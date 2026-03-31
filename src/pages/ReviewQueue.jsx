import { useState, useEffect, useCallback } from 'react';
import {
  MdCheckCircle,
  MdCancel,
  MdFilterList,
  MdClose,
  MdCalendarToday,
  MdPerson,
  MdCampaign,
  MdAutoAwesome,
  MdExpandMore,
  MdExpandLess,
  MdArrowBack,
  MdArrowForward,
  MdInbox,
  MdRefresh,
  MdVisibility,
  MdSchedule,
  MdRocketLaunch,
  MdAccessTime,
  MdStar,
  MdBolt,
  MdDateRange,
  MdArrowRight,
  MdCheckCircleOutline,
  MdSkipNext,
} from 'react-icons/md';
import { PLATFORMS } from '../utils/platforms';
import { fetchReviewQueue, fetchSuggestedTimes, autoSchedule } from '../services/contentPlan';
import { approvePost, rejectPost, schedulePost, publishPost, getMediaUrl } from '../services/api';
import '../styles/review-queue.css';

/* ── helpers ─────────────────────────────────────────── */

const platformMap = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

function PlatformBadge({ platform }) {
  const p = platformMap[platform] || platformMap.twitter;
  if (!p) return <span className="rq__platform-chip">{platform}</span>;
  const Icon = p.icon;
  return (
    <span className="rq__platform-chip" style={{ '--p-color': p.color }}>
      <Icon /> {p.name}
    </span>
  );
}

function TimeAgo({ date }) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  const days = Math.floor(hrs / 24);
  return <span>{days}d ago</span>;
}

function MediaPreview({ urls, onImageClick }) {
  if (!urls || urls.length === 0) return null;
  const show = urls.slice(0, 4);
  const extra = urls.length - 4;
  return (
    <div className="rq__media-grid">
      {show.map((url, i) => (
        <div
          key={i}
          className={`rq__media-thumb ${show.length === 1 ? 'rq__media-thumb--single' : ''}`}
          onClick={() => onImageClick && onImageClick(i)}
        >
          <img src={getMediaUrl(url)} alt="" className="rq__media-img" />
          {i === 3 && extra > 0 && (
            <div className="rq__media-more">+{extra}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── main component ──────────────────────────────────── */

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [platformFilter, setPlatformFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  // Schedule-after-approve state
  const [approvedCards, setApprovedCards] = useState({}); // { [postId]: { suggestedTimes, loading, customTime, showCustom } }
  const [scheduledCards, setScheduledCards] = useState(new Set()); // posts that completed scheduling (for exit animation)

  const limit = 12;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  /* ── fetch ────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchReviewQueue({
        page,
        limit,
        platform: platformFilter || undefined,
      });
      const data = res.entries || res.data || res.items || res;
      setItems(Array.isArray(data) ? data : []);
      setTotal(res.total || res.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, platformFilter]);

  useEffect(() => { load(); }, [load]);

  /* ── approve → transition to schedule ──────────── */
  const handleApprove = async (postId, entryPlatform, entryDate) => {
    setActionLoading(postId);
    try {
      await approvePost(postId);
      showToast('Post approved — now schedule it!');

      // Transition card to schedule phase
      setApprovedCards((prev) => ({
        ...prev,
        [postId]: { suggestedTimes: [], loading: true, customTime: '', showCustom: false },
      }));

      // Load suggested times in background
      try {
        const timesRes = await fetchSuggestedTimes({
          date: entryDate,
          platform: entryPlatform,
        });
        const times = timesRes.times || timesRes.suggested_times || timesRes;
        setApprovedCards((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], suggestedTimes: Array.isArray(times) ? times : [], loading: false },
        }));
      } catch {
        setApprovedCards((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], suggestedTimes: [], loading: false },
        }));
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── schedule actions ─────────────────────────── */
  const handleScheduleAt = async (postId, scheduledAt) => {
    setActionLoading(postId);
    try {
      await schedulePost(postId, scheduledAt);
      handleScheduleComplete(postId, `Scheduled for ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishNow = async (postId) => {
    setActionLoading(postId);
    try {
      await publishPost(postId);
      handleScheduleComplete(postId, 'Published successfully!');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoSchedule = async (postId) => {
    setActionLoading(postId);
    try {
      await autoSchedule([postId]);
      handleScheduleComplete(postId, 'Auto-scheduled with optimal time!');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleScheduleComplete = (postId, message) => {
    showToast(message);
    setScheduledCards((prev) => new Set([...prev, postId]));
    // Remove card after exit animation
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => {
        const pid = item.post?.id || item.post?._id;
        return pid !== postId;
      }));
      setApprovedCards((prev) => { const n = { ...prev }; delete n[postId]; return n; });
      setScheduledCards((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setTotal((t) => Math.max(0, t - 1));
    }, 600);
  };

  const handleSkipSchedule = (postId) => {
    // Remove from approved state but keep in the list? No — it's approved, remove it.
    setItems((prev) => prev.filter((item) => {
      const pid = item.post?.id || item.post?._id;
      return pid !== postId;
    }));
    setApprovedCards((prev) => { const n = { ...prev }; delete n[postId]; return n; });
    setTotal((t) => Math.max(0, t - 1));
    showToast('Approved — you can schedule it later from the calendar');
  };

  /* ── reject ────────────────────────────────────── */
  const handleReject = async () => {
    if (!rejectModal) return;
    const postId = rejectModal;
    setActionLoading(postId);
    try {
      await rejectPost(postId, rejectReason);
      setItems((prev) => prev.filter((item) => {
        const pid = item.post?.id || item.post?._id;
        return pid !== postId;
      }));
      setTotal((t) => Math.max(0, t - 1));
      setRejectModal(null);
      setRejectReason('');
      showToast('Post rejected');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const pendingCount = items.filter((item) => !approvedCards[item.post?.id || item.post?._id]).length;

  /* ── render ───────────────────────────────────────── */
  return (
    <div className="rq">
      {/* ── Header ── */}
      <div className="rq__header">
        <div className="rq__header-left">
          <h1 className="rq__title">Review Queue</h1>
          <span className="rq__badge-count">
            {loading ? '...' : pendingCount} pending
          </span>
          {Object.keys(approvedCards).length > 0 && (
            <span className="rq__badge-approved">
              {Object.keys(approvedCards).length} to schedule
            </span>
          )}
        </div>
        <div className="rq__header-actions">
          <div className="rq__filter-group">
            <MdFilterList className="rq__filter-icon" />
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
              className="rq__filter-select"
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button onClick={load} className="rq__refresh-btn" title="Refresh">
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rq__alert">
          <span>{error}</span>
          <button onClick={() => setError('')}><MdClose /></button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="rq__skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rq__skeleton-card">
              <div className="rq__skeleton-media shimmer" />
              <div className="rq__skeleton-lines">
                <div className="rq__skeleton-line shimmer" style={{ width: '60%' }} />
                <div className="rq__skeleton-line shimmer" style={{ width: '90%' }} />
                <div className="rq__skeleton-line shimmer" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && items.length === 0 && !error && (
        <div className="rq__empty">
          <div className="rq__empty-icon"><MdInbox /></div>
          <h3>All caught up!</h3>
          <p>No posts waiting for review. New submissions will appear here.</p>
        </div>
      )}

      {/* ── Cards Grid ── */}
      {!loading && items.length > 0 && (
        <>
          <div className="rq__grid">
            {items.map((item) => {
              const entry = item;
              const post = item.post || {};
              const postId = post.id || post._id;
              const product = item.product || post.product;
              const plan = item.plan || item.content_plan;
              const author = item.author || post.author || post.created_by;
              const media = post.media_urls || post.slides?.map((s) => s.image_url) || entry.media_urls || [];
              const caption = post.caption || post.base_content || entry.description || '';
              const hashtags = post.hashtags || '';
              const title = entry.title || post.title || 'Untitled';
              const platform = entry.platform || post.platform || '';
              const contentType = entry.content_type || post.content_type || '';
              const isExpanded = expandedId === postId;
              const isActioning = actionLoading === postId;
              const isPreviewing = previewId === postId;
              const isApproved = !!approvedCards[postId];
              const isScheduled = scheduledCards.has(postId);
              const scheduleState = approvedCards[postId];

              return (
                <div
                  key={postId || entry.id || entry._id}
                  className={`rq__card ${isApproved ? 'rq__card--approved' : ''} ${isScheduled ? 'rq__card--scheduled' : ''}`}
                >
                  {/* ── Approved Badge Overlay ── */}
                  {isApproved && !isScheduled && (
                    <div className="rq__approved-banner">
                      <MdCheckCircle /> Approved — Choose when to post
                    </div>
                  )}

                  {/* ── Scheduled Success Overlay ── */}
                  {isScheduled && (
                    <div className="rq__scheduled-overlay">
                      <MdCheckCircleOutline className="rq__scheduled-icon" />
                      <span>Scheduled!</span>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="rq__card-top">
                    <div className="rq__card-meta">
                      <PlatformBadge platform={platform} />
                      {contentType && (
                        <span className="rq__type-tag">{contentType.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    <div className="rq__card-time">
                      <TimeAgo date={post.created_at || entry.created_at || entry.date} />
                    </div>
                  </div>

                  {/* Media */}
                  <MediaPreview
                    urls={media}
                    onImageClick={(i) => setLightbox({ urls: media.map(getMediaUrl), index: i })}
                  />

                  {/* Content */}
                  <div className="rq__card-body">
                    <h3 className="rq__card-title">{title}</h3>
                    <p className={`rq__card-caption ${isExpanded ? 'rq__card-caption--expanded' : ''}`}>
                      {caption}
                    </p>
                    {caption.length > 120 && (
                      <button
                        className="rq__expand-btn"
                        onClick={() => setExpandedId(isExpanded ? null : postId)}
                      >
                        {isExpanded ? <><MdExpandLess /> Less</> : <><MdExpandMore /> More</>}
                      </button>
                    )}
                    {hashtags && (
                      <p className="rq__card-hashtags">
                        {Array.isArray(hashtags) ? hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ') : hashtags}
                      </p>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="rq__card-info">
                    {plan && (
                      <div className="rq__info-item" title="Content Plan">
                        <MdCampaign />
                        <span>{plan.name || 'Plan'}</span>
                      </div>
                    )}
                    {product && (
                      <div className="rq__info-item" title="Product">
                        <MdAutoAwesome />
                        <span>{product.name || product.title || 'Product'}</span>
                      </div>
                    )}
                    {author && (
                      <div className="rq__info-item" title="Author">
                        <MdPerson />
                        <span>{typeof author === 'string' ? author : (author.name || author.email || 'Unknown')}</span>
                      </div>
                    )}
                    {entry.date && (
                      <div className="rq__info-item" title="Scheduled Date">
                        <MdCalendarToday />
                        <span>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* ════════ PHASE 1: Review Actions ════════ */}
                  {!isApproved && (
                    <>
                      <div className="rq__card-actions">
                        <button
                          className="rq__action-btn rq__action-btn--reject"
                          onClick={() => { setRejectModal(postId); setRejectReason(''); }}
                          disabled={isActioning}
                        >
                          <MdCancel /> Reject
                        </button>
                        <button
                          className="rq__action-btn rq__action-btn--preview"
                          onClick={() => setPreviewId(isPreviewing ? null : postId)}
                        >
                          <MdVisibility /> Preview
                        </button>
                        <button
                          className="rq__action-btn rq__action-btn--approve"
                          onClick={() => handleApprove(postId, platform, entry.date)}
                          disabled={isActioning}
                        >
                          {isActioning ? <span className="rq__spinner" /> : <MdCheckCircle />}
                          Approve
                        </button>
                      </div>

                      {/* Inline Preview Panel */}
                      {isPreviewing && (
                        <div className="rq__preview-panel">
                          <div className="rq__preview-divider" />
                          {media.length > 0 && (
                            <div className="rq__preview-media-row">
                              {media.map((url, i) => (
                                <img
                                  key={i}
                                  src={getMediaUrl(url)}
                                  alt=""
                                  className="rq__preview-media-img"
                                  onClick={() => setLightbox({ urls: media.map(getMediaUrl), index: i })}
                                />
                              ))}
                            </div>
                          )}
                          <div className="rq__preview-section">
                            <label>Caption</label>
                            <p>{caption || 'No caption'}</p>
                          </div>
                          {hashtags && (
                            <div className="rq__preview-section">
                              <label>Hashtags</label>
                              <p className="rq__preview-hashtags">
                                {Array.isArray(hashtags) ? hashtags.join(' ') : hashtags}
                              </p>
                            </div>
                          )}
                          {(post.cta || post.cta_text) && (
                            <div className="rq__preview-section">
                              <label>Call to Action</label>
                              <span className="rq__preview-cta">{post.cta || post.cta_text}</span>
                            </div>
                          )}
                          {product && (
                            <div className="rq__preview-product">
                              {(product.images?.[0] || product.image) && (
                                <img src={getMediaUrl(product.images?.[0] || product.image)} alt="" className="rq__preview-product-img" />
                              )}
                              <div>
                                <strong>{product.name || product.title}</strong>
                                {product.price && <span className="rq__preview-product-price">{product.currency || 'AED'} {product.sale_price || product.price}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ════════ PHASE 2: Schedule Actions ════════ */}
                  {isApproved && !isScheduled && (
                    <div className="rq__schedule-panel">
                      <div className="rq__schedule-divider" />

                      {/* Suggested Times */}
                      {scheduleState.loading ? (
                        <div className="rq__schedule-loading">
                          <span className="rq__spinner rq__spinner--purple" />
                          <span>Finding best times...</span>
                        </div>
                      ) : scheduleState.suggestedTimes.length > 0 ? (
                        <div className="rq__times-section">
                          <div className="rq__times-header">
                            <MdAccessTime /> Best Times
                          </div>
                          <div className="rq__times-list">
                            {scheduleState.suggestedTimes.slice(0, 3).map((slot, i) => {
                              const time = slot.time || slot.suggested_time;
                              const label = slot.label || slot.reason || slot.description || '';
                              const score = slot.score || slot.engagement_score;
                              const entryDate = entry.date || entry.scheduled_date || new Date().toISOString().split('T')[0];
                              return (
                                <button
                                  key={i}
                                  className={`rq__time-slot ${i === 0 ? 'rq__time-slot--top' : ''}`}
                                  onClick={() => handleScheduleAt(postId, `${entryDate}T${time}:00`)}
                                  disabled={isActioning}
                                >
                                  <div className="rq__time-left">
                                    {i === 0 && <MdStar className="rq__time-star" />}
                                    <span className="rq__time-value">{time}</span>
                                    {label && <span className="rq__time-label">{label}</span>}
                                  </div>
                                  <div className="rq__time-right">
                                    {score && (
                                      <span className={`rq__score ${score >= 90 ? 'rq__score--high' : score >= 80 ? 'rq__score--mid' : ''}`}>
                                        {score}
                                      </span>
                                    )}
                                    <MdArrowRight className="rq__time-go" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {/* Custom Time */}
                      {!scheduleState.loading && (
                        <>
                          <button
                            className="rq__custom-toggle"
                            onClick={() => setApprovedCards((prev) => ({
                              ...prev,
                              [postId]: { ...prev[postId], showCustom: !prev[postId].showCustom },
                            }))}
                          >
                            <MdDateRange /> {scheduleState.showCustom ? 'Hide' : 'Pick'} custom time
                          </button>

                          {scheduleState.showCustom && (
                            <div className="rq__custom-row">
                              <input
                                type="time"
                                value={scheduleState.customTime}
                                onChange={(e) => setApprovedCards((prev) => ({
                                  ...prev,
                                  [postId]: { ...prev[postId], customTime: e.target.value },
                                }))}
                                className="rq__custom-input"
                              />
                              <button
                                className="rq__custom-go"
                                onClick={() => {
                                  if (!scheduleState.customTime) return;
                                  const entryDate = entry.date || entry.scheduled_date || new Date().toISOString().split('T')[0];
                                  handleScheduleAt(postId, `${entryDate}T${scheduleState.customTime}:00`);
                                }}
                                disabled={!scheduleState.customTime || isActioning}
                              >
                                <MdSchedule /> Schedule
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Quick Actions */}
                      <div className="rq__schedule-actions">
                        <button
                          className="rq__sched-btn rq__sched-btn--publish"
                          onClick={() => handlePublishNow(postId)}
                          disabled={isActioning}
                        >
                          {isActioning && actionLoading === postId ? <span className="rq__spinner" /> : <MdRocketLaunch />}
                          Publish Now
                        </button>
                        <button
                          className="rq__sched-btn rq__sched-btn--auto"
                          onClick={() => handleAutoSchedule(postId)}
                          disabled={isActioning}
                        >
                          <MdBolt /> Auto-Schedule
                        </button>
                        <button
                          className="rq__sched-btn rq__sched-btn--skip"
                          onClick={() => handleSkipSchedule(postId)}
                          disabled={isActioning}
                        >
                          <MdSkipNext /> Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rq__pagination">
              <button
                className="rq__page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <MdArrowBack /> Previous
              </button>
              <div className="rq__page-info">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
              <button
                className="rq__page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <MdArrowForward />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="rq__overlay" onClick={() => setRejectModal(null)}>
          <div className="rq__modal" onClick={(e) => e.stopPropagation()}>
            <div className="rq__modal-header">
              <h3><MdCancel /> Reject Post</h3>
              <button onClick={() => setRejectModal(null)}><MdClose /></button>
            </div>
            <div className="rq__modal-body">
              <p className="rq__modal-desc">
                Provide a reason for rejection. The author will be notified and can revise the post.
              </p>
              <div className="rq__form-group">
                <label>Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Caption needs revision, wrong image dimensions..."
                  rows={4}
                />
              </div>
              <div className="rq__quick-reasons">
                {['Caption needs work', 'Wrong image/media', 'Off-brand tone', 'Missing hashtags', 'Incorrect product info'].map((r) => (
                  <button
                    key={r}
                    className="rq__quick-reason"
                    onClick={() => setRejectReason((prev) => prev ? `${prev}, ${r.toLowerCase()}` : r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="rq__modal-actions">
                <button className="btn btn--outline" onClick={() => setRejectModal(null)}>Cancel</button>
                <button
                  className="rq__reject-confirm-btn"
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal}
                >
                  {actionLoading === rejectModal ? (
                    <span className="rq__spinner" />
                  ) : (
                    <MdCancel />
                  )}
                  Reject Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><MdClose /></button>
          {lightbox.urls.length > 1 && (
            <>
              <button
                className="lightbox-nav lightbox-nav--prev"
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => ({ ...l, index: (l.index - 1 + l.urls.length) % l.urls.length })); }}
              >‹</button>
              <button
                className="lightbox-nav lightbox-nav--next"
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => ({ ...l, index: (l.index + 1) % l.urls.length })); }}
              >›</button>
            </>
          )}
          <img
            src={lightbox.urls[lightbox.index]}
            alt=""
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.urls.length > 1 && (
            <div className="lightbox-counter">{lightbox.index + 1} / {lightbox.urls.length}</div>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div className="rq__toast">{toast}</div>}
    </div>
  );
}
