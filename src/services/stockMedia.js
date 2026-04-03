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

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(res.ok ? 'Unexpected response format' : `Request failed (${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data.data || data.payload || data;
}

// ─── Stock Media Search ──────────────────────────────────

export async function searchStock({ term, page = 1, limit = 20, orientation } = {}) {
  const params = new URLSearchParams({ term, page, limit });
  if (orientation) params.set('orientation', orientation);
  return request(`/stock-media/search?${params}`);
}

export async function getStockDownloadUrl(resourceId) {
  const res = await request(`/stock-media/download/${resourceId}`);
  return res.download_url || res;
}

/**
 * Resolve download URLs for multiple stock image IDs in parallel.
 * @param {number[]} resourceIds
 * @returns {Promise<string[]>} array of download URLs
 */
export async function resolveStockUrls(resourceIds) {
  return Promise.all(resourceIds.map((id) => getStockDownloadUrl(id)));
}
