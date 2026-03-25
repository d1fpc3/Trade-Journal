import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/investments
router.get('/', requireAuth, (req, res) => {
  const { name, from_date, to_date } = req.query;
  let query = 'SELECT * FROM investments WHERE user_id = ?';
  const params = [req.user.id];

  if (name)      { query += ' AND name LIKE ?'; params.push(`%${name}%`); }
  if (from_date) { query += ' AND date >= ?';   params.push(from_date); }
  if (to_date)   { query += ' AND date <= ?';   params.push(to_date); }

  query += ' ORDER BY date DESC, created_at DESC';

  try {
    const investments = db.prepare(query).all(...params);
    res.json(investments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/investments
router.post('/', requireAuth, (req, res) => {
  try {
    const { name, amount, date, notes } = req.body;

    if (!name || amount == null || !date) {
      return res.status(400).json({ error: 'name, amount, and date are required' });
    }

    const result = db.prepare(`
      INSERT INTO investments (user_id, name, amount, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, name, parseFloat(amount), date, notes || null);

    const created = db.prepare('SELECT * FROM investments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/investments/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!inv) return res.status(404).json({ error: 'Investment not found' });

    const { name, amount, date, notes } = req.body;

    db.prepare(`
      UPDATE investments SET name = ?, amount = ?, date = ?, notes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name !== undefined ? name : inv.name,
      amount !== undefined ? parseFloat(amount) : inv.amount,
      date !== undefined ? date : inv.date,
      notes !== undefined ? (notes || null) : inv.notes,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM investments WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/investments/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!inv) return res.status(404).json({ error: 'Investment not found' });

    db.prepare('DELETE FROM investments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Investment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
