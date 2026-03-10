import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTrade } from '../utils/storage.js';

const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];
const EMOTIONS = ['Disciplined', 'Confident', 'Hesitant', 'FOMO', 'Revenge', 'Anxious', 'Neutral'];
const GRADES = ['A', 'B', 'C'];
const MISTAKE_OPTIONS = [
  'Chased entry', 'Sized too big', 'Moved stop loss', 'Took profit too early',
  'Ignored trade plan', 'Overtraded', 'Revenge traded', 'Missed entry'
];

export default function LogTrade() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    symbol: '',
    direction: 'LONG',
    quantity: '',
    pnl: '',
    date: new Date().toISOString().slice(0, 10),
    session: '',
    setup: '',
    risk_amount: '',
    emotion: '',
    grade: '',
    mistakes: [],
    notes: ''
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const readFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageId = Date.now().toString() + Math.random().toString(36).slice(2);
        setImages(prev => [...prev, { id: imageId, data: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileChange = (e) => readFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    readFiles(e.dataTransfer.files);
  };

  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const quantity = form.quantity ? parseFloat(form.quantity) : null;
    const pnl = form.pnl !== '' ? parseFloat(form.pnl) : null;

    const trade = {
      id: Date.now().toString(),
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      quantity,
      pnl,
      date: form.date,
      session: form.session,
      setup: form.setup,
      risk_amount: form.risk_amount ? parseFloat(form.risk_amount) : null,
      emotion: form.emotion,
      grade: form.grade,
      mistakes: form.mistakes,
      notes: form.notes,
      images,
      created_at: new Date().toISOString()
    };

    addTrade(trade);
    navigate(`/trades/${trade.id}`);
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Log Trade</h1>
        <p className="page-subtitle">// record a new trade entry</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '0.72rem', color: 'var(--purple)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>Trade Details</h3>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input
                className="form-input"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL, BTC, EUR/USD"
                required
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
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
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      letterSpacing: '0.06em',
                      background: form.direction === dir
                        ? (dir === 'LONG' ? 'rgba(0,255,136,0.1)' : 'rgba(255,26,74,0.1)')
                        : 'rgba(3,3,10,0.95)',
                      border: `1px solid ${form.direction === dir
                        ? (dir === 'LONG' ? 'rgba(0,255,136,0.5)' : 'rgba(255,26,74,0.5)')
                        : 'var(--border-light)'}`,
                      color: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--text-muted)',
                      boxShadow: form.direction === dir
                        ? (dir === 'LONG' ? '0 0 16px rgba(0,255,136,0.15)' : '0 0 16px rgba(255,26,74,0.15)')
                        : 'none',
                      textShadow: form.direction === dir
                        ? (dir === 'LONG' ? '0 0 10px rgba(0,255,136,0.5)' : '0 0 10px rgba(255,26,74,0.5)')
                        : 'none'
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
              <label className="form-label">P&L ($) *</label>
              <input
                type="number"
                className="form-input"
                value={form.pnl}
                onChange={e => set('pnl', e.target.value)}
                placeholder="e.g. 250 or -100"
                step="any"
                required
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="Shares / contracts"
                step="any"
                min="0"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Session</label>
              <select
                className="form-select"
                value={form.session}
                onChange={e => set('session', e.target.value)}
              >
                <option value="">— Select —</option>
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Risk Amount ($)</label>
              <input
                type="number"
                className="form-input"
                value={form.risk_amount}
                onChange={e => set('risk_amount', e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Setup</label>
            <input
              className="form-input"
              value={form.setup}
              onChange={e => set('setup', e.target.value)}
              placeholder="e.g. BOS + Order Block retest, FVG fill, VWAP rejection..."
            />
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Emotion</label>
              <select className="form-select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>
                <option value="">— Select —</option>
                {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trade Grade</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set('grade', form.grade === g ? '' : g)}
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                      background: form.grade === g ? (g === 'A' ? 'rgba(0,255,136,0.1)' : g === 'B' ? 'rgba(255,165,0,0.12)' : 'rgba(255,26,74,0.1)') : 'rgba(3,3,10,0.95)',
                      border: `1px solid ${form.grade === g ? (g === 'A' ? 'rgba(0,255,136,0.5)' : g === 'B' ? 'rgba(255,165,0,0.5)' : 'rgba(255,26,74,0.5)') : 'var(--border-light)'}`,
                      color: form.grade === g ? (g === 'A' ? 'var(--green)' : g === 'B' ? '#ffa500' : 'var(--red)') : 'var(--text-muted)',
                      boxShadow: form.grade === g ? (g === 'A' ? '0 0 14px rgba(0,255,136,0.15)' : g === 'B' ? '0 0 14px rgba(255,165,0,0.15)' : '0 0 14px rgba(255,26,74,0.15)') : 'none'
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Mistakes</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MISTAKE_OPTIONS.map(m => {
                const active = form.mistakes.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('mistakes', active ? form.mistakes.filter(x => x !== m) : [...form.mistakes, m])}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.76rem', cursor: 'pointer',
                      border: `1px solid ${active ? 'rgba(255,26,74,0.5)' : 'var(--border-light)'}`,
                      background: active ? 'rgba(255,26,74,0.1)' : 'rgba(3,3,10,0.95)',
                      color: active ? 'var(--red)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                      textShadow: active ? '0 0 8px rgba(255,26,74,0.5)' : 'none',
                      boxShadow: active ? '0 0 10px rgba(255,26,74,0.1)' : 'none'
                    }}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="What did you see? Execution thoughts, lessons learned..."
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Screenshots / Photos</label>

            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{ fontSize: '1.8rem', marginBottom: 8, opacity: 0.6 }}>🖼</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 500 }}>
                Drop images here or click to upload
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                PNG, JPG, GIF, WEBP — multiple files supported
              </p>
            </div>

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 12 }}>
                {images.map(img => (
                  <div key={img.id} className="image-thumb">
                    <img
                      src={img.data}
                      alt={img.name}
                      style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      className="image-thumb-delete"
                      onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                    >
                      ✕
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      padding: '4px 6px',
                      fontSize: '0.6rem', color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {img.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Log Trade
          </button>
        </div>
      </form>
    </div>
  );
}
