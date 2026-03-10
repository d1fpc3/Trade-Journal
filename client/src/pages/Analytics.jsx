import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { getTrades } from '../utils/storage.js';

function formatPnl(val) {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const bestTrade = closed.length > 0 ? closed.reduce((b, t) => t.pnl > b.pnl ? t : b, closed[0]) : null;
  const worstTrade = closed.length > 0 ? closed.reduce((w, t) => t.pnl < w.pnl ? t : w, closed[0]) : null;

  // Equity curve — sort by entry_date
  const sorted = [...closed].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
  let cum = 0;
  const equityCurve = sorted.map(t => {
    cum += t.pnl;
    return { date: t.entry_date, cumulativePnl: parseFloat(cum.toFixed(2)) };
  });

  // P&L by symbol
  const symbolMap = {};
  closed.forEach(t => {
    symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + t.pnl;
  });
  const pnlBySymbol = Object.entries(symbolMap)
    .map(([symbol, pnl]) => ({ symbol, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

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
    worstTrade,
    equityCurve,
    pnlBySymbol
  };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1a28',
      border: '1px solid #252538',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.8rem'
    }}>
      <p style={{ color: '#8888aa', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.value >= 0 ? '#00d4aa' : '#ff4757', fontFamily: 'monospace', fontWeight: 600 }}>
          {entry.value >= 0 ? '+' : ''}${Math.abs(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color: color || 'var(--text-primary)', fontSize: '1.5rem', fontFamily: 'monospace' }}>
        {value}
      </p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const trades = getTrades();
    setData(computeAnalytics(trades));
  }, []);

  if (!data) return <div className="page-container"><span className="spinner" /></div>;

  const pieData = data.winCount > 0 || data.lossCount > 0 ? [
    { name: 'Wins', value: data.winCount, color: '#00d4aa' },
    { name: 'Losses', value: data.lossCount, color: '#ff4757' }
  ] : [];

  const hasData = data.totalTrades > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance breakdown across all closed trades</p>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">No trade data yet</p>
          <p className="empty-state-sub">
            <Link to="/log-trade">Log some trades</Link> to see analytics
          </p>
        </div>
      ) : (
        <>
          {/* Key Stats */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <StatCard
              label="Total P&L"
              value={formatPnl(data.totalPnl)}
              color={data.totalPnl >= 0 ? '#00d4aa' : '#ff4757'}
            />
            <StatCard
              label="Win Rate"
              value={data.closedTrades > 0 ? `${data.winRate}%` : '—'}
              sub={`${data.winCount}W / ${data.lossCount}L`}
              color={data.winRate >= 50 ? '#00d4aa' : '#ff4757'}
            />
            <StatCard
              label="Avg Win"
              value={formatPnl(data.avgWin)}
              color="#00d4aa"
            />
            <StatCard
              label="Avg Loss"
              value={formatPnl(data.avgLoss)}
              color="#ff4757"
            />
          </div>

          {/* Equity Curve */}
          {data.equityCurve?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 20 }}>Equity Curve</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.equityCurve} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: '#555570', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#555570', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e2e' }}
                    tickLine={false}
                    tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString()}`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    labelFormatter={formatDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativePnl"
                    stroke="#00d4aa"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#00d4aa', stroke: '#0a0a0f', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar + Pie row */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* P&L by Symbol */}
            {data.pnlBySymbol?.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>P&L by Symbol</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.pnlBySymbol} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis
                      dataKey="symbol"
                      tick={{ fill: '#8888aa', fontSize: 11 }}
                      axisLine={{ stroke: '#1e1e2e' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#555570', fontSize: 11 }}
                      axisLine={{ stroke: '#1e1e2e' }}
                      tickLine={false}
                      tickFormatter={v => `$${v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {data.pnlBySymbol.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? '#00d4aa' : '#ff4757'} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Win/Loss Pie */}
            {pieData.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>Win / Loss Ratio</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value, entry) => (
                        <span style={{ color: '#8888aa', fontSize: '0.8rem' }}>
                          {entry.payload.name} ({entry.payload.value})
                        </span>
                      )}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{ background: '#1a1a28', border: '1px solid #252538', borderRadius: 8, fontSize: '0.8rem' }}
                      labelStyle={{ color: '#8888aa' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Best / Worst Trades */}
          {(data.bestTrade || data.worstTrade) && (
            <div className="grid-2" style={{ marginBottom: 20 }}>
              {data.bestTrade && (
                <div className="card" style={{ borderColor: '#00d4aa33' }}>
                  <p style={{ fontSize: '0.72rem', color: '#00d4aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Best Trade
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{data.bestTrade.symbol}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {data.bestTrade.direction} • {formatDate(data.bestTrade.entry_date)}
                      </p>
                      {data.bestTrade.strategy && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                          {data.bestTrade.strategy}
                        </p>
                      )}
                    </div>
                    <p style={{ color: '#00d4aa', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem' }}>
                      {formatPnl(data.bestTrade.pnl)}
                    </p>
                  </div>
                </div>
              )}
              {data.worstTrade && (
                <div className="card" style={{ borderColor: '#ff475733' }}>
                  <p style={{ fontSize: '0.72rem', color: '#ff4757', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Worst Trade
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{data.worstTrade.symbol}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {data.worstTrade.direction} • {formatDate(data.worstTrade.entry_date)}
                      </p>
                      {data.worstTrade.strategy && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                          {data.worstTrade.strategy}
                        </p>
                      )}
                    </div>
                    <p style={{ color: '#ff4757', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem' }}>
                      {formatPnl(data.worstTrade.pnl)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Table */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Performance Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Trades', value: data.totalTrades },
                { label: 'Closed Trades', value: data.closedTrades },
                { label: 'Open Trades', value: data.openTrades, color: '#4c9aff' },
                { label: 'Winning Trades', value: data.winCount, color: '#00d4aa' },
                { label: 'Losing Trades', value: data.lossCount, color: '#ff4757' },
                { label: 'Avg Win', value: formatPnl(data.avgWin), color: '#00d4aa', mono: true },
                { label: 'Avg Loss', value: formatPnl(data.avgLoss), color: '#ff4757', mono: true },
                { label: 'Total P&L', value: formatPnl(data.totalPnl), color: data.totalPnl >= 0 ? '#00d4aa' : '#ff4757', mono: true }
              ].map(row => (
                <div key={row.label} style={{
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {row.label}
                  </p>
                  <p style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: row.color || 'var(--text-primary)',
                    fontFamily: row.mono ? 'monospace' : 'inherit'
                  }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
