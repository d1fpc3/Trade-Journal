import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTrades, saveTrades, exportTrades, importTrades } from '../utils/storage.js';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

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

function StatCard({ label, value, valueColor, sub, glow, delay }) {
  return (
    <div className="stat-card" style={{ animationDelay: delay || '0s' }}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value${glow === 'green' ? ' glow-green' : glow === 'red' ? ' glow-red' : ''}`}
        style={{ color: valueColor }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef();

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const handleExport = () => exportTrades();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const added = importTrades(ev.target.result, 'merge');
        setTrades(getTrades());
        setImportMsg(`${added} trade${added !== 1 ? 's' : ''} imported successfully`);
        setTimeout(() => setImportMsg(''), 4000);
      } catch {
        setImportMsg('Invalid backup file — import failed');
        setTimeout(() => setImportMsg(''), 4000);
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  const analytics = computeAnalytics(trades);
  const sortedTrades = [...trades].sort((a, b) => {
    const da = a.date ?? a.entry_date ?? '';
    const db = b.date ?? b.entry_date ?? '';
    return db.localeCompare(da);
  });
  const recentTrades = sortedTrades.slice(0, 5);

  // Mini equity curve data
  const equityCurve = (() => {
    const withPnl = [...trades]
      .filter(t => t.pnl !== null)
      .sort((a, b) => (a.date ?? a.entry_date ?? '').localeCompare(b.date ?? b.entry_date ?? ''));
    let cum = 0;
    return withPnl.map(t => { cum += t.pnl; return { v: parseFloat(cum.toFixed(2)) }; });
  })();

  return (
    <div className="page-container">
      <div className="page-header flex-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExport}
            title="Download all trades as JSON backup"
            style={{ gap: 6 }}
          >
            ↓ Export
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => importRef.current?.click()}
            title="Restore trades from a backup file"
            style={{ gap: 6 }}
          >
            ↑ Import
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <Link to="/log-trade" className="btn btn-primary">+ Log Trade</Link>
        </div>
      </div>

      {importMsg && (
        <div
          className={`animate-fade-in ${importMsg.includes('failed') ? 'error-msg' : 'success-msg'}`}
          style={{ marginBottom: 16 }}
        >
          {importMsg}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          delay="0.05s"
          label="Total P&L"
          value={formatPnl(analytics.totalPnl)}
          valueColor={analytics.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          glow={analytics.totalPnl >= 0 ? 'green' : 'red'}
          sub={`${analytics.totalTrades} trades logged`}
        />
        <StatCard
          delay="0.12s"
          label="Win Rate"
          value={analytics.totalTrades > 0 ? `${analytics.winRate}%` : '—'}
          valueColor={analytics.winRate >= 50 ? 'var(--green)' : analytics.totalTrades > 0 ? 'var(--red)' : 'var(--text-muted)'}
          glow={analytics.winRate >= 50 ? 'green' : undefined}
          sub={`${analytics.winCount}W / ${analytics.lossCount}L`}
        />
        <StatCard
          delay="0.19s"
          label="Today's P&L"
          value={formatPnl(analytics.todayPnl)}
          valueColor={analytics.todayPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          glow={analytics.todayPnl > 0 ? 'green' : analytics.todayPnl < 0 ? 'red' : undefined}
          sub="Current session"
        />
        <StatCard
          delay="0.26s"
          label="Avg Win"
          value={analytics.avgWin ? formatPnl(analytics.avgWin) : '—'}
          valueColor="var(--green)"
          sub={`Avg loss: ${analytics.avgLoss ? formatPnl(analytics.avgLoss) : '—'}`}
        />
      </div>

      {/* Mini Equity Curve */}
      {equityCurve.length > 1 && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Equity Curve · {equityCurve.length} trades
            </span>
            <Link to="/analytics" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>Full Analytics →</Link>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={equityCurve} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <Tooltip
                contentStyle={{ background: '#0f0f18', border: '1px solid #252540', borderRadius: 6, fontSize: '0.75rem', padding: '6px 10px' }}
                formatter={v => [`${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`, 'Equity']}
                labelFormatter={() => ''}
              />
              <Line type="monotone" dataKey="v" stroke={analytics.totalPnl >= 0 ? '#05d890' : '#ff3d5a'}
                strokeWidth={2} dot={false}
                activeDot={{ r: 3, fill: analytics.totalPnl >= 0 ? '#05d890' : '#ff3d5a', stroke: 'none' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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
