import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTrades, deleteTrade } from '../utils/storage.js';

function formatPnl(val) {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TradeHistory() {
  const navigate = useNavigate();
  const [allTrades, setAllTrades] = useState([]);
  const [filters, setFilters] = useState({
    symbol: '',
    direction: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    setAllTrades(getTrades());
  }, []);

  const filtered = allTrades
    .filter(t => {
      if (filters.symbol && !t.symbol.toUpperCase().includes(filters.symbol.toUpperCase())) return false;
      if (filters.direction && t.direction !== filters.direction) return false;
      const tradeDate = t.date ?? t.entry_date ?? '';
      if (filters.from_date && tradeDate < filters.from_date) return false;
      if (filters.to_date && tradeDate > filters.to_date) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.date ?? a.entry_date ?? '';
      const db = b.date ?? b.entry_date ?? '';
      return db.localeCompare(da);
    });

  const totalPnl = filtered.filter(t => t.pnl !== null).reduce((s, t) => s + t.pnl, 0);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this trade? This cannot be undone.')) return;
    deleteTrade(id);
    setAllTrades(getTrades());
  };

  const clearFilters = () => {
    setFilters({ symbol: '', direction: '', from_date: '', to_date: '' });
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="page-title">Trade History</h1>
          <p className="page-subtitle">{filtered.length} trade{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/log-trade" className="btn btn-primary">+ Log Trade</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 120, flex: 1 }}>
            <label className="form-label">Symbol</label>
            <input
              className="form-input"
              value={filters.symbol}
              onChange={e => setFilters(f => ({ ...f, symbol: e.target.value }))}
              placeholder="AAPL"
            />
          </div>
          <div className="form-group" style={{ minWidth: 110 }}>
            <label className="form-label">Direction</label>
            <select
              className="form-select"
              value={filters.direction}
              onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}
            >
              <option value="">All</option>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.from_date}
              onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.to_date}
              onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex', gap: 20, marginBottom: 16,
          padding: '12px 16px',
          background: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> trades
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total P&L: <strong style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace' }}>
              {formatPnl(totalPnl)}
            </strong>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Wins: <strong style={{ color: 'var(--green)' }}>
              {filtered.filter(t => t.pnl > 0).length}
            </strong>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Losses: <strong style={{ color: 'var(--red)' }}>
              {filtered.filter(t => t.pnl < 0).length}
            </strong>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No trades found</p>
            <p className="empty-state-sub">Try adjusting your filters or <Link to="/log-trade">log a new trade</Link></p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Direction</th>
                  <th>P&L</th>
                  <th>Grade</th>
                  <th>Session</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(trade => (
                  <tr key={trade.id} onClick={() => navigate(`/trades/${trade.id}`)}>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {trade.symbol}
                    </td>
                    <td>
                      <span className={`badge ${trade.direction === 'LONG' ? 'badge-green' : 'badge-red'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className={`font-mono ${trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : ''}`}>
                      {formatPnl(trade.pnl)}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem', color: trade.grade === 'A' ? 'var(--green)' : trade.grade === 'B' ? 'orange' : trade.grade === 'C' ? 'var(--red)' : 'var(--text-muted)' }}>
                      {trade.grade || '—'}
                    </td>
                    <td>
                      {trade.session
                        ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 7px', borderRadius: 4 }}>{trade.session}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(trade.date ?? trade.entry_date)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => handleDelete(e, trade.id)}
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      >
                        Delete
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
