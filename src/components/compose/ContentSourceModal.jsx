import { useState, useCallback, useEffect } from 'react';
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

export default function ContentSourceModal({ entry, onClose, onComposed }) {
  const existingJob = activeJobs.get(entry.id);

  const [step, setStep] = useState(existingJob ? STEP.GENERATING : STEP.SOURCE_SELECT);
  const [source, setSource] = useState(existingJob?.contentSource || null);
  const [composing, setComposing] = useState(!!existingJob);
  const [error, setError] = useState('');
  const [templateName, setTemplateName] = useState(existingJob?.templateName || '');
  const [stockPayload, setStockPayload] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);

  // ─── Resume polling if a job was already running ──────

  useEffect(() => {
    if (!existingJob) return;

    let active = true;

    pollAndFinish(existingJob.jobId, existingJob.templateName, existingJob.contentSource, () => active);

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Core: poll job → extract result → call onComposed ─

  async function pollAndFinish(jobId, tplName, contentSource, isActive) {
    try {
      const completed = await pollJob(jobId, {
        interval: 3000,
        timeout: 600000,
        onProgress: (job) => {
          if (isActive()) setJobProgress(job.progress || null);
        },
      });

      activeJobs.delete(entry.id);

      // Extract result from completed job
      const result = completed.result || completed;
      const post = extractPost(result);

      if (!post?.id) {
        throw new Error('Compose did not return a valid post.');
      }

      // Always call onComposed — even if unmounted, the parent handles it
      onComposed({
        post,
        entry: result.entry || entry,
        content_source: result.content_source || contentSource,
        template_name: result.template_name || tplName || undefined,
      });
    } catch (err) {
      activeJobs.delete(entry.id);

      if (!isActive()) return;

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

  // ─── Compose call ─────────────────────────────────────

  async function doCompose(payload, tplName) {
    setTemplateName(tplName || '');
    setStep(STEP.GENERATING);
    setComposing(true);
    setError('');
    setJobProgress(null);

    // isActive always returns true for non-effect-based calls (user initiated)
    const alwaysActive = () => true;

    try {
      const res = await composeEntry(entry.id, payload);

      // Async flow: BE returned 202 with job_id
      if (res.job_id) {
        activeJobs.set(entry.id, {
          jobId: res.job_id,
          templateName: tplName || '',
          contentSource: source,
        });

        await pollAndFinish(res.job_id, tplName, source, alwaysActive);
        return;
      }

      // Sync flow: immediate result (skip / no template)
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
    } catch (err) {
      activeJobs.delete(entry.id);
      setError(err.message);
      setComposing(false);
      setJobProgress(null);
      setStep(STEP.TEMPLATE_SELECT);
    }
  }

  // ─── Step 2b: Template selected → compose with template

  function handleTemplateGenerate({ template_id, template_name, ai_image_prompt, num_images }) {
    doCompose({
      content_source: source,
      template_id,
      ai_image_prompt,
      num_images,
      ...(source === CONTENT_SOURCE.STOCK && stockPayload),
    }, template_name);
  }

  // ─── Step 2c: Skip template → compose WITHOUT template

  function handleSkip() {
    doCompose({
      content_source: source,
      ...(source === CONTENT_SOURCE.STOCK && stockPayload),
    }, '');
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
