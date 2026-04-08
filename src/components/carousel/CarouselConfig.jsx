import { PLATFORMS } from '../../utils/platforms';

const SUPPORTED_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'x', 'pinterest'];

function CarouselConfig({ product, platform, setPlatform, slideCount, setSlideCount, onBack }) {
  const name = product.name || product.title || 'Selected Product';
  const image = product.image || product.thumbnail || product.images?.[0] || null;
  const category = product.category || product.type || '';

  return (
    <div>
      {/* Selected product summary */}
      <div className="selected-product-summary">
        {image ? (
          <img className="selected-product-summary__img" src={image} alt={name} />
        ) : (
          <div
            className="selected-product-summary__img"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: '#f3f4f6' }}
          >
            📦
          </div>
        )}
        <div className="selected-product-summary__info">
          <div className="selected-product-summary__name">{name}</div>
          {category && <div className="selected-product-summary__meta">{category}</div>}
        </div>
        <span className="selected-product-summary__change" onClick={onBack}>
          Change
        </span>
      </div>

      <div className="config-form">
        {/* Platform */}
        <div className="form-group">
          <label className="form-group__label">Platform</label>
          <p className="form-group__hint">
            Choose which platform this carousel is for. The AI will optimize content accordingly.
          </p>
          <div className="platform-grid" style={{ marginTop: 4 }}>
            {SUPPORTED_PLATFORMS.map((pid) => {
              const p = PLATFORMS.find((pl) => pl.id === pid);
              if (!p) return null;
              const Icon = p.icon;
              const isSelected = platform === pid;
              return (
                <div
                  key={pid}
                  className={`platform-chip${isSelected ? ' platform-chip--selected' : ''}`}
                  onClick={() => setPlatform(pid)}
                >
                  <span className="platform-chip__icon" style={{ color: isSelected ? p.color : undefined }}>
                    <Icon />
                  </span>
                  {p.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Slide count */}
        <div className="form-group">
          <label className="form-group__label">Number of Slides</label>
          <p className="form-group__hint">
            How many carousel slides should be generated?
          </p>
          <div className="slide-count-selector">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                className={`slide-count-btn${slideCount === n ? ' slide-count-btn--active' : ''}`}
                onClick={() => setSlideCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarouselConfig;
