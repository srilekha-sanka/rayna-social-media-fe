import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdVisibility, MdFavorite, MdTrendingUp,
  MdTouchApp, MdRefresh, MdOpenInNew, MdPerson, MdCalendarMonth,
  MdPlayCircle,
} from 'react-icons/md';
import { getPlatformConfig } from '../../utils/platforms';
import { fetchPostAnalytics, syncPost } from '../../services/analytics';
import { getMediaUrl } from '../../services/api';
import '../../styles/analytics.css';
import '../../styles/pages.css';

function formatNum(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PostAnalytics() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeMedia, setActiveMedia] = useState(0);
  const [activeTab, setActiveTab] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPostAnalytics(postId);
      setData(res);
      if (res.platforms?.length > 0 && !activeTab) {
        setActiveTab(res.platforms[0].platform);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPost(postId);
      setToast({ msg: 'Analytics synced successfully', type: 'success' });
      await load();
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (loading) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate(-1)}>
          <MdArrowBack /> Back
        </button>
        <div className="an__loading"><div className="an__spinner" /> Loading post analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate(-1)}>
          <MdArrowBack /> Back
        </button>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <h3>Failed to load post</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={load} style={{ marginTop: 16 }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const { post, totals, platforms, last_synced_at } = data;
  const mediaUrls = (post.media_urls || []).map(getMediaUrl).filter(Boolean);
  const activePlatform = platforms.find((p) => p.platform === activeTab);

  const kpis = [
    { label: 'Total Reach', value: formatNum(totals.reach), icon: <MdVisibility /> },
    { label: 'Total Engagement', value: formatNum(totals.likes + totals.comments + totals.shares), icon: <MdFavorite /> },
    { label: 'Engagement Rate', value: totals.engagement_rate.toFixed(2) + '%', icon: <MdTrendingUp /> },
    { label: 'Total Clicks', value: formatNum(totals.clicks), icon: <MdTouchApp /> },
  ];

  return (
    <div>
      <button className="an__back" onClick={() => navigate(-1)}>
        <MdArrowBack /> Back
      </button>

      {/* Post Preview */}
      <div className="an__post-preview">
        {/* Media */}
        <div className="an__post-media">
          {mediaUrls.length > 0 ? (
            <>
              <img src={mediaUrls[activeMedia] || mediaUrls[0]} alt="" />
              {mediaUrls.length > 1 && (
                <div className="an__post-media-gallery">
                  {mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className={i === activeMedia ? 'active' : ''}
                      onClick={() => setActiveMedia(i)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-card)', fontSize: 48, opacity: 0.3 }}>
              &#128247;
            </div>
          )}
        </div>

        {/* Info */}
        <div className="an__post-info">
          <p className="an__post-full-caption">{post.base_content}</p>
          <div className="an__post-meta">
            <span className="an__post-meta-item">
              <MdCalendarMonth />
              {new Date(post.published_at).toLocaleString()}
            </span>
            {post.author && (
              <span className="an__post-meta-item">
                <MdPerson /> {post.author.first_name}
              </span>
            )}
            <span className={`badge badge--${post.status === 'PUBLISHED' ? 'active' : 'draft'}`}>
              {post.status}
            </span>
          </div>
          {post.campaign && (
            <div
              className="an__post-campaign"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/analytics/campaigns/${post.campaign.id}`)}
            >
              {post.campaign.name} ({post.campaign.goal})
            </div>
          )}
          <div className="an__post-platforms" style={{ marginTop: 4 }}>
            {post.platforms.map((pid) => {
              const cfg = getPlatformConfig(pid);
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <span
                  key={pid}
                  className="platform-pill"
                  style={{ background: cfg.color === '#000000' ? '#1a1a2e10' : cfg.color + '10', color: cfg.color === '#000000' ? '#1a1a2e' : cfg.color }}
                >
                  <Icon /> {cfg.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sync Bar */}
      <div className="an__sync-bar">
        <span>Updated {timeAgo(last_synced_at)}</span>
        <button className={`an__sync-btn${syncing ? ' an__sync-btn--loading' : ''}`} onClick={handleSync}>
          <MdRefresh className={syncing ? 'an__spin' : ''} />
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Aggregate KPIs */}
      <div className="an__kpi-grid">
        {kpis.map((kpi) => (
          <div className="an__kpi" key={kpi.label}>
            <div className="an__kpi-icon">{kpi.icon}</div>
            <p className="an__kpi-label">{kpi.label}</p>
            <p className="an__kpi-value">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Metrics Row */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="an__platform-detail">
          <div className="an__platform-detail-card">
            <label>Likes</label>
            <span>{formatNum(totals.likes)}</span>
          </div>
          <div className="an__platform-detail-card">
            <label>Comments</label>
            <span>{formatNum(totals.comments)}</span>
          </div>
          <div className="an__platform-detail-card">
            <label>Shares</label>
            <span>{formatNum(totals.shares)}</span>
          </div>
          <div className="an__platform-detail-card">
            <label>Saves</label>
            <span>{formatNum(totals.saves)}</span>
          </div>
          <div className="an__platform-detail-card">
            <label>Impressions</label>
            <span>{formatNum(totals.impressions)}</span>
          </div>
          {totals.video_views > 0 && (
            <div className="an__platform-detail-card">
              <label>Video Views</label>
              <span>{formatNum(totals.video_views)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-Platform Breakdown */}
      {platforms.length > 0 && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Platform Breakdown</h3>
          </div>

          {/* Platform Tabs */}
          <div className="an__platform-tabs">
            {platforms.map((p) => {
              const cfg = getPlatformConfig(p.platform);
              const Icon = cfg?.icon;
              return (
                <button
                  key={p.platform}
                  className={`an__platform-tab${activeTab === p.platform ? ' an__platform-tab--active' : ''}`}
                  onClick={() => setActiveTab(p.platform)}
                >
                  {Icon && <Icon style={{ fontSize: 14 }} />}
                  {cfg?.name || p.platform}
                </button>
              );
            })}
          </div>

          {/* Active Platform Detail */}
          {activePlatform && (
            <>
              {/* Account Info */}
              {activePlatform.SocialAccount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  {activePlatform.SocialAccount.avatar_url ? (
                    <img src={activePlatform.SocialAccount.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                      {activePlatform.SocialAccount.display_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{activePlatform.SocialAccount.display_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{activePlatform.SocialAccount.username}</div>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="an__platform-detail">
                <div className="an__platform-detail-card">
                  <label>Likes</label>
                  <span>{formatNum(activePlatform.likes)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Comments</label>
                  <span>{formatNum(activePlatform.comments)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Shares</label>
                  <span>{formatNum(activePlatform.shares)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Saves</label>
                  <span>{formatNum(activePlatform.saves)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Reach</label>
                  <span>{formatNum(activePlatform.reach)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Impressions</label>
                  <span>{formatNum(activePlatform.impressions)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Clicks</label>
                  <span>{formatNum(activePlatform.clicks)}</span>
                </div>
                <div className="an__platform-detail-card">
                  <label>Eng. Rate</label>
                  <span style={{ color: activePlatform.engagement_rate > 5 ? 'var(--success)' : activePlatform.engagement_rate >= 2 ? 'var(--warning)' : 'var(--error)' }}>
                    {activePlatform.engagement_rate.toFixed(2)}%
                  </span>
                </div>
                {activePlatform.video_views > 0 && (
                  <>
                    <div className="an__platform-detail-card">
                      <label>Video Views</label>
                      <span>{formatNum(activePlatform.video_views)}</span>
                    </div>
                    {activePlatform.watch_time_seconds > 0 && (
                      <div className="an__platform-detail-card">
                        <label>Watch Time</label>
                        <span>{Math.floor(activePlatform.watch_time_seconds / 60)}m {activePlatform.watch_time_seconds % 60}s</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* View on Platform Link */}
              {activePlatform.platform_post_url && (
                <a
                  href={activePlatform.platform_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="an__view-link"
                  style={{ marginTop: 12, display: 'inline-flex' }}
                >
                  View on {getPlatformConfig(activePlatform.platform)?.name || activePlatform.platform} <MdOpenInNew />
                </a>
              )}

              {/* Last Synced */}
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
                Last synced: {timeAgo(activePlatform.last_synced_at)}
              </p>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`an__toast an__toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default PostAnalytics;
