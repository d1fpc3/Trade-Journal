import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Dashboard() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, tradesRes] = await Promise.all([
          authFetch('/api/trades/analytics'),
          authFetch('/api/trades?limit=5')
        ]);
        if (!analyticsRes.ok || !tradesRes.ok) throw new Error('Failed to load data');
        const [a, trades] = await Promise.all([analyticsRes.json(), tradesRes.json()]);
        setAnalytics(a);
        setRecentTrades(trades.slice(0, 8));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-container"><span className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header flex-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading performance overview</p>
        </div>
        <Link to="/log-trade" className="btn btn-primary">+ Log Trade</Link>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total P&L"
          value={formatPnl(analytics?.totalPnl)}
          valueColor={analytics?.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          sub={`${analytics?.closedTrades || 0} closed trades`}
        />
        <StatCard
          label="Win Rate"
          value={analytics?.winRate ? `${analytics.winRate}%` : '—'}
          valueColor={analytics?.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${analytics?.winCount || 0}W / ${analytics?.lossCount || 0}L`}
        />
        <StatCard
          label="Open Trades"
          value={analytics?.openTrades ?? '—'}
          valueColor="var(--blue)"
          sub="Currently active"
        />
        <StatCard
          label="Total Trades"
          value={analytics?.totalTrades ?? '—'}
          valueColor="var(--text-primary)"
          sub={`Avg win: ${formatPnl(analytics?.avgWin)}`}
        />
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3>Recent Trades</h3>
          <Link to="/trades" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No trades yet</p>
            <p className="empty-state-sub">
              <Link to="/log-trade">Log your first trade</Link> to get started
            </p>
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
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(trade => (
                  <tr key={trade.id} onClick={() => navigate(`/trades/${trade.id}`)}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trade.symbol}</td>
                    <td>
                      <span className={`badge ${trade.direction === 'LONG' ? 'badge-green' : 'badge-red'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="font-mono">${trade.entry_price.toLocaleString()}</td>
                    <td className="font-mono">{trade.exit_price ? `$${trade.exit_price.toLocaleString()}` : '—'}</td>
                    <td>{trade.quantity}</td>
                    <td className={`font-mono ${trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : ''}`}>
                      {formatPnl(trade.pnl)}
                    </td>
                    <td>
                      <span className={`badge ${trade.status === 'OPEN' ? 'badge-blue' : 'badge-muted'}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td>{formatDate(trade.entry_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Best / Worst */}
      {analytics && (analytics.bestTrade || analytics.worstTrade) && (
        <div className="grid-2" style={{ marginTop: 20 }}>
          {analytics.bestTrade && (
            <div className="card" style={{ borderColor: 'var(--green)', borderOpacity: 0.3 }}>
              <p className="card-title" style={{ color: 'var(--green)' }}>Best Trade</p>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--green)' }}>
                {formatPnl(analytics.bestTrade.pnl)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {analytics.bestTrade.symbol} — {formatDate(analytics.bestTrade.entry_date)}
              </p>
            </div>
          )}
          {analytics.worstTrade && (
            <div className="card" style={{ borderColor: 'var(--red)', borderOpacity: 0.3 }}>
              <p className="card-title" style={{ color: 'var(--red)' }}>Worst Trade</p>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--red)' }}>
                {formatPnl(analytics.worstTrade.pnl)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {analytics.worstTrade.symbol} — {formatDate(analytics.worstTrade.entry_date)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color: valueColor }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
