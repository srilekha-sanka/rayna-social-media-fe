import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  MdArrowBack, MdVisibility, MdFavorite, MdTrendingUp, MdTouchApp,
  MdEmojiEvents,
} from 'react-icons/md';
import { getPlatformConfig } from '../../utils/platforms';
import { fetchCampaignAnalytics } from '../../services/analytics';
import '../../styles/analytics.css';
import '../../styles/pages.css';

function formatNum(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function EngagementBadge({ rate }) {
  const cls = rate > 5 ? 'green' : rate >= 2 ? 'yellow' : 'red';
  return <span className={`an__er-badge an__er-badge--${cls}`}>{rate.toFixed(2)}%</span>;
}

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

function CampaignAnalytics() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState(getDefaultRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCampaignAnalytics(campaignId, range);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId, range]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate('/analytics')}>
          <MdArrowBack /> Back to Analytics
        </button>
        <div className="an__loading"><div className="an__spinner" /> Loading campaign analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate('/analytics')}>
          <MdArrowBack /> Back to Analytics
        </button>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <h3>Failed to load campaign</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={load} style={{ marginTop: 16 }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const { campaign, totals, platform_breakdown, best_post, posts, total_posts } = data;

  const kpis = [
    { label: 'Total Reach', value: formatNum(totals.reach), icon: <MdVisibility /> },
    { label: 'Total Engagement', value: formatNum(totals.likes + totals.comments + totals.shares), icon: <MdFavorite /> },
    { label: 'Engagement Rate', value: Number(totals.engagement_rate || 0).toFixed(2) + '%', icon: <MdTrendingUp /> },
    { label: 'Total Clicks', value: formatNum(totals.clicks), icon: <MdTouchApp /> },
  ];

  const chartData = (platform_breakdown || []).map((p) => {
    const cfg = getPlatformConfig(p.platform);
    return {
      name: cfg?.name || p.platform,
      Likes: p.likes,
      Comments: p.comments,
      Shares: p.shares,
    };
  });

  return (
    <div>
      <button className="an__back" onClick={() => navigate('/analytics')}>
        <MdArrowBack /> Back to Analytics
      </button>

      {/* Campaign Header */}
      <div className="an__campaign-header">
        <div style={{ flex: 1 }}>
          <h2 className="an__campaign-title">{campaign.name}</h2>
          <div className="an__campaign-badges">
            <span className={`an__goal-badge an__goal-badge--${campaign.goal}`}>{campaign.goal}</span>
            <span className={`an__status-badge an__status-badge--${campaign.status}`}>{campaign.status}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {total_posts} published posts
            </span>
          </div>
          {campaign.product && (
            <div className="an__product-link">
              <strong>{campaign.product.name}</strong>
              <span className="an__product-price">${parseFloat(campaign.product.price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="an__date-bar">
        <input type="date" className="an__date-input" value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        <span className="an__date-sep">to</span>
        <input type="date" className="an__date-input" value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
      </div>

      {/* KPI Cards */}
      <div className="an__kpi-grid">
        {kpis.map((kpi) => (
          <div className="an__kpi" key={kpi.label}>
            <div className="an__kpi-icon">{kpi.icon}</div>
            <p className="an__kpi-label">{kpi.label}</p>
            <p className="an__kpi-value">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="an__charts-row">
        {/* Platform Breakdown Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Platform Breakdown</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barGap={2} barCategoryGap="20%">
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

        {/* Best Post */}
        {best_post && (
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Best Performing Post</h3>
            </div>
            <div
              className="an__best-post"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/analytics/posts/${best_post.id}`)}
            >
              <span className="an__best-post-trophy"><MdEmojiEvents style={{ fontSize: 32, color: '#f59e0b' }} /></span>
              <div className="an__best-post-content">
                <h4>Top Post</h4>
                <p className="an__best-post-caption">{best_post.base_content}</p>
                <span className="an__best-post-eng">{formatNum(best_post.total_engagement)} engagements</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Breakdown Table */}
      {platform_breakdown && platform_breakdown.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Platform Metrics</h3>
          </div>
          <div className="table-wrapper">
            <table className="an__platform-table">
              <thead>
                <tr>
                  <th>Platform</th>
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
                {platform_breakdown.map((p) => {
                  const cfg = getPlatformConfig(p.platform);
                  const Icon = cfg?.icon;
                  return (
                    <tr key={p.platform}>
                      <td>
                        <div className="an__platform-name">
                          <span className="an__platform-bar-icon"
                            style={{ background: (cfg?.color === '#000000' ? '#1a1a2e' : cfg?.color) || '#6b7280', width: 26, height: 26, fontSize: 11 }}>
                            {Icon && <Icon />}
                          </span>
                          {cfg?.name || p.platform}
                        </div>
                      </td>
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

      {/* Campaign Posts List */}
      {posts && posts.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Campaign Posts</h3>
          </div>
          <div className="table-wrapper">
            <table className="an__platform-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Platforms</th>
                  <th>Published</th>
                  <th>Engagement</th>
                  <th>Impressions</th>
                  <th>Eng. Rate</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/analytics/posts/${p.id}`)}
                  >
                    <td style={{ maxWidth: 280 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.base_content}
                      </p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {p.platforms.map((pid) => {
                          const cfg = getPlatformConfig(pid);
                          if (!cfg) return null;
                          const Icon = cfg.icon;
                          return (
                            <span key={pid} title={cfg.name}
                              style={{
                                width: 22, height: 22, borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: 10,
                                background: cfg.color === '#000000' ? '#1a1a2e15' : cfg.color + '15',
                                color: cfg.color === '#000000' ? '#1a1a2e' : cfg.color,
                              }}>
                              <Icon />
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(p.published_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatNum(p.total_engagement)}</td>
                    <td>{formatNum(p.impressions)}</td>
                    <td><EngagementBadge rate={p.engagement_rate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignAnalytics;
