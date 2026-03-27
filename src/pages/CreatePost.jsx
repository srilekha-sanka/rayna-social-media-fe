import { useState } from 'react';
import { MdCheck, MdArrowForward, MdArrowBack } from 'react-icons/md';
import StepContentGeneration from '../components/pipeline/StepContentGeneration';
import StepMediaEngine from '../components/pipeline/StepMediaEngine';
import StepPlatformFormat from '../components/pipeline/StepPlatformFormat';
import StepUTMBuilder from '../components/pipeline/StepUTMBuilder';
import StepApproval from '../components/pipeline/StepApproval';
import { PLATFORMS } from '../utils/platforms';
import '../styles/pages.css';
import '../styles/carousel.css';
import '../styles/pipeline.css';

const PIPELINE_STEPS = [
  { id: 'content', label: 'AI Content' },
  { id: 'media', label: 'Media Engine' },
  { id: 'platform', label: 'Platforms' },
  { id: 'utm', label: 'UTM Builder' },
  { id: 'approval', label: 'Approve & Publish' },
];

function CreatePost() {
  const [currentStep, setCurrentStep] = useState(0);

  // Pipeline state
  const [campaign] = useState({ name: '', city: '', goal: '', target_audience: '', usp: '', start_date: '', end_date: '' });
  const [selectedProduct] = useState(null);
  const [decision] = useState({ _mode: 'auto' });
  const [generatedData, setGeneratedData] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
  const [utm, setUtm] = useState({});
  const [slideCount] = useState(4);

  function canProceed() {
    switch (currentStep) {
      case 0: return generatedData;
      case 1: return generatedData;
      case 2: return selectedPlatforms.length > 0;
      case 3: return true;
      default: return true;
    }
  }

  function next() {
    if (canProceed() && currentStep < PIPELINE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function back() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function goToStep(i) {
    if (i <= currentStep) setCurrentStep(i);
  }

  function togglePlatform(id) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function selectAllPlatforms() {
    setSelectedPlatforms(
      selectedPlatforms.length === PLATFORMS.length ? [] : PLATFORMS.map((p) => p.id)
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Create Post</h2>
        <p>Follow the pipeline — AI Content → Media → Platforms → Publish.</p>
      </div>

      {/* Pipeline Tracker */}
      <div className="pipeline-tracker">
        {PIPELINE_STEPS.map((step, i) => {
          let state = '';
          if (i < currentStep) state = 'done';
          else if (i === currentStep) state = 'active';
          return (
            <div
              key={step.id}
              className={`pipeline-step pipeline-step--${state}${i <= currentStep ? ' pipeline-step--clickable' : ''}`}
              onClick={() => goToStep(i)}
            >
              <span className="pipeline-step__dot">
                {i < currentStep && <MdCheck size={8} style={{ color: '#fff', marginTop: -1 }} />}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <StepContentGeneration
          product={selectedProduct}
          campaign={campaign}
          decision={decision}
          platform={selectedPlatforms[0] || 'instagram'}
          slideCount={slideCount}
          onGenerated={(data) => { setGeneratedData(data); }}
        />
      )}

      {currentStep === 1 && (
        <StepMediaEngine generatedData={generatedData} />
      )}

      {currentStep === 2 && (
        <StepPlatformFormat
          selectedPlatforms={selectedPlatforms}
          onToggle={togglePlatform}
          onSelectAll={selectAllPlatforms}
        />
      )}

      {currentStep === 3 && (
        <StepUTMBuilder
          data={utm}
          onChange={setUtm}
          campaign={campaign}
          selectedPlatforms={selectedPlatforms}
        />
      )}

      {currentStep === 4 && (
        <StepApproval
          campaign={campaign}
          product={selectedProduct}
          decision={decision}
          generatedData={generatedData}
          selectedPlatforms={selectedPlatforms}
          utm={utm}
        />
      )}

      {/* Navigation Footer */}
      {(
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)',
        }}>
          <button
            className="btn btn--outline"
            onClick={back}
            disabled={currentStep === 0}
            style={currentStep === 0 ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            <MdArrowBack /> Back
          </button>

          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Step {currentStep + 1} of {PIPELINE_STEPS.length}
          </span>

          {currentStep < PIPELINE_STEPS.length - 1 && (
            <button
              className="btn btn--primary"
              onClick={next}
              disabled={!canProceed()}
              style={!canProceed() ? { opacity: 0.5, pointerEvents: 'none' } : {}}
            >
              Next <MdArrowForward />
            </button>
          )}

          {currentStep === PIPELINE_STEPS.length - 1 && (
            <div />
          )}
        </div>
      )}
    </div>
  );
}

export default CreatePost;
