import { useState } from 'react';
import { MdImage, MdVideocam } from 'react-icons/md';
import { getMediaUrl } from '../../services/api';

function StepMediaEngine({ generatedData }) {
  const [mediaSource, setMediaSource] = useState('existing');
  const slides = generatedData?.slides || [];

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--blue"><MdImage /></span>
          Image / Video Engine
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {slides.length} slides generated
        </span>
      </div>

      <div className="panel__body">
        {/* Source selection */}
        <div className="media-source-cards" style={{ marginBottom: 24 }}>
          <div
            className={`media-source-card${mediaSource === 'existing' ? ' media-source-card--selected' : ''}`}
            onClick={() => setMediaSource('existing')}
          >
            <div className="media-source-card__icon"><MdImage /></div>
            <div className="media-source-card__title">Use Existing Images</div>
            <div className="media-source-card__desc">Use product images from DB with overlay enhancement</div>
            <span className="media-source-card__tag media-source-card__tag--admin">Admin</span>
          </div>

          <div
            className={`media-source-card${mediaSource === 'ai-image' ? ' media-source-card--selected' : ''}`}
            onClick={() => setMediaSource('ai-image')}
          >
            <div className="media-source-card__icon">🎨</div>
            <div className="media-source-card__title">Generate with AI</div>
            <div className="media-source-card__desc">Create new images using Gemini AI</div>
            <span className="media-source-card__tag media-source-card__tag--ai">AI</span>
          </div>

          <div
            className={`media-source-card${mediaSource === 'ai-video' ? ' media-source-card--selected' : ''}`}
            onClick={() => setMediaSource('ai-video')}
          >
            <div className="media-source-card__icon"><MdVideocam /></div>
            <div className="media-source-card__title">Generate Video</div>
            <div className="media-source-card__desc">Create video using Veo3, Kling, or Seedance</div>
            <span className="media-source-card__tag media-source-card__tag--ai">AI</span>
          </div>
        </div>

        {/* Preview of generated slides */}
        {slides.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Generated Slides Preview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {slides.map((slide, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1/1' }}>
                  <img
                    src={getMediaUrl(slide.url || slide.processed_image)}
                    alt={`Slide ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '8px 10px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                  }}>
                    {slide.overlay_text}
                  </div>
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'var(--gradient-brand)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  }}>
                    Slide {slide.slide_number || i + 1}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StepMediaEngine;
