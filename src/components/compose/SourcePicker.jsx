import { MdInventory, MdImage, MdAutoAwesome } from 'react-icons/md';
import { CONTENT_SOURCE, getProductInfo } from './constants';

export default function SourcePicker({ entry, onSelect }) {
  const { name, price, thumbnail, hasProduct } = getProductInfo(entry);

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
        {/* ── Product Data ── */}
        <button
          className={`csp__source-card ${!hasProduct ? 'csp__source-card--disabled' : ''}`}
          disabled={!hasProduct}
          onClick={() => onSelect(CONTENT_SOURCE.PRODUCT)}
        >
          <div className="csp__source-icon csp__source-icon--product"><MdInventory /></div>
          <h5 className="csp__source-label">Product Data</h5>
          <p className="csp__source-desc">Use product images from your catalog</p>
          {hasProduct ? (
            <div className="csp__product-preview">
              {thumbnail && <img src={thumbnail} alt="" className="csp__product-thumb" />}
              <div className="csp__product-info">
                {name && <span className="csp__product-name">{name}</span>}
                {price && <span className="csp__product-price">{price}</span>}
              </div>
            </div>
          ) : (
            <span className="csp__source-disabled-text">No product linked</span>
          )}
        </button>

        {/* ── Stock Media ── */}
        <button className="csp__source-card" onClick={() => onSelect(CONTENT_SOURCE.STOCK)}>
          <div className="csp__source-icon csp__source-icon--stock"><MdImage /></div>
          <h5 className="csp__source-label">Stock Media</h5>
          <p className="csp__source-desc">Search stock photos or upload your own images</p>
        </button>

        {/* ── AI Generate ── */}
        <button className="csp__source-card" onClick={() => onSelect(CONTENT_SOURCE.AI_GENERATED)}>
          <div className="csp__source-icon csp__source-icon--ai"><MdAutoAwesome /></div>
          <h5 className="csp__source-label">AI Generate</h5>
          <p className="csp__source-desc">AI designs a poster from your product image & brief</p>
        </button>
      </div>
    </div>
  );
}
