import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getUserByUsername, getUserById, createUser, updateUserCredentials } from '../db/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';

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

router.post('/change-credentials', requireAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  if (newUsername !== undefined) {
    if (!newUsername || newUsername.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    const existing = getUserByUsername(newUsername.trim());
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    updateUserCredentials(user.id, { username: newUsername.trim() });
    const token = signToken({ id: user.id, username: newUsername.trim(), plan: user.plan || 'free' });
    return res.json({ token, username: newUsername.trim(), plan: user.plan || 'free' });
  }

  if (newPassword !== undefined) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    updateUserCredentials(user.id, { password: newPassword });
    return res.json({ success: true });
  }

  res.status(400).json({ error: 'No changes requested' });
});

export default router;
