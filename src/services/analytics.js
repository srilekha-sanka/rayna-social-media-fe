const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
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

  return data.data;
}

// ─── Overview ──────────────────────────────────────────
export async function fetchOverview({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request(`/analytics/overview${qs ? `?${qs}` : ''}`);
}

// ─── Platform Breakdown ────────────────────────────────
export async function fetchPlatforms({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request(`/analytics/platforms${qs ? `?${qs}` : ''}`);
}

// ─── Top Performing Posts ──────────────────────────────
export async function fetchTopPosts({ page = 1, limit = 10, platform, sort_by = 'engagement', sort_order = 'DESC', from, to } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort_by, sort_order });
  if (platform) params.set('platform', platform);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request(`/analytics/top-posts?${params.toString()}`);
}

// ─── Campaign Analytics ────────────────────────────────
export async function fetchCampaignAnalytics(campaignId, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request(`/analytics/campaigns/${campaignId}${qs ? `?${qs}` : ''}`);
}

// ─── Single Post Analytics ─────────────────────────────
export async function fetchPostAnalytics(postId) {
  return request(`/analytics/posts/${postId}`);
}

// ─── Manual Sync ───────────────────────────────────────
export async function syncPost(postId) {
  return request(`/analytics/sync/${postId}`, { method: 'POST' });
}

// ─── Account Feed ──────────────────────────────────────
export async function fetchAccountFeed(accountId, { limit = 25, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return request(`/analytics/accounts/${accountId}/feed?${params.toString()}`);
}
