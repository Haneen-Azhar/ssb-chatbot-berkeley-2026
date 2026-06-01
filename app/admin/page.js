'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import styles from './admin.module.css';

let supabase = null;
if (typeof window !== 'undefined') {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ---- Role badge config ----
const ROLE_STYLES = {
  CD: styles.roleCd,
  AM: styles.roleAm,
  SPA: styles.roleSpa,
  Mentor: styles.roleMentor,
  Instructor: styles.roleInstructor,
};

function RoleBadge({ role }) {
  const cls = ROLE_STYLES[role] || styles.roleOther;
  return (
    <span className={`${styles.roleBadge} ${cls}`}>
      {role || 'N/A'}
    </span>
  );
}

// ---- Helpers ----
function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatTime(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function formatAvgTime(ms) {
  if (ms == null) return '--';
  return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
}

function formatNumber(val) {
  if (val == null) return '--';
  return Number(val).toLocaleString();
}

export default function AdminPage() {
  const router = useRouter();

  // Auth state
  const [userEmail, setUserEmail] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Data state
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [topics, setTopics] = useState(null);
  const [queries, setQueries] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackTab, setFeedbackTab] = useState('down'); // 'down' | 'up'
  const [feedbackShowAll, setFeedbackShowAll] = useState(false);
  const [feedbackExpandedIdx, setFeedbackExpandedIdx] = useState(null);

  // Session state
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showEndSession, setShowEndSession] = useState(false);
  const [endSessionLabel, setEndSessionLabel] = useState('');
  const [endingSession, setEndingSession] = useState(false);
  const [showRenameSession, setShowRenameSession] = useState(false);
  const [renameLabel, setRenameLabel] = useState('');
  const [renamingSaving, setRenamingSaving] = useState(false);

  // Expand state
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedUserQueries, setExpandedUserQueries] = useState(null);
  const [expandedUserLoading, setExpandedUserLoading] = useState(false);
  const [expandedQueryIndex, setExpandedQueryIndex] = useState(null);

  // ---- URL helper: append session param ----
  const withSession = useCallback(
    (url, session) => {
      if (session === null || session === undefined) return url;
      const sep = url.includes('?') ? '&' : '?';
      return url + sep + 'session=' + encodeURIComponent(session);
    },
    []
  );

  // ---- Fetch helper ----
  const fetchWithAuth = useCallback(
    async (url) => {
      const res = await fetch(url, {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      if (res.status === 403) {
        throw new Error('FORBIDDEN');
      }
      if (!res.ok) {
        throw new Error('Request failed: ' + res.status);
      }
      return res.json();
    },
    [accessToken]
  );

  // ---- Auth gate on mount ----
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }

      const token = data.session.access_token;
      setUserEmail(data.session.user.email);
      setAccessToken(token);

      // Check admin access with overview fetch
      try {
        const res = await fetch('/api/admin', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.status === 403) {
          setAccessDenied(true);
          setTimeout(() => router.push('/'), 2000);
          return;
        }
        if (!res.ok) {
          throw new Error('Request failed: ' + res.status);
        }
        const overviewData = await res.json();
        setOverview(overviewData);
        setAuthChecked(true);

        // Fetch sessions list
        try {
          const sessionsRes = await fetch('/api/admin/sessions', {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (sessionsRes.ok) {
            const sessionsData = await sessionsRes.json();
            setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions || []);
          }
        } catch {
          // Sessions endpoint may not exist yet, fail silently
        }
      } catch (err) {
        if (err.message === 'FORBIDDEN') {
          setAccessDenied(true);
          setTimeout(() => router.push('/'), 2000);
        } else {
          console.error('Admin load error:', err);
        }
      }
    }
    init();
  }, [router]);

  // ---- Load remaining data once auth is confirmed (re-runs on session change) ----
  useEffect(() => {
    if (!authChecked || !accessToken) return;

    async function loadData() {
      // Also re-fetch overview for the selected session
      const overviewUrl = withSession('/api/admin', activeSession);
      fetchWithAuth(overviewUrl).then(setOverview).catch(() => {});

      const [usersData, topicsData, queriesData, feedbackData] = await Promise.all([
        fetchWithAuth(withSession('/api/admin/users', activeSession)).catch(() => []),
        fetchWithAuth(withSession('/api/admin/topics', activeSession)).catch(() => []),
        fetchWithAuth(withSession('/api/admin/queries?limit=50', activeSession)).catch(() => []),
        fetchWithAuth(withSession('/api/admin/feedback', activeSession)).catch(() => ({ up: [], down: [] })),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
      const topicsArr = Array.isArray(topicsData) ? topicsData : topicsData?.data || [];
      setTopics([...topicsArr].sort((a, b) => (b.count || 0) - (a.count || 0)));
      setQueries(Array.isArray(queriesData) ? queriesData : queriesData?.data || []);
      setFeedback(feedbackData || { up: [], down: [] });
    }
    loadData();
  }, [authChecked, accessToken, fetchWithAuth, activeSession, withSession]);

  // ---- Expand user row ----
  async function handleExpandUser(userId) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setExpandedUserQueries(null);
      return;
    }

    setExpandedUserId(userId);
    setExpandedUserQueries(null);
    setExpandedUserLoading(true);

    try {
      const data = await fetchWithAuth(withSession('/api/admin/queries?user_id=' + userId, activeSession));
      setExpandedUserQueries(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setExpandedUserQueries([]);
    } finally {
      setExpandedUserLoading(false);
    }
  }

  // ---- Expand query ----
  function handleExpandQuery(index) {
    setExpandedQueryIndex(expandedQueryIndex === index ? null : index);
  }

  // ---- Access denied screen ----
  if (accessDenied) {
    return (
      <div className={styles.accessDenied}>
        Admin access required. Redirecting...
      </div>
    );
  }

  // ---- Loading until auth checked ----
  if (!authChecked) {
    return null;
  }

  // ---- Dashboard ----
  return (
    <div>
      <header className={styles.adminHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>SSB Analytics Dashboard</h1>
          <select
            value={activeSession === null ? '' : activeSession}
            onChange={(e) => {
              const val = e.target.value;
              setActiveSession(val === '' ? null : val);
              // Reset expanded states on session change
              setExpandedUserId(null);
              setExpandedUserQueries(null);
              setExpandedQueryIndex(null);
              setAiAnalysis(null);
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.825rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '180px',
            }}
          >
            <option value="" style={{ color: '#333' }}>Current Session</option>
            {sessions.map((label, i) => (
              <option key={i} value={label} style={{ color: '#333' }}>{label}</option>
            ))}
            <option value="all" style={{ color: '#333' }}>All Sessions</option>
          </select>
        </div>
        <div className={styles.headerRight}>
          {activeSession === null && (
            <button
              onClick={() => setShowEndSession(true)}
              style={{
                background: '#FDB515',
                color: '#1a1a2e',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              End Session
            </button>
          )}
          {activeSession && activeSession !== 'all' && (
            <button
              onClick={() => { setRenameLabel(activeSession); setShowRenameSession(true); }}
              style={{
                background: 'transparent',
                color: '#FDB515',
                border: '1px solid rgba(253,181,21,0.4)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Rename
            </button>
          )}
          <span className={styles.userEmail}>{userEmail}</span>
          <Link href="/">Back to Portal</Link>
        </div>
      </header>

      {/* End Session Modal */}
      {showEndSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEndSession(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#003262',
              marginTop: 0,
              marginBottom: '12px',
            }}>
              Archive Current Session
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: '#5f6368',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}>
              This will label all current queries as a past session. New queries will start fresh. User accounts and campus info are NOT affected.
            </p>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#333',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Session name
            </label>
            <input
              type="text"
              value={endSessionLabel}
              onChange={(e) => setEndSessionLabel(e.target.value)}
              placeholder="Berkeley B Session 1 - June 2026"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.9rem',
                border: '1px solid #d0d4d8',
                borderRadius: '8px',
                outline: 'none',
                marginBottom: '24px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.target.style.borderColor = '#003262'}
              onBlur={(e) => e.target.style.borderColor = '#d0d4d8'}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEndSession(false);
                  setEndSessionLabel('');
                }}
                disabled={endingSession}
                style={{
                  background: '#e0e4e8',
                  color: '#333',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!endSessionLabel.trim()) return;
                  setEndingSession(true);
                  try {
                    const res = await fetch('/api/admin/sessions', {
                      method: 'POST',
                      headers: {
                        Authorization: 'Bearer ' + accessToken,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ label: endSessionLabel.trim() }),
                    });
                    if (!res.ok) throw new Error('Archive failed');
                    // Refresh sessions list
                    const sessionsRes = await fetch('/api/admin/sessions', {
                      headers: { Authorization: 'Bearer ' + accessToken },
                    });
                    if (sessionsRes.ok) {
                      const sessionsData = await sessionsRes.json();
                      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions || []);
                    }
                    // Reset to current session view
                    setActiveSession(null);
                    setShowEndSession(false);
                    setEndSessionLabel('');
                  } catch (err) {
                    console.error('Archive session error:', err);
                  } finally {
                    setEndingSession(false);
                  }
                }}
                disabled={endingSession || !endSessionLabel.trim()}
                style={{
                  background: endingSession || !endSessionLabel.trim() ? '#8aaccc' : '#003262',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: endingSession || !endSessionLabel.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {endingSession ? 'Archiving...' : 'Archive Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Session Modal */}
      {showRenameSession && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowRenameSession(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '14px', padding: '28px', maxWidth: '420px', width: '100%', margin: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>
              Rename Session
            </h3>
            <input
              type="text"
              value={renameLabel}
              onChange={(e) => setRenameLabel(e.target.value)}
              placeholder="New session name"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
                borderRadius: '8px', fontSize: '15px', outline: 'none', marginBottom: '16px',
              }}
              onFocus={(e) => e.target.style.borderColor = '#003262'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRenameSession(false)}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: 'white', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                disabled={!renameLabel.trim() || renameLabel.trim() === activeSession || renamingSaving}
                onClick={async () => {
                  setRenamingSaving(true);
                  try {
                    await fetch('/api/admin/sessions', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + accessToken,
                      },
                      body: JSON.stringify({ oldLabel: activeSession, newLabel: renameLabel.trim() }),
                    });
                    const newName = renameLabel.trim();
                    setSessions((prev) => prev.map((s) => s === activeSession ? newName : s));
                    setActiveSession(newName);
                    setShowRenameSession(false);
                  } catch (err) {
                    console.error('Rename error:', err);
                  }
                  setRenamingSaving(false);
                }}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: '#003262', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  opacity: (!renameLabel.trim() || renameLabel.trim() === activeSession || renamingSaving) ? 0.5 : 1,
                }}
              >{renamingSaving ? 'Saving...' : 'Rename'}</button>
            </div>
          </div>
        </div>
      )}

      <main className={styles.adminMain}>
        {/* Overview cards */}
        <section className={styles.overviewCards}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {formatNumber(overview?.totalQueries)}
            </div>
            <div className={styles.statLabel}>Total Queries</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {formatNumber(overview?.queriesToday)}
            </div>
            <div className={styles.statLabel}>Queries Today</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {formatNumber(overview?.queriesThisWeek)}
            </div>
            <div className={styles.statLabel}>This Week</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {formatNumber(overview?.activeUsers)}
            </div>
            <div className={styles.statLabel}>Active Users (7d)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {formatAvgTime(overview?.avgResponseTimeMs)}
            </div>
            <div className={styles.statLabel}>Avg Response Time</div>
          </div>
        </section>

        {/* AI Analysis */}
        <section className={styles.dashboardSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: aiAnalysis ? '1px solid #e0e4e8' : 'none' }}>
            <h2 className={styles.sectionHeader} style={{ margin: 0, padding: 0, border: 'none' }}>AI Insights</h2>
            <button
              onClick={async () => {
                setAiLoading(true);
                setAiAnalysis(null);
                try {
                  const data = await fetchWithAuth(withSession('/api/admin/analyze', activeSession));
                  setAiAnalysis(data);
                } catch {
                  setAiAnalysis({ error: true });
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              style={{
                background: aiLoading ? '#999' : '#003262',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>

          {aiAnalysis?.error && (
            <div style={{ padding: '20px 24px', color: '#c62828' }}>Failed to generate analysis. Try again.</div>
          )}

          {aiAnalysis && !aiAnalysis.error && (
            <div style={{ padding: '0 24px 24px' }}>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f0f4f8', borderRadius: '10px', padding: '16px 24px', flex: '0 0 auto' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#003262', fontFamily: 'Montserrat, sans-serif' }}>{aiAnalysis.totalQueries}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Queries Analyzed</div>
                </div>
                {aiAnalysis.topCategories?.map((cat, i) => (
                  <div key={i} style={{ background: '#f0f4f8', borderRadius: '10px', padding: '16px 24px', flex: '1 1 auto', minWidth: '160px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#003262', fontFamily: 'Montserrat, sans-serif' }}>{cat.count}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.name}</div>
                  </div>
                ))}
              </div>

              {/* Overview */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#003262', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontFamily: 'Montserrat, sans-serif' }}>Overview</h3>
                <div style={{ background: '#f8f9fb', borderLeft: '4px solid #003262', padding: '16px 20px', borderRadius: '0 8px 8px 0', lineHeight: '1.7', fontSize: '15px', color: '#333' }}>
                  {aiAnalysis.overview}
                </div>
              </div>

              {/* Staff Insights */}
              {aiAnalysis.staffInsights?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#003262', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', fontFamily: 'Montserrat, sans-serif' }}>Staff Insights</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {aiAnalysis.staffInsights.map((s, i) => (
                      <div key={i} style={{ background: '#f8f9fb', borderRadius: '10px', padding: '14px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0, minWidth: '120px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{s.name}</div>
                          <RoleBadge role={s.role} />
                        </div>
                        <div style={{ fontSize: '14px', color: '#444', lineHeight: '1.6' }}>{s.insight}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Users */}
        <section className={styles.dashboardSection}>
          <h2 className={styles.sectionHeader}>Users</h2>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Queries</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users === null ? (
                  <tr>
                    <td colSpan={5} className={styles.loadingSpinner}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.loadingSpinner}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isExpanded={expandedUserId === u.id}
                      expandedQueries={
                        expandedUserId === u.id ? expandedUserQueries : null
                      }
                      isLoading={
                        expandedUserId === u.id && expandedUserLoading
                      }
                      onToggle={() => handleExpandUser(u.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Topics */}
        <section className={styles.dashboardSection}>
          <h2 className={styles.sectionHeader}>Topics</h2>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {topics === null ? (
                  <tr>
                    <td colSpan={2} className={styles.loadingSpinner}>
                      Loading topics...
                    </td>
                  </tr>
                ) : topics.length === 0 ? (
                  <tr>
                    <td colSpan={2} className={styles.loadingSpinner}>
                      No topics found.
                    </td>
                  </tr>
                ) : (
                  topics.map((t, i) => (
                    <tr key={i}>
                      <td>{t.topic}</td>
                      <td>{t.count || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Feedback */}
        {feedback && (feedback.up.length > 0 || feedback.down.length > 0) && (() => {
          const items = feedbackTab === 'down' ? feedback.down : feedback.up;
          const displayed = feedbackShowAll ? items : items.slice(0, 5);
          const borderColor = feedbackTab === 'down' ? '#ef4444' : '#22c55e';
          return (
            <section className={styles.dashboardSection}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #e0e4e8' }}>
                <div style={{ display: 'flex', gap: '0' }}>
                  <button
                    onClick={() => { setFeedbackTab('down'); setFeedbackShowAll(false); setFeedbackExpandedIdx(null); }}
                    style={{
                      padding: '14px 20px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: feedbackTab === 'down' ? '#991b1b' : '#6b7280',
                      borderBottom: feedbackTab === 'down' ? '2px solid #ef4444' : '2px solid transparent',
                    }}
                  >
                    Disliked ({feedback.down.length})
                  </button>
                  <button
                    onClick={() => { setFeedbackTab('up'); setFeedbackShowAll(false); setFeedbackExpandedIdx(null); }}
                    style={{
                      padding: '14px 20px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: feedbackTab === 'up' ? '#166534' : '#6b7280',
                      borderBottom: feedbackTab === 'up' ? '2px solid #22c55e' : '2px solid transparent',
                    }}
                  >
                    Liked ({feedback.up.length})
                  </button>
                </div>
              </div>
              <div className={styles.queriesList} style={{ maxHeight: feedbackShowAll ? 'none' : '500px' }}>
                {items.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No {feedbackTab === 'down' ? 'disliked' : 'liked'} responses yet.
                  </div>
                ) : (
                  displayed.map((item, i) => (
                    <div
                      key={`${feedbackTab}-${i}`}
                      className={styles.queryEntry}
                      style={{ borderLeft: `3px solid ${borderColor}`, cursor: 'pointer' }}
                      onClick={() => setFeedbackExpandedIdx(feedbackExpandedIdx === i ? null : i)}
                    >
                      <div className={styles.queryMeta}>
                        <div className={styles.queryUser}>
                          {item.profiles?.name || 'Anonymous'} <RoleBadge role={item.profiles?.role} />
                        </div>
                        <div className={styles.queryTimestamp}>{formatTime(item.created_at)}</div>
                      </div>
                      {feedbackExpandedIdx === i ? (
                        <div style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '8px' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#003262', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Question</div>
                            {item.message}
                          </div>
                          <div style={{ paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#003262', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Response</div>
                            {item.response}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.queryPreview}>
                          <strong>Q:</strong> {truncate(item.message, 80)}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {items.length > 5 && !feedbackShowAll && (
                  <button
                    onClick={() => setFeedbackShowAll(true)}
                    style={{
                      display: 'block', width: '100%', padding: '12px', textAlign: 'center',
                      fontSize: '13px', fontWeight: 600, color: '#003262', background: '#f8fafc',
                      border: 'none', borderTop: '1px solid #e5e7eb', cursor: 'pointer',
                    }}
                  >
                    Show all {items.length} responses
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* Recent Queries */}
        <section className={styles.dashboardSection}>
          <h2 className={styles.sectionHeader}>Recent Queries</h2>
          <div className={styles.queriesList}>
            {queries === null ? (
              <div className={styles.loadingSpinner}>
                Loading recent queries...
              </div>
            ) : queries.length === 0 ? (
              <div className={styles.loadingSpinner}>No queries found.</div>
            ) : (
              queries.map((q, i) => (
                <div
                  key={i}
                  className={styles.queryEntry}
                  onClick={() => handleExpandQuery(i)}
                >
                  <div className={styles.queryMeta}>
                    <div className={styles.queryUser}>
                      {q.profiles?.name || 'Anonymous'} <RoleBadge role={q.profiles?.role} />
                    </div>
                    <div className={styles.queryTimestamp}>
                      {formatTime(q.created_at)}
                    </div>
                  </div>
                  <div className={styles.queryPreview}>
                    {truncate(q.message, 100)}
                  </div>
                  <div
                    className={`${styles.queryFull} ${
                      expandedQueryIndex === i ? styles.queryFullOpen : ''
                    }`}
                  >
                    <div className={styles.fullMessage}>
                      <div className={styles.fullLabel}>Message</div>
                      {q.message}
                    </div>
                    <div className={styles.fullResponse}>
                      <div className={styles.fullLabel}>Response</div>
                      {q.response}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ---- User row sub-component ----
function UserRow({ user, isExpanded, expandedQueries, isLoading, onToggle }) {
  return (
    <>
      <tr className={styles.clickableRow} onClick={onToggle}>
        <td>{user.name}</td>
        <td>
          <RoleBadge role={user.role} />
        </td>
        <td>{user.email}</td>
        <td>{user.queryCount ?? 0}</td>
        <td>{formatTime(user.lastActive)}</td>
      </tr>
      <tr
        className={`${styles.expandRow} ${
          isExpanded ? styles.expandRowOpen : ''
        }`}
      >
        <td colSpan={5} className={styles.expandRowTd}>
          <div className={styles.expandContent}>
            {isLoading ? (
              'Loading queries...'
            ) : !expandedQueries || expandedQueries.length === 0 ? (
              <div className={styles.queryItem}>
                <span className={styles.queryText}>
                  No queries from this user.
                </span>
              </div>
            ) : (
              expandedQueries.map((q, i) => (
                <div key={i} className={styles.queryItem}>
                  <div className={styles.queryText}>
                    {truncate(q.message, 200)}
                  </div>
                  <div className={styles.queryTime}>
                    {formatTime(q.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </td>
      </tr>
    </>
  );
}
