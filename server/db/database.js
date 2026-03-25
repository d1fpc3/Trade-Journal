import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbDir = join(__dirname, '..', '..', 'data');

mkdirSync(dbDir, { recursive: true });

const dbPath = join(dbDir, 'trade-journal.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    plan TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('LONG','SHORT')),
    quantity REAL,
    pnl REAL,
    date TEXT NOT NULL,
    session TEXT,
    setup TEXT,
    risk_amount REAL,
    emotion TEXT,
    grade TEXT,
    mistakes TEXT,
    notes TEXT,
    images TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

`)

// Migrations: add new columns to existing tables without breaking old installs
const migrations = [
  "ALTER TABLE users ADD COLUMN email TEXT",
  "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT",
  "ALTER TABLE users ADD COLUMN plan_expires_at TEXT",
  "ALTER TABLE trades ADD COLUMN quantity REAL",
  "ALTER TABLE trades ADD COLUMN pnl REAL",
  "ALTER TABLE trades ADD COLUMN date TEXT",
  "ALTER TABLE trades ADD COLUMN session TEXT",
  "ALTER TABLE trades ADD COLUMN setup TEXT",
  "ALTER TABLE trades ADD COLUMN risk_amount REAL",
  "ALTER TABLE trades ADD COLUMN emotion TEXT",
  "ALTER TABLE trades ADD COLUMN grade TEXT",
  "ALTER TABLE trades ADD COLUMN mistakes TEXT",
  "ALTER TABLE trades ADD COLUMN images TEXT",
];

for (const sql of migrations) {
  try { db.exec(sql); } catch (_) { /* column already exists */ }
}

// Helper functions
export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function createUser({ username, password, email }) {
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
  ).run(username, hash, email || null);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByStripeCustomer(customerId) {
  return db.prepare('SELECT * FROM users WHERE stripe_customer_id = ?').get(customerId);
}

export function updateUserStripe(id, updates) {
  const fields = [];
  const values = [];
  if (updates.stripe_customer_id !== undefined) { fields.push('stripe_customer_id = ?'); values.push(updates.stripe_customer_id); }
  if (updates.stripe_subscription_id !== undefined) { fields.push('stripe_subscription_id = ?'); values.push(updates.stripe_subscription_id); }
  if (updates.plan !== undefined) { fields.push('plan = ?'); values.push(updates.plan); }
  if (updates.plan_expires_at !== undefined) { fields.push('plan_expires_at = ?'); values.push(updates.plan_expires_at); }
  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function updateUserCredentials(id, updates) {
  const fields = [];
  const values = [];
  if (updates.username !== undefined) { fields.push('username = ?'); values.push(updates.username); }
  if (updates.password !== undefined) { fields.push('password_hash = ?'); values.push(bcrypt.hashSync(updates.password, 10)); }
  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function parseTrade(trade) {
  return {
    ...trade,
    mistakes: trade.mistakes ? JSON.parse(trade.mistakes) : [],
    images: trade.images ? JSON.parse(trade.images) : [],
  };
}

export function parseTrades(trades) {
  return trades.map(parseTrade);
}

export function getTradeById(id) {
  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
  return trade ? parseTrade(trade) : null;
}

export default db;
