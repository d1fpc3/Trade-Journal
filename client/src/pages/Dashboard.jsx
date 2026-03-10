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
  const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl !== null);
  const open = trades.filter(t => t.status === 'OPEN');
  const wins = closed.filter(t => t.pnl > 0);
  const losses = closed.filter(t => t.pnl <= 0);
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const winRate = closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : null;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
  const bestTrade = closed.length > 0 ? closed.reduce((best, t) => t.pnl > best.pnl ? t : best, closed[0]) : null;
  const worstTrade = closed.length > 0 ? closed.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, closed[0]) : null;
  return {
    totalPnl,
    winRate,
    winCount: wins.length,
    lossCount: losses.length,
    openTrades: open.length,
    closedTrades: closed.length,
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
          value={analytics.closedTrades > 0 ? `${analytics.winRate}%` : '—'}
          valueColor={analytics.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${analytics.winCount}W / ${analytics.lossCount}L`}
        />
        <StatCard
          label="Open Trades"
          value={analytics.openTrades}
          valueColor="var(--blue)"
          sub="Currently active"
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
                    <td className="font-mono">${Number(trade.entry_price).toLocaleString()}</td>
                    <td className="font-mono">{trade.exit_price ? `$${Number(trade.exit_price).toLocaleString()}` : '—'}</td>
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
      {(analytics.bestTrade || analytics.worstTrade) && (
        <div className="grid-2" style={{ marginTop: 20 }}>
          {analytics.bestTrade && (
            <div className="card" style={{ borderColor: '#00d4aa33' }}>
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
            <div className="card" style={{ borderColor: '#ff475733' }}>
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
