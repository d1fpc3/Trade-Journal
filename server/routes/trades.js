import { Router } from 'express';
import db, { parseTrade, parseTrades } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/trades
router.get('/', requireAuth, (req, res) => {
  const { symbol, direction, grade, session, from_date, to_date } = req.query;
  let query = 'SELECT * FROM trades WHERE user_id = ?';
  const params = [req.user.id];

  if (symbol)    { query += ' AND symbol LIKE ?';    params.push(`%${symbol.toUpperCase()}%`); }
  if (direction) { query += ' AND direction = ?';    params.push(direction.toUpperCase()); }
  if (grade)     { query += ' AND grade = ?';        params.push(grade); }
  if (session)   { query += ' AND session = ?';      params.push(session); }
  if (from_date) { query += ' AND date >= ?';        params.push(from_date); }
  if (to_date)   { query += ' AND date <= ?';        params.push(to_date); }

  query += ' ORDER BY date DESC, created_at DESC';

  try {
    const trades = db.prepare(query).all(...params);
    res.json(parseTrades(trades));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    res.json(parseTrade(trade));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades
router.post('/', requireAuth, (req, res) => {
  try {
    const { symbol, direction, quantity, pnl, date, session, setup, risk_amount, emotion, grade, mistakes, notes, images } = req.body;

    if (!symbol || !direction || !date) {
      return res.status(400).json({ error: 'symbol, direction, and date are required' });
    }

    if (req.user.plan !== 'pro') {
      const { count } = db.prepare('SELECT COUNT(*) as count FROM trades WHERE user_id = ?').get(req.user.id);
      if (count >= 50) {
        return res.status(403).json({ error: 'Free plan is limited to 50 trades. Upgrade to Pro for unlimited.', upgrade: true });
      }
    }

    const result = db.prepare(`
      INSERT INTO trades (user_id, symbol, direction, quantity, pnl, date, session, setup, risk_amount, emotion, grade, mistakes, notes, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      symbol.toUpperCase(),
      direction.toUpperCase(),
      quantity != null ? parseFloat(quantity) : null,
      pnl != null ? parseFloat(pnl) : null,
      date,
      session || null,
      setup || null,
      risk_amount != null ? parseFloat(risk_amount) : null,
      emotion || null,
      grade || null,
      mistakes ? JSON.stringify(mistakes) : null,
      notes || null,
      images ? JSON.stringify(images) : null
    );

    const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseTrade(newTrade));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trades/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const { symbol, direction, quantity, pnl, date, session, setup, risk_amount, emotion, grade, mistakes, notes, images } = req.body;

    db.prepare(`
      UPDATE trades SET
        symbol = ?, direction = ?, quantity = ?, pnl = ?, date = ?,
        session = ?, setup = ?, risk_amount = ?, emotion = ?, grade = ?,
        mistakes = ?, notes = ?, images = ?
      WHERE id = ? AND user_id = ?
    `).run(
      symbol !== undefined ? symbol.toUpperCase() : trade.symbol,
      direction !== undefined ? direction.toUpperCase() : trade.direction,
      quantity !== undefined ? (quantity != null ? parseFloat(quantity) : null) : trade.quantity,
      pnl !== undefined ? (pnl != null ? parseFloat(pnl) : null) : trade.pnl,
      date !== undefined ? date : trade.date,
      session !== undefined ? (session || null) : trade.session,
      setup !== undefined ? (setup || null) : trade.setup,
      risk_amount !== undefined ? (risk_amount != null ? parseFloat(risk_amount) : null) : trade.risk_amount,
      emotion !== undefined ? (emotion || null) : trade.emotion,
      grade !== undefined ? (grade || null) : trade.grade,
      mistakes !== undefined ? (mistakes ? JSON.stringify(mistakes) : null) : trade.mistakes,
      notes !== undefined ? (notes || null) : trade.notes,
      images !== undefined ? (images ? JSON.stringify(images) : null) : trade.images,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
    res.json(parseTrade(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Trade deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
