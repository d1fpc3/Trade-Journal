import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addInvestment } from '../utils/storage.js';

export default function LogInvestment() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addInvestment({
        name: form.name,
        amount: parseFloat(form.amount),
        date: form.date,
        notes: form.notes || null,
      });
      navigate('/investments');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 560 }}>
      <div className="page-header animate-fade-up">
        <h1 className="page-title">Log Investment</h1>
        <p className="page-subtitle">Record money spent on an investment</p>
      </div>

      {error && (
        <div className="error-msg animate-fade-in" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 20, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Investment Details
          </h3>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Name / Symbol *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. AAPL, Bitcoin, Vanguard ETF"
              required
            />
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Amount Spent ($) *</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Why you made this investment, strategy, etc."
              rows={3}
            />
          </div>
        </div>

        <div className="animate-fade-up delay-2" style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/investments')}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ flex: 2 }}
          >
            {submitting ? 'Saving…' : 'Save Investment'}
          </button>
        </div>
      </form>
    </div>
  );
}
