import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, updateTrade, deleteTrade, calculatePnl } from '../utils/storage.js';

const STRATEGIES = [
  'Breakout', 'Pullback', 'Trend Following', 'Reversal', 'Scalp',
  'Swing', 'News Play', 'Gap Fill', 'Support/Resistance', 'Other'
];

function formatPnl(val) {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [trade, setTrade] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({});

  useEffect(() => {
    const t = getTradeById(id);
    if (!t) {
      setError('Trade not found.');
      return;
    }
    setTrade(t);
    setForm({
      symbol: t.symbol,
      direction: t.direction,
      entry_price: t.entry_price,
      exit_price: t.exit_price ?? '',
      quantity: t.quantity,
      entry_date: t.entry_date,
      exit_date: t.exit_date ?? '',
      status: t.status,
      strategy: t.strategy ?? '',
      notes: t.notes ?? ''
    });
  }, [id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const entryPrice = parseFloat(form.entry_price);
      const exitPrice = form.exit_price ? parseFloat(form.exit_price) : null;
      const quantity = parseFloat(form.quantity);
      const { pnl, pnl_percent } = calculatePnl(form.direction, entryPrice, exitPrice, quantity);

      const updates = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity,
        entry_date: form.entry_date,
        exit_date: form.exit_date || null,
        status: form.status,
        strategy: form.strategy,
        notes: form.notes,
        pnl,
        pnl_percent
      };

      const updated = updateTrade(id, updates);
      setTrade(updated);
      setEditing(false);
      setSuccess('Trade updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this trade? This cannot be undone.')) return;
    deleteTrade(id);
    navigate('/trades');
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        const imageId = Date.now().toString() + Math.random().toString(36).slice(2);
        const currentTrade = getTradeById(id);
        if (!currentTrade) return;
        const images = [...(currentTrade.images || []), { id: imageId, data: base64, name: file.name }];
        const updated = updateTrade(id, { images });
        setTrade(updated);
      };
      reader.readAsDataURL(file);
    });

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDeleteImage = (imageId) => {
    if (!confirm('Delete this image?')) return;
    const currentTrade = getTradeById(id);
    if (!currentTrade) return;
    const images = (currentTrade.images || []).filter(img => img.id !== imageId);
    const updated = updateTrade(id, { images });
    setTrade(updated);
  };

  if (!trade && !error) return <div className="page-container"><span className="spinner" /></div>;
  if (!trade) return (
    <div className="page-container">
      <div className="error-msg">{error}</div>
      <Link to="/trades" className="btn btn-secondary" style={{ marginTop: 12 }}>← Back to History</Link>
    </div>
  );

  const pnlColor = trade.pnl > 0 ? 'var(--green)' : trade.pnl < 0 ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex-between flex-wrap" style={{ gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/trades" className="btn btn-ghost btn-sm">← Back</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trade.symbol}</h1>
              <span className={`badge ${trade.direction === 'LONG' ? 'badge-green' : 'badge-red'}`}>
                {trade.direction}
              </span>
              <span className={`badge ${trade.status === 'OPEN' ? 'badge-blue' : 'badge-muted'}`}>
                {trade.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Trade #{trade.id} • {formatDate(trade.entry_date)}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          )}
          {editing && (
            <>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="success-msg" style={{ marginBottom: 16 }}>{success}</div>}

      {/* P&L Banner */}
      {trade.pnl !== null && (
        <div style={{
          padding: '16px 20px',
          background: trade.pnl >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${trade.pnl >= 0 ? 'var(--green)' : 'var(--red)'}`,
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>REALIZED P&L</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: pnlColor, fontFamily: 'monospace', lineHeight: 1 }}>
              {formatPnl(trade.pnl)}
            </p>
          </div>
          {trade.pnl_percent !== null && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>RETURN</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: pnlColor, fontFamily: 'monospace' }}>
                {trade.pnl_percent >= 0 ? '+' : ''}{Number(trade.pnl_percent).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Details */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Trade Details
          </h3>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input className="form-input" value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label className="form-label">Direction</label>
                <select className="form-select" value={form.direction} onChange={e => set('direction', e.target.value)}>
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Entry Price</label>
                <input type="number" className="form-input" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} step="any" />
              </div>
              <div className="form-group">
                <label className="form-label">Exit Price</label>
                <input type="number" className="form-input" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} step="any" placeholder="Optional" />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" value={form.quantity} onChange={e => set('quantity', e.target.value)} step="any" />
              </div>
              <div className="form-group">
                <label className="form-label">Entry Date</label>
                <input type="date" className="form-input" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Exit Date</label>
                <input type="date" className="form-input" value={form.exit_date} onChange={e => set('exit_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Strategy</label>
                <select className="form-select" value={form.strategy} onChange={e => set('strategy', e.target.value)}>
                  <option value="">None</option>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
              </div>
            </div>
          ) : (
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px' }}>
              {[
                { label: 'Entry Price', value: `$${Number(trade.entry_price).toLocaleString()}`, mono: true },
                { label: 'Exit Price', value: trade.exit_price ? `$${Number(trade.exit_price).toLocaleString()}` : '—', mono: true },
                { label: 'Quantity', value: trade.quantity },
                { label: 'Strategy', value: trade.strategy || '—' },
                { label: 'Entry Date', value: formatDate(trade.entry_date) },
                { label: 'Exit Date', value: formatDate(trade.exit_date) },
                { label: 'Created', value: formatDate(trade.created_at) }
              ].map(row => (
                <div key={row.label}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    {row.label}
                  </dt>
                  <dd style={{ fontFamily: row.mono ? 'monospace' : 'inherit', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {row.value}
                  </dd>
                </div>
              ))}
              {trade.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    Notes
                  </dt>
                  <dd style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {trade.notes}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Images */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Screenshots
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileRef.current?.click()}
            >
              + Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
          </div>

          {trade.images && trade.images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {trade.images.map(img => (
                <div key={img.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                  <a href={img.data} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.data}
                      alt="Trade screenshot"
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(255,71,87,0.85)', border: 'none', borderRadius: 4,
                      color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem',
                      lineHeight: 1.5
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              border: '2px dashed var(--border)', borderRadius: 8,
              cursor: 'pointer'
            }}
              onClick={() => fileRef.current?.click()}
            >
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Click to upload screenshots</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>PNG, JPG, GIF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
