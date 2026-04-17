import { useState, useEffect } from 'react';
import { MdClose, MdBolt, MdErrorOutline, MdCheckCircle } from 'react-icons/md';
import { fetchDesignTemplates, composeAllPlan, pollJob } from '../../services/contentPlan';
import { CONTENT_SOURCE, getMediaType, getTemplateExample } from './constants';
import DesignTemplateCard from './DesignTemplateCard';
import '../../styles/compose.css';

export default function ComposeAllModal({ planId, entries, onClose, onDone }) {
  const mediaType = entries.length > 0 ? getMediaType(entries[0]) : 'image';

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const [composing, setComposing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, failed: 0, total: entries.length });
  const [composeError, setComposeError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDesignTemplates(mediaType)
      .then((res) => {
        if (cancelled) return;
        setTemplates(res.templates || []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mediaType]);

  async function handleComposeAll() {
    if (!selectedId || composing || !planId) return;
    const tpl = templates.find((t) => t.id === selectedId);
    setComposing(true);
    setComposeError('');
    setProgress({ completed: 0, failed: 0, total: entries.length });

    try {
      const payload = {
        template_id: selectedId,
        entry_ids: entries.map((e) => e.id),
        content_source: CONTENT_SOURCE.PRODUCT,
        concurrency: 1,
        ...(additionalPrompt.trim() ? { ai_image_prompt: additionalPrompt.trim() } : {}),
      };
      const res = await composeAllPlan(planId, payload);
      if (!res?.job_id) throw new Error('Batch compose did not return a job.');

      setProgress({ completed: 0, failed: 0, total: res.total ?? entries.length });

      const completed = await pollJob(res.job_id, {
        interval: 3000,
        timeout: 1800000,
        onProgress: (job) => {
          const p = job.progress || {};
          setProgress({
            completed: p.completed ?? 0,
            failed: p.failed ?? 0,
            total: p.total ?? res.total ?? entries.length,
          });
        },
      });

      const result = completed.result || completed;
      const summaryData = result.summary || {};
      const done = summaryData.completed ?? summaryData.succeeded ?? (result.entries || []).filter((e) => e.status === 'COMPOSING' || e.post_id).length;
      const failed = summaryData.failed ?? (result.entries || []).filter((e) => e.status === 'FAILED' || e.error).length;
      const total = summaryData.total ?? res.total ?? entries.length;

      setProgress({ completed: done, failed, total });

      if (failed === total && total > 0) {
        setComposeError('All compose jobs failed. Please try again.');
        setComposing(false);
        return;
      }

      const tplName = res.template_name || tpl?.name || 'selected style';
      const msg = failed > 0
        ? `${done} composed, ${failed} failed (${tplName})`
        : `${done} posts composed with ${tplName}`;
      onDone(msg);
    } catch (err) {
      setComposeError(err.message || 'Failed to compose entries.');
      setComposing(false);
    }
  }

  const [peekTpl, setPeekTpl] = useState(null);

  return (
    <div className="cc__overlay" onClick={composing ? undefined : onClose}>
      <div className="cc__modal cc__modal--lg csp__modal" onClick={(e) => e.stopPropagation()}>
        <div className="cc__modal-header">
          <h3>Compose All — Choose Design Style</h3>
          <button onClick={onClose} disabled={composing}><MdClose /></button>
        </div>

        <div className="cc__modal-body">
          <div className="csp__source-badge">
            <MdCheckCircle className="csp__source-badge-icon" />
            <span>Applying to {entries.length} approved {entries.length === 1 ? 'entry' : 'entries'}</span>
          </div>

          {loadError && (
            <div className="csp__tpl-error">
              <MdErrorOutline />
              <span>Failed to load design templates. Please try again.</span>
            </div>
          )}

          <div className="csp__tpl-header">
            <h5 className="csp__tpl-title">Choose Design Style</h5>
            <p className="csp__tpl-subtitle">
              The selected style will be applied to all approved entries.
            </p>
          </div>

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

          {!loading && templates.length > 0 && (
            <div className="csp__tpl-grid">
              {templates.map((tpl) => (
                <DesignTemplateCard
                  key={tpl.id}
                  template={tpl}
                  selected={selectedId === tpl.id}
                  onSelect={(id) => !composing && setSelectedId(id === selectedId ? null : id)}
                  onPeek={getTemplateExample(tpl) ? setPeekTpl : null}
                />
              ))}
            </div>
          )}

          {!loading && templates.length > 0 && (
            <div className="csp__tpl-extra-prompt">
              <label className="csp__ai-section-label">
                Additional instructions <span className="csp__optional">(optional)</span>
              </label>
              <textarea
                className="csp__ai-prompt"
                rows="2"
                placeholder="Apply these instructions to every entry (e.g., 'use vibrant colors')"
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                disabled={composing}
              />
            </div>
          )}

          {composing && (
            <div className="cc-compose-all__progress">
              <span className="cc__spinner" />
              <span>
                Composing {progress.completed + progress.failed} of {progress.total}
                {progress.failed > 0 && ` (${progress.failed} failed)`}
              </span>
            </div>
          )}

          {composeError && (
            <div className="cc__alert cc__alert--error" style={{ marginTop: 12 }}>
              {composeError}
            </div>
          )}

          <div className="csp__step-footer">
            <button className="btn btn--ghost" onClick={onClose} disabled={composing}>
              Cancel
            </button>
            <button
              className="btn btn--primary btn--generate"
              onClick={handleComposeAll}
              disabled={!selectedId || composing || loading}
            >
              {composing
                ? <><span className="cc__spinner" /> Composing {progress.completed + progress.failed}/{progress.total}...</>
                : <><MdBolt /> Compose All ({entries.length})</>}
            </button>
          </div>
        </div>

        {peekTpl && (
          <div className="csp__peek" onClick={() => setPeekTpl(null)} role="dialog" aria-modal="true">
            <div className="csp__peek-card" onClick={(e) => e.stopPropagation()}>
              <button className="csp__peek-close" onClick={() => setPeekTpl(null)} aria-label="Close preview">
                <MdClose />
              </button>
              <div className="csp__peek-image-wrap">
                {getTemplateExample(peekTpl) ? (
                  <img src={getTemplateExample(peekTpl)} alt={peekTpl.name} className="csp__peek-image" />
                ) : (
                  <div className="csp__peek-placeholder">No preview available</div>
                )}
              </div>
              <div className="csp__peek-body">
                <span className="csp__peek-eyebrow">Sample output</span>
                <h4 className="csp__peek-title">{peekTpl.name}</h4>
                {peekTpl.description && <p className="csp__peek-desc">{peekTpl.description}</p>}
                <button
                  className="btn btn--primary"
                  onClick={() => { setSelectedId(peekTpl.id); setPeekTpl(null); }}
                >
                  <MdBolt /> Use this style
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
