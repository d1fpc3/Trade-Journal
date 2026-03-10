import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTradeById, updateTrade, deleteTrade } from '../utils/storage.js';

const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];
const EMOTIONS = ['Disciplined', 'Confident', 'Hesitant', 'FOMO', 'Revenge', 'Anxious', 'Neutral'];
const GRADES = ['A', 'B', 'C'];
const MISTAKE_OPTIONS = [
  'Chased entry', 'Sized too big', 'Moved stop loss', 'Took profit too early',
  'Ignored trade plan', 'Overtraded', 'Revenge traded', 'Missed entry'
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
  const [dragOver, setDragOver] = useState(false);

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
      quantity: t.quantity ?? '',
      pnl: t.pnl ?? '',
      date: t.date ?? t.entry_date ?? '',
      session: t.session ?? '',
      setup: t.setup ?? '',
      risk_amount: t.risk_amount ?? '',
      emotion: t.emotion ?? '',
      grade: t.grade ?? '',
      mistakes: t.mistakes ?? [],
      notes: t.notes ?? ''
    });
  }, [id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updates = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        quantity: form.quantity !== '' ? parseFloat(form.quantity) : null,
        pnl: form.pnl !== '' ? parseFloat(form.pnl) : null,
        date: form.date,
        session: form.session,
        setup: form.setup,
        risk_amount: form.risk_amount ? parseFloat(form.risk_amount) : null,
        emotion: form.emotion,
        grade: form.grade,
        mistakes: form.mistakes,
        notes: form.notes
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

  const processUploadFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
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

  const handleUpload = (e) => processUploadFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processUploadFiles(e.dataTransfer.files);
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
              {trade.session && <span className="badge badge-muted">{trade.session}</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              {formatDate(trade.date ?? trade.entry_date)}
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
                <label className="form-label">P&L ($)</label>
                <input type="number" className="form-input" value={form.pnl} onChange={e => set('pnl', e.target.value)} step="any" placeholder="e.g. 250 or -100" style={{ fontFamily: 'monospace' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" value={form.quantity} onChange={e => set('quantity', e.target.value)} step="any" placeholder="Shares / contracts" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Session</label>
                <select className="form-select" value={form.session} onChange={e => set('session', e.target.value)}>
                  <option value="">None</option>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Setup</label>
                <input className="form-input" value={form.setup} onChange={e => set('setup', e.target.value)} placeholder="e.g. BOS + OB retest" />
              </div>
              <div className="form-group">
                <label className="form-label">Risk Amount ($)</label>
                <input type="number" className="form-input" value={form.risk_amount} onChange={e => set('risk_amount', e.target.value)} step="any" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Emotion</label>
                <select className="form-select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>
                  <option value="">None</option>
                  {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Trade Grade</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GRADES.map(g => (
                    <button key={g} type="button" onClick={() => set('grade', form.grade === g ? '' : g)} className="btn flex-1"
                      style={{
                        justifyContent: 'center', fontWeight: 700,
                        background: form.grade === g ? (g === 'A' ? 'var(--green-dim)' : g === 'B' ? 'rgba(255,165,0,0.15)' : 'var(--red-dim)') : 'var(--bg-input)',
                        border: `1px solid ${form.grade === g ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)') : 'var(--border)'}`,
                        color: form.grade === g ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)') : 'var(--text-muted)'
                      }}
                    >{g}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mistakes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {MISTAKE_OPTIONS.map(m => {
                    const active = (form.mistakes || []).includes(m);
                    return (
                      <button key={m} type="button"
                        onClick={() => set('mistakes', active ? form.mistakes.filter(x => x !== m) : [...(form.mistakes || []), m])}
                        style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', cursor: 'pointer',
                          border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
                          background: active ? 'var(--red-dim)' : 'var(--bg-input)',
                          color: active ? 'var(--red)' : 'var(--text-muted)'
                        }}
                      >{m}</button>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
              </div>
            </div>
          ) : (
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px' }}>
              {[
                { label: 'Quantity', value: trade.quantity ?? '—' },
                { label: 'Date', value: formatDate(trade.date ?? trade.entry_date) },
                { label: 'Session', value: trade.session || '—' },
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
              {trade.risk_amount != null && (
                <div>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Risk Amount</dt>
                  <dd style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '0.9rem' }}>${Number(trade.risk_amount).toFixed(2)}</dd>
                </div>
              )}
              {trade.grade && (
                <div>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Grade</dt>
                  <dd style={{ fontWeight: 700, fontSize: '1rem', color: trade.grade === 'A' ? 'var(--green)' : trade.grade === 'B' ? 'orange' : 'var(--red)' }}>{trade.grade}</dd>
                </div>
              )}
              {trade.emotion && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Emotion</dt>
                  <dd style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{trade.emotion}</dd>
                </div>
              )}
              {trade.mistakes && trade.mistakes.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mistakes</dt>
                  <dd style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {trade.mistakes.map(m => (
                      <span key={m} style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }}>{m}</span>
                    ))}
                  </dd>
                </div>
              )}
              {trade.setup && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Setup</dt>
                  <dd style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{trade.setup}</dd>
                </div>
              )}
              {trade.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Notes</dt>
                  <dd style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{trade.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Images */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.68rem', color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
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
                <div key={img.id} className="image-thumb">
                  <a href={img.data} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.data}
                      alt="Trade screenshot"
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                  <button
                    className="image-thumb-delete"
                    onClick={() => handleDeleteImage(img.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <p style={{ fontSize: '1.8rem', marginBottom: 8, opacity: 0.5 }}>🖼</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 500 }}>Drop images or click to upload</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-mono)' }}>PNG, JPG, GIF, WEBP</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
