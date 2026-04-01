import { useState, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import { composeEntry } from '../../services/contentPlan';
import { resolveStockUrls } from '../../services/stockMedia';
import SourcePicker from './SourcePicker';
import StockBrowser from './StockBrowser';
import AIGeneratorConfig from './AIGeneratorConfig';
import ComposeProgress from './ComposeProgress';
import '../../styles/compose.css';

/**
 * ContentSourceModal — orchestrates the content source selection flow.
 *
 * Steps:
 *   pick_source → stock_browser | ai_config | (PRODUCT → composing)
 *   stock_browser → composing
 *   ai_config → composing
 *   composing → done (calls onComposed) | error (back to pick_source)
 */
export default function ContentSourceModal({ entry, onClose, onComposed }) {
  const [step, setStep] = useState('pick_source');
  const [source, setSource] = useState(null);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState('');

  // ─── Source Selected (Step 1) ──────────────────────────
  const handleSourceSelect = useCallback((selectedSource) => {
    setSource(selectedSource);
    setError('');

    if (selectedSource === 'PRODUCT') {
      doCompose({ content_source: 'PRODUCT' });
    } else if (selectedSource === 'STOCK') {
      setStep('stock_browser');
    } else if (selectedSource === 'AI_GENERATED') {
      setStep('ai_config');
    }
  }, []);

  // ─── Compose API Call ──────────────────────────────────
  async function doCompose(payload) {
    setStep('composing');
    setComposing(true);
    setError('');
    try {
      const res = await composeEntry(entry.id, payload);
      const post = res.post || res.data?.post || res;

      if (!post?.id) {
        throw new Error('Compose did not return a valid post.');
      }

      onComposed({ post, entry: res.entry || entry, content_source: payload.content_source });
    } catch (err) {
      setError(err.message);
      setComposing(false);
      // Go back to source picker on error so user can retry
      setStep('pick_source');
    }
  }

  // ─── Stock Compose Handler ─────────────────────────────
  async function handleStockCompose({ selectedImages, uploadedFiles, applyOverlay, generateCaption }) {
    setStep('composing');
    setComposing(true);
    setError('');

    try {
      // Resolve full download URLs for selected Freepik images
      let stockUrls = [];
      if (selectedImages.length > 0) {
        stockUrls = await resolveStockUrls(selectedImages.map((img) => img.id));
      }

      // For uploaded files, we pass them as-is — the backend handles upload
      // If the API expects URLs only, we'd need a pre-upload step.
      // For now, send stock URLs; uploaded files would need a separate upload endpoint.
      const payload = {
        content_source: 'STOCK',
        stock_image_urls: stockUrls,
        apply_overlay: applyOverlay,
        generate_ai_caption: generateCaption,
      };

      await doCompose(payload);
    } catch (err) {
      setError(err.message);
      setComposing(false);
      setStep('stock_browser');
    }
  }

  // ─── AI Generate Handler ───────────────────────────────
  function handleAIGenerate(config) {
    doCompose({
      content_source: 'AI_GENERATED',
      ...config,
    });
  }

  // ─── Back Navigation ───────────────────────────────────
  function goBack() {
    setStep('pick_source');
    setSource(null);
    setError('');
  }

  return (
    <div className="cc__overlay" onClick={onClose}>
      <div className="cc__modal cc__modal--lg csp__modal" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3>Create Post</h3>
          <button onClick={onClose}><MdClose /></button>
        </div>

        <div className="cc__modal-body">
          {error && (
            <div className="cc__alert cc__alert--error" style={{ marginBottom: 16 }}>
              {error}
              <button onClick={() => setError('')}><MdClose /></button>
            </div>
          )}

          {step === 'pick_source' && (
            <SourcePicker entry={entry} onSelect={handleSourceSelect} />
          )}

          {step === 'stock_browser' && (
            <StockBrowser
              onCompose={handleStockCompose}
              onBack={goBack}
              composing={composing}
            />
          )}

          {step === 'ai_config' && (
            <AIGeneratorConfig
              entry={entry}
              onGenerate={handleAIGenerate}
              onBack={goBack}
              composing={composing}
            />
          )}

          {step === 'composing' && (
            <ComposeProgress source={source} />
          )}
        </div>
      </div>
    </div>
  );
}
