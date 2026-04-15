import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORMS, getPlatformConfig } from '../utils/platforms';
import { fetchDashboard } from '../services/analytics';
import '../styles/pages.css';

function formatNumber(n) {
  if (n == null) return '-';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PlatformIcons({ platformIds }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {platformIds.map((id) => {
        const p = getPlatformConfig(id) || PLATFORMS.find((pl) => pl.id === id);
        if (!p) return null;
        const Icon = p.icon;
        return (
          <span
            key={id}
            title={p.name}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: p.color === '#000000' ? '#1a1a2e15' : p.color + '15',
              color: p.color === '#000000' ? '#1a1a2e' : p.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}
          >
            <Icon />
          </span>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchDashboard();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Welcome back!</h2>
          <p>Loading your dashboard...</p>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="stat-card" key={i} style={{ minHeight: 90, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Welcome back!</h2>
          <p style={{ color: 'var(--error)' }}>Failed to load dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const { stats, connected_platforms, recent_posts } = data;

  const statCards = [
    { label: 'Total Followers', value: formatNumber(stats.total_followers) },
    { label: 'Engagement Rate', value: stats.engagement_rate + '%' },
    { label: 'Scheduled Posts', value: String(stats.scheduled_posts) },
    { label: 'Total Reach', value: formatNumber(stats.total_reach) },
  ];

  const connectedCount = connected_platforms?.length || 0;

  return (
    <div>
      <div className="page-header">
        <h2>Welcome back!</h2>
        <p>Here's what's happening across your {connectedCount} connected channel{connectedCount !== 1 ? 's' : ''}.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <p className="stat-card__label">{stat.label}</p>
            <p className="stat-card__value">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Connected Platforms */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__header">
          <h3 className="card__title">Connected Platforms</h3>
          <button className="btn btn--outline btn--sm" onClick={() => navigate('/platforms')}>Manage</button>
        </div>
        {connected_platforms?.length > 0 ? (
          <div className="platform-grid">
            {connected_platforms.map((acct) => {
              const p = getPlatformConfig(acct.platform) || PLATFORMS.find((pl) => pl.id === acct.platform);
              if (!p) return null;
              const Icon = p.icon;
              const isActive = acct.status === 'CONNECTED';
              return (
                <div
                  key={acct.id}
                  className={`platform-chip ${isActive ? 'platform-chip--selected' : ''}`}
                  style={!isActive ? { opacity: 0.45 } : undefined}
                >
                  <span className="platform-chip__icon" style={{ color: isActive ? p.color : 'var(--text-secondary)' }}>
                    <Icon />
                  </span>
                  {acct.display_name || acct.username || p.name}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No platforms connected yet.</p>
            <button className="btn btn--primary btn--sm" style={{ marginTop: 12 }} onClick={() => navigate('/platforms')}>
              Connect a Platform
            </button>
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Recent Posts</h3>
        </div>
        {recent_posts?.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Platforms</th>
                  <th>Engagement</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {recent_posts.map((post) => (
                  <tr key={post.id}>
                    <td style={{ fontWeight: 600 }}>{post.title}</td>
                    <td><PlatformIcons platformIds={post.platforms || []} /></td>
                    <td>{formatNumber(post.engagement)}</td>
                    <td>{formatDate(post.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No posts yet. Create your first post in Content Studio!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
