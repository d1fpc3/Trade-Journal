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

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('LONG','SHORT')),
    entry_price REAL NOT NULL,
    exit_price REAL,
    quantity REAL NOT NULL,
    entry_date TEXT NOT NULL,
    exit_date TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
    strategy TEXT,
    notes TEXT,
    pnl REAL,
    pnl_percent REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trade_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );
`);

// Seed default user if none exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('trader123', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('trader', hash);
  console.log('Default user created: username=trader, password=trader123');
}

// Helper functions
export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function getTradeById(id) {
  return db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
}

export function getTradeImages(tradeId) {
  return db.prepare('SELECT * FROM trade_images WHERE trade_id = ?').all(tradeId);
}

export function calculatePnl(direction, entryPrice, exitPrice, quantity) {
  if (!exitPrice) return { pnl: null, pnl_percent: null };
  let pnl;
  if (direction === 'LONG') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }
  const pnl_percent = (pnl / (entryPrice * quantity)) * 100;
  return { pnl, pnl_percent };
}

export default db;
