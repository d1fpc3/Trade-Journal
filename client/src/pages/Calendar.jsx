import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrades } from '../utils/storage.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatPnl(val) {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [trades, setTrades] = useState([]);
  const [selected, setSelected] = useState(null); // 'YYYY-MM-DD'

  useEffect(() => { setTrades(getTrades()); }, []);

  // Build day-keyed map for this month
  const dayMap = {};
  trades.forEach(t => {
    const d = (t.date ?? t.entry_date ?? '').slice(0, 10);
    if (!d) return;
    if (!dayMap[d]) dayMap[d] = [];
    dayMap[d].push(t);
  });

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = n => String(n).padStart(2, '0');
  const dateKey = d => `${year}-${pad(month + 1)}-${pad(d)}`;

  // Month summary stats
  const monthTrades = trades.filter(t => {
    const d = (t.date ?? t.entry_date ?? '').slice(0, 10);
    return d.startsWith(`${year}-${pad(month + 1)}`);
  });
  const monthWithPnl = monthTrades.filter(t => t.pnl !== null);
  const monthPnl = monthWithPnl.reduce((s, t) => s + t.pnl, 0);
  const activeDays = new Set(monthWithPnl.map(t => (t.date ?? t.entry_date ?? '').slice(0, 10)));
  const winDays = [...activeDays].filter(d => {
    const dayTrades = (dayMap[d] || []).filter(t => t.pnl !== null);
    return dayTrades.reduce((s, t) => s + t.pnl, 0) > 0;
  }).length;
  const lossDays = [...activeDays].filter(d => {
    const dayTrades = (dayMap[d] || []).filter(t => t.pnl !== null);
    return dayTrades.reduce((s, t) => s + t.pnl, 0) <= 0;
  }).length;

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelected(null); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelected(null); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); };
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const selectedTrades = selected ? (dayMap[selected] || []) : [];

  return (
    <div className="page-container">
      <div className="page-header animate-fade-up">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">Daily trading activity overview</p>
      </div>

      {/* Month summary */}
      <div className="grid-4 animate-fade-up delay-1" style={{ marginBottom: 20 }}>
        {[
          { label: 'Month P&L', value: formatPnl(monthPnl), color: monthPnl >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Total Trades', value: monthTrades.length || '—', color: 'var(--text-primary)' },
          { label: 'Win Days', value: winDays || '—', color: 'var(--green)' },
          { label: 'Loss Days', value: lossDays || '—', color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="card animate-fade-up delay-2">

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prev} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '1rem' }}>‹</button>
            {!isCurrentMonth && (
              <button onClick={goToday} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                Today
              </button>
            )}
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '1rem' }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', padding: '4px 0'
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const key = dateKey(day);
            const dayTrades = dayMap[key] || [];
            const withPnl = dayTrades.filter(t => t.pnl !== null);
            const pnl = withPnl.length > 0 ? withPnl.reduce((s, t) => s + t.pnl, 0) : null;
            const isToday = key === today.toISOString().slice(0, 10);
            const isSelected = key === selected;
            const isWin = pnl !== null && pnl > 0;
            const isLoss = pnl !== null && pnl <= 0;

            return (
              <div
                key={key}
                onClick={() => setSelected(isSelected ? null : key)}
                style={{
                  borderRadius: 8,
                  padding: '8px 6px 6px',
                  minHeight: 64,
                  cursor: dayTrades.length > 0 ? 'pointer' : 'default',
                  border: isSelected
                    ? '1px solid rgba(5,216,144,0.6)'
                    : isToday
                    ? '1px solid rgba(5,216,144,0.3)'
                    : '1px solid transparent',
                  background: isSelected
                    ? 'rgba(5,216,144,0.08)'
                    : isWin
                    ? 'rgba(5,216,144,0.06)'
                    : isLoss
                    ? 'rgba(255,61,90,0.06)'
                    : isToday
                    ? 'rgba(5,216,144,0.03)'
                    : 'var(--bg-input)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxShadow: isSelected ? '0 0 12px rgba(5,216,144,0.15)' : 'none',
                }}
                onMouseEnter={e => { if (dayTrades.length > 0 && !isSelected) e.currentTarget.style.borderColor = 'rgba(5,216,144,0.3)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isToday ? 'rgba(5,216,144,0.3)' : 'transparent'; }}
              >
                <div style={{
                  fontSize: '0.78rem', fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--green)' : 'var(--text-secondary)',
                  marginBottom: 4
                }}>{day}</div>

                {pnl !== null && (
                  <div style={{
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: isWin ? 'var(--green)' : 'var(--red)',
                    lineHeight: 1.2,
                    marginBottom: 3
                  }}>
                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
                  </div>
                )}

                {dayTrades.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {dayTrades.slice(0, 4).map((_, idx) => (
                      <div key={idx} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: isWin ? 'var(--green)' : isLoss ? 'var(--red)' : 'var(--text-muted)',
                        opacity: 0.7
                      }} />
                    ))}
                    {dayTrades.length > 4 && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '5px' }}>+{dayTrades.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day trade list */}
      {selected && (
        <div className="card animate-fade-up" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedTrades.filter(t => t.pnl !== null).length > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                color: selectedTrades.filter(t => t.pnl !== null).reduce((s, t) => s + t.pnl, 0) >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {formatPnl(selectedTrades.filter(t => t.pnl !== null).reduce((s, t) => s + t.pnl, 0))}
              </span>
            )}
          </div>

          {selectedTrades.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No trades on this day.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTrades.map(trade => (
                <div
                  key={trade.id}
                  onClick={() => navigate(`/trades/${trade.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(5,216,144,0.3)'; e.currentTarget.style.background = 'rgba(5,216,144,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{trade.symbol}</span>
                    <span className={`badge ${trade.direction === 'LONG' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
                      {trade.direction}
                    </span>
                    {trade.setup && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trade.setup}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {trade.grade && (
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 700,
                        color: trade.grade === 'A' ? 'var(--green)' : trade.grade === 'B' ? 'orange' : 'var(--red)'
                      }}>{trade.grade}</span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem',
                      color: trade.pnl > 0 ? 'var(--green)' : trade.pnl < 0 ? 'var(--red)' : 'var(--text-muted)'
                    }}>
                      {formatPnl(trade.pnl)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
