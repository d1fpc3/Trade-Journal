import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTrades } from '../utils/storage.js';

function formatPnl(val) {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeAnalytics(trades) {
  const today = new Date().toISOString().slice(0, 10);
  const withPnl = trades.filter(t => t.pnl !== null);
  const wins = withPnl.filter(t => t.pnl > 0);
  const losses = withPnl.filter(t => t.pnl <= 0);
  const totalPnl = withPnl.reduce((s, t) => s + t.pnl, 0);
  const todayPnl = withPnl.filter(t => (t.date ?? t.entry_date ?? '').slice(0, 10) === today).reduce((s, t) => s + t.pnl, 0);
  const winRate = withPnl.length > 0 ? Math.round((wins.length / withPnl.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : null;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
  const bestTrade = withPnl.length > 0 ? withPnl.reduce((best, t) => t.pnl > best.pnl ? t : best, withPnl[0]) : null;
  const worstTrade = withPnl.length > 0 ? withPnl.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, withPnl[0]) : null;
  return {
    totalPnl,
    todayPnl,
    winRate,
    winCount: wins.length,
    lossCount: losses.length,
    totalTrades: trades.length,
    avgWin,
    avgLoss,
    bestTrade,
    worstTrade
  };
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const analytics = computeAnalytics(trades);
  const recentTrades = trades.slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header flex-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading performance overview</p>
        </div>
        <Link to="/log-trade" className="btn btn-primary">+ Log Trade</Link>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total P&L"
          value={formatPnl(analytics.totalPnl)}
          valueColor={analytics.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          sub={`${analytics.closedTrades} closed trades`}
        />
        <StatCard
          label="Win Rate"
          value={analytics.totalTrades > 0 ? `${analytics.winRate}%` : '—'}
          valueColor={analytics.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${analytics.winCount}W / ${analytics.lossCount}L`}
        />
        <StatCard
          label="Today's P&L"
          value={formatPnl(analytics.todayPnl)}
          valueColor={analytics.todayPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          sub="Current session"
        />
        <StatCard
          label="Total Trades"
          value={analytics.totalTrades}
          valueColor="var(--text-primary)"
          sub={`Avg win: ${formatPnl(analytics.avgWin)}`}
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
                  <th>Session</th>
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
                    <td className="font-mono">${Number(trade.entry_price).toLocaleString()}</td>
                    <td className="font-mono">{trade.exit_price ? `$${Number(trade.exit_price).toLocaleString()}` : '—'}</td>
                    <td>{trade.quantity}</td>
                    <td className={`font-mono ${trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : ''}`}>
                      {formatPnl(trade.pnl)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{trade.session || '—'}</td>
                    <td>{formatDate(trade.date ?? trade.entry_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Best / Worst */}
      {(analytics.bestTrade || analytics.worstTrade) && (
        <div className="grid-2" style={{ marginTop: 20 }}>
          {analytics.bestTrade && (
            <div className="card" style={{ borderColor: '#00d4aa33' }}>
              <p className="card-title" style={{ color: 'var(--green)' }}>Best Trade</p>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--green)' }}>
                {formatPnl(analytics.bestTrade.pnl)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {analytics.bestTrade.symbol} — {formatDate(analytics.bestTrade.date ?? analytics.bestTrade.entry_date)}
              </p>
            </div>
          )}
          {analytics.worstTrade && (
            <div className="card" style={{ borderColor: '#ff475733' }}>
              <p className="card-title" style={{ color: 'var(--red)' }}>Worst Trade</p>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--red)' }}>
                {formatPnl(analytics.worstTrade.pnl)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                {analytics.worstTrade.symbol} — {formatDate(analytics.worstTrade.date ?? analytics.worstTrade.entry_date)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
