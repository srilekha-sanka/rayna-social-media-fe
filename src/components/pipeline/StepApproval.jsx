import { useState } from 'react';
import {
  MdCheck,
  MdSchedule,
  MdSend,
  MdChevronLeft,
  MdChevronRight,
  MdVerified,
} from 'react-icons/md';
import { getMediaUrl } from '../../services/api';
import { PLATFORMS } from '../../utils/platforms';

function StepApproval({ campaign, product, decision, generatedData, selectedPlatforms, utm }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = generatedData?.slides || [];
  const post = generatedData?.post || {};
  const ai = generatedData?.ai_content || {};
  const meta = generatedData?.meta || {};
  const currentSlide = slides[activeSlide];

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--green"><MdVerified /></span>
          Admin Approval & Publish
        </div>
        <span className="badge badge--draft">{post.status || 'DRAFT'}</span>
      </div>

      <div className="panel__body">
        {/* Summary Strip */}
        <div className="approval-summary">
          <div className="approval-item">
            <div className="approval-item__label">Campaign</div>
            <div className="approval-item__value">{campaign.name || '—'}</div>
          </div>
          <div className="approval-item">
            <div className="approval-item__label">Product</div>
            <div className="approval-item__value">{meta.product_name || product?.name || '—'}</div>
          </div>
          <div className="approval-item">
            <div className="approval-item__label">Intent</div>
            <div className="approval-item__value">
              <span className={`intent-badge intent-badge--${(decision.intent || meta.intent || 'engagement').toLowerCase()}`}>
                {decision.intent || meta.intent || 'ENGAGEMENT'}
              </span>
            </div>
          </div>
          <div className="approval-item">
            <div className="approval-item__label">Platforms</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {selectedPlatforms.map((pid) => {
                const p = PLATFORMS.find((pl) => pl.id === pid);
                if (!p) return null;
                const Icon = p.icon;
                return (
                  <span key={pid} title={p.name} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: p.color + '15', color: p.color === '#000000' ? '#1a1a2e' : p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>
                    <Icon />
                  </span>
                );
              })}
            </div>
          </div>
          <div className="approval-item">
            <div className="approval-item__label">Slides</div>
            <div className="approval-item__value">{slides.length}</div>
          </div>
        </div>

        {/* Slide Preview + Caption side by side */}
        {slides.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Slide Viewer */}
            <div>
              <div style={{
                position: 'relative', borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--border)', aspectRatio: '1/1', background: '#000',
              }}>
                <img
                  src={getMediaUrl(currentSlide.url || currentSlide.processed_image)}
                  alt={`Slide ${activeSlide + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#fff',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{currentSlide.overlay_text}</div>
                  {currentSlide.cta_text && (
                    <span style={{
                      display: 'inline-block', padding: '5px 14px', borderRadius: 16,
                      background: 'var(--gradient-brand)', fontSize: 12, fontWeight: 600,
                    }}>
                      {currentSlide.cta_text}
                    </span>
                  )}
                </div>
              </div>

              {/* Nav */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <button className="slide-nav-btn" onClick={() => setActiveSlide((i) => (i > 0 ? i - 1 : slides.length - 1))}>
                  <MdChevronLeft />
                </button>
                <div className="slide-dots">
                  {slides.map((_, i) => (
                    <div key={i} className={`slide-dot${i === activeSlide ? ' slide-dot--active' : ''}`} onClick={() => setActiveSlide(i)} />
                  ))}
                </div>
                <button className="slide-nav-btn" onClick={() => setActiveSlide((i) => (i < slides.length - 1 ? i + 1 : 0))}>
                  <MdChevronRight />
                </button>
              </div>
            </div>

            {/* Caption & Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ai-output-card" style={{ flex: 1 }}>
                <div className="ai-output-card__label">Caption</div>
                <div className="ai-output-card__value">{post.base_content || ai.caption}</div>
              </div>
              <div className="ai-output-card">
                <div className="ai-output-card__label">Hashtags</div>
                <div className="hashtag-list">
                  {(post.hashtags || ai.hashtags || []).map((tag) => (
                    <span key={tag} className="hashtag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="ai-output-card">
                <div className="ai-output-card__label">CTA</div>
                <div className="cta-preview">{post.cta_text || ai.cta}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn--outline">
            <MdSchedule /> Schedule for Later
          </button>
          <button className="btn btn--primary" style={{ minWidth: 180 }}>
            <MdSend /> Approve & Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepApproval;
