function getToken() {
  return localStorage.getItem('tj_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function getTrades(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return apiFetch(`/trades${params ? '?' + params : ''}`);
}

export async function addTrade(trade) {
  return apiFetch('/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
}

export async function updateTrade(id, updates) {
  return apiFetch(`/trades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTrade(id) {
  return apiFetch(`/trades/${id}`, { method: 'DELETE' });
}

export async function getTradeById(id) {
  return apiFetch(`/trades/${id}`);
}

export async function exportTrades() {
  const trades = await getTrades();
  const json = JSON.stringify({ version: 1, exported_at: new Date().toISOString(), trades }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `trade-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getInvestments(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return apiFetch(`/investments${params ? '?' + params : ''}`);
}

export async function addInvestment(data) {
  return apiFetch('/investments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvestment(id, updates) {
  return apiFetch(`/investments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteInvestment(id) {
  return apiFetch(`/investments/${id}`, { method: 'DELETE' });
}

export async function getBillingStatus() {
  return apiFetch('/billing/status');
}

export async function createCheckoutSession() {
  return apiFetch('/billing/create-checkout-session', { method: 'POST' });
}

export async function createPortalSession() {
  return apiFetch('/billing/create-portal-session', { method: 'POST' });
}

export async function importTrades(jsonString, mode = 'merge') {
  const parsed   = JSON.parse(jsonString);
  const incoming = Array.isArray(parsed) ? parsed : (parsed.trades ?? []);
  if (!Array.isArray(incoming)) throw new Error('Invalid backup file.');

  if (mode === 'replace') {
    const existing = await getTrades();
    await Promise.all(existing.map(t => deleteTrade(t.id)));
    await Promise.all(incoming.map(t => addTrade(t)));
    return incoming.length;
  }

  const existing    = await getTrades();
  const existingIds = new Set(existing.map(t => String(t.id)));
  const newOnes     = incoming.filter(t => !existingIds.has(String(t.id)));
  await Promise.all(newOnes.map(t => addTrade(t)));
  return newOnes.length;
}
