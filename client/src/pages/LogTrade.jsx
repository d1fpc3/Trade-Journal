import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const STRATEGIES = [
  'Breakout', 'Pullback', 'Trend Following', 'Reversal', 'Scalp',
  'Swing', 'News Play', 'Gap Fill', 'Support/Resistance', 'Other'
];

export default function LogTrade() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    symbol: '',
    direction: 'LONG',
    entry_price: '',
    exit_price: '',
    quantity: '',
    entry_date: new Date().toISOString().slice(0, 10),
    exit_date: '',
    status: 'OPEN',
    strategy: '',
    notes: ''
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        symbol: form.symbol.toUpperCase(),
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : undefined,
        quantity: parseFloat(form.quantity),
        exit_date: form.exit_date || undefined
      };

      const res = await authFetch('/api/trades', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trade');
      navigate(`/trades/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-set status based on exit_price
  const handleExitPrice = (val) => {
    set('exit_price', val);
    if (val) set('status', 'CLOSED');
    else set('status', 'OPEN');
  };

  // Preview P&L
  let previewPnl = null;
  if (form.entry_price && form.exit_price && form.quantity) {
    const ep = parseFloat(form.entry_price);
    const xp = parseFloat(form.exit_price);
    const qty = parseFloat(form.quantity);
    if (!isNaN(ep) && !isNaN(xp) && !isNaN(qty)) {
      previewPnl = form.direction === 'LONG' ? (xp - ep) * qty : (ep - xp) * qty;
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Log Trade</h1>
        <p className="page-subtitle">Record a new trade entry</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--text-muted)' }}>Trade Details</h3>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input
                className="form-input"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL, BTC, EUR/USD"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direction *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['LONG', 'SHORT'].map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => set('direction', dir)}
                    className={`btn flex-1`}
                    style={{
                      justifyContent: 'center',
                      background: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green-dim)' : 'var(--red-dim)')
                        : 'var(--bg-input)',
                      border: `1px solid ${form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--border)'}`,
                      color: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--text-muted)'
                    }}
                  >
                    {dir === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Entry Price *</label>
              <input
                type="number"
                className="form-input"
                value={form.entry_price}
                onChange={e => set('entry_price', e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exit Price</label>
              <input
                type="number"
                className="form-input"
                value={form.exit_price}
                onChange={e => handleExitPrice(e.target.value)}
                placeholder="0.00 (optional)"
                step="any"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                className="form-input"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="0"
                step="any"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Entry Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.entry_date}
                onChange={e => set('entry_date', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exit Date</label>
              <input
                type="date"
                className="form-input"
                value={form.exit_date}
                onChange={e => set('exit_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Strategy / Setup</label>
              <select
                className="form-select"
                value={form.strategy}
                onChange={e => set('strategy', e.target.value)}
              >
                <option value="">— Select strategy —</option>
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Setup rationale, market conditions, lessons learned..."
              rows={3}
            />
          </div>
        </div>

        {/* P&L Preview */}
        {previewPnl !== null && (
          <div style={{
            marginTop: 16,
            padding: '14px 18px',
            background: previewPnl >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `1px solid ${previewPnl >= 0 ? 'var(--green)' : 'var(--red)'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated P&L</span>
            <span style={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: previewPnl >= 0 ? 'var(--green)' : 'var(--red)',
              fontFamily: 'monospace'
            }}>
              {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
            </span>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/trades')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {loading ? 'Saving...' : 'Log Trade'}
          </button>
        </div>
      </form>
    </div>
  );
}
