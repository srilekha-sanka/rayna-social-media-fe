import { useState, useEffect, useRef } from 'react';
import {
  MdSearch,
  MdClose,
  MdAutoAwesome,
  MdImage,
  MdTag,
  MdTouchApp,
  MdContentCopy,
  MdCheck,
  MdRefresh,
  MdArrowBack,
  MdSend,
  MdThumbUp,
  MdThumbDown,
  MdPublish,
  MdSchedule,
  MdCheckCircle,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import {
  fetchProducts, generateCarousel, pollJob, getMediaUrl,
  submitPost, approvePost, rejectPost, publishPost, schedulePost,
  checkInstagramCredentials, publishToInstagram,
} from '../../services/api';
import { FaInstagram } from 'react-icons/fa6';
import { PLATFORMS } from '../../utils/platforms';
import '../../styles/pages.css';
import '../../styles/pipeline.css';
import '../../styles/studio.css';

const CAROUSEL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter', 'pinterest', 'whatsapp'];

function CarouselStudio() {
  const navigate = useNavigate();

  // ─── Product Selection ────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ─── Lightbox ──────────────────────────────────────────
  const [lightbox, setLightbox] = useState(null); // { src, text, cta }

  // ─── Config ───────────────────────────────────────────
  const [platform, setPlatform] = useState('instagram');
  const [slideCount, setSlideCount] = useState(4);

  // ─── Generation (async job) ────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(''); // human-readable progress
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  // ─── Instagram Integration ───────────────────────────
  const [igConnected, setIgConnected] = useState(false);
  const [igLoading, setIgLoading] = useState(false);
  const [showIgConfirm, setShowIgConfirm] = useState(false);
  const [igPublishResult, setIgPublishResult] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  async function loadProducts() {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const list = await fetchProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProductsError(err.message);
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  // Check Instagram credentials on mount
  useEffect(() => {
    let cancelled = false;
    async function checkIg() {
      try {
        const creds = await checkInstagramCredentials();
        if (!cancelled) setIgConnected(!!creds?.configured);
      } catch {
        if (!cancelled) setIgConnected(false);
      }
    }
    checkIg();
    return () => { cancelled = true; };
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleGenerate() {
    if (!selectedProduct) return;
    try {
      setGenerating(true);
      setError(null);
      setResult(null);
      setGenStage('Starting generation...');

      // Step 1: Kick off the job (~100ms response)
      const job = await generateCarousel({
        product_id: selectedProduct.id,
        platform,
        slide_count: slideCount,
      });

      // If backend returned the full result directly (no job_id), use it
      if (!job.job_id && (job.post || job.slides)) {
        setResult(job);
        setGenerating(false);
        return;
      }

      // Step 2: Poll for completion
      const stages = [
        'Fetching product data...',
        'Running Decision Engine...',
        'Generating AI captions & hashtags...',
        'Downloading product images...',
        'Applying text overlays...',
        'Assembling carousel slides...',
        'Finalizing...',
      ];

      const completed = await pollJob(job.job_id, {
        interval: 2500,
        maxAttempts: 60,
        onProgress: (_status, attempt) => {
          const idx = Math.min(attempt - 1, stages.length - 1);
          setGenStage(stages[idx]);
        },
      });

      setResult(completed);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setGenStage('');
    }
  }

  // ─── Workflow State ────────────────────────────────────
  const [postStatus, setPostStatus] = useState(null); // tracks live status
  const [actionLoading, setActionLoading] = useState(null); // which action is in progress
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');

  // Current status from result or local override
  const currentStatus = postStatus || result?.post?.status || 'DRAFT';
  const postId = result?.post?.id;

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setPostStatus(null);
    setActionLoading(null);
    setIgPublishResult(null);
    setToast(null);
  }

  async function handleAction(action) {
    if (!postId) return;
    setActionLoading(action);
    try {
      if (action === 'submit') {
        await submitPost(postId);
        setPostStatus('PENDING_REVIEW');
      } else if (action === 'approve') {
        await approvePost(postId, '');
        setPostStatus('APPROVED');
      } else if (action === 'reject') {
        await rejectPost(postId, rejectReason);
        setPostStatus('DRAFT');
        setShowRejectModal(false);
        setRejectReason('');
      } else if (action === 'publish') {
        await publishPost(postId);
        setPostStatus('PUBLISHED');
      } else if (action === 'schedule') {
        const dt = `${scheduleDate}T${scheduleTime}:00.000Z`;
        await schedulePost(postId, dt);
        setPostStatus('SCHEDULED');
        setShowScheduleModal(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInstagramPublish() {
    if (!postId) return;
    setIgLoading(true);
    setShowIgConfirm(false);
    try {
      const res = await publishToInstagram(postId);
      setIgPublishResult(res);
      setPostStatus('PUBLISHED');
      setToast({ type: 'success', message: 'Successfully published to Instagram!' });
    } catch (err) {
      const msg = err.message || 'Failed to publish to Instagram';
      if (msg.includes('credentials not configured')) {
        setToast({ type: 'error', message: 'Instagram credentials not configured. Go to Settings to connect your account.' });
      } else if (msg.includes('no media')) {
        setToast({ type: 'error', message: 'Post has no media URLs. Please regenerate the slides.' });
      } else {
        setToast({ type: 'error', message: msg });
      }
    } finally {
      setIgLoading(false);
    }
  }

  // Instagram publish eligibility
  const canPublishToIg = igConnected
    && (result?.slides?.length > 0 || result?.post?.media_urls?.length > 0)
    && (result?.ai_content?.caption || result?.post?.base_content);

  const productImage = selectedProduct?.image_urls?.[0] || null;
  const hasOffer = selectedProduct?.offer_label || (selectedProduct?.compare_at_price && Number(selectedProduct.compare_at_price) > Number(selectedProduct.price));

  // Workflow step states
  const WORKFLOW = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PENDING_REVIEW', label: 'In Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'PUBLISHED', label: 'Published' },
  ];
  const statusIndex = WORKFLOW.findIndex((w) => w.key === currentStatus);

  // ─────────────────────────────────────────────────────
  // RESULT VIEW
  // ─────────────────────────────────────────────────────
  if (result && !generating) {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn btn--outline btn--sm" onClick={handleReset} style={{ gap: 4 }}>
            <MdArrowBack size={16} /> New
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{result.meta?.product_name}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              {result.meta?.platform} · {result.slides?.length} slides · {result.meta?.intent}
            </p>
          </div>
          <span className={`intent-badge intent-badge--${(result.meta?.intent || 'engagement').toLowerCase()}`}>
            {result.meta?.intent}
          </span>
        </div>

        {/* Workflow Progress Bar */}
        <div className="workflow-bar">
          {WORKFLOW.map((step, i) => {
            let state = '';
            if (currentStatus === 'SCHEDULED' && step.key === 'PUBLISHED') {
              state = 'active';
            } else if (i < statusIndex) state = 'done';
            else if (i === statusIndex) state = 'active';
            return (
              <div key={step.key} className={`workflow-step workflow-step--${state}`}>
                <span className="workflow-step__dot">
                  {state === 'done' && <MdCheck size={7} style={{ color: '#fff' }} />}
                </span>
                {currentStatus === 'SCHEDULED' && step.key === 'PUBLISHED' ? 'Scheduled' : step.label}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>×</button>
          </div>
        )}

        {/* ─── Published / Scheduled Success ─── */}
        {(currentStatus === 'PUBLISHED' || currentStatus === 'SCHEDULED') && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel__body">
              <div className="success-state">
                <div className="success-state__icon"><MdCheckCircle /></div>
                <h3>{currentStatus === 'PUBLISHED' ? 'Post Published!' : 'Post Scheduled!'}</h3>
                <p>
                  {currentStatus === 'PUBLISHED'
                    ? 'Your carousel has been published successfully.'
                    : `Your carousel is scheduled for ${scheduleDate} at ${scheduleTime} UTC.`
                  }
                </p>
                <div style={{ marginTop: 20 }}>
                  <button className="btn btn--outline" onClick={handleReset}><MdRefresh /> Create Another</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Action Cards (contextual based on status) ─── */}
        {currentStatus !== 'PUBLISHED' && currentStatus !== 'SCHEDULED' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            {currentStatus === 'DRAFT' && (
              <div
                className="action-card action-card--primary"
                onClick={() => !actionLoading && handleAction('submit')}
              >
                <div className="action-card__icon" style={{ background: '#f3e8ff', color: 'var(--primary)' }}>
                  {actionLoading === 'submit' ? <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: 0 }} /> : <MdSend />}
                </div>
                <div className="action-card__title">Submit for Review</div>
                <div className="action-card__desc">Send to admin for approval</div>
              </div>
            )}

            {currentStatus === 'PENDING_REVIEW' && (
              <>
                <div
                  className="action-card action-card--success"
                  onClick={() => !actionLoading && handleAction('approve')}
                >
                  <div className="action-card__icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    {actionLoading === 'approve' ? <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: 0 }} /> : <MdThumbUp />}
                  </div>
                  <div className="action-card__title">Approve</div>
                  <div className="action-card__desc">Content looks good, approve it</div>
                </div>
                <div
                  className="action-card action-card--danger"
                  onClick={() => setShowRejectModal(true)}
                >
                  <div className="action-card__icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    <MdThumbDown />
                  </div>
                  <div className="action-card__title">Reject</div>
                  <div className="action-card__desc">Send back to draft with feedback</div>
                </div>
              </>
            )}

            {currentStatus === 'APPROVED' && (
              <>
                <div
                  className="action-card action-card--primary"
                  onClick={() => !actionLoading && handleAction('publish')}
                >
                  <div className="action-card__icon" style={{ background: '#f3e8ff', color: 'var(--primary)' }}>
                    {actionLoading === 'publish' ? <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: 0 }} /> : <MdPublish />}
                  </div>
                  <div className="action-card__title">Publish Now</div>
                  <div className="action-card__desc">Post immediately to {result.meta?.platform}</div>
                </div>
                <div
                  className="action-card"
                  onClick={() => setShowScheduleModal(true)}
                >
                  <div className="action-card__icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                    <MdSchedule />
                  </div>
                  <div className="action-card__title">Schedule</div>
                  <div className="action-card__desc">Pick a date & time to post</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Instagram Publish Card ─── */}
        {currentStatus !== 'PUBLISHED' && currentStatus !== 'SCHEDULED' && igConnected && (
          <div style={{ marginBottom: 28 }}>
            <div
              className={`action-card action-card--ig${!canPublishToIg || igLoading ? ' action-card--disabled' : ''}`}
              onClick={() => canPublishToIg && !igLoading && setShowIgConfirm(true)}
            >
              <div className="action-card__icon action-card__icon--ig">
                {igLoading
                  ? <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: 0 }} />
                  : <FaInstagram />
                }
              </div>
              <div className="action-card__title">
                {igLoading ? 'Publishing to Instagram...' : 'Publish to Instagram'}
              </div>
              <div className="action-card__desc">
                {!canPublishToIg && !igLoading
                  ? 'Needs at least one slide and a caption'
                  : 'Post directly to your Instagram account'
                }
              </div>
            </div>
          </div>
        )}

        {/* ─── Instagram Publish Success Info ─── */}
        {igPublishResult && currentStatus === 'PUBLISHED' && (
          <div className="ig-publish-info" style={{ marginBottom: 24 }}>
            <FaInstagram style={{ fontSize: 16 }} />
            <span>Published to Instagram</span>
            {igPublishResult.media_id && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Media ID: {igPublishResult.media_id}</span>
            )}
          </div>
        )}

        {/* ─── Slides ─── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Generated Slides
          </div>
          <div className="slides-result">
            {(result.slides || []).map((slide, i) => (
              <div
                className="slide-card"
                key={i}
                onClick={() => setLightbox({ src: getMediaUrl(slide.url || slide.processed_image), text: slide.overlay_text, cta: slide.cta_text, num: slide.slide_number || i + 1 })}
                style={{ cursor: 'pointer' }}
              >
                <div className="slide-card__img-wrap">
                  <img className="slide-card__img" src={getMediaUrl(slide.url || slide.processed_image)} alt={`Slide ${slide.slide_number || i + 1}`} />
                  <div className="slide-card__number">Slide {slide.slide_number || i + 1}</div>
                  <div className="slide-card__overlay">
                    <div className="slide-card__overlay-text">{slide.overlay_text}</div>
                    {slide.cta_text && <span className="slide-card__overlay-cta">{slide.cta_text}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Caption + Hashtags + CTA ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <div className="result-section" style={{ margin: 0 }}>
            <div className="result-section__header">
              <div className="result-section__label"><MdAutoAwesome className="result-section__label-icon" /> Caption</div>
              <button className="result-section__copy" onClick={() => handleCopy(result.ai_content?.caption || result.post?.base_content, 'caption')}>
                {copied === 'caption' ? <><MdCheck size={12} /> Copied</> : <><MdContentCopy size={12} /> Copy</>}
              </button>
            </div>
            <div className="result-caption">{result.ai_content?.caption || result.post?.base_content}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="result-section" style={{ margin: 0 }}>
              <div className="result-section__header">
                <div className="result-section__label"><MdTag className="result-section__label-icon" /> Hashtags</div>
                <button className="result-section__copy" onClick={() => handleCopy((result.ai_content?.hashtags || result.post?.hashtags || []).join(' '), 'hashtags')}>
                  {copied === 'hashtags' ? <><MdCheck size={12} /> Copied</> : <><MdContentCopy size={12} /> Copy</>}
                </button>
              </div>
              <div className="hashtag-list">
                {(result.ai_content?.hashtags || result.post?.hashtags || []).map((tag) => (
                  <span key={tag} className="hashtag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="result-section" style={{ margin: 0 }}>
              <div className="result-section__header">
                <div className="result-section__label"><MdTouchApp className="result-section__label-icon" /> CTA</div>
                <button className="result-section__copy" onClick={() => handleCopy(result.ai_content?.cta || result.post?.cta_text, 'cta')}>
                  {copied === 'cta' ? <><MdCheck size={12} /> Copied</> : <><MdContentCopy size={12} /> Copy</>}
                </button>
              </div>
              <div className="cta-preview">{result.ai_content?.cta || result.post?.cta_text}</div>
            </div>
          </div>
        </div>

        {/* ─── Image Lightbox ─── */}
        {lightbox && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}
            onClick={() => setLightbox(null)}
          >
            {/* Close button */}
            <button
              style={{
                position: 'absolute', top: 20, right: 24,
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 22, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setLightbox(null)}
            >
              <MdClose />
            </button>

            {/* Image */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '85vw', maxHeight: '85vh', position: 'relative', cursor: 'default' }}
            >
              <img
                src={lightbox.src}
                alt={lightbox.text}
                style={{
                  maxWidth: '85vw', maxHeight: '85vh',
                  borderRadius: 12, objectFit: 'contain',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
              {/* Overlay info */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '24px 28px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                borderRadius: '0 0 12px 12px', color: '#fff',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
                  Slide {lightbox.num}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                  {lightbox.text}
                </div>
                {lightbox.cta && (
                  <span style={{
                    display: 'inline-block', padding: '6px 18px', borderRadius: 20,
                    background: 'var(--gradient-brand)', fontSize: 13, fontWeight: 700,
                  }}>
                    {lightbox.cta}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Reject Modal ─── */}
        {showRejectModal && (
          <div className="schedule-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Reject Post</h3>
              <p>Provide feedback — the post will go back to draft.</p>
              <div className="form-field" style={{ marginBottom: 20 }}>
                <label className="form-field__label">Reason</label>
                <textarea
                  className="form-field__input"
                  placeholder="e.g. Change the CTA text to something more urgent"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn--outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button
                  className="btn btn--primary"
                  style={{ background: '#dc2626' }}
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading === 'reject'}
                >
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Schedule Modal ─── */}
        {showScheduleModal && (
          <div className="schedule-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Schedule Post</h3>
              <p>Choose when to publish this carousel.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div className="form-field">
                  <label className="form-field__label">Date</label>
                  <input type="date" className="form-field__input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
                <div className="form-field">
                  <label className="form-field__label">Time (UTC)</label>
                  <input type="time" className="form-field__input" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn--outline" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button
                  className="btn btn--primary"
                  onClick={() => handleAction('schedule')}
                  disabled={!scheduleDate || actionLoading === 'schedule'}
                >
                  {actionLoading === 'schedule' ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Instagram Confirm Modal ─── */}
        {showIgConfirm && (
          <div className="schedule-overlay" onClick={() => setShowIgConfirm(false)}>
            <div className="schedule-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <FaInstagram style={{ fontSize: 22, color: '#E4405F' }} />
                <h3 style={{ margin: 0 }}>Publish to Instagram</h3>
              </div>
              <p>Review your post before publishing to Instagram.</p>

              {/* Preview image */}
              {(result.slides?.[0]?.url || result.slides?.[0]?.processed_image) && (
                <div style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={getMediaUrl(result.slides[0].url || result.slides[0].processed_image)}
                    alt="Preview"
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {/* Caption preview */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Caption</div>
                <div style={{
                  fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)',
                  background: 'var(--bg-primary)', padding: '12px 14px',
                  borderRadius: 8, border: '1px solid var(--border)',
                  maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap',
                }}>
                  {result.ai_content?.caption || result.post?.base_content}
                </div>
              </div>

              {/* Hashtags preview */}
              {(result.ai_content?.hashtags || result.post?.hashtags || []).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Hashtags</div>
                  <div style={{ fontSize: 13, color: 'var(--primary)', lineHeight: 1.6 }}>
                    {(result.ai_content?.hashtags || result.post?.hashtags || []).join(' ')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn--outline" onClick={() => setShowIgConfirm(false)}>Cancel</button>
                <button
                  className="btn btn--ig"
                  onClick={handleInstagramPublish}
                >
                  <FaInstagram /> Publish Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Toast Notification ─── */}
        {toast && (
          <div className={`toast toast--${toast.type}`}>
            <span className="toast__icon">
              {toast.type === 'success' ? <MdCheckCircle /> : <MdClose />}
            </span>
            <span className="toast__message">{toast.message}</span>
            <button className="toast__close" onClick={() => setToast(null)}><MdClose size={16} /></button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // GENERATING STATE
  // ─────────────────────────────────────────────────────
  if (generating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div className="generating-spinner" style={{ width: 56, height: 56, borderWidth: 4 }} />
          <h3 style={{ marginTop: 20, fontSize: 20, fontWeight: 800 }}>Creating your carousel...</h3>
          <p style={{
            color: 'var(--primary)', fontSize: 14, marginTop: 10,
            fontWeight: 600, minHeight: 20,
            transition: 'opacity 0.3s',
          }}>
            {genStage || 'Starting...'}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            Product → Decision Engine → AI → Image overlay → Slides
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // CONFIG VIEW (default)
  // ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => navigate('/studio')}
          style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
        >
          <MdArrowBack size={16} /> Back to Content Studio
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2>Image Carousel</h2>
        <p>Product image with text overlay + AI captions & hashtags. One click.</p>
      </div>

      {/* ─── Two column: Left = Config, Right = Product preview ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedProduct ? '1fr 340px' : '1fr', gap: 24 }}>

        {/* Left Column — Config */}
        <div>
          {/* Product Selector */}
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel__header">
              <div className="panel__title">
                <span className="panel__title-icon panel__title-icon--purple"><MdImage /></span>
                Select Product
              </div>
              {products.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{products.length} products</span>
              )}
            </div>
            <div className="panel__body" ref={dropdownRef} style={{ position: 'relative', zIndex: 60 }}>
              {selectedProduct ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', border: '2px solid var(--primary)',
                  borderRadius: 10, background: '#f5f3ff',
                }}>
                  {productImage && (
                    <img src={productImage} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {selectedProduct.city && `${selectedProduct.city} · `}
                      {selectedProduct.currency || 'AED'} {selectedProduct.price}
                      {hasOffer && (
                        <span style={{ marginLeft: 8, color: '#dc2626', fontWeight: 700 }}>{selectedProduct.offer_label}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedProduct(null); setSearch(''); }}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}
                  >
                    <MdClose />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 16px',
                    border: `2px solid ${dropdownOpen ? 'var(--primary-light)' : 'var(--border)'}`,
                    borderRadius: dropdownOpen ? '10px 10px 0 0' : '10px',
                    background: '#fff', transition: 'border-color 0.15s',
                  }}>
                    <MdSearch size={20} color="var(--text-secondary)" />
                    <input
                      type="text"
                      placeholder={productsLoading ? 'Loading products...' : productsError ? 'Failed to load products' : 'Search products by name...'}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
                      onFocus={() => setDropdownOpen(true)}
                      style={{ border: 'none', background: 'transparent', fontSize: 14, width: '100%', outline: 'none', color: 'var(--text-primary)' }}
                    />
                    {productsLoading && <div className="generating-spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0, flexShrink: 0 }} />}
                    {productsError && !productsLoading && (
                      <button onClick={loadProducts} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 20, display: 'flex', flexShrink: 0 }} title="Retry">
                        <MdRefresh />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute', left: 22, right: 22, zIndex: 999,
                      background: '#fff', border: '2px solid var(--primary-light)',
                      borderTop: '1px solid #f3f4f6', borderRadius: '0 0 10px 10px',
                      maxHeight: 320, overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    }}>
                      {productsError ? (
                        <div style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 10 }}>{productsError}</div>
                          <button className="btn btn--primary btn--sm" onClick={loadProducts}>Retry</button>
                        </div>
                      ) : productsLoading ? (
                        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                          <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: '0 auto 8px' }} />
                          Loading products...
                        </div>
                      ) : filtered.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {products.length === 0 ? 'No products available' : 'No match found'}
                        </div>
                      ) : (
                        filtered.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedProduct(p); setSearch(''); setDropdownOpen(false); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '11px 16px', cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                          >
                            {p.image_urls?.[0] ? (
                              <img src={p.image_urls[0]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📦</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                                {p.city && `${p.city} · `}{p.currency || 'AED'} {p.price}
                                {p.offer_label && <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>{p.offer_label}</span>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Platform + Slides side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel__header">
                <div className="panel__title" style={{ fontSize: 13 }}>Platform</div>
              </div>
              <div className="panel__body" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CAROUSEL_PLATFORMS.map((pid) => {
                    const p = PLATFORMS.find((pl) => pl.id === pid);
                    if (!p) return null;
                    const Icon = p.icon;
                    const isSelected = platform === pid;
                    return (
                      <div
                        key={pid}
                        className={`platform-chip${isSelected ? ' platform-chip--selected' : ''}`}
                        onClick={() => setPlatform(pid)}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <span className="platform-chip__icon" style={{ color: isSelected ? p.color : undefined, fontSize: 14 }}><Icon /></span>
                        {p.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel__header">
                <div className="panel__title" style={{ fontSize: 13 }}>Slides</div>
              </div>
              <div className="panel__body" style={{ padding: '16px 20px' }}>
                <div className="slide-count-selector">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      className={`slide-count-btn${slideCount === n ? ' slide-count-btn--active' : ''}`}
                      onClick={() => setSlideCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10 }}>
                  AI will generate {slideCount} slides with text overlay
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div style={{ marginTop: 24 }}>
            <button
              className="btn btn--primary"
              onClick={handleGenerate}
              disabled={!selectedProduct}
              style={{
                padding: '14px 32px', fontSize: 15,
                ...(!selectedProduct ? { opacity: 0.5, pointerEvents: 'none' } : {}),
              }}
            >
              <MdAutoAwesome /> Generate Carousel
            </button>
            {!selectedProduct && (
              <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                Select a product to get started
              </span>
            )}
          </div>
        </div>

        {/* Right Column — Product Preview (only if product selected) */}
        {selectedProduct && (
          <div className="panel" style={{ position: 'sticky', top: 88, alignSelf: 'start' }}>
            <div className="panel__header">
              <div className="panel__title" style={{ fontSize: 13 }}>Product Preview</div>
            </div>
            <div className="panel__body" style={{ padding: 0 }}>
              {/* Product image */}
              {selectedProduct.image_urls?.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={selectedProduct.image_urls[0]}
                    alt={selectedProduct.name}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                  />
                  {hasOffer && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: '#dc2626', color: '#fff', padding: '4px 12px',
                      borderRadius: 14, fontSize: 11, fontWeight: 700,
                    }}>
                      {selectedProduct.offer_label}
                    </span>
                  )}
                  <span style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 10px',
                    borderRadius: 10, fontSize: 11, fontWeight: 600,
                  }}>
                    <MdImage size={12} style={{ verticalAlign: -2 }} /> {selectedProduct.image_urls.length} images
                  </span>
                </div>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <MdImage size={40} style={{ opacity: 0.2 }} />
                </div>
              )}

              {/* Details */}
              <div style={{ padding: '16px 18px' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{selectedProduct.name}</h4>

                {selectedProduct.city && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    📍 {selectedProduct.city}
                    {selectedProduct.category && ` · ${selectedProduct.category}`}
                  </div>
                )}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                    {selectedProduct.currency || 'AED'} {selectedProduct.price}
                  </span>
                  {selectedProduct.compare_at_price && Number(selectedProduct.compare_at_price) > Number(selectedProduct.price) && (
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                      {selectedProduct.currency || 'AED'} {selectedProduct.compare_at_price}
                    </span>
                  )}
                </div>

                {/* Short description */}
                {selectedProduct.short_description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                    {selectedProduct.short_description}
                  </p>
                )}

                {/* Highlights */}
                {selectedProduct.highlights?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selectedProduct.highlights.map((h, i) => (
                      <span key={i} style={{
                        padding: '3px 10px', borderRadius: 14, fontSize: 11, fontWeight: 500,
                        background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
                      }}>
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CarouselStudio;
