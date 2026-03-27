import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * LiveScoreWidget - Displays RCB vs SRH IPL match score above the price chart.
 *
 * Props:
 *   apiBaseUrl  - Base URL of the livescore backend (default: http://localhost:3001)
 *   pollInterval - Polling interval in ms (default: 15000 = 15s)
 *   className   - Optional extra CSS class for the container
 */

const DEFAULT_API_BASE = process.env.REACT_APP_LIVESCORE_API_URL || 'http://localhost:3001';
const DEFAULT_POLL_MS = 15000;

// Inline SVG cricket ball icon
function CricketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M7 12 Q12 6 17 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M7 12 Q12 18 17 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// Status badge
function StatusBadge({ status }) {
  const cfg = {
    live: { label: '● LIVE', bg: '#ef4444', color: '#fff' },
    upcoming: { label: '⏰ UPCOMING', bg: '#f59e0b', color: '#fff' },
    completed: { label: '✓ COMPLETED', bg: '#6b7280', color: '#fff' }
  };
  const { label, bg, color } = cfg[status] || cfg.upcoming;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        background: bg,
        color,
        animation: status === 'live' ? 'pulse 2s infinite' : 'none'
      }}
    >
      {label}
    </span>
  );
}

// Team card showing flag, name, and score
function TeamCard({ team, align = 'left' }) {
  const isLeft = align === 'left';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isLeft ? 'row' : 'row-reverse',
        alignItems: 'center',
        gap: 10,
        flex: 1
      }}
    >
      {/* Team logo / flag */}
      {team.image_path ? (
        <img
          src={team.image_path}
          alt={team.short_name}
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: team.short_name === 'RCB' ? '#c41e3a' : '#ff6600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            flexShrink: 0
          }}
        >
          {team.short_name}
        </div>
      )}

      {/* Team info */}
      <div style={{ textAlign: isLeft ? 'left' : 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
          {team.short_name}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', maxWidth: 120, lineHeight: 1.2 }}>
          {team.name}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: isLeft ? 'right' : 'left', marginLeft: isLeft ? 'auto' : 0, marginRight: isLeft ? 0 : 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#1f2937', lineHeight: 1 }}>
          {team.score && team.score.display !== '--' ? team.score.display : '--'}
        </div>
        {team.score && team.score.overs !== null && (
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {team.score.overs} ov
          </div>
        )}
      </div>
    </div>
  );
}

// Loading skeleton
function SkeletonWidget() {
  const pulse = {
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 6
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ ...pulse, width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...pulse, height: 14, width: '60%', marginBottom: 6 }} />
          <div style={{ ...pulse, height: 10, width: '40%' }} />
        </div>
        <div style={{ ...pulse, width: 60, height: 24 }} />
        <div style={{ ...pulse, width: 20, height: 14 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...pulse, height: 14, width: '60%', marginBottom: 6, marginLeft: 'auto' }} />
          <div style={{ ...pulse, height: 10, width: '40%', marginLeft: 'auto' }} />
        </div>
        <div style={{ ...pulse, width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    </div>
  );
}

// Error state
function ErrorWidget({ message, onRetry }) {
  return (
    <div style={{ ...styles.container, background: '#fef2f2', border: '1px solid #fecaca' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#dc2626' }}>
          ⚠️ Could not load match data
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #dc2626',
              borderRadius: 4,
              background: 'transparent',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>
      {message && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{message}</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 16px',
    marginBottom: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
};

// Global CSS injected once
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes skeleton-pulse {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LiveScoreWidget({
  apiBaseUrl = DEFAULT_API_BASE,
  pollInterval = DEFAULT_POLL_MS,
  className = ''
}) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  injectCSS();

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/livescore/match`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (!mountedRef.current) return;

      if (json.success || json.data) {
        setMatchData(json.data);
        setError(null);
      } else {
        // API returned an error but also fallback data
        if (json.data) setMatchData(json.data);
        setError(json.error || 'Unknown error');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[LiveScoreWidget] fetch error:', err.message);
      setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiBaseUrl]);

  // Initial fetch + polling — adjust interval when match status changes
  useEffect(() => {
    mountedRef.current = true;
    fetchMatch();

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [fetchMatch]);

  // Restart the polling timer whenever matchData.status changes so the interval
  // switches from the idle rate to the faster live rate automatically.
  useEffect(() => {
    clearInterval(timerRef.current);
    const interval = matchData?.status === 'live' ? Math.min(pollInterval, 10000) : pollInterval;
    timerRef.current = setInterval(fetchMatch, interval);

    return () => clearInterval(timerRef.current);
  }, [matchData?.status, fetchMatch, pollInterval]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMatch();
  }, [fetchMatch]);

  if (loading && !matchData) {
    return <SkeletonWidget />;
  }

  if (error && !matchData) {
    return <ErrorWidget message={error} onRetry={handleRetry} />;
  }

  if (!matchData) return null;

  const { rcb, srh, status, league, starting_at, note } = matchData;

  // Format starting time
  let startingAtStr = '';
  if (starting_at) {
    try {
      const d = new Date(starting_at);
      startingAtStr = d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
    } catch (_) {
      startingAtStr = starting_at;
    }
  }

  return (
    <div className={`livescore-widget ${className}`} style={styles.container}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CricketIcon />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            {league || 'IPL 2025'}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamCard team={rcb} align="left" />

        {/* VS separator */}
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: '#9ca3af',
            flexShrink: 0,
            width: 28,
            textAlign: 'center'
          }}
        >
          vs
        </div>

        <TeamCard team={srh} align="right" />
      </div>

      {/* Footer row */}
      {(startingAtStr || note) && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'center',
            borderTop: '1px solid #f3f4f6',
            paddingTop: 5
          }}
        >
          {status === 'upcoming' && startingAtStr ? `Starts: ${startingAtStr}` : note}
        </div>
      )}

      {/* Soft error banner (when we have fallback data but API had issues) */}
      {error && matchData && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: '#ef4444',
            textAlign: 'center'
          }}
        >
          ⚠️ Live data unavailable — showing cached data
        </div>
      )}
    </div>
  );
}
