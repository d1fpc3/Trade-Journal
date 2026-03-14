import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getUserByUsername, createUser } from '../db/database.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, username: user.username, plan: user.plan || 'free' });
  res.json({ token, username: user.username, plan: user.plan || 'free' });
});

router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = getUserByUsername(username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  try {
    const user = createUser({ username: username.trim(), password, email });
    const token = signToken({ id: user.id, username: user.username, plan: 'free' });
    res.status(201).json({ token, username: user.username, plan: 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
