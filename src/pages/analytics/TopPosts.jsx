import { useState, useEffect, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { MdArrowBack, MdArrowForward, MdArrowBackIos, MdArrowForwardIos, MdDashboard, MdLeaderboard } from 'react-icons/md';
import { PLATFORMS, getPlatformConfig } from '../../utils/platforms';
import { fetchTopPosts } from '../../services/analytics';
import { getMediaUrl } from '../../services/api';
import '../../styles/analytics.css';
import '../../styles/pages.css';

const SORT_OPTIONS = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'likes', label: 'Likes' },
  { value: 'comments', label: 'Comments' },
  { value: 'shares', label: 'Shares' },
  { value: 'reach', label: 'Reach' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
];

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

function TopPosts() {
  const navigate = useNavigate();
  const [range, setRange] = useState(getDefaultRange);
  const [platform, setPlatform] = useState('');
  const [sortBy, setSortBy] = useState('engagement');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTopPosts({ page, limit: 10, platform: platform || undefined, sort_by: sortBy, from: range.from, to: range.to });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, platform, sortBy, range]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [platform, sortBy, range.from, range.to]);

  const posts = data?.posts || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Track performance across all your social media platforms.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="an__nav-tabs">
        <NavLink to="/analytics" end className={({ isActive }) => `an__nav-tab${isActive ? ' an__nav-tab--active' : ''}`}>
          <MdDashboard /> Overview
        </NavLink>
        <NavLink to="/analytics/top-posts" className={({ isActive }) => `an__nav-tab${isActive ? ' an__nav-tab--active' : ''}`}>
          <MdLeaderboard /> Top Posts
        </NavLink>
      </div>

      {/* Controls: Date Range + Platform Filter + Sort */}
      <div className="an__controls">
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="an__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="an__filter-tabs" style={{ marginBottom: 24, display: 'inline-flex' }}>
        <button
          className={`an__filter-tab${!platform ? ' an__filter-tab--active' : ''}`}
          onClick={() => setPlatform('')}
        >
          All
        </button>
        {PLATFORMS.filter((p) => ['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube'].includes(p.id)).map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              className={`an__filter-tab${platform === p.id ? ' an__filter-tab--active' : ''}`}
              onClick={() => setPlatform(p.id)}
            >
              <Icon /> {p.name}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="an__loading"><div className="an__spinner" /> Loading top posts...</div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <h3>Failed to load</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={load} style={{ marginTop: 16 }}>Try Again</button>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && posts.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">&#128202;</div>
            <h3>No posts found</h3>
            <p>Try adjusting your date range or platform filter.</p>
          </div>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="an__posts-table-wrap">
            <table className="an__posts-table">
              <thead>
                <tr>
                  <th className="an__posts-th an__posts-th--rank">#</th>
                  <th className="an__posts-th an__posts-th--post">Post</th>
                  <th className="an__posts-th an__posts-th--platform">Platform</th>
                  <th className="an__posts-th an__posts-th--metric">Engagement</th>
                  <th className="an__posts-th an__posts-th--metric">Likes</th>
                  <th className="an__posts-th an__posts-th--metric">Comments</th>
                  <th className="an__posts-th an__posts-th--metric">Shares</th>
                  <th className="an__posts-th an__posts-th--metric">Saves</th>
                  <th className="an__posts-th an__posts-th--metric">Reach</th>
                  <th className="an__posts-th an__posts-th--metric">Impressions</th>
                  <th className="an__posts-th an__posts-th--metric">Clicks</th>
                  <th className="an__posts-th an__posts-th--metric">Video Views</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => {
                  const rank = (pagination.page - 1) * 10 + idx + 1;
                  const thumb = post.media_urls?.[0] ? getMediaUrl(post.media_urls[0]) : null;
                  const m = post.metrics || {};
                  return (
                    <tr
                      key={post.id}
                      className="an__posts-row"
                      onClick={() => navigate(`/analytics/posts/${post.id}`)}
                    >
                      <td className="an__posts-td an__posts-td--rank">
                        <span className="an__posts-rank-badge">#{rank}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--post">
                        <div className="an__posts-post-cell">
                          {thumb ? (
                            <img className="an__posts-thumb" src={thumb} alt="" loading="lazy" />
                          ) : (
                            <div className="an__posts-thumb-placeholder">&#128247;</div>
                          )}
                          <div className="an__posts-post-info">
                            {post.campaign && (
                              <span className="an__post-campaign">{post.campaign.name}</span>
                            )}
                            <p className="an__posts-caption">{post.base_content}</p>
                          </div>
                        </div>
                      </td>
                      <td className="an__posts-td an__posts-td--platform">
                        <div className="an__post-platforms">
                          {post.platforms.map((pid) => {
                            const cfg = getPlatformConfig(pid);
                            if (!cfg) return null;
                            const Icon = cfg.icon;
                            return (
                              <span
                                key={pid}
                                className="an__post-platform-icon"
                                title={cfg.name}
                                style={{
                                  background: cfg.color === '#000000' ? '#1a1a2e15' : cfg.color + '15',
                                  color: cfg.color === '#000000' ? '#1a1a2e' : cfg.color,
                                }}
                              >
                                <Icon />
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.total_engagement)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.likes)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.comments)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.shares)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.saves)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.reach)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.impressions)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.clicks)}</span>
                      </td>
                      <td className="an__posts-td an__posts-td--metric">
                        <span className="an__posts-metric-value">{formatNum(m.video_views)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="an__pagination">
              <button
                className="an__page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <MdArrowBackIos style={{ fontSize: 12 }} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <span key={p} style={{ display: 'contents' }}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>...</span>
                    )}
                    <button
                      className={`an__page-btn${p === page ? ' an__page-btn--active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                className="an__page-btn"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <MdArrowForwardIos style={{ fontSize: 12 }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TopPosts;
