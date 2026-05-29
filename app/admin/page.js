'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import styles from './admin.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  // Expand state
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedUserQueries, setExpandedUserQueries] = useState(null);
  const [expandedUserLoading, setExpandedUserLoading] = useState(false);
  const [expandedQueryIndex, setExpandedQueryIndex] = useState(null);

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

  // ---- Load remaining data once auth is confirmed ----
  useEffect(() => {
    if (!authChecked || !accessToken) return;

    async function loadData() {
      const [usersData, topicsData, queriesData] = await Promise.all([
        fetchWithAuth('/api/admin/users').catch(() => []),
        fetchWithAuth('/api/admin/topics').catch(() => []),
        fetchWithAuth('/api/admin/queries?limit=50').catch(() => []),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
      const topicsArr = Array.isArray(topicsData) ? topicsData : topicsData?.data || [];
      setTopics([...topicsArr].sort((a, b) => (b.count || 0) - (a.count || 0)));
      setQueries(Array.isArray(queriesData) ? queriesData : queriesData?.data || []);
    }
    loadData();
  }, [authChecked, accessToken, fetchWithAuth]);

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
      const data = await fetchWithAuth('/api/admin/queries?user_id=' + userId);
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
        <h1>SSB Analytics Dashboard</h1>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{userEmail}</span>
          <Link href="/">Back to Portal</Link>
        </div>
      </header>

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
                  const data = await fetchWithAuth('/api/admin/analyze');
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
