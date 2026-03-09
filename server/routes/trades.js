import { Router } from 'express';
import db, { getTradeById, getTradeImages, calculatePnl } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/trades - list all trades with optional filters
router.get('/', requireAuth, (req, res) => {
  const { status, symbol, direction, from_date, to_date } = req.query;
  let query = 'SELECT * FROM trades WHERE user_id = ?';
  const params = [req.user.id];

  if (status) { query += ' AND status = ?'; params.push(status.toUpperCase()); }
  if (symbol) { query += ' AND symbol LIKE ?'; params.push(`%${symbol.toUpperCase()}%`); }
  if (direction) { query += ' AND direction = ?'; params.push(direction.toUpperCase()); }
  if (from_date) { query += ' AND entry_date >= ?'; params.push(from_date); }
  if (to_date) { query += ' AND entry_date <= ?'; params.push(to_date); }

  query += ' ORDER BY entry_date DESC, created_at DESC';

  try {
    const trades = db.prepare(query).all(...params);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/analytics
router.get('/analytics', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const allTrades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_date ASC, created_at ASC').all(userId);
    const closedTrades = allTrades.filter(t => t.status === 'CLOSED' && t.pnl !== null);
    const openTrades = allTrades.filter(t => t.status === 'OPEN');

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl <= 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;

    const sortedByPnl = [...closedTrades].sort((a, b) => b.pnl - a.pnl);
    const bestTrade = sortedByPnl[0] || null;
    const worstTrade = sortedByPnl[sortedByPnl.length - 1] || null;

    // Equity curve
    let cumPnl = 0;
    const equityCurve = closedTrades.map(t => {
      cumPnl += t.pnl || 0;
      return {
        date: t.exit_date || t.entry_date,
        cumulativePnl: parseFloat(cumPnl.toFixed(2)),
        symbol: t.symbol,
        pnl: t.pnl
      };
    });

    // P&L by symbol
    const symbolMap = {};
    closedTrades.forEach(t => {
      if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { symbol: t.symbol, pnl: 0, count: 0 };
      symbolMap[t.symbol].pnl += t.pnl || 0;
      symbolMap[t.symbol].count++;
    });
    const pnlBySymbol = Object.values(symbolMap)
      .map(s => ({ ...s, pnl: parseFloat(s.pnl.toFixed(2)) }))
      .sort((a, b) => b.pnl - a.pnl);

    res.json({
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: allTrades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      winCount: wins.length,
      lossCount: losses.length,
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      bestTrade,
      worstTrade,
      equityCurve,
      pnlBySymbol
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    const images = getTradeImages(trade.id);
    res.json({ ...trade, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      symbol, direction, entry_price, exit_price, quantity,
      entry_date, exit_date, status, strategy, notes
    } = req.body;

    if (!symbol || !direction || !entry_price || !quantity || !entry_date) {
      return res.status(400).json({ error: 'symbol, direction, entry_price, quantity, entry_date are required' });
    }

    const { pnl, pnl_percent } = calculatePnl(direction, parseFloat(entry_price), exit_price ? parseFloat(exit_price) : null, parseFloat(quantity));
    const tradeStatus = status || (exit_price ? 'CLOSED' : 'OPEN');

    const result = db.prepare(`
      INSERT INTO trades (user_id, symbol, direction, entry_price, exit_price, quantity, entry_date, exit_date, status, strategy, notes, pnl, pnl_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      symbol.toUpperCase(),
      direction.toUpperCase(),
      parseFloat(entry_price),
      exit_price ? parseFloat(exit_price) : null,
      parseFloat(quantity),
      entry_date,
      exit_date || null,
      tradeStatus.toUpperCase(),
      strategy || null,
      notes || null,
      pnl,
      pnl_percent
    );

    const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTrade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trades/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const {
      symbol, direction, entry_price, exit_price, quantity,
      entry_date, exit_date, status, strategy, notes
    } = req.body;

    const newDirection = direction ? direction.toUpperCase() : trade.direction;
    const newEntryPrice = entry_price !== undefined ? parseFloat(entry_price) : trade.entry_price;
    const newExitPrice = exit_price !== undefined ? (exit_price ? parseFloat(exit_price) : null) : trade.exit_price;
    const newQuantity = quantity !== undefined ? parseFloat(quantity) : trade.quantity;
    const newStatus = status ? status.toUpperCase() : trade.status;

    const { pnl, pnl_percent } = calculatePnl(newDirection, newEntryPrice, newExitPrice, newQuantity);

    db.prepare(`
      UPDATE trades SET
        symbol = ?, direction = ?, entry_price = ?, exit_price = ?, quantity = ?,
        entry_date = ?, exit_date = ?, status = ?, strategy = ?, notes = ?,
        pnl = ?, pnl_percent = ?
      WHERE id = ? AND user_id = ?
    `).run(
      symbol ? symbol.toUpperCase() : trade.symbol,
      newDirection,
      newEntryPrice,
      newExitPrice,
      newQuantity,
      entry_date || trade.entry_date,
      exit_date !== undefined ? (exit_date || null) : trade.exit_date,
      newStatus,
      strategy !== undefined ? (strategy || null) : trade.strategy,
      notes !== undefined ? (notes || null) : trade.notes,
      pnl,
      pnl_percent,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
    const images = getTradeImages(updated.id);
    res.json({ ...updated, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    db.prepare('DELETE FROM trade_images WHERE trade_id = ?').run(req.params.id);
    db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    res.json({ message: 'Trade deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
