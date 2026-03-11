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
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeAnalytics(trades) {
  const withPnl = trades.filter(t => t.pnl !== null && t.pnl !== undefined);
  const wins    = withPnl.filter(t => t.pnl > 0);
  const losses  = withPnl.filter(t => t.pnl <= 0);

  const totalPnl  = withPnl.reduce((s, t) => s + t.pnl, 0);
  const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const winRate   = withPnl.length > 0 ? Math.round((wins.length / withPnl.length) * 100) : 0;
  const avgWin    = wins.length   > 0 ? totalWins / wins.length   : null;
  const avgLoss   = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : null;
  const profitFactor = totalLoss > 0 ? parseFloat((totalWins / totalLoss).toFixed(2)) : null;

  const bestTrade  = withPnl.length > 0 ? withPnl.reduce((b, t) => t.pnl > b.pnl ? t : b, withPnl[0]) : null;
  const worstTrade = withPnl.length > 0 ? withPnl.reduce((w, t) => t.pnl < w.pnl ? t : w, withPnl[0]) : null;

  // Win/Loss streaks
  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
  const sorted = [...withPnl].sort((a, b) => new Date(a.date ?? a.entry_date) - new Date(b.date ?? b.entry_date));
  sorted.forEach(t => {
    if (t.pnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
    else            { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
  });

  // Avg R:R (pnl / risk_amount where both exist)
  const rrTrades = withPnl.filter(t => t.risk_amount && t.risk_amount > 0);
  const avgRR = rrTrades.length > 0
    ? parseFloat((rrTrades.reduce((s, t) => s + t.pnl / t.risk_amount, 0) / rrTrades.length).toFixed(2))
    : null;

  // Equity curve sorted by date
  let cum = 0;
  const equityCurve = sorted.map(t => {
    cum += t.pnl;
    return { date: t.date ?? t.entry_date, pnl: t.pnl, cumulativePnl: parseFloat(cum.toFixed(2)) };
  });

  // Max drawdown from equity curve
  let peak = 0, maxDrawdown = 0;
  equityCurve.forEach(p => {
    if (p.cumulativePnl > peak) peak = p.cumulativePnl;
    const dd = peak - p.cumulativePnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  // P&L by symbol
  const symbolMap = {};
  withPnl.forEach(t => { symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + t.pnl; });
  const pnlBySymbol = Object.entries(symbolMap)
    .map(([symbol, pnl]) => ({ symbol, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

  // P&L by session
  const sessionMap = {};
  withPnl.forEach(t => {
    const s = t.session || 'Unknown';
    if (!sessionMap[s]) sessionMap[s] = { pnl: 0, count: 0 };
    sessionMap[s].pnl += t.pnl;
    sessionMap[s].count++;
  });
  const pnlBySession = Object.entries(sessionMap)
    .map(([session, v]) => ({ session, pnl: parseFloat(v.pnl.toFixed(2)), count: v.count }))
    .sort((a, b) => b.pnl - a.pnl);

  // P&L by grade
  const gradeMap = { A: { pnl: 0, count: 0 }, B: { pnl: 0, count: 0 }, C: { pnl: 0, count: 0 } };
  withPnl.forEach(t => {
    if (t.grade && gradeMap[t.grade]) {
      gradeMap[t.grade].pnl += t.pnl;
      gradeMap[t.grade].count++;
    }
  });
  const pnlByGrade = Object.entries(gradeMap)
    .filter(([, v]) => v.count > 0)
    .map(([grade, v]) => ({ grade, pnl: parseFloat(v.pnl.toFixed(2)), count: v.count }));

  // Mistakes frequency
  const mistakeMap = {};
  withPnl.forEach(t => {
    (t.mistakes || []).forEach(m => { mistakeMap[m] = (mistakeMap[m] || 0) + 1; });
  });
  const mistakeFreq = Object.entries(mistakeMap)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // P&L by day of week
  const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dowMap = {};
  withPnl.forEach(t => {
    const dayName = DOW_NAMES[new Date(t.date ?? t.entry_date).getDay()];
    if (!dowMap[dayName]) dowMap[dayName] = { pnl: 0, count: 0 };
    dowMap[dayName].pnl += t.pnl;
    dowMap[dayName].count++;
  });
  const pnlByDow = DOW_ORDER
    .map(d => ({ day: d, pnl: parseFloat((dowMap[d]?.pnl || 0).toFixed(2)), count: dowMap[d]?.count || 0 }))
    .filter(d => d.count > 0);

  // Win rate by setup (min 2 trades)
  const setupMap2 = {};
  withPnl.forEach(t => {
    if (!t.setup) return;
    if (!setupMap2[t.setup]) setupMap2[t.setup] = { count: 0, wins: 0, pnl: 0 };
    setupMap2[t.setup].count++;
    if (t.pnl > 0) setupMap2[t.setup].wins++;
    setupMap2[t.setup].pnl += t.pnl;
  });
  const winRateBySetup = Object.entries(setupMap2)
    .filter(([, v]) => v.count >= 2)
    .map(([setup, v]) => ({ setup, winRate: Math.round((v.wins / v.count) * 100), count: v.count, pnl: parseFloat(v.pnl.toFixed(2)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalPnl, winRate, winCount: wins.length, lossCount: losses.length,
    totalTrades: trades.length, withPnlCount: withPnl.length,
    avgWin, avgLoss, profitFactor, bestTrade, worstTrade,
    maxWinStreak, maxLossStreak, avgRR, maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    equityCurve, pnlBySymbol, pnlBySession, pnlByGrade, mistakeFreq, pnlByDow, winRateBySetup
  };
}

const ChartTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: '#0f0f18', border: '1px solid #252540', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{prefix}{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.value >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace', fontWeight: 700 }}>
          {typeof val === 'number' && entry.name !== 'count'
            ? `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(2)}`
            : entry.value}
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color, delay }) {
  return (
    <div className="stat-card" style={{ animationDelay: delay || '0s' }}>
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color: color || 'var(--text-primary)', fontSize: '1.6rem' }}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

const GRADE_COLORS = { A: '#05d890', B: '#ff9a3c', C: '#ff3d5a' };

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(computeAnalytics(getTrades()));
  }, []);

  if (!data) return <div className="page-container"><span className="spinner" /></div>;

  const pieData = (data.winCount > 0 || data.lossCount > 0) ? [
    { name: 'Wins',   value: data.winCount,  color: '#05d890' },
    { name: 'Losses', value: data.lossCount, color: '#ff3d5a' }
  ] : [];

  if (data.totalTrades === 0) return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance breakdown</p>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-text">No trade data yet</p>
        <p className="empty-state-sub"><Link to="/log-trade">Log some trades</Link> to see analytics</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header animate-fade-up">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance breakdown across {data.withPnlCount} trade{data.withPnlCount !== 1 ? 's' : ''}</p>
      </div>

      {/* ── Row 1: Core stats ─────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard delay="0.05s" label="Total P&L"
          value={formatPnl(data.totalPnl)}
          color={data.totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
          sub={`${data.withPnlCount} trades`}
        />
        <StatCard delay="0.1s" label="Win Rate"
          value={data.withPnlCount > 0 ? `${data.winRate}%` : '—'}
          color={data.winRate >= 50 ? 'var(--green)' : 'var(--red)'}
          sub={`${data.winCount}W / ${data.lossCount}L`}
        />
        <StatCard delay="0.15s" label="Profit Factor"
          value={data.profitFactor != null ? data.profitFactor.toFixed(2) : '—'}
          color={data.profitFactor != null ? (data.profitFactor >= 1.5 ? 'var(--green)' : data.profitFactor >= 1 ? 'var(--orange)' : 'var(--red)') : 'var(--text-muted)'}
          sub="wins ÷ losses"
        />
        <StatCard delay="0.2s" label="Avg R:R"
          value={data.avgRR != null ? `${data.avgRR}R` : '—'}
          color={data.avgRR != null ? (data.avgRR >= 1 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)'}
          sub="avg pnl ÷ risk"
        />
      </div>

      {/* ── Row 2: Secondary stats ────────────────── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard delay="0.25s" label="Avg Win"
          value={formatPnl(data.avgWin)}
          color="var(--green)"
        />
        <StatCard delay="0.3s" label="Avg Loss"
          value={formatPnl(data.avgLoss)}
          color="var(--red)"
        />
        <StatCard delay="0.35s" label="Max Win Streak"
          value={data.maxWinStreak || '—'}
          color="var(--green)"
          sub="consecutive wins"
        />
        <StatCard delay="0.4s" label="Max Loss Streak"
          value={data.maxLossStreak || '—'}
          color="var(--red)"
          sub="consecutive losses"
        />
      </div>

      {/* ── Equity Curve ──────────────────────────── */}
      {data.equityCurve.length > 1 && (
        <div className="card animate-fade-up delay-2" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Equity Curve</h3>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Max Drawdown: <strong style={{ color: 'var(--red)', fontFamily: 'monospace' }}>-${data.maxDrawdown.toFixed(2)}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Net: <strong style={{ color: data.totalPnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'monospace' }}>{formatPnl(data.totalPnl)}</strong>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.equityCurve} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#05d890" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#05d890" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" />
              <XAxis dataKey="date" tickFormatter={formatDate}
                tick={{ fill: '#44446a', fontSize: 11 }} axisLine={{ stroke: '#1c1c2e' }} tickLine={false} />
              <YAxis tick={{ fill: '#44446a', fontSize: 11 }} axisLine={{ stroke: '#1c1c2e' }} tickLine={false}
                tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString()}`} />
              <Tooltip content={<ChartTooltip />} labelFormatter={formatDate} />
              <Line type="monotone" dataKey="cumulativePnl" stroke="#05d890" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: '#05d890', stroke: '#060609', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Symbol + Win/Loss ─────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {data.pnlBySymbol.length > 0 && (
          <div className="card animate-fade-up delay-3">
            <h3 style={{ marginBottom: 20 }}>P&L by Symbol</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.pnlBySymbol} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" />
                <XAxis dataKey="symbol" tick={{ fill: '#8888b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#44446a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pnl" radius={[5, 5, 0, 0]}>
                  {data.pnlBySymbol.map((e, i) => (
                    <Cell key={i} fill={e.pnl >= 0 ? '#05d890' : '#ff3d5a'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="card animate-fade-up delay-3">
            <h3 style={{ marginBottom: 20 }}>Win / Loss Ratio</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90}
                  paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend formatter={(val, entry) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {entry.payload.name} ({entry.payload.value})
                  </span>
                )} />
                <Tooltip
                  contentStyle={{ background: '#0f0f18', border: '1px solid #252540', borderRadius: 8, fontSize: '0.8rem' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Session + Grade ───────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {data.pnlBySession.length > 0 && (
          <div className="card animate-fade-up delay-4">
            <h3 style={{ marginBottom: 20 }}>P&L by Session</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.pnlBySession} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" />
                <XAxis dataKey="session" tick={{ fill: '#8888b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#44446a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pnl" radius={[5, 5, 0, 0]}>
                  {data.pnlBySession.map((e, i) => (
                    <Cell key={i} fill={e.pnl >= 0 ? '#05d890' : '#ff3d5a'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.pnlByGrade.length > 0 && (
          <div className="card animate-fade-up delay-4">
            <h3 style={{ marginBottom: 20 }}>P&L by Grade</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.pnlByGrade} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" />
                <XAxis dataKey="grade" tick={{ fill: '#8888b0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#44446a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pnl" radius={[5, 5, 0, 0]}>
                  {data.pnlByGrade.map((e, i) => (
                    <Cell key={i} fill={GRADE_COLORS[e.grade] || '#8888b0'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Mistakes ──────────────────────────────── */}
      {data.mistakeFreq.length > 0 && (
        <div className="card animate-fade-up delay-5" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 20 }}>Top Mistakes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.mistakeFreq} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#44446a', fontSize: 10 }} axisLine={false} tickLine={false}
                allowDecimals={false} />
              <YAxis type="category" dataKey="mistake" width={130}
                tick={{ fill: '#8888b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f0f18', border: '1px solid #252540', borderRadius: 8, fontSize: '0.8rem' }}
                formatter={(v) => [v, 'Times']}
              />
              <Bar dataKey="count" radius={[0, 5, 5, 0]} fill="rgba(255,61,90,0.7)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Day of Week + Setup Win Rate ──────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {data.pnlByDow.length > 0 && (
          <div className="card animate-fade-up delay-5">
            <h3 style={{ marginBottom: 20 }}>P&L by Day of Week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.pnlByDow} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" />
                <XAxis dataKey="day" tick={{ fill: '#8888b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#44446a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="pnl" radius={[5, 5, 0, 0]}>
                  {data.pnlByDow.map((e, i) => (
                    <Cell key={i} fill={e.pnl >= 0 ? '#05d890' : '#ff3d5a'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.winRateBySetup.length > 0 && (
          <div className="card animate-fade-up delay-5">
            <h3 style={{ marginBottom: 20 }}>Win Rate by Setup</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.winRateBySetup} layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,28,46,0.8)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#44446a', fontSize: 10 }}
                  axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="setup" width={120}
                  tick={{ fill: '#8888b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f0f18', border: '1px solid #252540', borderRadius: 8, fontSize: '0.8rem' }}
                  formatter={(v, name) => name === 'winRate' ? [`${v}%`, 'Win Rate'] : [v, name]}
                />
                <Bar dataKey="winRate" radius={[0, 5, 5, 0]}>
                  {data.winRateBySetup.map((e, i) => (
                    <Cell key={i} fill={e.winRate >= 50 ? '#05d890' : '#ff3d5a'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Best / Worst ──────────────────────────── */}
      {(data.bestTrade || data.worstTrade) && (
        <div className="grid-2 animate-fade-up delay-5" style={{ marginBottom: 20 }}>
          {data.bestTrade && (
            <div className="card" style={{ borderColor: 'rgba(5,216,144,0.2)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Best Trade</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{data.bestTrade.symbol}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                    {data.bestTrade.direction} • {formatDate(data.bestTrade.date ?? data.bestTrade.entry_date)}
                    {data.bestTrade.session ? ` • ${data.bestTrade.session}` : ''}
                  </p>
                  {data.bestTrade.setup && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{data.bestTrade.setup}</p>
                  )}
                </div>
                <p style={{ color: 'var(--green)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem' }}>
                  {formatPnl(data.bestTrade.pnl)}
                </p>
              </div>
            </div>
          )}
          {data.worstTrade && (
            <div className="card" style={{ borderColor: 'rgba(255,61,90,0.2)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Worst Trade</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{data.worstTrade.symbol}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                    {data.worstTrade.direction} • {formatDate(data.worstTrade.date ?? data.worstTrade.entry_date)}
                    {data.worstTrade.session ? ` • ${data.worstTrade.session}` : ''}
                  </p>
                  {data.worstTrade.setup && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{data.worstTrade.setup}</p>
                  )}
                </div>
                <p style={{ color: 'var(--red)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem' }}>
                  {formatPnl(data.worstTrade.pnl)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Summary grid ──────────────────────────── */}
      <div className="card animate-fade-up delay-6">
        <h3 style={{ marginBottom: 16 }}>Full Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Trades',    value: data.totalTrades },
            { label: 'Trades w/ P&L',  value: data.withPnlCount },
            { label: 'Winning Trades',  value: data.winCount,    color: 'var(--green)' },
            { label: 'Losing Trades',   value: data.lossCount,   color: 'var(--red)' },
            { label: 'Avg Win',         value: formatPnl(data.avgWin),  color: 'var(--green)', mono: true },
            { label: 'Avg Loss',        value: formatPnl(data.avgLoss), color: 'var(--red)',   mono: true },
            { label: 'Profit Factor',   value: data.profitFactor != null ? data.profitFactor : '—',
              color: data.profitFactor >= 1.5 ? 'var(--green)' : data.profitFactor >= 1 ? 'var(--orange)' : 'var(--red)' },
            { label: 'Max Drawdown',    value: `$${data.maxDrawdown.toFixed(2)}`, color: 'var(--red)', mono: true },
            { label: 'Win Streak',      value: data.maxWinStreak  || '—', color: 'var(--green)' },
            { label: 'Loss Streak',     value: data.maxLossStreak || '—', color: 'var(--red)' },
            { label: 'Avg R:R',         value: data.avgRR != null ? `${data.avgRR}R` : '—',
              color: data.avgRR >= 1 ? 'var(--green)' : 'var(--red)' },
            { label: 'Net P&L',         value: formatPnl(data.totalPnl),
              color: data.totalPnl >= 0 ? 'var(--green)' : 'var(--red)', mono: true }
          ].map(row => (
            <div key={row.label} style={{
              padding: '12px 14px', background: 'var(--bg-input)',
              borderRadius: 8, border: '1px solid var(--border)',
              transition: 'border-color 0.2s ease'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                {row.label}
              </p>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: row.color || 'var(--text-primary)', fontFamily: row.mono ? 'var(--font-mono)' : 'inherit' }}>
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
