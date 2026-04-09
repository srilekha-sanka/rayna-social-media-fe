import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdFavorite, MdChatBubble, MdShare, MdRemoveRedEye,
} from 'react-icons/md';
import { getPlatformConfig } from '../../utils/platforms';
import { fetchAccountFeed } from '../../services/analytics';
import '../../styles/analytics.css';
import '../../styles/pages.css';

function formatNum(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function AccountFeed() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [feed, setFeed] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAccountFeed(accountId, { limit: 25 });
      setAccount(res.account);
      setFeed(res.feed || []);
      setCursor(res.meta?.next || null);
      setHasMore(!!res.meta?.next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchAccountFeed(accountId, { limit: 25, cursor });
      setFeed((prev) => [...prev, ...(res.feed || [])]);
      setCursor(res.meta?.next || null);
      setHasMore(!!res.meta?.next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const cfg = account ? getPlatformConfig(account.platform) : null;
  const PlatformIcon = cfg?.icon;

  if (loading) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate(-1)}>
          <MdArrowBack /> Back
        </button>
        <div className="an__loading"><div className="an__spinner" /> Loading feed...</div>
      </div>
    );
  }

  if (error && !account) {
    return (
      <div>
        <button className="an__back" onClick={() => navigate(-1)}>
          <MdArrowBack /> Back
        </button>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">!</div>
            <h3>Failed to load feed</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={loadInitial} style={{ marginTop: 16 }}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="an__back" onClick={() => navigate(-1)}>
        <MdArrowBack /> Back
      </button>

      {/* Account Header */}
      {account && (
        <div className="an__account-header">
          {account.avatar_url ? (
            <img className="an__account-avatar" src={account.avatar_url} alt="" />
          ) : (
            <div className="an__account-avatar-placeholder">
              {account.display_name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="an__account-name">{account.display_name}</h2>
              {PlatformIcon && (
                <span style={{ color: cfg.color === '#000000' ? '#1a1a2e' : cfg.color, fontSize: 18 }}>
                  <PlatformIcon />
                </span>
              )}
            </div>
            <p className="an__account-username">@{account.username}</p>
          </div>
        </div>
      )}

      {/* Feed Grid */}
      {feed.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">&#128240;</div>
            <h3>No feed items</h3>
            <p>This account has no posts yet.</p>
          </div>
        </div>
      )}

      {feed.length > 0 && (
        <div className="an__feed-grid">
          {feed.map((item) => (
            <div
              key={item.id}
              className="an__feed-item"
              onClick={() => item.url && window.open(item.url, '_blank')}
              style={{ cursor: item.url ? 'pointer' : 'default' }}
            >
              {item.media_type === 'video' && (
                <div style={{ position: 'relative' }}>
                  <div className="an__feed-thumb" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdRemoveRedEye style={{ fontSize: 32, color: '#fff', opacity: 0.6 }} />
                  </div>
                </div>
              )}
              {item.media_type !== 'video' && (
                <div className="an__feed-thumb" style={{ background: 'var(--gradient-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: 0.3 }}>
                  &#128247;
                </div>
              )}
              <div className="an__feed-body">
                <p className="an__feed-caption">{item.caption}</p>
                <div className="an__feed-metrics">
                  <span className="an__feed-metric"><MdFavorite /> {formatNum(item.metrics?.likes)}</span>
                  <span className="an__feed-metric"><MdChatBubble /> {formatNum(item.metrics?.comments)}</span>
                  <span className="an__feed-metric"><MdShare /> {formatNum(item.metrics?.shares)}</span>
                  <span className="an__feed-metric"><MdRemoveRedEye /> {formatNum(item.metrics?.reach)}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {new Date(item.published_at).toLocaleDateString()}
                  {item.media_type && <span style={{ marginLeft: 8 }} className="badge badge--draft">{item.media_type}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="an__load-more">
          <button className="btn btn--outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <><div className="an__spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading...</>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountFeed;
