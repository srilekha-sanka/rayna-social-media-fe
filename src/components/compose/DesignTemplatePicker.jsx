import { useState, useEffect } from 'react';
import { MdChevronLeft, MdErrorOutline, MdBolt, MdCheckCircle, MdSkipNext } from 'react-icons/md';
import { fetchDesignTemplates } from '../../services/contentPlan';
import {
  CONTENT_SOURCE,
  CONTENT_SOURCE_LABELS,
  TEMPLATE_PICKER_COPY,
  getMediaType,
  getProductInfo,
} from './constants';
import EntryContext from './EntryContext';
import DesignTemplateCard from './DesignTemplateCard';

// ─── In-memory cache (survives re-renders, cleared on page reload) ───

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCachedTemplates(mediaType) {
  const entry = cache.get(mediaType);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCachedTemplates(mediaType, data) {
  cache.set(mediaType, { data, ts: Date.now() });
}

// ─── Component ───────────────────────────────────────────

export default function DesignTemplatePicker({
  entry,
  contentSource,
  onBack,
  onGenerate,
  onSkip,
  composing,
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const mediaType = getMediaType(entry);
  const copy = TEMPLATE_PICKER_COPY[contentSource] || TEMPLATE_PICKER_COPY[CONTENT_SOURCE.AI_GENERATED];
  const isProduct = contentSource === CONTENT_SOURCE.PRODUCT;
  const { name: productName, thumbnail: productThumb } = getProductInfo(entry);
  const selectedTemplate = templates.find((t) => t.id === selectedId);
  const sourceLabel = CONTENT_SOURCE_LABELS[contentSource] || contentSource;

  // ─── Fetch templates with cache ────────────────────────

  useEffect(() => {
    const cached = getCachedTemplates(mediaType);
    if (cached) {
      setTemplates(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchDesignTemplates(mediaType)
      .then((res) => {
        if (cancelled) return;
        const list = res.templates || [];
        setCachedTemplates(mediaType, list);
        setTemplates(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mediaType]);

  // ─── Handlers ──────────────────────────────────────────

  function handleSelect(templateId) {
    setSelectedId(templateId === selectedId ? null : templateId);
  }

  function handleGenerate() {
    if (!selectedId) return;
    onGenerate({
      template_id: selectedId,
      template_name: selectedTemplate?.name || '',
      ai_image_prompt: additionalPrompt.trim() || undefined,
      num_images: 1,
    });
  }

  // ─── Render ────────────────────────────────────────────

  const hasTemplates = !loading && templates.length > 0;

  return (
    <div className="csp__ai">
      <div className="csp__step-header">
        <button className="csp__back-btn" onClick={onBack}><MdChevronLeft /> Back</button>
        <h4>{copy.heading}</h4>
      </div>

      <EntryContext entry={entry} />

      {/* Source badge */}
      <div className="csp__source-badge">
        <MdCheckCircle className="csp__source-badge-icon" />
        <span>Source: {sourceLabel}</span>
      </div>

      {/* Product image preview (PRODUCT flow only) */}
      {isProduct && productThumb && (
        <div className="csp__tpl-product-preview">
          <img src={productThumb} alt={productName || 'Product'} className="csp__tpl-product-img" />
          <div className="csp__tpl-product-info">
            <span className="csp__tpl-product-label">Base image</span>
            {productName && <span className="csp__tpl-product-name">{productName}</span>}
            <span className="csp__tpl-product-hint">The selected design will be applied on this image</span>
          </div>
        </div>
      )}

      <div className="csp__tpl-header">
        <h5 className="csp__tpl-title">Choose Design Style</h5>
        <p className="csp__tpl-subtitle">{copy.subtitle}</p>
      </div>

      {error && (
        <div className="csp__tpl-error">
          <MdErrorOutline />
          <span>Failed to load design templates. Please try again.</span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="csp__tpl-grid">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="csp__tpl-skeleton">
              <div className="csp__tpl-skeleton-thumb" />
              <div className="csp__tpl-skeleton-text" />
              <div className="csp__tpl-skeleton-text csp__tpl-skeleton-text--short" />
            </div>
          ))}
        </div>
      )}

      {/* Template grid */}
      {hasTemplates && (
        <div className="csp__tpl-grid">
          {templates.map((tpl) => (
            <DesignTemplateCard
              key={tpl.id}
              template={tpl}
              selected={selectedId === tpl.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Additional instructions */}
      {hasTemplates && (
        <div className="csp__tpl-extra-prompt">
          <label className="csp__ai-section-label">
            Additional instructions <span className="csp__optional">(optional)</span>
          </label>
          <textarea
            className="csp__ai-prompt"
            rows="2"
            placeholder={copy.placeholder}
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
          />
        </div>
      )}

      {/* Footer — Skip + Design Poster */}
      <div className="csp__step-footer">
        <button
          className="btn btn--ghost btn--skip"
          onClick={onSkip}
          disabled={composing}
        >
          <MdSkipNext /> Skip — Use Original
        </button>
        <button
          className="btn btn--primary btn--generate"
          onClick={handleGenerate}
          disabled={!selectedId || composing}
        >
          {composing
            ? <><span className="cc__spinner" /> Designing...</>
            : <><MdBolt /> Design Poster</>}
        </button>
      </div>
    </div>
  );
}
