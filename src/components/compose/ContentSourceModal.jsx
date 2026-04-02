import { useState, useCallback, useEffect, useRef } from 'react';
import { MdClose } from 'react-icons/md';
import { composeEntry, pollJob } from '../../services/contentPlan';
import { resolveStockUrls } from '../../services/stockMedia';
import { CONTENT_SOURCE, STEP, extractPost } from './constants';
import SourcePicker from './SourcePicker';
import StockBrowser from './StockBrowser';
import DesignTemplatePicker from './DesignTemplatePicker';
import GeneratingPosterState from './GeneratingPosterState';
import '../../styles/compose.css';

// ─── Active jobs registry (survives modal close/reopen) ──

const activeJobs = new Map();

/**
 * ContentSourceModal — orchestrates the full create-post flow.
 *
 * On open: if an active job exists for this entry, skips straight to
 * the generating state and resumes polling. Otherwise shows source picker.
 */
export default function ContentSourceModal({ entry, onClose, onComposed }) {
  const existingJob = activeJobs.get(entry.id);

  const [step, setStep] = useState(existingJob ? STEP.GENERATING : STEP.SOURCE_SELECT);
  const [source, setSource] = useState(existingJob?.contentSource || null);
  const [composing, setComposing] = useState(!!existingJob);
  const [error, setError] = useState('');
  const [templateName, setTemplateName] = useState(existingJob?.templateName || '');
  const [stockPayload, setStockPayload] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);

  // Track whether this component instance is still mounted
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ─── Resume polling for an existing job on mount ──────

  useEffect(() => {
    if (!existingJob) return;
    resumePolling(existingJob.jobId, existingJob.templateName);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function resumePolling(jobId, tplName) {
    setStep(STEP.GENERATING);
    setComposing(true);
    setError('');
    setJobProgress(null);

    try {
      const completed = await pollJob(jobId, {
        interval: 3000,
        timeout: 600000,
        onProgress: (job) => {
          if (mountedRef.current) setJobProgress(job.progress || null);
        },
      });

      activeJobs.delete(entry.id);

      if (!mountedRef.current) return;

      const result = completed.result || completed;
      handleComposeSuccess(result, tplName);
    } catch (err) {
      activeJobs.delete(entry.id);

      if (!mountedRef.current) return;

      setError(err.message);
      setComposing(false);
      setJobProgress(null);
      setStep(STEP.TEMPLATE_SELECT);
    }
  }

  // ─── Step 1: Source selection ──────────────────────────

  const handleSourceSelect = useCallback((selectedSource) => {
    setSource(selectedSource);
    setError('');

    if (selectedSource === CONTENT_SOURCE.STOCK) {
      setStep(STEP.STOCK_BROWSER);
    } else {
      setStep(STEP.TEMPLATE_SELECT);
    }
  }, []);

  // ─── Step 2a: Stock images selected → save & advance ──

  async function handleStockNext({ selectedImages, uploadedFiles, applyOverlay, generateCaption }) {
    setError('');
    try {
      const stockUrls = selectedImages.length > 0
        ? await resolveStockUrls(selectedImages.map((img) => img.id))
        : [];

      setStockPayload({
        stock_image_urls: stockUrls,
        apply_overlay: applyOverlay,
        generate_ai_caption: generateCaption,
      });
      setStep(STEP.TEMPLATE_SELECT);
    } catch (err) {
      setError(err.message);
    }
  }

  // ─── Resolve compose result ───────────────────────────

  function handleComposeSuccess(res, tplName) {
    const post = extractPost(res);

    if (!post?.id) {
      throw new Error('Compose did not return a valid post.');
    }

    onComposed({
      post,
      entry: res.entry || entry,
      content_source: source,
      template_name: tplName || undefined,
    });
  }

  // ─── Shared compose call ──────────────────────────────

  async function doCompose(payload, tplName) {
    setTemplateName(tplName || '');
    setStep(STEP.GENERATING);
    setComposing(true);
    setError('');
    setJobProgress(null);

    try {
      const res = await composeEntry(entry.id, payload);

      // Async flow: BE returned 202 with job_id (template compose)
      if (res.job_id) {
        // Register so we can resume if modal is closed and reopened
        activeJobs.set(entry.id, {
          jobId: res.job_id,
          templateName: tplName || '',
          contentSource: source,
        });

        const completed = await pollJob(res.job_id, {
          interval: 3000,
          timeout: 600000,
          onProgress: (job) => {
            if (mountedRef.current) setJobProgress(job.progress || null);
          },
        });

        activeJobs.delete(entry.id);

        if (!mountedRef.current) return;

        const result = completed.result || completed;
        handleComposeSuccess(result, tplName);
        return;
      }

      // Sync flow: BE returned 200 with post directly (skip / no template)
      handleComposeSuccess(res, tplName);
    } catch (err) {
      activeJobs.delete(entry.id);

      if (!mountedRef.current) return;

      setError(err.message);
      setComposing(false);
      setJobProgress(null);
      setStep(STEP.TEMPLATE_SELECT);
    }
  }

  // ─── Step 2b: Template selected → compose with template ─

  function handleTemplateGenerate({ template_id, template_name, ai_image_prompt, num_images }) {
    const payload = {
      content_source: source,
      template_id,
      ai_image_prompt,
      num_images,
      ...(source === CONTENT_SOURCE.STOCK && stockPayload),
    };
    doCompose(payload, template_name);
  }

  // ─── Step 2c: Skip template → compose WITHOUT template ─

  function handleSkip() {
    const payload = {
      content_source: source,
      ...(source === CONTENT_SOURCE.STOCK && stockPayload),
    };
    doCompose(payload, '');
  }

  // ─── Navigation ────────────────────────────────────────

  function goToSourceSelect() {
    setStep(STEP.SOURCE_SELECT);
    setSource(null);
    setStockPayload(null);
    setError('');
    setComposing(false);
    setJobProgress(null);
  }

  function handleTemplateBack() {
    if (source === CONTENT_SOURCE.STOCK) {
      setStep(STEP.STOCK_BROWSER);
    } else {
      goToSourceSelect();
    }
  }

  // ─── Render ────────────────────────────────────────────

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

          {step === STEP.SOURCE_SELECT && (
            <SourcePicker entry={entry} onSelect={handleSourceSelect} />
          )}

          {step === STEP.STOCK_BROWSER && (
            <StockBrowser
              onCompose={handleStockNext}
              onBack={goToSourceSelect}
              composing={false}
              nextLabel="Next: Choose Design"
            />
          )}

          {step === STEP.TEMPLATE_SELECT && (
            <DesignTemplatePicker
              entry={entry}
              contentSource={source}
              onBack={handleTemplateBack}
              onGenerate={handleTemplateGenerate}
              onSkip={handleSkip}
              composing={composing}
            />
          )}

          {step === STEP.GENERATING && (
            <GeneratingPosterState
              templateName={templateName}
              contentSource={source}
              progress={jobProgress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
