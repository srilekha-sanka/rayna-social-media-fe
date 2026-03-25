import { useState, useEffect, useRef } from 'react';
import { MdCampaign, MdSearch, MdClose, MdRefresh } from 'react-icons/md';
import { fetchProducts } from '../../services/api';

function StepCampaign({ data, onChange, onProductSelect, selectedProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      console.log('[StepCampaign] Fetching products...');
      const list = await fetchProducts();
      console.log('[StepCampaign] Got products:', list.length);
      setProducts(list);
    } catch (err) {
      console.error('[StepCampaign] Failed to load products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  function set(field, value) {
    onChange({ ...data, [field]: value });
  }

  function handleSelectProduct(product) {
    onProductSelect(product);
    setSearch('');
    setDropdownOpen(false);
  }

  function handleClearProduct() {
    onProductSelect(null);
    setSearch('');
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--green"><MdCampaign /></span>
          Campaign Setup
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Step 1 of 8</span>
      </div>

      <div className="panel__body">
        <div className="campaign-form">
          {/* Campaign Name */}
          <div className="form-field">
            <label className="form-field__label">Campaign Name</label>
            <input
              className="form-field__input"
              placeholder="e.g. Dubai Summer Sale 2026"
              value={data.name || ''}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          {/* City */}
          <div className="form-field">
            <label className="form-field__label">City</label>
            <input
              className="form-field__input"
              placeholder="e.g. Dubai"
              value={data.city || ''}
              onChange={(e) => set('city', e.target.value)}
            />
          </div>

          {/* ─── Product Dropdown with Search ─── */}
          <div
            className="form-field"
            style={{ gridColumn: '1 / -1', position: 'relative', zIndex: 60 }}
            ref={dropdownRef}
          >
            <label className="form-field__label">Select Product</label>

            {selectedProduct ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                border: '2px solid var(--primary)',
                borderRadius: 8,
                background: '#f5f3ff',
              }}>
                {selectedProduct.image_urls?.[0] && (
                  <img
                    src={selectedProduct.image_urls[0]}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedProduct.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedProduct.city && `${selectedProduct.city} · `}
                    {selectedProduct.currency || 'AED'} {selectedProduct.price}
                    {selectedProduct.offer_label && (
                      <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 600 }}>
                        {selectedProduct.offer_label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClearProduct}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
                    background: '#e5e7eb', color: '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 16, flexShrink: 0,
                  }}
                >
                  <MdClose />
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  border: `2px solid ${dropdownOpen ? 'var(--primary-light)' : 'var(--border)'}`,
                  borderRadius: dropdownOpen ? '8px 8px 0 0' : '8px',
                  background: '#fff',
                  transition: 'border-color 0.2s',
                }}
              >
                <MdSearch size={18} color="var(--text-secondary)" />
                <input
                  type="text"
                  placeholder={loading ? 'Loading products...' : error ? 'Failed to load — click retry' : 'Search and select a product...'}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  style={{
                    border: 'none', background: 'transparent', fontSize: 14,
                    width: '100%', color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                {loading && (
                  <div className="generating-spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0, flexShrink: 0 }} />
                )}
                {error && !loading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); loadProducts(); }}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: 'var(--primary)', fontSize: 18, display: 'flex',
                      flexShrink: 0,
                    }}
                    title="Retry"
                  >
                    <MdRefresh />
                  </button>
                )}
              </div>
            )}

            {/* Dropdown */}
            {dropdownOpen && !selectedProduct && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 999,
                background: '#fff',
                border: '2px solid var(--primary-light)',
                borderTop: '1px solid var(--border-light)',
                borderRadius: '0 0 8px 8px',
                maxHeight: 300,
                overflowY: 'auto',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
              }}>
                {error && (
                  <div style={{
                    padding: '12px 18px', fontSize: 13, color: '#dc2626',
                    background: '#fef2f2', borderBottom: '1px solid #fecaca',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{error}</span>
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={loadProducts}
                      style={{ fontSize: 11 }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    <div className="generating-spinner" style={{ width: 22, height: 22, borderWidth: 2, margin: '0 auto 8px' }} />
                    Loading products...
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {products.length === 0 ? 'No products available' : 'No match found'}
                  </div>
                ) : (
                  filtered.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px', cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 6, background: '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0,
                        }}>📦</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {product.city && `${product.city} · `}
                          {product.currency || 'AED'} {product.price}
                          {product.offer_label && (
                            <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 4 }}>
                              {product.offer_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="form-field">
            <label className="form-field__label">Start Date</label>
            <input
              type="date"
              className="form-field__input"
              value={data.start_date || ''}
              onChange={(e) => set('start_date', e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="form-field">
            <label className="form-field__label">End Date</label>
            <input
              type="date"
              className="form-field__input"
              value={data.end_date || ''}
              onChange={(e) => set('end_date', e.target.value)}
            />
          </div>

          {/* Campaign Goal */}
          <div className="form-field">
            <label className="form-field__label">Campaign Goal</label>
            <select
              className="form-field__input"
              value={data.goal || ''}
              onChange={(e) => set('goal', e.target.value)}
            >
              <option value="">Select goal...</option>
              <option value="sales">Drive Sales</option>
              <option value="awareness">Brand Awareness</option>
              <option value="engagement">Engagement</option>
              <option value="traffic">Website Traffic</option>
              <option value="leads">Lead Generation</option>
            </select>
          </div>

          {/* Target Audience */}
          <div className="form-field">
            <label className="form-field__label">Target Audience</label>
            <input
              className="form-field__input"
              placeholder="e.g. Tourists, Families, Adventure seekers"
              value={data.target_audience || ''}
              onChange={(e) => set('target_audience', e.target.value)}
            />
          </div>

          {/* USP / Offer */}
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="form-field__label">USP / Offer (from product or custom)</label>
            <textarea
              className="form-field__input"
              placeholder="e.g. 46% OFF — Snow Park tickets at AED 35 only!"
              value={data.usp || ''}
              onChange={(e) => set('usp', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepCampaign;
