// Strip trailing slash from env URL to avoid double-slash issues
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

export function setToken(token) {
  localStorage.setItem('auth_token', token);
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token') || '';
}

export function setRefreshToken(token) {
  localStorage.setItem('refresh_token', token);
}

export function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
}

export function isLoggedIn() {
  return !!getToken();
}

export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

let isRefreshing = false;

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

  // Auto-refresh token on 401
  if (res.status === 401 && getRefreshToken() && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: getRefreshToken() }),
      });
      const refreshData = await refreshRes.json();
      const tokens = refreshData.payload || refreshData.data || refreshData;

      if (refreshRes.ok && (tokens.accessToken || tokens.access_token)) {
        setToken(tokens.accessToken || tokens.access_token);
        if (tokens.refreshToken || tokens.refresh_token) {
          setRefreshToken(tokens.refreshToken || tokens.refresh_token);
        }
        isRefreshing = false;
        return request(endpoint, options);
      }
    } catch (err) {
      console.error('[API] Token refresh failed:', err);
    }
    isRefreshing = false;
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Store tokens
  const tokens = data.payload || data.data || data;
  if (tokens.accessToken) setToken(tokens.accessToken);
  if (tokens.access_token) setToken(tokens.access_token);
  if (tokens.refreshToken) setRefreshToken(tokens.refreshToken);
  if (tokens.refresh_token) setRefreshToken(tokens.refresh_token);

  return tokens;
}

export function logout() {
  clearAuth();
  window.location.href = '/login';
}

// ─── Products ───────────────────────────────────────────
export async function fetchProducts({ search, city, category } = {}) {
  const params = new URLSearchParams({ limit: '100' });
  if (search) params.set('search', search);
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  const res = await request(`/products?${params.toString()}`);
  // Handle all possible response shapes:
  // { data: { products: [] } } or { payload: { products: [] } } or { data: [] } or { products: [] }
  const products = res.data?.products || res.payload?.products || res.products || res.data || [];
  console.log('[API] fetchProducts raw response:', JSON.stringify(Object.keys(res)), 'count:', Array.isArray(products) ? products.length : 0);
  return Array.isArray(products) ? products : [];
}

// ─── Carousel Generation (Async Job) ─────────────────────
// POST returns { job_id, status: "PROCESSING" } instantly
export async function generateCarousel({ product_id, platform, slide_count }) {
  const res = await request('/content/generate-carousel', {
    method: 'POST',
    body: JSON.stringify({ product_id, platform, slide_count }),
  });
  return res.data || res.payload || res;
}

// Poll job status: GET /content/jobs/:jobId
// Returns { status: "PROCESSING" | "COMPLETED" | "FAILED", result?, error? }
export async function getJobStatus(jobId) {
  const res = await request(`/content/jobs/${jobId}`);
  return res.data || res.payload || res;
}

// Helper: poll until done, calls onProgress with each status
export function pollJob(jobId, { interval = 2500, maxAttempts = 60, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    async function check() {
      attempt++;
      try {
        const job = await getJobStatus(jobId);
        if (onProgress) onProgress(job, attempt);

        if (job.status === 'COMPLETED') {
          resolve(job.result || job);
        } else if (job.status === 'FAILED') {
          reject(new Error(job.error || 'Carousel generation failed'));
        } else if (attempt >= maxAttempts) {
          reject(new Error('Generation timed out — please try again'));
        } else {
          setTimeout(check, interval);
        }
      } catch (err) {
        if (attempt >= 3) {
          reject(err);
        } else {
          setTimeout(check, interval);
        }
      }
    }

    check();
  });
}

export async function fetchProductById(id) {
  const res = await request(`/products/${id}`);
  return res.data || res.payload;
}

// ─── Campaigns ──────────────────────────────────────────
export async function fetchCampaigns() {
  const res = await request('/campaigns');
  return res.payload || res.data || [];
}

export async function createCampaign(payload) {
  const res = await request('/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.payload || res.data;
}

// ─── Post Workflow ──────────────────────────────────────
// DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED / SCHEDULED
//                           ↓
//                        DRAFT (rejected)

export async function submitPost(postId) {
  const res = await request(`/posts/${postId}/submit`, { method: 'POST' });
  return res.payload || res.data;
}

export async function approvePost(postId, note) {
  const res = await request(`/posts/${postId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note: note || '' }),
  });
  return res.payload || res.data;
}

export async function rejectPost(postId, reason) {
  const res = await request(`/posts/${postId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  });
  return res.payload || res.data;
}

export async function publishPost(postId) {
  const res = await request(`/posts/${postId}/publish`, { method: 'POST' });
  return res.payload || res.data;
}

export async function schedulePost(postId, scheduledAt) {
  const res = await request(`/posts/${postId}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
  return res.payload || res.data;
}

// ─── Instagram Integration ──────────────────────────────

export async function checkInstagramCredentials() {
  const res = await request('/instagram/credentials');
  return res.data || res.payload || res;
}

export async function publishToInstagram(postId) {
  const res = await request(`/instagram/publish/${postId}`, { method: 'POST' });
  return res.data || res.payload || res;
}

export async function publishToInstagramDirect({ image_url, caption, media_type = 'IMAGE' }) {
  const res = await request('/instagram/publish', {
    method: 'POST',
    body: JSON.stringify({ image_url, caption, media_type }),
  });
  return res.data || res.payload || res;
}

export async function fetchInstagramMedia(limit = 5) {
  const res = await request(`/instagram/media?limit=${limit}`);
  return res.data || res.payload || res;
}
