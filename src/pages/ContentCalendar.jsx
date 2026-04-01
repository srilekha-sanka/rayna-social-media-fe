import { useState, useEffect, useCallback } from 'react';
import { PLATFORMS } from '../utils/platforms';
import { fetchProducts } from '../services/api';
import {
  generatePlan,
  fetchPlans,
  fetchPlan,
  deletePlan,
  submitPlanForReview,
  approvePlan,
  rejectPlan,
  fetchCalendar,
  createEntry,
  updateEntry,
  deleteEntry,
  composeEntry,
  generateEntryContent,
  generateEntries,
  fetchEntryDetail,
  fetchSuggestedTimes,
  bulkSchedule,
  autoSchedule,
  pollJob,
} from '../services/contentPlan';
import { updatePost, submitPost, schedulePost, publishPost, getMediaUrl } from '../services/api';
import {
  MdAdd,
  MdAutoAwesome,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDelete,
  MdEdit,
  MdCheckCircle,
  MdImage,
  MdPlayCircle,
  MdMoreVert,
  MdSearch,
  MdSend,
  MdThumbUp,
  MdThumbDown,
  MdCalendarMonth,
  MdViewList,
  MdBrush,
  MdSmartToy,
  MdSave,
  MdRateReview,
  MdVisibility,
  MdSchedule,
  MdRocketLaunch,
  MdAccessTime,
  MdStar,
  MdDateRange,
  MdBolt,
  MdArrowForward,
  MdInventory,
} from 'react-icons/md';
import ContentSourceModal from '../components/compose/ContentSourceModal';
import '../styles/content-calendar.css';

// Backend-supported platforms with correct IDs
const PLAN_PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'x', name: 'X (Twitter)' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'viber', name: 'Viber' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'snapchat', name: 'Snapchat' },
];

const TONE_OPTIONS = [
  { value: 'adventurous', label: 'Adventurous' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgency', label: 'Urgency' },
];

const GOAL_OPTIONS = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'followers', label: 'Followers' },
];

const POST_TYPE_OPTIONS = [
  { value: 'reel', label: 'Reel' },
  { value: 'image', label: 'Image' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'cinematic_video', label: 'Cinematic Video' },
  { value: 'story', label: 'Story' },
  { value: 'text', label: 'Text' },
];

const LANGUAGE_OPTIONS = [
  'english', 'arabic', 'hindi', 'french', 'spanish', 'german',
  'portuguese', 'chinese', 'japanese', 'korean', 'russian', 'turkish',
];

// Map backend platform ID to PLATFORMS util for icon/color lookup
function getPlanPlatformUI(id) {
  // 'x' in backend maps to 'twitter' in our PLATFORMS util
  const mappedId = id === 'x' ? 'twitter' : id;
  return PLATFORMS.find((p) => p.id === mappedId) || { name: id, color: '#6b7280' };
}

const CONTENT_TYPE_LABELS = {
  PRODUCT_PROMOTION: 'Promotion',
  FESTIVAL_GREETING: 'Festival',
  ENGAGEMENT: 'Engagement',
  OFFER_HIGHLIGHT: 'Offer',
  BRAND_AWARENESS: 'Brand',
  CUSTOM: 'Custom',
};

const STATUS_MAP = {
  SUGGESTED: { label: 'Suggested', cls: 'draft' },
  DRAFT: { label: 'Draft', cls: 'draft' },
  APPROVED: { label: 'Approved', cls: 'active' },
  COMPOSING: { label: 'Composing', cls: 'paused' },
  READY: { label: 'Ready', cls: 'completed' },
  REJECTED: { label: 'Rejected', cls: 'paused' },
  PUBLISHED: { label: 'Published', cls: 'completed' },
  PENDING_REVIEW: { label: 'In Review', cls: 'paused' },
  SCHEDULED: { label: 'Scheduled', cls: 'completed' },
  SKIPPED: { label: 'Skipped', cls: 'draft' },
};

function getPlatformMeta(id) {
  const mappedId = id === 'x' ? 'twitter' : id;
  return PLATFORMS.find((p) => p.id === mappedId) || { name: id, color: '#6b7280' };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

// ─── Main Component ───────────────────────────────────────

export default function ContentCalendar() {
  // View state
  const [view, setView] = useState('plans'); // 'plans' | 'calendar'
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showAIFillModal, setShowAIFillModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [composingEntry, setComposingEntry] = useState(null); // entry being composed into a post
  const [sourcePickerEntry, setSourcePickerEntry] = useState(null); // entry for content source selection
  const [scheduleEntry, setScheduleEntry] = useState(null); // entry opened in schedule panel
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);

  // Data
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);

  // Filters
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Active menu
  const [activeMenu, setActiveMenu] = useState(null);

  // ─── Load plans on mount ────────────────────────────────
  useEffect(() => {
    loadPlans();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  async function loadPlans() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPlans();
      setPlans(Array.isArray(res) ? res : res.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlanEntries(plan) {
    setActivePlan(plan);
    setView('calendar');
    setLoading(true);
    setError('');
    setSelectedEntries([]);
    try {
      const res = await fetchPlan(plan.id);
      const p = res.plan || res;
      setActivePlan(p);
      setCalendarEntries(p.entries || p.calendar_entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarRange(startDate, endDate) {
    setLoading(true);
    try {
      const res = await fetchCalendar({
        start_date: startDate,
        end_date: endDate,
        platform: platformFilter || undefined,
        status: statusFilter || undefined,
      });
      setCalendarEntries(Array.isArray(res) ? res : res.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Actions ────────────────────────────────────────────

  async function handleDeletePlan(planId) {
    if (!confirm('Delete this content plan?')) return;
    try {
      await deletePlan(planId);
      showToast('Plan deleted');
      loadPlans();
      if (activePlan?.id === planId) {
        setActivePlan(null);
        setView('plans');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePlanAction(planId, action) {
    setActiveMenu(null);
    try {
      if (action === 'submit') await submitPlanForReview(planId);
      else if (action === 'approve') await approvePlan(planId);
      else if (action === 'reject') await rejectPlan(planId);
      showToast(`Plan ${action}ed successfully`);
      loadPlans();
      if (activePlan?.id === planId) loadPlanEntries(activePlan);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteEntry(entryId) {
    try {
      await deleteEntry(entryId);
      showToast('Entry removed');
      setCalendarEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEntryAction(entryId, status) {
    try {
      await updateEntry(entryId, { status });
      showToast(`Entry ${status === 'APPROVED' ? 'approved' : 'skipped'}`);
      if (activePlan) loadPlanEntries(activePlan);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBulkAction(status) {
    if (!selectedEntries.length) return;
    try {
      await Promise.all(selectedEntries.map((id) => updateEntry(id, { status })));
      showToast(`${selectedEntries.length} entries ${status === 'APPROVED' ? 'approved' : 'skipped'}`);
      setSelectedEntries([]);
      if (activePlan) loadPlanEntries(activePlan);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleEntrySelect(id) {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleComposeEntry(entry) {
    // Entries already composing have a post — go straight to the editor
    if (entry.status === 'COMPOSING' && entry.post) {
      setComposingEntry(entry);
    } else {
      // Fresh compose — let user pick content source first
      setSourcePickerEntry(entry);
    }
  }

  // ─── Filtering ──────────────────────────────────────────

  function filteredEntries() {
    return calendarEntries.filter((e) => {
      if (platformFilter && e.platform !== platformFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }

  // ─── Render ─────────────────────────────────────────────

  const entries = filteredEntries();
  const groupedByDate = entries.reduce((acc, entry) => {
    const d = entry.date || entry.scheduled_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="cc">
      {/* Header */}
      <div className="page-header">
        <div className="cc__header-row">
          <div>
            <h2>Content Calendar</h2>
            <p>AI-powered content planning across all your platforms.</p>
          </div>
          <div className="cc__header-actions">
            {view === 'calendar' && activePlan && (
              <button className="btn btn--outline btn--sm" onClick={() => { setView('plans'); setActivePlan(null); }}>
                <MdChevronLeft /> All Plans
              </button>
            )}
            <button className="btn btn--primary" onClick={() => { setShowGenerateModal(true); setProducts([]); }}>
              <MdAutoAwesome /> Generate Plan
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="cc__alert cc__alert--error">
          {error}
          <button onClick={() => setError('')}><MdClose /></button>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="cc__toast">{toast}</div>}

      {/* ─── Plans List View ─────────────────────────────── */}
      {view === 'plans' && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Content Plans</h3>
            <span className="cc__count">{plans.length} plans</span>
          </div>

          {loading ? (
            <div className="cc__loader">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><MdCalendarMonth /></div>
              <h3>No content plans yet</h3>
              <p>Generate your first AI-powered content plan to get started.</p>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowGenerateModal(true)}>
                <MdAutoAwesome /> Generate Plan
              </button>
            </div>
          ) : (
            <div className="cc__plan-grid">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onOpen={() => loadPlanEntries(plan)}
                  onDelete={() => handleDeletePlan(plan.id)}
                  onAction={(action) => handlePlanAction(plan.id, action)}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Calendar / Entries View ─────────────────────── */}
      {view === 'calendar' && activePlan && (
        <>
          {/* Plan Summary Bar */}
          <div className="cc__plan-bar">
            <div className="cc__plan-bar-left">
              <h3 className="cc__plan-bar-title">{activePlan.name}</h3>
              <div className="cc__plan-bar-meta">
                <span className="cc__plan-bar-dates">{formatDate(activePlan.start_date)} — {formatDate(activePlan.end_date)}</span>
                {activePlan.status && (
                  <span className={`badge badge--${STATUS_MAP[activePlan.status]?.cls || 'draft'}`}>
                    {STATUS_MAP[activePlan.status]?.label || activePlan.status}
                  </span>
                )}
                {activePlan.language && (
                  <span className="cc__pill">{activePlan.language.charAt(0).toUpperCase() + activePlan.language.slice(1)}</span>
                )}
              </div>
            </div>
            <div className="cc__plan-bar-actions">
              <button className="btn btn--outline btn--sm" onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}>
                <MdAdd /> Add Entry
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => { setShowAIFillModal(true); setProducts([]); }}>
                <MdAutoAwesome /> AI Fill
              </button>
            </div>
          </div>

          {/* Toolbar: Filters + Bulk */}
          <div className="cc__toolbar">
            <div className="cc__filters">
              <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                <option value="">All Platforms</option>
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            {selectedEntries.length > 0 && (() => {
              const selectedReadyEntries = entries.filter(
                (e) => selectedEntries.includes(e.id) && e.status === 'READY'
              );
              return (
                <div className="cc__bulk-bar">
                  <span className="cc__bulk-count">{selectedEntries.length} selected</span>
                  <button className="btn btn--sm cc__bulk-approve" onClick={() => handleBulkAction('APPROVED')}>
                    <MdThumbUp /> Approve
                  </button>
                  <button className="btn btn--sm cc__bulk-skip" onClick={() => handleBulkAction('SKIPPED')}>
                    Skip
                  </button>
                  {selectedReadyEntries.length > 0 && (
                    <>
                      <button className="btn btn--sm cc__bulk-schedule" onClick={() => setShowBulkScheduleModal(true)}>
                        <MdDateRange /> Bulk Schedule
                      </button>
                      <button className="btn btn--sm cc__bulk-auto" onClick={async () => {
                        const postIds = selectedReadyEntries
                          .map((e) => e.post?.id || e.post_id)
                          .filter(Boolean);
                        if (postIds.length === 0) { setError('No posts linked to selected entries'); return; }
                        try {
                          await autoSchedule(postIds);
                          showToast(`${postIds.length} posts auto-scheduled!`);
                          setSelectedEntries([]);
                          if (activePlan) loadPlanEntries(activePlan);
                        } catch (err) { setError(err.message); }
                      }}>
                        <MdBolt /> Auto-Schedule
                      </button>
                    </>
                  )}
                  <button className="cc__bulk-clear" onClick={() => setSelectedEntries([])}>
                    <MdClose />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Entries Table */}
          {loading ? (
            <div className="cc__loader">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state__icon"><MdViewList /></div>
                <h3>No entries found</h3>
                <p>Try adjusting your filters or add a manual entry.</p>
              </div>
            </div>
          ) : (
            <div className="cc__table-wrap">
              <table className="cc__table">
                <thead>
                  <tr>
                    <th className="cc__th-check">
                      <input
                        type="checkbox"
                        checked={selectedEntries.length === entries.length && entries.length > 0}
                        onChange={() => {
                          if (selectedEntries.length === entries.length) setSelectedEntries([]);
                          else setSelectedEntries(entries.map((e) => e.id));
                        }}
                      />
                    </th>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Format</th>
                    <th>Platform</th>
                    <th>Assets</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((date) =>
                    groupedByDate[date].map((entry, idx) => {
                      const platform = getPlatformMeta(entry.platform);
                      const PlatformIcon = platform.icon || null;
                      const st = STATUS_MAP[entry.status] || STATUS_MAP.DRAFT;
                      const isSelected = selectedEntries.includes(entry.id);

                      return (
                        <tr key={entry.id} className={isSelected ? 'cc__tr--selected' : ''}>
                          <td className="cc__td-check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEntrySelect(entry.id)}
                            />
                          </td>
                          <td className="cc__td-date">
                            {idx === 0 ? (
                              <div className="cc__date-badge">
                                <span className="cc__date-day">{new Date(date + 'T00:00:00').getDate()}</span>
                                <span className="cc__date-wk">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              </div>
                            ) : null}
                          </td>
                          <td className="cc__td-title">{entry.title}</td>
                          <td className="cc__td-desc">{entry.description}</td>
                          <td><span className="cc__tag">{CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type || '—'}</span></td>
                          <td>
                            {entry.post_type ? (
                              <span className="cc__tag">{(POST_TYPE_OPTIONS.find((o) => o.value === entry.post_type) || {}).label || entry.post_type.replace('_', ' ')}</span>
                            ) : '—'}
                          </td>
                          <td>
                            <span className="cc__platform-chip" style={{ '--p-color': platform.color }}>
                              {PlatformIcon && <PlatformIcon />}
                              {platform.name}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const assets = entry.media_urls || entry.assets || [];
                              return assets.length > 0 ? (
                                <div className="cc__assets">
                                  {assets.slice(0, 3).map((url, i) => {
                                    const isVideo = url.match(/\.(mp4|mov|webm)/i);
                                    return (
                                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cc__asset-thumb">
                                        {isVideo ? (
                                          <MdPlayCircle />
                                        ) : (
                                          <img src={url} alt="" className="cc__asset-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        )}
                                        <span className="cc__asset-fallback" style={{ display: 'none' }}><MdImage /></span>
                                      </a>
                                    );
                                  })}
                                  {assets.length > 3 && <span className="cc__asset-more">+{assets.length - 3}</span>}
                                </div>
                              ) : (
                                <span className="cc__no-assets">—</span>
                              );
                            })()}
                          </td>
                          <td><span className={`badge badge--${st.cls}`}>{st.label}</span></td>
                          <td className="cc__td-actions">
                            {entry.status === 'SUGGESTED' && (
                              <>
                                <button className="cc__act cc__act--approve" onClick={() => handleEntryAction(entry.id, 'APPROVED')} title="Approve"><MdThumbUp /></button>
                                <button className="cc__act cc__act--skip" onClick={() => handleEntryAction(entry.id, 'SKIPPED')} title="Skip"><MdThumbDown /></button>
                                <button className="cc__act" onClick={() => { setEditingEntry(entry); setShowEntryModal(true); }} title="Edit"><MdEdit /></button>
                                <button className="cc__act cc__act--danger" onClick={() => handleDeleteEntry(entry.id)} title="Delete"><MdDelete /></button>
                              </>
                            )}
                            {entry.status === 'APPROVED' && (
                              <>
                                <button className="cc__compose-btn" onClick={() => handleComposeEntry(entry)}><MdBrush /> Compose</button>
                                <button className="cc__act" onClick={() => { setEditingEntry(entry); setShowEntryModal(true); }} title="Edit"><MdEdit /></button>
                              </>
                            )}
                            {entry.status === 'COMPOSING' && (
                              <button className="cc__compose-btn cc__compose-btn--outline" onClick={() => handleComposeEntry(entry)}><MdEdit /> Edit Draft</button>
                            )}
                            {entry.status === 'READY' && (
                              <button className="cc__compose-btn" onClick={() => setScheduleEntry(entry)}>
                                <MdSchedule /> Schedule
                              </button>
                            )}
                            {['SCHEDULED', 'PUBLISHED'].includes(entry.status) && (
                              <span className="cc__finalized"><MdCheckCircle /> {st.label}</span>
                            )}
                            {entry.status === 'SKIPPED' && (
                              <>
                                <button className="cc__act" onClick={() => handleEntryAction(entry.id, 'SUGGESTED')} title="Restore"><MdEdit /></button>
                                <button className="cc__act cc__act--danger" onClick={() => handleDeleteEntry(entry.id)} title="Delete"><MdDelete /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── Generate Plan Modal ─────────────────────────── */}
      {showGenerateModal && (
        <GeneratePlanModal
          onClose={() => setShowGenerateModal(false)}
          onGenerated={(plan) => {
            setShowGenerateModal(false);
            showToast('Plan generated successfully!');
            loadPlans();
            loadPlanEntries(plan);
          }}
          products={products}
          setProducts={setProducts}
          generating={generating}
          setGenerating={setGenerating}
        />
      )}

      {/* ─── AI Fill Modal ────────────────────────────────── */}
      {showAIFillModal && activePlan && (
        <AIFillModal
          plan={activePlan}
          onClose={() => setShowAIFillModal(false)}
          onFilled={(res) => {
            setShowAIFillModal(false);
            const count = res.entries_added ?? 0;
            showToast(`AI filled ${count} entries!`);
            loadPlanEntries(activePlan);
          }}
          products={products}
          setProducts={setProducts}
        />
      )}

      {/* ─── Add / Edit Entry Modal ──────────────────────── */}
      {showEntryModal && activePlan && (
        <EntryModal
          entry={editingEntry}
          planId={activePlan.id}
          startDate={activePlan.start_date}
          endDate={activePlan.end_date}
          onClose={() => { setShowEntryModal(false); setEditingEntry(null); }}
          onSaved={() => {
            setShowEntryModal(false);
            setEditingEntry(null);
            showToast(editingEntry ? 'Entry updated' : 'Entry created');
            loadPlanEntries(activePlan);
          }}
        />
      )}

      {/* ─── Content Source Picker Modal ─────────────────────── */}
      {sourcePickerEntry && (
        <ContentSourceModal
          entry={sourcePickerEntry}
          onClose={() => setSourcePickerEntry(null)}
          onComposed={({ post, entry: updatedEntry }) => {
            setSourcePickerEntry(null);
            // Open PostComposer with the newly composed entry
            setComposingEntry({
              ...sourcePickerEntry,
              ...updatedEntry,
              status: 'COMPOSING',
              post,
            });
            showToast('Post created — now edit your content');
            if (activePlan) loadPlanEntries(activePlan);
          }}
        />
      )}

      {/* ─── Post Composer Modal ────────────────────────────── */}
      {composingEntry && (
        <PostComposer
          entry={composingEntry}
          onClose={() => setComposingEntry(null)}
          onDone={(msg) => {
            setComposingEntry(null);
            showToast(msg || 'Post updated');
            if (activePlan) loadPlanEntries(activePlan);
          }}
        />
      )}

      {/* ─── Schedule Panel (Slide-in) ─────────────────────── */}
      {scheduleEntry && (
        <SchedulePanel
          entry={scheduleEntry}
          onClose={() => setScheduleEntry(null)}
          onScheduled={(msg) => {
            setScheduleEntry(null);
            showToast(msg || 'Post scheduled!');
            if (activePlan) loadPlanEntries(activePlan);
          }}
        />
      )}

      {/* ─── Bulk Schedule Modal ───────────────────────────── */}
      {showBulkScheduleModal && (
        <BulkScheduleModal
          entries={entries.filter((e) => selectedEntries.includes(e.id) && e.status === 'READY')}
          onClose={() => setShowBulkScheduleModal(false)}
          onScheduled={(msg) => {
            setShowBulkScheduleModal(false);
            setSelectedEntries([]);
            showToast(msg || 'Posts scheduled!');
            if (activePlan) loadPlanEntries(activePlan);
          }}
        />
      )}
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────

function PlanCard({ plan, onOpen, onDelete, onAction, activeMenu, setActiveMenu }) {
  const st = STATUS_MAP[plan.status] || STATUS_MAP.DRAFT;
  const platforms = plan.platforms || [];
  const entryCount = plan.entry_count || plan.entries?.length || 0;
  const isMenuOpen = activeMenu === plan.id;

  return (
    <div className="cc__plan-card" onClick={onOpen}>
      <div className="cc__plan-card-top">
        <span className={`badge badge--${st.cls}`}>{st.label}</span>
        <button
          className="cc__menu-btn"
          onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : plan.id); }}
        >
          <MdMoreVert />
        </button>
        {isMenuOpen && (
          <div className="cc__menu-dropdown" onClick={(e) => e.stopPropagation()}>
            {plan.status === 'DRAFT' && (
              <button onClick={() => onAction('submit')}><MdSend /> Submit for Review</button>
            )}
            {plan.status === 'PENDING_REVIEW' && (
              <>
                <button onClick={() => onAction('approve')}><MdThumbUp /> Approve</button>
                <button onClick={() => onAction('reject')}><MdThumbDown /> Reject</button>
              </>
            )}
            <button className="cc__menu-danger" onClick={onDelete}><MdDelete /> Delete</button>
          </div>
        )}
      </div>
      <h4 className="cc__plan-card-title">{plan.name}</h4>
      <p className="cc__plan-card-dates">
        {formatDate(plan.start_date)} — {formatDate(plan.end_date)}
      </p>
      {plan.language && (
        <p className="cc__plan-card-meta" style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Language: {plan.language.charAt(0).toUpperCase() + plan.language.slice(1)}
        </p>
      )}
      {plan.post_types && plan.post_types.length > 0 && (
        <p className="cc__plan-card-meta" style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          {plan.post_types.length >= 6
            ? 'All Formats'
            : plan.post_types.map((t) => {
                const opt = POST_TYPE_OPTIONS.find((o) => o.value === t);
                return opt ? opt.label : t.replace('_', ' ');
              }).join(', ')}
        </p>
      )}
      <div className="cc__plan-card-footer">
        <div className="cc__plan-card-platforms">
          {platforms.map((pid) => {
            const p = getPlatformMeta(pid);
            const Icon = p.icon;
            return Icon ? <Icon key={pid} style={{ color: p.color }} title={p.name} /> : null;
          })}
        </div>
        <span className="cc__plan-card-count">{entryCount} entries</span>
      </div>
    </div>
  );
}

// ─── Generate Plan Modal ───────────────────────────────────

function GeneratePlanModal({ onClose, onGenerated, products, setProducts, generating, setGenerating }) {
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    platforms: [],
    product_ids: [],
    include_festivals: true,
    include_engagement: true,
    posts_per_day: 1,
    tone: 'adventurous',
    primary_goal: 'bookings',
    target_audience: 'tourists and residents in UAE aged 20-45',
    region: 'UAE',
    special_notes: '',
    language: 'english',
    post_types: [],
  });
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState(null); // { completed, total }

  async function searchProducts(q) {
    setLoadingProducts(true);
    try {
      const res = await fetchProducts({ search: q || undefined });
      setProducts(Array.isArray(res) ? res : res.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    searchProducts('');
  }, []);

  useEffect(() => {
    if (!productSearch) return;
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  function togglePlatform(id) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id) ? f.platforms.filter((p) => p !== id) : [...f.platforms, id],
    }));
  }

  function toggleProduct(id) {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter((p) => p !== id) : [...f.product_ids, id],
    }));
  }

  function togglePostType(value) {
    setForm((f) => ({
      ...f,
      post_types: f.post_types.includes(value) ? f.post_types.filter((t) => t !== value) : [...f.post_types, value],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date || form.platforms.length === 0) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormError('');
    setGenerating(true);
    setProgress(null);
    try {
      const payload = { ...form };
      if (payload.post_types.length === 0) delete payload.post_types;
      const res = await generatePlan(payload);
      // Async job pattern: backend returns { job_id, status: "PROCESSING" }
      if (res.job_id) {
        const completed = await pollJob(res.job_id, {
          onProgress: (job) => {
            if (job.progress) setProgress(job.progress);
          },
        });
        const plan = completed.result?.plan || completed.result;
        onGenerated(plan);
      } else {
        // Fallback: direct response (old behavior)
        onGenerated(res.plan || res);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }

  const pct = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3><MdAutoAwesome /> Generate Content Plan</h3>
          <button onClick={onClose} disabled={generating}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="cc__modal-body">
          {formError && <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>{formError}</div>}

          <div className="cc__form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              placeholder="e.g. April Dubai Campaign"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Start Date *</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="cc__form-group">
              <label>End Date *</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div className="cc__form-group">
              <label>Posts / Day</label>
              <input
                type="number"
                min="1"
                max="5"
                value={form.posts_per_day}
                onChange={(e) => setForm((f) => ({ ...f, posts_per_day: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="cc__form-group">
            <label>Platforms *</label>
            <div className="cc__chip-grid">
              {PLAN_PLATFORMS.map((pp) => {
                const ui = getPlanPlatformUI(pp.id);
                const Icon = ui.icon;
                const selected = form.platforms.includes(pp.id);
                return (
                  <button
                    key={pp.id}
                    type="button"
                    className={`platform-chip${selected ? ' platform-chip--selected' : ''}`}
                    onClick={() => togglePlatform(pp.id)}
                  >
                    {Icon && <Icon className="platform-chip__icon" style={{ color: selected ? ui.color : undefined }} />}
                    {pp.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cc__form-group">
            <label>Products (optional)</label>
            <div className="product-search">
              <MdSearch size={18} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            {loadingProducts && <div className="cc__loader" style={{ padding: 16 }}>Loading products...</div>}
            {!loadingProducts && products.length > 0 && (
              <div className="cc__product-grid">
                {products.slice(0, 6).map((p) => {
                  const isSelected = form.product_ids.includes(p.id);
                  const name = p.name || p.title || 'Untitled';
                  const image = p.image || p.thumbnail || p.images?.[0] || null;
                  const price = p.sale_price || p.price || p.original_price;

                  return (
                    <div
                      key={p.id}
                      className={`product-card${isSelected ? ' product-card--selected' : ''}`}
                      onClick={() => toggleProduct(p.id)}
                    >
                      {image ? (
                        <img className="product-card__img" src={image} alt={name} />
                      ) : (
                        <div className="product-card__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
                          <MdImage />
                        </div>
                      )}
                      <div className="product-card__info">
                        <div className="product-card__name">{name}</div>
                        {p.category && <div className="product-card__meta">{p.category}</div>}
                        {price != null && (
                          <div className="product-card__price">
                            {p.currency || 'AED'} {price}
                          </div>
                        )}
                      </div>
                      <div className="product-card__check">
                        {isSelected && <MdCheckCircle style={{ color: 'var(--primary)', fontSize: 18 }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Tone</label>
              <select value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}>
                {TONE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="cc__form-group">
              <label>Primary Goal</label>
              <select value={form.primary_goal} onChange={(e) => setForm((f) => ({ ...f, primary_goal: e.target.value }))}>
                {GOAL_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Language</label>
              <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cc__form-group">
            <label>Post Types <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(leave empty for all types)</span></label>
            <div className="cc__chip-grid">
              {POST_TYPE_OPTIONS.map((pt) => {
                const selected = form.post_types.includes(pt.value);
                return (
                  <button
                    key={pt.value}
                    type="button"
                    className={`platform-chip${selected ? ' platform-chip--selected' : ''}`}
                    onClick={() => togglePostType(pt.value)}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Target Audience</label>
              <input
                type="text"
                value={form.target_audience}
                onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}
              />
            </div>
            <div className="cc__form-group">
              <label>Region</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </div>
          </div>

          <div className="cc__form-group">
            <label>Special Notes (optional)</label>
            <textarea
              rows="2"
              placeholder="e.g. Focus on desert safari this month"
              value={form.special_notes}
              onChange={(e) => setForm((f) => ({ ...f, special_notes: e.target.value }))}
            />
          </div>

          <div className="cc__form-row">
            <label className="cc__toggle">
              <input
                type="checkbox"
                checked={form.include_festivals}
                onChange={(e) => setForm((f) => ({ ...f, include_festivals: e.target.checked }))}
              />
              <span>Include festival greetings</span>
            </label>
            <label className="cc__toggle">
              <input
                type="checkbox"
                checked={form.include_engagement}
                onChange={(e) => setForm((f) => ({ ...f, include_engagement: e.target.checked }))}
              />
              <span>Include engagement posts</span>
            </label>
          </div>

          {generating && progress && (
            <div className="cc__progress">
              <div className="cc__progress-header">
                <span>Generating entries...</span>
                <span>{progress.completed} / {progress.total} batches</span>
              </div>
              <div className="cc__progress-bar">
                <div className="cc__progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn--primary cc__generate-btn" disabled={generating}>
            {generating ? (
              <>
                <span className="cc__spinner" /> {progress ? `${pct}% complete` : 'Generating...'}
              </>
            ) : (
              <>
                <MdAutoAwesome /> Generate Plan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── AI Fill Modal ──────────────────────────────────────────

function AIFillModal({ plan, onClose, onFilled, products, setProducts }) {
  const [form, setForm] = useState({
    platforms: plan.platforms || [],
    product_ids: [],
    posts_per_day: 1,
    tone: 'adventurous',
    primary_goal: 'bookings',
    skip_existing_dates: true,
    language: plan.language || 'english',
    post_types: plan.post_types || [],
  });
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [filling, setFilling] = useState(false);
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState(null); // { completed, total }

  async function searchProducts(q) {
    setLoadingProducts(true);
    try {
      const res = await fetchProducts({ search: q || undefined });
      setProducts(Array.isArray(res) ? res : res.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    searchProducts('');
  }, []);

  useEffect(() => {
    if (!productSearch) return;
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  function togglePlatform(id) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id) ? f.platforms.filter((p) => p !== id) : [...f.platforms, id],
    }));
  }

  function toggleProduct(id) {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter((p) => p !== id) : [...f.product_ids, id],
    }));
  }

  function togglePostType(value) {
    setForm((f) => ({
      ...f,
      post_types: f.post_types.includes(value) ? f.post_types.filter((t) => t !== value) : [...f.post_types, value],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.platforms.length === 0) {
      setFormError('Please select at least one platform.');
      return;
    }
    setFormError('');
    setFilling(true);
    setProgress(null);
    try {
      const payload = { ...form };
      if (payload.post_types.length === 0) delete payload.post_types;
      const res = await generateEntries(plan.id, payload);
      // Async job pattern
      if (res.job_id) {
        const completed = await pollJob(res.job_id, {
          onProgress: (job) => {
            if (job.progress) setProgress(job.progress);
          },
        });
        const result = completed.result || completed;
        onFilled(result.plan || result);
      } else {
        onFilled(res.plan || res);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFilling(false);
      setProgress(null);
    }
  }

  const pct = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3><MdAutoAwesome /> AI Fill Entries</h3>
          <button onClick={onClose} disabled={filling}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="cc__modal-body">
          {formError && <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>{formError}</div>}

          <div className="cc__form-group">
            <label>Platforms *</label>
            <div className="cc__chip-grid">
              {PLAN_PLATFORMS.map((pp) => {
                const ui = getPlanPlatformUI(pp.id);
                const Icon = ui.icon;
                const selected = form.platforms.includes(pp.id);
                return (
                  <button
                    key={pp.id}
                    type="button"
                    className={`platform-chip${selected ? ' platform-chip--selected' : ''}`}
                    onClick={() => togglePlatform(pp.id)}
                  >
                    {Icon && <Icon className="platform-chip__icon" style={{ color: selected ? ui.color : undefined }} />}
                    {pp.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cc__form-group">
            <label>Products (optional)</label>
            <div className="product-search">
              <MdSearch size={18} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            {loadingProducts && <div className="cc__loader" style={{ padding: 16 }}>Loading products...</div>}
            {!loadingProducts && products.length > 0 && (
              <div className="cc__product-grid">
                {products.slice(0, 6).map((p) => {
                  const isSelected = form.product_ids.includes(p.id);
                  const name = p.name || p.title || 'Untitled';
                  const image = p.image || p.thumbnail || p.images?.[0] || null;
                  const price = p.sale_price || p.price || p.original_price;

                  return (
                    <div
                      key={p.id}
                      className={`product-card${isSelected ? ' product-card--selected' : ''}`}
                      onClick={() => toggleProduct(p.id)}
                    >
                      {image ? (
                        <img className="product-card__img" src={image} alt={name} />
                      ) : (
                        <div className="product-card__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
                          <MdImage />
                        </div>
                      )}
                      <div className="product-card__info">
                        <div className="product-card__name">{name}</div>
                        {p.category && <div className="product-card__meta">{p.category}</div>}
                        {price != null && (
                          <div className="product-card__price">
                            {p.currency || 'AED'} {price}
                          </div>
                        )}
                      </div>
                      <div className="product-card__check">
                        {isSelected && <MdCheckCircle style={{ color: 'var(--primary)', fontSize: 18 }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Tone</label>
              <select value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}>
                {TONE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="cc__form-group">
              <label>Primary Goal</label>
              <select value={form.primary_goal} onChange={(e) => setForm((f) => ({ ...f, primary_goal: e.target.value }))}>
                {GOAL_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="cc__form-group">
              <label>Posts / Day</label>
              <input
                type="number"
                min="1"
                max="5"
                value={form.posts_per_day}
                onChange={(e) => setForm((f) => ({ ...f, posts_per_day: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Language</label>
              <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cc__form-group">
            <label>Post Types <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(leave empty for all types)</span></label>
            <div className="cc__chip-grid">
              {POST_TYPE_OPTIONS.map((pt) => {
                const selected = form.post_types.includes(pt.value);
                return (
                  <button
                    key={pt.value}
                    type="button"
                    className={`platform-chip${selected ? ' platform-chip--selected' : ''}`}
                    onClick={() => togglePostType(pt.value)}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="cc__toggle">
            <input
              type="checkbox"
              checked={form.skip_existing_dates}
              onChange={(e) => setForm((f) => ({ ...f, skip_existing_dates: e.target.checked }))}
            />
            <span>Skip dates with existing entries</span>
          </label>

          {filling && progress && (
            <div className="cc__progress">
              <div className="cc__progress-header">
                <span>Filling entries...</span>
                <span>{progress.completed} / {progress.total} batches</span>
              </div>
              <div className="cc__progress-bar">
                <div className="cc__progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn--primary cc__generate-btn" disabled={filling}>
            {filling ? (
              <>
                <span className="cc__spinner" /> {progress ? `${pct}% complete` : 'Filling with AI...'}
              </>
            ) : (
              <>
                <MdAutoAwesome /> AI Fill Plan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Entry Modal (Add / Edit) ──────────────────────────────

function EntryModal({ entry, planId, startDate, endDate, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: entry?.date || entry?.scheduled_date || '',
    title: entry?.title || '',
    description: entry?.description || '',
    content_type: entry?.content_type || 'CUSTOM',
    platform: entry?.platform || 'instagram',
    media_urls: (entry?.media_urls || entry?.assets || []).join('\n'),
    status: entry?.status || 'DRAFT',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.title || !form.platform) {
      setFormError('Please fill required fields.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = {
      ...form,
      content_plan_id: planId,
      media_urls: form.media_urls.split('\n').map((u) => u.trim()).filter(Boolean),
    };
    try {
      if (entry?.id) {
        await updateEntry(entry.id, payload);
      } else {
        await createEntry(payload);
      }
      onSaved();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal cc__modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3>{entry ? 'Edit Entry' : 'Add Entry'}</h3>
          <button onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className="cc__modal-body">
          {formError && <div className="cc__alert cc__alert--error" style={{ marginBottom: 12 }}>{formError}</div>}

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Date *</label>
              <input type="date" value={form.date} min={startDate} max={endDate} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="cc__form-group">
              <label>Platform *</label>
              <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}>
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="cc__form-group">
            <label>Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="cc__form-group">
            <label>Description</label>
            <textarea rows="3" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="cc__form-row">
            <div className="cc__form-group">
              <label>Content Type</label>
              <select value={form.content_type} onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}>
                {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="cc__form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cc__form-group">
            <label>Media URLs (one per line)</label>
            <textarea rows="2" placeholder="https://..." value={form.media_urls} onChange={(e) => setForm((f) => ({ ...f, media_urls: e.target.value }))} />
          </div>

          <button type="submit" className="btn btn--primary cc__generate-btn" disabled={saving}>
            {saving ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Post Composer Modal ──────────────────────────────────────

function PostComposer({ entry, onClose, onDone }) {
  const [postId, setPostId] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [cta, setCta] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxUrls, setLightboxUrls] = useState([]);

  // On mount: call compose or reuse existing post
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // If entry already has a linked post, reuse it
      if (entry.status === 'COMPOSING' && entry.post) {
        const p = entry.post;
        setPostId(p.id);
        setCaption(p.base_content || '');
        setHashtags((p.hashtags || []).join(', '));
        setCta(p.cta_text || '');
        setMediaUrls(p.media_urls || []);
        return;
      }

      // Call compose — returns 201 with full post (images already processed)
      setLoading(true);
      setError('');
      try {
        const res = await composeEntry(entry.id);
        if (cancelled) return;

        // contentPlan.js request() unwraps data.data, so res = { post, entry }
        const post = res.post || res.data?.post || res;

        console.log('[PostComposer] compose response:', post);

        if (!post?.id) {
          setError('Compose did not return a valid post.');
          return;
        }

        setPostId(post.id);
        setCaption(post.base_content || '');
        setHashtags((post.hashtags || []).join(', '));
        setCta(post.cta_text || '');
        setMediaUrls(post.media_urls || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [entry]);

  async function handleGenerateAI() {
    setGenerating(true);
    setError('');
    try {
      const raw = await generateEntryContent(entry.id);
      const res = raw.data || raw;
      if (res.caption) setCaption(res.caption);
      if (res.hashtags) setHashtags(res.hashtags.join(', '));
      if (res.cta_text) setCta(res.cta_text);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!postId) { setError('No post created yet'); return; }
    setSaving(true);
    setError('');
    try {
      await updatePost(postId, {
        base_content: caption,
        hashtags: hashtags.split(',').map((h) => h.trim()).filter(Boolean),
        cta_text: cta,
        media_urls: mediaUrls,
      });
      onDone('Draft saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!postId) { setError('No post created yet'); return; }
    setSaving(true);
    setError('');
    try {
      // Save first, then submit
      await updatePost(postId, {
        base_content: caption,
        hashtags: hashtags.split(',').map((h) => h.trim()).filter(Boolean),
        cta_text: cta,
        media_urls: mediaUrls,
      });
      await submitPost(postId);
      onDone('Post submitted for review');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const platform = getPlatformMeta(entry.platform);
  const PlatformIcon = platform.icon || null;
  const hashtagList = hashtags.split(',').map((h) => h.trim()).filter(Boolean);

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal cc__modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3><MdBrush /> Post Composer</h3>
          <button onClick={onClose}><MdClose /></button>
        </div>

        <div className="cc__modal-body">
          {error && (
            <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>
              {error}
              <button onClick={() => setError('')}><MdClose /></button>
            </div>
          )}

          {loading ? (
            <div className="pc__loading">
              <span className="cc__spinner cc__spinner--lg" />
              <p className="pc__loading-text">Processing images & generating content...</p>
            </div>
          ) : showPreview ? (
            /* ─── Preview (pure FE — no API call) ─────── */
            <div className="pc__preview">
              <div className="pc__preview-header">
                <h4><MdVisibility /> Post Preview</h4>
                <button className="btn btn--outline btn--sm" onClick={() => setShowPreview(false)}>
                  <MdEdit /> Back to Editor
                </button>
              </div>

              {mediaUrls.length > 0 && (
                <div className="pc__preview-media">
                  {mediaUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Slide ${i + 1}`} className="pc__preview-slide" onClick={() => { setLightboxUrls(mediaUrls); setLightboxIndex(i); }} style={{ cursor: 'pointer' }} />
                  ))}
                </div>
              )}

              <div className="pc__preview-body">
                <div className="pc__preview-platform">
                  {PlatformIcon && <PlatformIcon style={{ color: platform.color }} />}
                  <span>{platform.name}</span>
                  {entry.date && <span className="pc__date">{formatDate(entry.date)}</span>}
                </div>
                {caption && <p className="pc__preview-caption">{caption}</p>}
                {hashtagList.length > 0 && (
                  <p className="pc__preview-hashtags">
                    {hashtagList.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </p>
                )}
                {cta && <div className="pc__preview-cta">{cta}</div>}
              </div>

              <div className="pc__actions">
                <button className="btn btn--outline" onClick={() => setShowPreview(false)}>
                  <MdEdit /> Edit
                </button>
                <button className="btn btn--primary" onClick={handleSubmitForReview} disabled={saving || !caption.trim()}>
                  <MdRateReview /> Submit for Review
                </button>
              </div>
            </div>
          ) : (
            /* ─── Editor ────────────────────────────────── */
            <>
              {/* Entry context bar */}
              <div className="pc__context-bar">
                <div className="pc__context-info">
                  <h4>{entry.title}</h4>
                  <div className="pc__context-meta">
                    <span className="cc__type-tag">{CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type}</span>
                    <div className="platform-pill" style={{ borderColor: platform.color, color: platform.color }}>
                      {PlatformIcon && <PlatformIcon className="platform-pill__icon" />}
                      {platform.name}
                    </div>
                    {entry.post_type && (
                      <span className="cc__type-tag">
                        {(POST_TYPE_OPTIONS.find((o) => o.value === entry.post_type) || {}).label || entry.post_type}
                      </span>
                    )}
                    {entry.date && <span className="pc__date">{formatDate(entry.date)}</span>}
                  </div>
                </div>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={handleGenerateAI}
                  disabled={generating}
                >
                  {generating ? (
                    <><span className="cc__spinner" /> Generating...</>
                  ) : (
                    <><MdSmartToy /> Generate with AI</>
                  )}
                </button>
              </div>

              {entry.description && (
                <p className="pc__entry-desc">{entry.description}</p>
              )}

              {/* Processed images from compose */}
              {mediaUrls.length > 0 && (
                <div className="pc__media-gallery">
                  <label className="pc__media-label">Processed Media</label>
                  <div className="pc__slides-grid">
                    {mediaUrls.map((url, i) => (
                      <div className="pc__slide-card" key={i}>
                        <div className="pc__slide-card-img-wrap">
                          <img src={url} alt={`Slide ${i + 1}`} className="pc__slide-card-img" onClick={() => { setLightboxUrls(mediaUrls); setLightboxIndex(i); }} style={{ cursor: 'pointer' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="cc__form-group">
                <label>Caption / Content</label>
                <textarea
                  rows="5"
                  placeholder="Write your post caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              {/* Hashtags */}
              <div className="cc__form-group">
                <label>Hashtags <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="#RaynaTours, #Dubai, #DesertSafari"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                />
              </div>

              {/* CTA */}
              <div className="cc__form-group">
                <label>Call to Action</label>
                <input
                  type="text"
                  placeholder="e.g. Link in bio to book!"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="pc__actions">
                <button className="btn btn--outline" onClick={handleSave} disabled={saving}>
                  <MdSave /> Save Draft
                </button>
                <button className="btn btn--outline" onClick={() => setShowPreview(true)} disabled={!postId}>
                  <MdVisibility /> Preview
                </button>
                <button className="btn btn--primary" onClick={handleSubmitForReview} disabled={saving || !caption.trim()}>
                  <MdRateReview /> Submit for Review
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Lightbox overlay ─────────────────────────────── */}
      {lightboxIndex !== null && lightboxUrls.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
            <MdClose />
          </button>

          {lightboxUrls.length > 1 && lightboxIndex > 0 && (
            <button className="lightbox-nav lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}>
              <MdChevronLeft />
            </button>
          )}

          <img src={lightboxUrls[lightboxIndex]} alt="Full preview" className="lightbox-img" onClick={(e) => e.stopPropagation()} />

          {lightboxUrls.length > 1 && lightboxIndex < lightboxUrls.length - 1 && (
            <button className="lightbox-nav lightbox-nav--next" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}>
              <MdChevronRight />
            </button>
          )}

          {lightboxUrls.length > 1 && (
            <div className="lightbox-counter">{lightboxIndex + 1} / {lightboxUrls.length}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Schedule Panel (Slide-in) ──────────────────────────────

function SchedulePanel({ entry, onClose, onScheduled }) {
  const [detail, setDetail] = useState(null);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      // Fetch detail and suggested times independently — either can fail
      let detailRes = null;
      let times = [];

      try {
        detailRes = await fetchEntryDetail(entry.id);
      } catch {
        // Entry detail endpoint may not exist yet — use entry/post data we already have
      }

      try {
        const timesRes = await fetchSuggestedTimes({
          date: entry.date || entry.scheduled_date,
          platform: entry.platform,
        });
        const raw = timesRes.times || timesRes.suggested_times || timesRes;
        times = Array.isArray(raw) ? raw : [];
      } catch {
        // Suggested times endpoint may not exist yet — show custom time picker instead
      }

      if (cancelled) return;
      setDetail(detailRes);
      setSuggestedTimes(times);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [entry.id]);

  const post = detail?.post || entry.post || {};
  const postId = post.id || post._id || entry.post_id;
  const product = detail?.product || post.product;
  const media = post.media_urls || entry.media_urls || [];
  const caption = post.base_content || post.caption || entry.description || '';
  const hashtags = post.hashtags || [];
  const cta = post.cta_text || post.cta || '';
  const platform = getPlatformMeta(entry.platform);
  const PlatformIcon = platform.icon || null;

  async function handleScheduleAt(scheduledAt) {
    if (!postId) { setError('No post linked to this entry'); return; }
    setScheduling(true);
    setError('');
    try {
      await schedulePost(postId, scheduledAt);
      onScheduled(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  }

  async function handlePublishNow() {
    if (!postId) { setError('No post linked to this entry'); return; }
    setPublishing(true);
    setError('');
    try {
      await publishPost(postId);
      onScheduled('Published successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleAutoSchedule() {
    if (!postId) { setError('No post linked to this entry'); return; }
    setAutoScheduling(true);
    setError('');
    try {
      await autoSchedule([postId]);
      onScheduled('Auto-scheduled with optimal time!');
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoScheduling(false);
    }
  }

  function handleCustomSchedule() {
    if (!customTime) return;
    const entryDate = entry.date || entry.scheduled_date;
    const scheduledAt = entryDate ? `${entryDate}T${customTime}:00` : customTime;
    handleScheduleAt(scheduledAt);
  }

  function buildScheduledAt(time) {
    const entryDate = entry.date || entry.scheduled_date || new Date().toISOString().split('T')[0];
    return `${entryDate}T${time}:00`;
  }

  const isActioning = scheduling || publishing || autoScheduling;

  return (
    <div className="sp__backdrop" onClick={onClose}>
      <div className="sp__panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sp__header">
          <div className="sp__header-left">
            <MdSchedule className="sp__header-icon" />
            <h3>Schedule Post</h3>
          </div>
          <button className="sp__close" onClick={onClose}><MdClose /></button>
        </div>

        <div className="sp__body">
          {error && (
            <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>
              {error}
              <button onClick={() => setError('')}><MdClose /></button>
            </div>
          )}

          {loading ? (
            <div className="sp__loading">
              <span className="cc__spinner cc__spinner--lg" />
              <p className="pc__loading-text">Loading post details...</p>
            </div>
          ) : (
            <>
              {/* ── Post Preview Section ── */}
              <div className="sp__preview-card">
                {media.length > 0 && (
                  <div className="sp__media-row">
                    {media.slice(0, 4).map((url, i) => (
                      <div key={i} className="sp__media-item" onClick={() => setLightboxIndex(i)}>
                        <img src={getMediaUrl(url)} alt="" className="sp__media-img" />
                        {i === 3 && media.length > 4 && (
                          <div className="sp__media-more">+{media.length - 4}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="sp__preview-meta">
                  <span className="cc__platform-chip" style={{ '--p-color': platform.color }}>
                    {PlatformIcon && <PlatformIcon />} {platform.name}
                  </span>
                  {entry.content_type && (
                    <span className="cc__tag">{CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type}</span>
                  )}
                  {entry.date && (
                    <span className="sp__date-pill">
                      <MdCalendarMonth /> {formatDate(entry.date)}
                    </span>
                  )}
                </div>

                <h4 className="sp__preview-title">{entry.title}</h4>

                {caption && (
                  <p className="sp__preview-caption">{caption}</p>
                )}

                {hashtags.length > 0 && (
                  <p className="sp__preview-hashtags">
                    {hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </p>
                )}

                {cta && (
                  <div className="sp__preview-cta">{cta}</div>
                )}

                {product && (
                  <div className="sp__product-row">
                    {(product.image || product.images?.[0]) && (
                      <img src={getMediaUrl(product.image || product.images[0])} alt="" className="sp__product-img" />
                    )}
                    <div>
                      <strong>{product.name || product.title}</strong>
                      {product.price && (
                        <span className="sp__product-price">{product.currency || 'AED'} {product.sale_price || product.price}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Suggested Times ── */}
              <div className="sp__section">
                <div className="sp__section-header">
                  <MdAccessTime className="sp__section-icon" />
                  <h4>Best Times to Post</h4>
                </div>

                {suggestedTimes.length > 0 ? (
                  <div className="sp__times-list">
                    {suggestedTimes.map((slot, i) => {
                      const time = slot.time || slot.suggested_time;
                      const label = slot.label || slot.reason || slot.description || '';
                      const score = slot.score || slot.engagement_score;
                      return (
                        <button
                          key={i}
                          className="sp__time-slot"
                          onClick={() => handleScheduleAt(buildScheduledAt(time))}
                          disabled={isActioning}
                        >
                          <div className="sp__time-slot-left">
                            {i === 0 && <MdStar className="sp__time-star" />}
                            <div>
                              <span className="sp__time-value">{time}</span>
                              {label && <span className="sp__time-label">{label}</span>}
                            </div>
                          </div>
                          <div className="sp__time-slot-right">
                            {score && (
                              <div className="sp__score-badge" data-score={score >= 90 ? 'high' : score >= 80 ? 'mid' : 'low'}>
                                {score}
                              </div>
                            )}
                            <MdArrowForward className="sp__time-arrow" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="sp__empty-times">No suggested times available. Use auto-schedule or pick a custom time.</p>
                )}

                {/* Custom Time */}
                <button
                  className="sp__custom-toggle"
                  onClick={() => setShowCustom((v) => !v)}
                >
                  <MdDateRange /> {showCustom ? 'Hide' : 'Pick'} custom time
                </button>

                {showCustom && (
                  <div className="sp__custom-row">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="sp__custom-input"
                    />
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={handleCustomSchedule}
                      disabled={!customTime || isActioning}
                    >
                      Schedule
                    </button>
                  </div>
                )}
              </div>

              {/* ── Action Buttons ── */}
              <div className="sp__actions">
                <button
                  className="sp__action-btn sp__action-btn--publish"
                  onClick={handlePublishNow}
                  disabled={isActioning}
                >
                  {publishing ? <span className="cc__spinner" /> : <MdRocketLaunch />}
                  Publish Now
                </button>
                <button
                  className="sp__action-btn sp__action-btn--auto"
                  onClick={handleAutoSchedule}
                  disabled={isActioning}
                >
                  {autoScheduling ? <span className="cc__spinner" /> : <MdBolt />}
                  Auto-Schedule
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && media.length > 0 && (
          <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
            <button className="lightbox-close" onClick={() => setLightboxIndex(null)}><MdClose /></button>
            {media.length > 1 && lightboxIndex > 0 && (
              <button className="lightbox-nav lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}>‹</button>
            )}
            <img src={getMediaUrl(media[lightboxIndex])} alt="" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
            {media.length > 1 && lightboxIndex < media.length - 1 && (
              <button className="lightbox-nav lightbox-nav--next" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}>›</button>
            )}
            {media.length > 1 && (
              <div className="lightbox-counter">{lightboxIndex + 1} / {media.length}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bulk Schedule Modal ────────────────────────────────────

function BulkScheduleModal({ entries, onClose, onScheduled }) {
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [manualTimes, setManualTimes] = useState(() =>
    Object.fromEntries(entries.map((e) => [e.id, '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAutoSchedule() {
    const postIds = entries
      .map((e) => e.post?.id || e.post_id)
      .filter(Boolean);
    if (postIds.length === 0) { setError('No posts linked to selected entries'); return; }
    setLoading(true);
    setError('');
    try {
      await autoSchedule(postIds);
      onScheduled(`${postIds.length} posts auto-scheduled!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkManual() {
    const items = entries
      .map((e) => {
        const postId = e.post?.id || e.post_id;
        const time = manualTimes[e.id];
        if (!postId || !time) return null;
        const entryDate = e.date || e.scheduled_date || new Date().toISOString().split('T')[0];
        return { post_id: postId, scheduled_at: `${entryDate}T${time}:00` };
      })
      .filter(Boolean);
    if (items.length === 0) { setError('Please set times for at least one entry'); return; }
    setLoading(true);
    setError('');
    try {
      await bulkSchedule(items);
      onScheduled(`${items.length} posts scheduled!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal cc__modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3><MdSchedule /> Bulk Schedule — {entries.length} Posts</h3>
          <button onClick={onClose}><MdClose /></button>
        </div>
        <div className="cc__modal-body">
          {error && (
            <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>
              {error}
              <button onClick={() => setError('')}><MdClose /></button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="bs__tabs">
            <button
              className={`bs__tab ${mode === 'auto' ? 'bs__tab--active' : ''}`}
              onClick={() => setMode('auto')}
            >
              <MdBolt /> Auto-Schedule
            </button>
            <button
              className={`bs__tab ${mode === 'manual' ? 'bs__tab--active' : ''}`}
              onClick={() => setMode('manual')}
            >
              <MdDateRange /> Manual Times
            </button>
          </div>

          {mode === 'auto' ? (
            <div className="bs__auto-section">
              <div className="bs__auto-info">
                <div className="bs__auto-icon"><MdBolt /></div>
                <div>
                  <h4>AI-Optimized Scheduling</h4>
                  <p>Our AI will analyze each platform's peak engagement windows and schedule each post at the optimal time for maximum reach.</p>
                </div>
              </div>
              <div className="bs__entries-preview">
                {entries.map((e) => {
                  const p = getPlatformMeta(e.platform);
                  const Icon = p.icon;
                  return (
                    <div key={e.id} className="bs__entry-row">
                      <span className="cc__platform-chip" style={{ '--p-color': p.color }}>
                        {Icon && <Icon />} {p.name}
                      </span>
                      <span className="bs__entry-title">{e.title}</span>
                      <span className="bs__entry-date">{e.date ? formatDate(e.date) : '—'}</span>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn btn--primary cc__generate-btn"
                onClick={handleAutoSchedule}
                disabled={loading}
              >
                {loading ? <><span className="cc__spinner" /> Scheduling...</> : <><MdBolt /> Auto-Schedule All</>}
              </button>
            </div>
          ) : (
            <div className="bs__manual-section">
              <p className="bs__manual-hint">Set a specific time for each post. Times are on the entry's scheduled date.</p>
              <div className="bs__manual-list">
                {entries.map((e) => {
                  const p = getPlatformMeta(e.platform);
                  const Icon = p.icon;
                  return (
                    <div key={e.id} className="bs__manual-row">
                      <div className="bs__manual-info">
                        <span className="cc__platform-chip" style={{ '--p-color': p.color }}>
                          {Icon && <Icon />} {p.name}
                        </span>
                        <span className="bs__entry-title">{e.title}</span>
                        <span className="bs__entry-date">{e.date ? formatDate(e.date) : '—'}</span>
                      </div>
                      <input
                        type="time"
                        value={manualTimes[e.id] || ''}
                        onChange={(ev) => setManualTimes((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        className="bs__time-input"
                      />
                    </div>
                  );
                })}
              </div>
              <button
                className="btn btn--primary cc__generate-btn"
                onClick={handleBulkManual}
                disabled={loading}
              >
                {loading ? <><span className="cc__spinner" /> Scheduling...</> : <><MdSchedule /> Schedule All</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
