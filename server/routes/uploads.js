import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';
import db from '../db/database.js';
import { requireAuth, requirePlan } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `trade-${req.params.id}-${uniqueSuffix}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router({ mergeParams: true });

// POST /api/trades/:id/images
router.post('/', requireAuth, upload.array('images', 10), (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const inserted = req.files.map(file => {
      const result = db.prepare('INSERT INTO trade_images (trade_id, filename) VALUES (?, ?)').run(trade.id, file.filename);
      return db.prepare('SELECT * FROM trade_images WHERE id = ?').get(result.lastInsertRowid);
    });

    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id/images/:imageId
router.delete('/:imageId', requireAuth, (req, res) => {
  try {
    const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const image = db.prepare('SELECT * FROM trade_images WHERE id = ? AND trade_id = ?').get(req.params.imageId, req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const filePath = join(uploadsDir, image.filename);
    if (existsSync(filePath)) unlinkSync(filePath);

    db.prepare('DELETE FROM trade_images WHERE id = ?').run(req.params.imageId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
