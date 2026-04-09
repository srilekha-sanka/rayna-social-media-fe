import { useState, useEffect, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  MdVisibility, MdFavorite, MdTrendingUp, MdTouchApp,
  MdRefresh, MdArrowForward, MdDashboard, MdLeaderboard,
} from 'react-icons/md';
import { PLATFORMS, getPlatformConfig } from '../utils/platforms';
import { fetchOverview, fetchPlatforms } from '../services/analytics';
import '../styles/analytics.css';
import '../styles/pages.css';

const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  PENDING_REVIEW: '#f59e0b',
  APPROVED: '#3b82f6',
  SCHEDULED: '#8b5cf6',
  PUBLISHING: '#a78bfa',
  PUBLISHED: '#10b981',
  FAILED: '#ef4444',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  PUBLISHING: 'Publishing',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
};

function formatNum(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function EngagementBadge({ rate }) {
  const cls = rate > 5 ? 'green' : rate >= 2 ? 'yellow' : 'red';
  return <span className={`an__er-badge an__er-badge--${cls}`}>{rate.toFixed(2)}%</span>;
}

function Analytics() {
  const navigate = useNavigate();
  const [range, setRange] = useState(getDefaultRange);
  const [overview, setOverview] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, pl] = await Promise.all([
        fetchOverview(range),
        fetchPlatforms(range),
      ]);
      setOverview(ov);
      setPlatforms(pl.platforms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Prepare donut data from overview
  const donutData = overview
    ? Object.entries(overview.posts.by_status)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value, color: STATUS_COLORS[key] || '#94a3b8' }))
    : [];

  // Prepare platform bar data
  const platformBarData = overview
    ? Object.entries(overview.platform_distribution).map(([key, value]) => {
        const cfg = getPlatformConfig(key);
        return { name: cfg?.name || key, value, color: cfg?.color || '#6b7280', id: key };
      }).sort((a, b) => b.value - a.value)
    : [];

  const maxPlatformValue = Math.max(...platformBarData.map((p) => p.value), 1);

  // Radar-style grouped bar chart for platform comparison
  const platformChartData = platforms.map((p) => {
    const cfg = getPlatformConfig(p.platform);
    return {
      name: cfg?.name || p.platform,
      Likes: p.likes,
      Comments: p.comments,
      Shares: p.shares,
      fill: cfg?.color || '#6b7280',
    };
  });

  const kpis = overview
    ? [
        { label: 'Total Reach', value: formatNum(overview.totals.reach), icon: <MdVisibility /> },
        {
          label: 'Total Engagement',
          value: formatNum(overview.totals.likes + overview.totals.comments + overview.totals.shares),
          icon: <MdFavorite />,
        },
        { label: 'Engagement Rate', value: Number(overview.totals.engagement_rate || 0).toFixed(2) + '%', icon: <MdTrendingUp /> },
        { label: 'Total Clicks', value: formatNum(overview.totals.clicks), icon: <MdTouchApp /> },
      ]
    : [];

  const navTabs = (
    <div className="an__nav-tabs">
      <NavLink to="/analytics" end className={({ isActive }) => `an__nav-tab${isActive ? ' an__nav-tab--active' : ''}`}>
        <MdDashboard /> Overview
      </NavLink>
      <NavLink to="/analytics/top-posts" className={({ isActive }) => `an__nav-tab${isActive ? ' an__nav-tab--active' : ''}`}>
        <MdLeaderboard /> Top Posts
      </NavLink>
    </div>
  );

  if (loading && !overview) {
    return (
      <div>
        <div className="page-header">
          <h2>Analytics</h2>
          <p>Track performance across all your social media platforms.</p>
        </div>
        {navTabs}
        <div className="an__skeleton-grid">
          {[1, 2, 3, 4].map((i) => <div className="an__skeleton-card" key={i} />)}
        </div>
        <div className="an__loading"><div className="an__spinner" /> Loading analytics...</div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div>
        <div className="page-header">
          <h2>Analytics</h2>
          <p>Track performance across all your social media platforms.</p>
        </div>
        {navTabs}
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <h3>Failed to load analytics</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={load} style={{ marginTop: 16 }}>
              <MdRefresh /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Track performance across all your social media platforms.</p>
      </div>

      {/* Navigation Tabs */}
      {navTabs}

      {/* Date Range Picker */}
      <div className="an__date-bar">
        <input
          type="date"
          className="an__date-input"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
        />
        <span className="an__date-sep">to</span>
        <input
          type="date"
          className="an__date-input"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
        />
        <button className="btn btn--outline btn--sm" onClick={() => setRange(getDefaultRange())} style={{ marginLeft: 4 }}>
          Last 30 Days
        </button>
        <button
          className="btn btn--outline btn--sm"
          onClick={load}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* KPI Hero Cards */}
      {overview && (
        <div className="an__kpi-grid">
          {kpis.map((kpi) => (
            <div className="an__kpi" key={kpi.label}>
              <div className="an__kpi-icon">{kpi.icon}</div>
              <p className="an__kpi-label">{kpi.label}</p>
              <p className="an__kpi-value">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row: Donut + Platform Distribution */}
      <div className="an__charts-row">
        {/* Status Donut Chart */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Post Status Breakdown</h3>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {overview?.posts.total} total posts
            </span>
          </div>
          {donutData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => val} />
                </PieChart>
              </ResponsiveContainer>
              <div className="an__donut-legend">
                {donutData.map((d) => (
                  <div className="an__donut-legend-item" key={d.name}>
                    <span className="an__donut-legend-dot" style={{ background: d.color }} />
                    <span className="an__donut-legend-label">{d.name}</span>
                    <span className="an__donut-legend-value">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">&#128202;</div>
              <h3>No posts yet</h3>
              <p>Create some content to see your status breakdown.</p>
            </div>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Platform Distribution</h3>
          </div>
          {platformBarData.length > 0 ? (
            <div className="an__platform-bars">
              {platformBarData.map((p) => {
                const cfg = getPlatformConfig(p.id);
                const Icon = cfg?.icon;
                return (
                  <div className="an__platform-bar-row" key={p.id}>
                    <div className="an__platform-bar-label">
                      <span
                        className="an__platform-bar-icon"
                        style={{ background: p.color === '#000000' ? '#1a1a2e' : p.color }}
                      >
                        {Icon && <Icon />}
                      </span>
                      {p.name}
                    </div>
                    <div className="an__platform-bar-track">
                      <div
                        className="an__platform-bar-fill"
                        style={{
                          width: `${Math.max((p.value / maxPlatformValue) * 100, 8)}%`,
                          background: p.color === '#000000' ? '#1a1a2e' : p.color,
                        }}
                      >
                        {p.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">&#128202;</div>
              <h3>No platform data</h3>
              <p>Publish to platforms to see distribution.</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Comparison Table */}
      {platforms.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Platform Performance</h3>
            <button className="btn btn--outline btn--sm" onClick={() => navigate('/analytics/top-posts')}>
              View Top Posts <MdArrowForward />
            </button>
          </div>

          {/* Grouped Bar Chart */}
          {platformChartData.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformChartData} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comments" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Shares" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="table-wrapper">
            <table className="an__platform-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Platform</th>
                  <th>Posts</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Shares</th>
                  <th>Reach</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p, i) => {
                  const cfg = getPlatformConfig(p.platform);
                  const Icon = cfg?.icon;
                  return (
                    <tr key={p.platform}>
                      <td>
                        <span className={`an__platform-rank${i < 3 ? ` an__platform-rank--${i + 1}` : ''}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div className="an__platform-name">
                          <span
                            className="an__platform-bar-icon"
                            style={{ background: (cfg?.color === '#000000' ? '#1a1a2e' : cfg?.color) || '#6b7280', width: 28, height: 28, fontSize: 12 }}
                          >
                            {Icon && <Icon />}
                          </span>
                          {cfg?.name || p.platform}
                        </div>
                      </td>
                      <td>{p.post_count}</td>
                      <td>{formatNum(p.likes)}</td>
                      <td>{formatNum(p.comments)}</td>
                      <td>{formatNum(p.shares)}</td>
                      <td>{formatNum(p.reach)}</td>
                      <td>{formatNum(p.impressions)}</td>
                      <td>{formatNum(p.clicks)}</td>
                      <td><EngagementBadge rate={p.engagement_rate} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
