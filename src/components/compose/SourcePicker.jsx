import { MdInventory, MdImage, MdAutoAwesome } from 'react-icons/md';

const AI_STYLES = ['Photo', 'Digital Art', '3D', 'Painting'];

export default function SourcePicker({ entry, onSelect }) {
  const hasProduct = !!(entry.product_id || entry.product);
  const productName = entry.product?.name || entry.product_name || null;
  const productPrice = entry.product?.price || entry.product_price || null;
  const productThumb = entry.product?.image_url || entry.product?.thumbnail_url || null;

  return (
    <div className="csp__picker">
      <h4 className="csp__picker-title">How would you like to create this post?</h4>
      <div className="csp__picker-context">
        <span className="csp__picker-entry-title">{entry.title || 'Untitled Entry'}</span>
        <div className="csp__picker-meta">
          <span className="cc__type-tag">{entry.platform}</span>
          {entry.content_type && <span className="cc__type-tag">{entry.content_type}</span>}
        </div>
      </div>

      <div className="csp__picker-grid">
        {/* ── Product Data Card ── */}
        <button
          className={`csp__source-card ${!hasProduct ? 'csp__source-card--disabled' : ''}`}
          disabled={!hasProduct}
          onClick={() => onSelect('PRODUCT')}
        >
          <div className="csp__source-icon csp__source-icon--product">
            <MdInventory />
          </div>
          <h5 className="csp__source-label">Product Data</h5>
          <p className="csp__source-desc">Use product images from your catalog</p>
          {hasProduct ? (
            <div className="csp__product-preview">
              {productThumb && <img src={productThumb} alt="" className="csp__product-thumb" />}
              <div className="csp__product-info">
                {productName && <span className="csp__product-name">{productName}</span>}
                {productPrice && <span className="csp__product-price">{productPrice}</span>}
              </div>
            </div>
          ) : (
            <span className="csp__source-disabled-text">No product linked</span>
          )}
        </button>

        {/* ── Stock Media Card ── */}
        <button className="csp__source-card" onClick={() => onSelect('STOCK')}>
          <div className="csp__source-icon csp__source-icon--stock">
            <MdImage />
          </div>
          <h5 className="csp__source-label">Stock Media</h5>
          <p className="csp__source-desc">Search stock photos or upload your own images</p>
        </button>

        {/* ── AI Generate Card ── */}
        <button className="csp__source-card" onClick={() => onSelect('AI_GENERATED')}>
          <div className="csp__source-icon csp__source-icon--ai">
            <MdAutoAwesome />
          </div>
          <h5 className="csp__source-label">AI Generate</h5>
          <p className="csp__source-desc">AI creates images & copy from your brief</p>
          <div className="csp__ai-styles">
            {AI_STYLES.map((s) => (
              <span key={s} className="csp__ai-style-tag">{s}</span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}
