import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { GENERATING_TIPS, CONTENT_SOURCE } from './constants';

const PROGRESS_STEPS = [
  'Processing images with AI',
  'Generating caption & hashtags',
];

export default function GeneratingPosterState({ templateName, contentSource, progress }) {
  const tip = GENERATING_TIPS[contentSource] || GENERATING_TIPS[CONTENT_SOURCE.PRODUCT];
  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? PROGRESS_STEPS.length;
  const hasProgress = progress !== null && progress !== undefined;

  return (
    <div className="csp__generating">
      <div className="csp__generating-skeleton">
        <span className="cc__spinner cc__spinner--lg" />
      </div>

      <h4 className="csp__generating-title">Designing your poster...</h4>

      {templateName && (
        <p className="csp__generating-subtitle">
          Applying &ldquo;{templateName}&rdquo; to your image
        </p>
      )}

      {/* Progress steps */}
      {hasProgress && (
        <ul className="csp__generating-steps">
          {PROGRESS_STEPS.slice(0, total).map((label, i) => {
            const done = i < completed;
            const active = i === completed && completed < total;
            return (
              <li key={i} className={`csp__generating-step ${done ? 'csp__generating-step--done' : ''}`}>
                {done ? (
                  <MdCheckCircle className="csp__generating-step-icon csp__generating-step-icon--done" />
                ) : active ? (
                  <span className="cc__spinner csp__generating-step-icon" />
                ) : (
                  <MdRadioButtonUnchecked className="csp__generating-step-icon" />
                )}
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="csp__generating-tip">
        This may take 20–40 seconds. {tip}
      </p>
    </div>
  );
}
