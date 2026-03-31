import { useState, useEffect, useCallback } from 'react';
import { PLATFORMS } from '../utils/platforms';
import { fetchCalendar, createEntry, fetchPlans, quickCreatePlan } from '../services/contentPlan';
import {
  MdAdd,
  MdArrowBack,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdImage,
  MdPlayCircle,
  MdFilterList,
  MdAutoAwesome,
  MdCalendarMonth,
  MdEdit,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../styles/pages.css';
import '../styles/calendar-view.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CONTENT_TYPE_LABELS = {
  PRODUCT_PROMOTION: 'Promotion',
  FESTIVAL_GREETING: 'Festival',
  ENGAGEMENT: 'Engagement',
  OFFER_HIGHLIGHT: 'Offer',
  BRAND_AWARENESS: 'Brand',
  CUSTOM: 'Custom',
};

function getPlatformMeta(id) {
  const mappedId = id === 'x' ? 'twitter' : id;
  return PLATFORMS.find((p) => p.id === mappedId) || { name: id, color: '#6b7280' };
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, current: false });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true });
  }

  // Next month padding — only fill to complete the last row (multiple of 7)
  const remainder = days.length % 7;
  if (remainder > 0) {
    const fill = 7 - remainder;
    for (let i = 1; i <= fill; i++) {
      days.push({ day: i, current: false });
    }
  }

  return days;
}

function toISODate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [openDate, setOpenDate] = useState(null);

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getMonthDays(year, month);
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = toISODate(year, month, 1);
      const endDate = toISODate(year, month, new Date(year, month + 1, 0).getDate());
      const res = await fetchCalendar({
        start_date: startDate,
        end_date: endDate,
        platform: platformFilter || undefined,
        status: 'READY,SCHEDULED,PUBLISHED',
      });
      setEntries(Array.isArray(res) ? res : res.entries || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, platformFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(null);
  }

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const d = entry.date || entry.scheduled_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(entry);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="cal__header-row">
          <div>
            <h2>Content Calendar</h2>
            <p>Finalized posts scheduled across all platforms.</p>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/content-calendar')}>
            Open Planner
          </button>
        </div>
      </div>

      <div className="card cal__card">
        {/* Toolbar */}
        <div className="cal__toolbar">
          <div className="cal__nav">
            <button className="cal__nav-btn" onClick={prevMonth}><MdChevronLeft /></button>
            <h3 className="cal__month-title">{monthName}</h3>
            <button className="cal__nav-btn" onClick={nextMonth}><MdChevronRight /></button>
            <button className="btn btn--outline btn--sm" onClick={goToday}>Today</button>
          </div>
          <div className="cal__filter">
            <MdFilterList />
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="cal__grid">
          {/* Weekday headers */}
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal__weekday">{d}</div>
          ))}

          {/* Day cells */}
          {days.map((cell, idx) => {
            const dateISO = cell.current ? toISODate(year, month, cell.day) : null;
            const dayEntries = dateISO ? (entriesByDate[dateISO] || []) : [];
            const isToday = dateISO === todayISO;
            const isSelected = dateISO === selectedDate;

            return (
              <div
                key={idx}
                className={`cal__cell${!cell.current ? ' cal__cell--muted' : ''}${isToday ? ' cal__cell--today' : ''}${isSelected ? ' cal__cell--selected' : ''}${dayEntries.length > 0 ? ' cal__cell--has-entries' : ''}`}
                onClick={() => cell.current && setSelectedDate(isSelected ? null : dateISO)}
                onDoubleClick={() => cell.current && setOpenDate(dateISO)}
              >
                <span className={`cal__day-num${isToday ? ' cal__day-num--today' : ''}`}>
                  {cell.day}
                </span>
                {dayEntries.length > 0 && (
                  <div className="cal__cell-dots">
                    {dayEntries.slice(0, 3).map((entry, i) => {
                      const p = getPlatformMeta(entry.platform);
                      return <span key={i} className="cal__dot" style={{ background: p.color }} title={entry.title} />;
                    })}
                    {dayEntries.length > 3 && <span className="cal__dot-more">+{dayEntries.length - 3}</span>}
                  </div>
                )}
                {dayEntries.length > 0 && (
                  <div className="cal__cell-preview">
                    {dayEntries.slice(0, 2).map((entry, i) => {
                      const p = getPlatformMeta(entry.platform);
                      return (
                        <div key={i} className="cal__cell-tag" style={{ borderLeftColor: p.color }}>
                          {entry.title?.slice(0, 18)}{entry.title?.length > 18 ? '...' : ''}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {loading && <div className="cal__loading">Loading...</div>}
      </div>

      {/* Day Detail Modal — opens on double-click */}
      {openDate && (
        <DayDetailModal
          date={openDate}
          entries={entriesByDate[openDate] || []}
          onClose={() => setOpenDate(null)}
          onEntryCreated={() => { loadEntries(); }}
          onCreatePost={() => navigate('/create')}
        />
      )}
    </div>
  );
}

// ─── Day Detail Modal ──────────────────────────────────────

function DayDetailModal({ date, entries, onClose, onEntryCreated, onCreatePost }) {
  const [showForm, setShowForm] = useState(false);
  const d = new Date(date + 'T00:00:00');
  const dayNum = d.getDate();
  const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="cal__overlay" onClick={onClose}>
      <div className="cal__modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cal__modal-header">
          <div className="cal__modal-date">
            {showForm ? (
              <button className="cal__modal-back" onClick={() => setShowForm(false)}>
                <MdArrowBack />
              </button>
            ) : (
              <span className="cal__modal-day">{dayNum}</span>
            )}
            <div>
              <h3 className="cal__modal-title">{showForm ? 'Add Entry' : fullDate}</h3>
              <p className="cal__modal-subtitle">
                {showForm
                  ? fullDate
                  : entries.length > 0
                    ? `${entries.length} ${entries.length === 1 ? 'post' : 'posts'} scheduled`
                    : 'No posts scheduled'}
              </p>
            </div>
          </div>
          <div className="cal__modal-header-actions">
            {!showForm && (
              <>
                <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
                  <MdAdd /> Add Entry
                </button>
                <button className="btn btn--outline btn--sm" onClick={onCreatePost}>
                  <MdEdit /> Create Post
                </button>
              </>
            )}
            <button className="cal__modal-close" onClick={onClose}><MdClose /></button>
          </div>
        </div>

        {/* Body */}
        <div className="cal__modal-body">
          {showForm ? (
            <AddEntryForm
              date={date}
              onSaved={() => {
                setShowForm(false);
                if (onEntryCreated) onEntryCreated();
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : entries.length === 0 ? (
            <div className="cal__modal-empty">
              <MdCalendarMonth />
              <h4>Nothing scheduled</h4>
              <p>No content has been planned for this day yet.</p>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                <MdAdd /> Add Entry
              </button>
            </div>
          ) : (
            <div className="cal__modal-list">
              {entries.map((entry) => {
                const platform = getPlatformMeta(entry.platform);
                const PlatformIcon = platform.icon || null;
                const assets = entry.media_urls || entry.assets || [];
                const contentType = CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type;

                const linkedPost = entry.post || null;
                const postAssets = linkedPost?.media_urls || assets;
                const statusLabel = entry.status === 'READY' ? 'Ready' : entry.status === 'SCHEDULED' ? 'Scheduled' : entry.status === 'PUBLISHED' ? 'Published' : entry.status;
                const statusCls = entry.status === 'PUBLISHED' ? 'completed' : entry.status === 'READY' || entry.status === 'SCHEDULED' ? 'active' : 'draft';

                return (
                  <div key={entry.id} className="cal__modal-card">
                    <div className="cal__modal-card-stripe" style={{ background: platform.color }} />
                    <div className="cal__modal-card-body">
                      <div className="cal__modal-card-top">
                        <h4>{entry.title}</h4>
                        <div className="cal__modal-card-tags">
                          <span className="cal__modal-type">{contentType}</span>
                          <span className={`badge badge--${statusCls}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {linkedPost?.base_content && (
                        <p className="cal__modal-card-desc">
                          {linkedPost.base_content.length > 150
                            ? linkedPost.base_content.slice(0, 150) + '...'
                            : linkedPost.base_content}
                        </p>
                      )}

                      {!linkedPost?.base_content && entry.description && (
                        <p className="cal__modal-card-desc">{entry.description}</p>
                      )}

                      {linkedPost?.hashtags && linkedPost.hashtags.length > 0 && (
                        <div className="cal__modal-card-hashtags">
                          {linkedPost.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="cal__hashtag">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                          ))}
                          {linkedPost.hashtags.length > 5 && <span className="cal__hashtag-more">+{linkedPost.hashtags.length - 5}</span>}
                        </div>
                      )}

                      {entry.ai_rationale && (
                        <div className="cal__modal-card-ai">
                          <MdAutoAwesome />
                          <span>{entry.ai_rationale}</span>
                        </div>
                      )}

                      <div className="cal__modal-card-footer">
                        <div className="cal__modal-card-meta">
                          <span className="cal__modal-platform" style={{ color: platform.color }}>
                            {PlatformIcon && <PlatformIcon />}
                            {platform.name}
                          </span>
                          {entry.content_plan?.name && (
                            <span className="cal__modal-plan">{entry.content_plan.name}</span>
                          )}
                        </div>
                        {postAssets.length > 0 && (
                          <div className="cal__modal-assets">
                            {postAssets.slice(0, 4).map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="cal__modal-asset">
                                {url.match(/\.(mp4|mov|webm)/i) ? <MdPlayCircle /> : <MdImage />}
                              </a>
                            ))}
                            {postAssets.length > 4 && (
                              <span className="cal__modal-asset-more">+{postAssets.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Entry Form (inside modal) ────────────────────────

function AddEntryForm({ date, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    content_type: 'CUSTOM',
    platform: 'instagram',
    media_urls: '',
  });
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingPlans(true);
    fetchPlans()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.plans || [];
        setPlans(list);
        if (list.length > 0) setSelectedPlan(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  function handlePlanChange(value) {
    if (value === '__new__') {
      setNewPlanName('');
      setCreatingPlan(true);
    } else {
      setSelectedPlan(value);
      setCreatingPlan(false);
    }
  }

  async function handleCreatePlan() {
    if (!newPlanName.trim()) return;
    setCreatingPlan(false);
    setSaving(true);
    setError('');
    try {
      const d = new Date(date + 'T00:00:00');
      const startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await quickCreatePlan({ name: newPlanName.trim(), start_date: startDate, end_date: endDate });
      const plan = res.plan || res;
      setPlans((prev) => [...prev, plan]);
      setSelectedPlan(plan.id);
      setNewPlanName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.platform) {
      setError('Title and platform are required.');
      return;
    }
    if (!selectedPlan) {
      setError('Please select or create a content plan first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createEntry({
        content_plan_id: selectedPlan,
        date,
        title: form.title,
        description: form.description,
        content_type: form.content_type,
        platform: form.platform,
        media_urls: form.media_urls.split('\n').map((u) => u.trim()).filter(Boolean),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="cal__add-form">
      {error && <div className="cal__form-error">{error}</div>}

      {/* Plan Selection */}
      <div className="cal__form-group">
        <label>Content Plan *</label>
        {loadingPlans ? (
          <div className="cal__form-loading">Loading plans...</div>
        ) : creatingPlan ? (
          <div className="cal__new-plan-row">
            <input
              type="text"
              placeholder="Enter plan name..."
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreatePlan(); } }}
              autoFocus
            />
            <button type="button" className="btn btn--primary btn--sm" onClick={handleCreatePlan} disabled={saving || !newPlanName.trim()}>
              {saving ? '...' : 'Create'}
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => { setCreatingPlan(false); if (plans.length > 0) setSelectedPlan(plans[0].id); }}>
              Back
            </button>
          </div>
        ) : (
          <select value={selectedPlan} onChange={(e) => handlePlanChange(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="__new__">+ Create New Plan</option>
          </select>
        )}
      </div>

      <div className="cal__form-group">
        <label>Title *</label>
        <input
          type="text"
          placeholder="e.g. Eid Mubarak Greeting"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="cal__form-group">
        <label>Description</label>
        <textarea
          rows="2"
          placeholder="Brief description of the post..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="cal__form-row">
        <div className="cal__form-group">
          <label>Platform *</label>
          <select value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="cal__form-group">
          <label>Content Type</label>
          <select value={form.content_type} onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}>
            {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="cal__form-group">
        <label>Media URLs (one per line)</label>
        <textarea
          rows="2"
          placeholder="https://..."
          value={form.media_urls}
          onChange={(e) => setForm((f) => ({ ...f, media_urls: e.target.value }))}
        />
      </div>

      <div className="cal__form-actions">
        <button type="button" className="btn btn--outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={saving || !selectedPlan}>
          {saving ? 'Saving...' : 'Create Entry'}
        </button>
      </div>
    </form>
  );
}
