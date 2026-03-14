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

  const pnlNum = parseFloat(form.pnl);
  const pnlColor = !form.pnl ? 'var(--text-primary)' : pnlNum >= 0 ? 'var(--green)' : 'var(--red)';

  // ── Image handling ──────────────────────────────
  const MAX_IMG_MB = 3;
  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMG_MB * 1024 * 1024) {
        setError(`"${file.name}" is too large (max ${MAX_IMG_MB}MB). Resize it first.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        setImages(prev => [...prev, { id, data: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));

  // ── Submit ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trade = {
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      pnl: form.pnl !== '' ? parseFloat(form.pnl) : null,
      date: form.date,
      session: form.session,
      setup: form.setup,
      risk_amount: form.risk_amount ? parseFloat(form.risk_amount) : null,
      emotion: form.emotion,
      grade: form.grade,
      mistakes: form.mistakes,
      notes: form.notes,
      images,
    };

    try {
      const saved = await addTrade(trade);
      navigate(`/trades/${saved.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 740 }}>
      <div className="page-header animate-fade-up">
        <h1 className="page-title">Log Trade</h1>
        <p className="page-subtitle">Record a new trade entry</p>
      </div>

      {error && <div className="error-msg animate-fade-in" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* ── Core Info ───────────────────────────── */}
        <div className="card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 20, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Trade Details
          </h3>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input
                className="form-input"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value.toUpperCase())}
                placeholder="AAPL, BTC, EUR/USD"
                required
                style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direction *</label>
              <div style={{ display: 'flex', gap: 8, height: 42 }}>
                {['LONG', 'SHORT'].map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => set('direction', dir)}
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem',
                      transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                      background: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green-dim)' : 'var(--red-dim)')
                        : 'var(--bg-input)',
                      border: `1px solid ${form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--border)'}`,
                      color: form.direction === dir
                        ? (dir === 'LONG' ? 'var(--green)' : 'var(--red)')
                        : 'var(--text-muted)',
                      boxShadow: form.direction === dir
                        ? `0 0 14px ${dir === 'LONG' ? 'rgba(5,216,144,0.2)' : 'rgba(255,61,90,0.2)'}`
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
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: pnlColor,
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                  borderColor: form.pnl ? (pnlNum >= 0 ? 'rgba(5,216,144,0.4)' : 'rgba(255,61,90,0.4)') : undefined
                }}
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

          <div className="grid-2" style={{ gap: 16 }}>
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
              />
            </div>
          </div>
        </div>

        {/* ── Psychology & Notes ──────────────────── */}
        <div className="card animate-fade-up delay-2" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 20, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Psychology & Notes
          </h3>

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
              <div style={{ display: 'flex', gap: 8, height: 42 }}>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set('grade', form.grade === g ? '' : g)}
                    className="btn flex-1"
                    style={{
                      justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
                      transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                      background: form.grade === g
                        ? (g === 'A' ? 'var(--green-dim)' : g === 'B' ? 'rgba(255,165,0,0.15)' : 'var(--red-dim)')
                        : 'var(--bg-input)',
                      border: `1px solid ${form.grade === g
                        ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)')
                        : 'var(--border)'}`,
                      color: form.grade === g
                        ? (g === 'A' ? 'var(--green)' : g === 'B' ? 'orange' : 'var(--red)')
                        : 'var(--text-muted)',
                      boxShadow: form.grade === g
                        ? `0 0 12px ${g === 'A' ? 'rgba(5,216,144,0.2)' : g === 'B' ? 'rgba(255,165,0,0.2)' : 'rgba(255,61,90,0.2)'}`
                        : 'none'
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
                      padding: '5px 13px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
                      background: active ? 'var(--red-dim)' : 'var(--bg-input)',
                      color: active ? 'var(--red)' : 'var(--text-muted)',
                      transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                      boxShadow: active ? '0 0 10px rgba(255,61,90,0.2)' : 'none',
                      transform: active ? 'scale(1.04)' : 'scale(1)'
                    }}
                  >{m}</button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="What did you see? Execution thoughts, lessons learned..."
              rows={3}
            />
          </div>
        </div>

        {/* ── Screenshot Dropzone ─────────────────── */}
        <div className="card animate-fade-up delay-3" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Screenshots
          </h3>

          <div
            className={`dropzone${dragOver ? ' dropzone-active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileRef.current?.click()}
          >
            <span className="dropzone-icon">
              {dragOver ? '📂' : '🖼️'}
            </span>
            <p style={{ fontWeight: 600, color: dragOver ? 'var(--green)' : 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4, transition: 'color 0.2s' }}>
              {dragOver ? 'Drop to upload' : 'Drag & drop screenshots here'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              or <span style={{ color: 'var(--green)', fontWeight: 600 }}>click to browse</span> · PNG, JPG, GIF
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {images.length > 0 && (
            <div className="img-preview-grid">
              {images.map((img, i) => (
                <div key={img.id} className="img-preview-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <img src={img.data} alt={img.name} />
                  <button className="img-preview-del" onClick={() => removeImage(img.id)}>✕</button>
                </div>
              ))}
              <div
                style={{
                  aspectRatio: 1,
                  border: '2px dashed var(--border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1.4rem',
                  transition: 'all 0.18s ease',
                  background: 'var(--bg-input)'
                }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(5,216,144,0.4)'; e.currentTarget.style.color = 'var(--green)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >+</div>
            </div>
          )}
        </div>

        {/* ── Submit ──────────────────────────────── */}
        <div className="animate-fade-up delay-4" style={{ display: 'flex', gap: 12 }}>
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
