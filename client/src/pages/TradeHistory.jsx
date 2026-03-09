import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    symbol: '',
    direction: '',
    status: '',
    from_date: '',
    to_date: ''
  });

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await authFetch(`/api/trades?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrades(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrades(); }, []);

  const handleFilter = async (e) => {
    e.preventDefault();
    fetchTrades();
  };

  const clearFilters = () => {
    setFilters({ symbol: '', direction: '', status: '', from_date: '', to_date: '' });
    setTimeout(fetchTrades, 0);
  };

  const totalPnl = trades.filter(t => t.pnl !== null).reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="page-container">
      <div className="page-header flex-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="page-title">Trade History</h1>
          <p className="page-subtitle">{trades.length} trade{trades.length !== 1 ? 's' : ''} found</p>
        </div>
        <Link to="/log-trade" className="btn btn-primary">+ Log Trade</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
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
          <div className="form-group" style={{ minWidth: 110 }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
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
            <button type="submit" className="btn btn-primary">Filter</button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </form>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Summary bar */}
      {trades.length > 0 && (
        <div style={{
          display: 'flex', gap: 20, marginBottom: 16,
          padding: '12px 16px',
          background: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{trades.length}</strong> trades
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total P&L: <strong style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace' }}>
              {formatPnl(totalPnl)}
            </strong>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Open: <strong style={{ color: 'var(--blue)' }}>
              {trades.filter(t => t.status === 'OPEN').length}
            </strong>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Closed: <strong style={{ color: 'var(--text-secondary)' }}>
              {trades.filter(t => t.status === 'CLOSED').length}
            </strong>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <span className="spinner" style={{ margin: '40px auto' }} />
        ) : trades.length === 0 ? (
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
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Qty</th>
                  <th>P&L</th>
                  <th>P&L %</th>
                  <th>Strategy</th>
                  <th>Status</th>
                  <th>Entry Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} onClick={() => navigate(`/trades/${trade.id}`)}>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {trade.symbol}
                    </td>
                    <td>
                      <span className={`badge ${trade.direction === 'LONG' ? 'badge-green' : 'badge-red'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="font-mono">${trade.entry_price.toLocaleString()}</td>
                    <td className="font-mono">
                      {trade.exit_price ? `$${trade.exit_price.toLocaleString()}` : <span className="text-muted">—</span>}
                    </td>
                    <td>{trade.quantity}</td>
                    <td className={`font-mono ${trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : ''}`}>
                      {formatPnl(trade.pnl)}
                    </td>
                    <td className={`font-mono ${trade.pnl_percent > 0 ? 'text-green' : trade.pnl_percent < 0 ? 'text-red' : ''}`}>
                      {trade.pnl_percent != null ? `${trade.pnl_percent >= 0 ? '+' : ''}${trade.pnl_percent.toFixed(2)}%` : '—'}
                    </td>
                    <td>
                      {trade.strategy
                        ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 7px', borderRadius: 4 }}>{trade.strategy}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${trade.status === 'OPEN' ? 'badge-blue' : 'badge-muted'}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(trade.entry_date)}</td>
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
