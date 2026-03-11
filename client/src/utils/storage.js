const TRADES_KEY = 'tj_trades';

export function getTrades() {
  try {
    const data = localStorage.getItem(TRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
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

export function exportTrades() {
  const trades = getTrades();
  const json = JSON.stringify({ version: 1, exported_at: new Date().toISOString(), trades }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trade-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importTrades(jsonString, mode = 'merge') {
  const parsed = JSON.parse(jsonString);
  const incoming = Array.isArray(parsed) ? parsed : (parsed.trades ?? []);
  if (!Array.isArray(incoming)) throw new Error('Invalid backup file.');
  if (mode === 'replace') {
    saveTrades(incoming);
    return incoming.length;
  }
  // merge: keep existing, add any that don't already exist by id
  const existing = getTrades();
  const existingIds = new Set(existing.map(t => t.id));
  const newOnes = incoming.filter(t => !existingIds.has(t.id));
  saveTrades([...newOnes, ...existing]);
  return newOnes.length;
}
