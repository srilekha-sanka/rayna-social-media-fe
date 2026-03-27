// Strip trailing slash from env URL to avoid double-slash issues
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data.data || data.payload || data;
}

// ─── Content Plans ────────────────────────────────────────

export async function generatePlan(payload) {
  return request('/content-studio/plans/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPlans({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return request(`/content-studio/plans?${params}`);
}

export async function fetchPlan(planId) {
  return request(`/content-studio/plans/${planId}`);
}

export async function updatePlan(planId, payload) {
  return request(`/content-studio/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(planId) {
  return request(`/content-studio/plans/${planId}`, { method: 'DELETE' });
}

export async function submitPlanForReview(planId) {
  return request(`/content-studio/plans/${planId}/submit-review`, { method: 'POST' });
}

export async function approvePlan(planId) {
  return request(`/content-studio/plans/${planId}/approve`, { method: 'POST' });
}

export async function rejectPlan(planId) {
  return request(`/content-studio/plans/${planId}/reject`, { method: 'POST' });
}

export async function fetchPlansByDate(date) {
  return request(`/content-studio/plans/by-date?date=${date}`);
}

export async function quickCreatePlan(payload) {
  return request('/content-studio/plans/quick-create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Calendar Entries ─────────────────────────────────────

export async function fetchCalendar({ start_date, end_date, platform, status } = {}) {
  const params = new URLSearchParams();
  if (start_date) params.set('start_date', start_date);
  if (end_date) params.set('end_date', end_date);
  if (platform) params.set('platform', platform);
  if (status) params.set('status', status);
  return request(`/content-studio/calendar?${params}`);
}

export async function createEntry(payload) {
  return request('/content-studio/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEntry(entryId, payload) {
  return request(`/content-studio/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEntry(entryId) {
  return request(`/content-studio/entries/${entryId}`, { method: 'DELETE' });
}

export async function bulkUpdateEntries(entryIds, status) {
  return request('/content-studio/entries/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ entry_ids: entryIds, status }),
  });
}

export async function linkEntryToPost(entryId, postId) {
  return request(`/content-studio/entries/${entryId}/link-post`, {
    method: 'POST',
    body: JSON.stringify({ post_id: postId }),
  });
}

export async function generateEntries(planId, payload) {
  return request(`/content-studio/plans/${planId}/generate-entries`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Async Jobs ──────────────────────────────────────────

export async function fetchJobStatus(jobId) {
  return request(`/content-studio/jobs/${jobId}`);
}

/**
 * Poll a job until COMPLETED or FAILED.
 * @param {string} jobId
 * @param {object} opts
 * @param {number}   opts.interval  - ms between polls (default 2500)
 * @param {number}   opts.timeout   - max ms to wait (default 300000 = 5 min)
 * @param {function} opts.onProgress - called with job data on each poll
 * @returns {Promise} resolves with completed job data
 */
export async function pollJob(jobId, { interval = 2500, timeout = 300000, onProgress } = {}) {
  const start = Date.now();
  while (true) {
    const job = await fetchJobStatus(jobId);
    if (onProgress) onProgress(job);

    if (job.status === 'COMPLETED') return job;
    if (job.status === 'FAILED') throw new Error(job.error || 'Job failed');

    if (Date.now() - start > timeout) {
      throw new Error('Job timed out — it may still be running in the background.');
    }

    await new Promise((r) => setTimeout(r, interval));
  }
}
