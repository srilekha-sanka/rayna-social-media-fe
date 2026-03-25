import { useState } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdEdit,
  MdTag,
  MdTouchApp,
  MdSchedule,
  MdSend,
} from 'react-icons/md';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function CarouselPreview({ data, onBack }) {
  const { post, slides, ai_content, meta } = data;
  const [activeSlide, setActiveSlide] = useState(0);
  const [caption, setCaption] = useState(post.base_content);
  const [isEditing, setIsEditing] = useState(false);

  const currentSlide = slides[activeSlide];

  function prevSlide() {
    setActiveSlide((i) => (i > 0 ? i - 1 : slides.length - 1));
  }

  function nextSlide() {
    setActiveSlide((i) => (i < slides.length - 1 ? i + 1 : 0));
  }

  function getImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return (
    <div className="carousel-preview">
      {/* Left: Slide Viewer */}
      <div className="slide-viewer">
        <div className="slide-viewer__main">
          <img
            className="slide-viewer__img"
            src={getImageUrl(currentSlide.url || currentSlide.processed_image)}
            alt={`Slide ${activeSlide + 1}`}
          />
          <div className="slide-viewer__overlay">
            <div className="slide-viewer__overlay-text">
              {currentSlide.overlay_text}
            </div>
            {currentSlide.cta_text && (
              <span className="slide-viewer__overlay-cta">
                {currentSlide.cta_text}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="slide-viewer__nav">
          <button className="slide-nav-btn" onClick={prevSlide}>
            <MdChevronLeft />
          </button>

          <div className="slide-dots">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`slide-dot${i === activeSlide ? ' slide-dot--active' : ''}`}
                onClick={() => setActiveSlide(i)}
              />
            ))}
          </div>

          <button className="slide-nav-btn" onClick={nextSlide}>
            <MdChevronRight />
          </button>

          <span className="slide-viewer__counter">
            {activeSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Thumbnails */}
        <div className="slide-thumbs">
          {slides.map((slide, i) => (
            <img
              key={i}
              className={`slide-thumb${i === activeSlide ? ' slide-thumb--active' : ''}`}
              src={getImageUrl(slide.url || slide.processed_image)}
              alt={`Thumb ${i + 1}`}
              onClick={() => setActiveSlide(i)}
            />
          ))}
        </div>
      </div>

      {/* Right: Caption & Details */}
      <div className="caption-panel">
        {/* Product info */}
        <div className="caption-section" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{meta.product_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {meta.platform} · {meta.slide_count} slides · {meta.intent}
              </div>
            </div>
            <span className={`badge badge--${post.status === 'DRAFT' ? 'draft' : 'active'}`}>
              {post.status}
            </span>
          </div>
        </div>

        {/* Caption */}
        <div className="caption-section">
          <div className="caption-section__label">
            <MdEdit className="caption-section__label-icon" />
            Caption
            <span
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Done' : 'Edit'}
            </span>
          </div>
          {isEditing ? (
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          ) : (
            <div className="caption-section__text">{caption}</div>
          )}
        </div>

        {/* Hashtags */}
        <div className="caption-section">
          <div className="caption-section__label">
            <MdTag className="caption-section__label-icon" />
            Hashtags
          </div>
          <div className="hashtag-list">
            {(post.hashtags || ai_content.hashtags || []).map((tag) => (
              <span key={tag} className="hashtag">{tag}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="caption-section">
          <div className="caption-section__label">
            <MdTouchApp className="caption-section__label-icon" />
            Call to Action
          </div>
          <div className="cta-preview">{post.cta_text || ai_content.cta}</div>
        </div>

        {/* Actions */}
        <div className="post-actions">
          <button className="btn btn--outline">
            <MdSchedule /> Schedule
          </button>
          <button className="btn btn--primary">
            <MdSend /> Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarouselPreview;
