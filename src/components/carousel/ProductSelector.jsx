import { useState, useEffect } from 'react';
import { MdSearch, MdCheck } from 'react-icons/md';
import { fetchProducts } from '../../services/api';

function ProductSelector({ selectedProduct, onSelect }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetchProducts();
      setProducts(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) =>
    (p.name || p.title || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="empty-state">
        <div className="generating-spinner" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Could not load products</h3>
        <p>{error}</p>
        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={loadProducts}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="product-search">
        <MdSearch size={20} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => {
            const isSelected = selectedProduct?.id === product.id;
            const name = product.name || product.title || 'Untitled Product';
            const image = product.image || product.thumbnail || product.images?.[0] || null;
            const price = product.price || product.sale_price || product.original_price;
            const category = product.category || product.type || '';

            return (
              <div
                key={product.id}
                className={`product-card${isSelected ? ' product-card--selected' : ''}`}
                onClick={() => onSelect(product)}
              >
                {image ? (
                  <img className="product-card__img" src={image} alt={name} />
                ) : (
                  <div
                    className="product-card__img"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    📦
                  </div>
                )}

                <div className="product-card__info">
                  <div className="product-card__name">{name}</div>
                  {category && <div className="product-card__meta">{category}</div>}
                  {price != null && (
                    <div className="product-card__price">
                      {typeof price === 'number' ? `AED ${price}` : price}
                    </div>
                  )}
                </div>

                <div className="product-card__check">
                  {isSelected && <MdCheck />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductSelector;
