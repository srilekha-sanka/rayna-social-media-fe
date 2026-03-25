import { useState } from 'react';
import { MdAutoAwesome } from 'react-icons/md';
import { generateCarousel } from '../../services/api';

function StepContentGeneration({ product, campaign, decision, platform, slideCount, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      const res = await generateCarousel({
        product_id: product.id,
        platform: platform || 'instagram',
        slide_count: slideCount || 4,
      });
      setResult(res.data);
      onGenerated(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel__header">
          <div className="panel__title">
            <span className="panel__title-icon panel__title-icon--red"><MdAutoAwesome /></span>
            AI Content Generation
          </div>
        </div>
        <div className="panel__body">
          <div className="generating-state">
            <div className="generating-spinner" />
            <h3>AI is crafting your content...</h3>
            <p>Generating captions, hashtags, overlay images, and CTA. This may take a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const { ai_content, slides, meta } = result;
    return (
      <div className="panel">
        <div className="panel__header">
          <div className="panel__title">
            <span className="panel__title-icon panel__title-icon--red"><MdAutoAwesome /></span>
            AI Content — Generated
          </div>
          <span className="badge badge--active">Ready</span>
        </div>
        <div className="panel__body">
          <div className="ai-output-grid">
            <div className="ai-output-card" style={{ gridColumn: '1 / -1' }}>
              <div className="ai-output-card__label">Caption</div>
              <div className="ai-output-card__value">{ai_content.caption}</div>
            </div>

            <div className="ai-output-card">
              <div className="ai-output-card__label">Hashtags</div>
              <div className="hashtag-list">
                {(ai_content.hashtags || []).map((tag) => (
                  <span key={tag} className="hashtag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="ai-output-card">
              <div className="ai-output-card__label">Call to Action</div>
              <div className="cta-preview">{ai_content.cta}</div>
            </div>

            <div className="ai-output-card" style={{ gridColumn: '1 / -1' }}>
              <div className="ai-output-card__label">Slide Texts ({slides.length} slides)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {(ai_content.slide_texts || []).map((s, i) => (
                  <div key={i} style={{ padding: '8px 14px', background: '#f5f3ff', borderRadius: 8, fontSize: 13 }}>
                    <strong>Slide {i + 1}:</strong> {s.overlay_text}
                    <span style={{ color: 'var(--primary)', marginLeft: 8, fontSize: 11 }}>{s.cta_text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--red"><MdAutoAwesome /></span>
          AI Content Generation
        </div>
      </div>
      <div className="panel__body">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          The AI will take the product details + your decision engine inputs to generate:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Caption', 'Hashtags', 'Mentions', 'CTA', 'Slide Overlay Text'].map((item) => (
            <span key={item} className="hashtag">{item}</span>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button className="btn btn--primary" onClick={handleGenerate}>
          <MdAutoAwesome /> Generate Content
        </button>
      </div>
    </div>
  );
}

export default StepContentGeneration;
