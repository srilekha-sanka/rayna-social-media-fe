import { useState } from 'react';
import { MdChevronLeft, MdAutoAwesome } from 'react-icons/md';

const IMAGE_STYLES = [
  { value: 'photo', label: 'Photo', emoji: '\uD83D\uDCF7' },
  { value: 'digital-art', label: 'Digital Art', emoji: '\uD83C\uDFA8' },
  { value: '3d', label: '3D', emoji: '\uD83E\uDDCA' },
  { value: 'painting', label: 'Painting', emoji: '\uD83D\uDD8C\uFE0F' },
];

const NUM_IMAGE_OPTIONS = [1, 2, 3, 4];

export default function AIGeneratorConfig({ entry, onGenerate, onBack, composing }) {
  const [style, setStyle] = useState('photo');
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(2);
  const [applyOverlay, setApplyOverlay] = useState(true);
  const [generateCaption, setGenerateCaption] = useState(true);

  function handleGenerate() {
    onGenerate({
      ai_image_style: style,
      ai_image_prompt: prompt.trim() || undefined,
      num_images: numImages,
      apply_overlay: applyOverlay,
      generate_ai_caption: generateCaption,
    });
  }

  return (
    <div className="csp__ai">
      <div className="csp__step-header">
        <button className="csp__back-btn" onClick={onBack}><MdChevronLeft /> Back</button>
        <h4>AI Generate</h4>
      </div>

      {/* ── Entry Context ── */}
      <div className="csp__ai-context">
        <span className="csp__ai-context-label">Creating for:</span>
        <strong>{entry.title || 'Untitled Entry'}</strong>
        <div className="csp__picker-meta">
          <span className="cc__type-tag">{entry.platform}</span>
          {entry.content_type && <span className="cc__type-tag">{entry.content_type}</span>}
        </div>
      </div>

      {/* ── Style Picker ── */}
      <div className="csp__ai-section">
        <label className="csp__ai-section-label">Image Style</label>
        <div className="csp__ai-style-grid">
          {IMAGE_STYLES.map((s) => (
            <button
              key={s.value}
              className={`csp__ai-style-card ${style === s.value ? 'csp__ai-style-card--active' : ''}`}
              onClick={() => setStyle(s.value)}
            >
              <span className="csp__ai-style-emoji">{s.emoji}</span>
              <span className="csp__ai-style-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Number of Images ── */}
      <div className="csp__ai-section">
        <label className="csp__ai-section-label">Number of images</label>
        <div className="csp__ai-num-picker">
          {NUM_IMAGE_OPTIONS.map((n) => (
            <button
              key={n}
              className={`csp__ai-num-btn ${numImages === n ? 'csp__ai-num-btn--active' : ''}`}
              onClick={() => setNumImages(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Prompt ── */}
      <div className="csp__ai-section">
        <label className="csp__ai-section-label">Additional prompt <span className="csp__optional">(optional)</span></label>
        <textarea
          className="csp__ai-prompt"
          rows="3"
          placeholder="e.g. Golden hour desert safari with luxury SUVs, dramatic sky..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <p className="csp__ai-tip">
          <MdAutoAwesome /> The entry title & brief are already included as context.
        </p>
      </div>

      {/* ── Options ── */}
      <div className="csp__options-panel">
        <h5>Options</h5>
        <label className="csp__checkbox">
          <input type="checkbox" checked={applyOverlay} onChange={(e) => setApplyOverlay(e.target.checked)} />
          <span>Apply text overlay on generated images</span>
        </label>
        <label className="csp__checkbox">
          <input type="checkbox" checked={generateCaption} onChange={(e) => setGenerateCaption(e.target.checked)} />
          <span>Generate AI caption & hashtags</span>
        </label>
      </div>

      {/* ── Footer ── */}
      <div className="csp__step-footer">
        <div />
        <button className="btn btn--primary" onClick={handleGenerate} disabled={composing}>
          {composing ? <><span className="cc__spinner" /> Generating...</> : <><MdAutoAwesome /> Generate</>}
        </button>
      </div>
    </div>
  );
}
