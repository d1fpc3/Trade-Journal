import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvestments, deleteInvestment } from '../utils/storage.js';

function formatAmount(val) {
  return `$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvestmentHistory() {
  const [allInvestments, setAllInvestments] = useState([]);
  const [filters, setFilters] = useState({ name: '', from_date: '', to_date: '' });

  useEffect(() => {
    getInvestments().then(setAllInvestments).catch(console.error);
  }, []);

  const filtered = allInvestments
    .filter(inv => {
      if (filters.name && !inv.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.from_date && inv.date < filters.from_date) return false;
      if (filters.to_date && inv.date > filters.to_date) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSpent = filtered.reduce((s, inv) => s + inv.amount, 0);
  const hasFilters = filters.name || filters.from_date || filters.to_date;

  const clearFilters = () => setFilters({ name: '', from_date: '', to_date: '' });

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!confirm('Delete this investment entry? This cannot be undone.')) return;
    await deleteInvestment(id);
    setAllInvestments(prev => prev.filter(inv => inv.id !== id));
  };

  return (
    <div className="page-container">
      <div className="page-header animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Investments</h1>
          <p className="page-subtitle">Track money spent on investments</p>
        </div>
        <Link to="/log-investment" className="btn btn-primary">+ Log Investment</Link>
      </div>

      {/* Filters */}
      <div className="card animate-fade-up delay-1" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 160px', marginBottom: 0 }}>
            <label className="form-label">Search name</label>
            <input
              className="form-input"
              placeholder="AAPL, Bitcoin…"
              value={filters.name}
              onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label className="form-label">From date</label>
            <input
              className="form-input"
              type="date"
              value={filters.from_date}
              onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label className="form-label">To date</label>
            <input
              className="form-input"
              type="date"
              value={filters.to_date}
              onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
            />
          </div>
          {hasFilters && (
            <button className="btn btn-secondary" onClick={clearFilters} style={{ height: 42 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="animate-fade-up delay-2" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, padding: '12px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Entries</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '12px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Invested</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{formatAmount(totalSpent)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card animate-fade-up delay-3">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            {hasFilters ? 'No investments match your filters.' : 'No investments yet. Log your first one!'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Amount', 'Date', 'Notes', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{inv.name}</td>
                    <td style={{ padding: '12px', color: 'var(--green)', fontWeight: 600 }}>{formatAmount(inv.amount)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{formatDate(inv.date)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.notes || '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={e => handleDelete(e, inv.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 8px', borderRadius: 4, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
