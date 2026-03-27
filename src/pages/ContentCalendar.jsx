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
  bulkUpdateEntries,
  generateEntries,
  pollJob,
} from '../services/contentPlan';
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
  MdFilterList,
  MdMoreVert,
  MdSearch,
  MdSend,
  MdThumbUp,
  MdThumbDown,
  MdCalendarMonth,
  MdViewList,
} from 'react-icons/md';
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

  async function handleBulkAction(status) {
    if (!selectedEntries.length) return;
    try {
      await bulkUpdateEntries(selectedEntries, status);
      showToast(`${selectedEntries.length} entries updated`);
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

  function toggleSelectAll() {
    const filtered = filteredEntries();
    if (selectedEntries.length === filtered.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filtered.map((e) => e.id));
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
            <div className="cc__plan-bar-info">
              <h3>{activePlan.name}</h3>
              <span className="cc__plan-bar-dates">
                {formatDate(activePlan.start_date)} — {formatDate(activePlan.end_date)}
              </span>
              {activePlan.status && (
                <span className={`badge badge--${STATUS_MAP[activePlan.status]?.cls || 'draft'}`}>
                  {STATUS_MAP[activePlan.status]?.label || activePlan.status}
                </span>
              )}
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

          {/* Filters + Bulk Actions */}
          <div className="cc__toolbar">
            <div className="cc__filters">
              <MdFilterList className="cc__filter-icon" />
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
            {selectedEntries.length > 0 && (
              <div className="cc__bulk-actions">
                <span>{selectedEntries.length} selected</span>
                <button className="btn btn--sm btn--outline" onClick={() => handleBulkAction('APPROVED')}>
                  <MdThumbUp /> Approve
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => handleBulkAction('SKIPPED')}>
                  Skip
                </button>
              </div>
            )}
          </div>

          {/* Calendar Table */}
          {loading ? (
            <div className="cc__loader">Loading calendar...</div>
          ) : entries.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state__icon"><MdViewList /></div>
                <h3>No entries found</h3>
                <p>Try adjusting your filters or add a manual entry.</p>
              </div>
            </div>
          ) : (
            <div className="card cc__table-card">
              <div className="table-wrapper">
                <table className="table cc__table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedEntries.length === entries.length && entries.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Date</th>
                      <th>Title / Theme</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Platform</th>
                      <th>Assets</th>
                      <th>Status</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDates.map((date) =>
                      groupedByDate[date].map((entry, idx) => {
                        const platform = getPlatformMeta(entry.platform);
                        const PlatformIcon = platform.icon || null;
                        const st = STATUS_MAP[entry.status] || STATUS_MAP.DRAFT;
                        const assets = entry.media_urls || entry.assets || [];

                        return (
                          <tr key={entry.id} className={selectedEntries.includes(entry.id) ? 'cc__row--selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedEntries.includes(entry.id)}
                                onChange={() => toggleEntrySelect(entry.id)}
                              />
                            </td>
                            <td className="cc__date-cell">
                              {idx === 0 && (
                                <div className="cc__date-badge">
                                  <span className="cc__date-day">{new Date(date + 'T00:00:00').getDate()}</span>
                                  <span className="cc__date-month">
                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="cc__entry-title">{entry.title}</div>
                            </td>
                            <td>
                              <div className="cc__entry-desc">{entry.description}</div>
                            </td>
                            <td>
                              <span className="cc__type-tag">
                                {CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type || '—'}
                              </span>
                            </td>
                            <td>
                              <div className="platform-pill" style={{ borderColor: platform.color, color: platform.color }}>
                                {PlatformIcon && <PlatformIcon className="platform-pill__icon" />}
                                {platform.name}
                              </div>
                            </td>
                            <td>
                              {assets.length > 0 ? (
                                <div className="cc__assets">
                                  {assets.slice(0, 3).map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cc__asset-thumb">
                                      {url.match(/\.(mp4|mov|webm)/i) ? <MdPlayCircle /> : <MdImage />}
                                    </a>
                                  ))}
                                  {assets.length > 3 && <span className="cc__asset-more">+{assets.length - 3}</span>}
                                </div>
                              ) : (
                                <span className="cc__no-assets">—</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge badge--${st.cls}`}>{st.label}</span>
                            </td>
                            <td>
                              <div className="cc__row-actions">
                                <button
                                  title="Edit"
                                  onClick={() => { setEditingEntry(entry); setShowEntryModal(true); }}
                                >
                                  <MdEdit />
                                </button>
                                <button title="Delete" onClick={() => handleDeleteEntry(entry.id)}>
                                  <MdDelete />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
      const res = await generatePlan(form);
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
      const res = await generateEntries(plan.id, form);
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
