import { useState, useEffect } from 'react';
import { MdInventory, MdImage, MdVideocam, MdOpenInNew } from 'react-icons/md';
import { fetchProductById, getMediaUrl } from '../../services/api';

function StepProduct({ selectedProduct }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (selectedProduct?.id) {
      loadProduct(selectedProduct.id);
    }
  }, [selectedProduct?.id]);

  async function loadProduct(id) {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message);
      // fallback to the product object from campaign step
      setProduct(selectedProduct);
    } finally {
      setLoading(false);
    }
  }

  if (!selectedProduct) {
    return (
      <div className="panel">
        <div className="panel__header">
          <div className="panel__title">
            <span className="panel__title-icon panel__title-icon--green"><MdInventory /></span>
            Selected Product
          </div>
        </div>
        <div className="panel__body">
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <h3>No product selected</h3>
            <p>Go back to Campaign Setup and select a product from the dropdown.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel__header">
          <div className="panel__title">
            <span className="panel__title-icon panel__title-icon--green"><MdInventory /></span>
            Selected Product
          </div>
        </div>
        <div className="panel__body">
          <div className="empty-state">
            <div className="generating-spinner" />
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  const p = product || selectedProduct;
  const images = p.image_urls || [];
  const hasOffer = p.offer_label || (p.compare_at_price && p.compare_at_price > p.price);
  const discount = p.compare_at_price ? Math.round((1 - p.price / p.compare_at_price) * 100) : null;

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--green"><MdInventory /></span>
          Selected Product
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Step 2 of 8</span>
      </div>

      <div className="panel__body">
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
            Could not fetch latest details — showing cached data. {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Image gallery */}
          <div>
            {images.length > 0 ? (
              <>
                {/* Main image */}
                <div style={{
                  position: 'relative', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid var(--border)', aspectRatio: '4/3', background: '#f3f4f6',
                  marginBottom: 12,
                }}>
                  <img
                    src={getMediaUrl(images[activeImage])}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    display: 'flex', gap: 6,
                  }}>
                    <span style={{
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      padding: '3px 10px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <MdImage size={13} /> {images.length} images
                    </span>
                    {hasOffer && (
                      <span style={{
                        background: '#dc2626', color: '#fff',
                        padding: '3px 10px', borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {p.offer_label || `${discount}% OFF`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {images.map((url, i) => (
                    <img
                      key={i}
                      src={getMediaUrl(url)}
                      alt={`Thumb ${i + 1}`}
                      onClick={() => setActiveImage(i)}
                      style={{
                        width: 64, height: 64, borderRadius: 8, objectFit: 'cover',
                        border: i === activeImage ? '2px solid var(--primary)' : '2px solid transparent',
                        opacity: i === activeImage ? 1 : 0.6,
                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                aspectRatio: '4/3', borderRadius: 12, background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8, color: 'var(--text-secondary)',
              }}>
                <MdImage size={40} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: 13 }}>No images available</span>
              </div>
            )}
          </div>

          {/* Right: Product details */}
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{p.name}</h3>

            {p.city && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                📍 {p.city}
                {p.category && <span> · {p.category}</span>}
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>
                {p.currency || 'AED'} {p.price}
              </span>
              {p.compare_at_price && p.compare_at_price > p.price && (
                <span style={{ fontSize: 16, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                  {p.currency || 'AED'} {p.compare_at_price}
                </span>
              )}
              {discount && (
                <span style={{
                  background: '#fee2e2', color: '#dc2626', padding: '2px 8px',
                  borderRadius: 4, fontSize: 12, fontWeight: 700,
                }}>
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Description
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {p.description.length > 300 ? p.description.slice(0, 300) + '...' : p.description}
                </p>
              </div>
            )}

            {/* Highlights */}
            {p.highlights && p.highlights.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Highlights
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.highlights.map((h, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: 20,
                      fontSize: 12, fontWeight: 500,
                      background: '#f0fdf4', color: '#166534',
                      border: '1px solid #bbf7d0',
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Base URL */}
            {p.base_url && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Product URL
                </div>
                <a
                  href={p.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: 'var(--primary)', fontWeight: 500,
                  }}
                >
                  {p.base_url} <MdOpenInNew size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepProduct;
