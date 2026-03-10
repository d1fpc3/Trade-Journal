const TRADES_KEY = 'tj_trades';

export function getTrades() {
  const data = localStorage.getItem(TRADES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTrades(trades) {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

export function addTrade(trade) {
  const trades = getTrades();
  trades.unshift(trade);
  saveTrades(trades);
  return trade;
}

export function updateTrade(id, updates) {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx === -1) return null;
  trades[idx] = { ...trades[idx], ...updates };
  saveTrades(trades);
  return trades[idx];
}

export function deleteTrade(id) {
  const trades = getTrades().filter(t => t.id !== id);
  saveTrades(trades);
}

export function getTradeById(id) {
  return getTrades().find(t => t.id === id) || null;
}

export function calculatePnl(direction, entryPrice, exitPrice, quantity) {
  if (!exitPrice) return { pnl: null, pnl_percent: null };
  const pnl = direction === 'LONG'
    ? (exitPrice - entryPrice) * quantity
    : (entryPrice - exitPrice) * quantity;
  const pnl_percent = (pnl / (entryPrice * quantity)) * 100;
  return { pnl, pnl_percent };
}
