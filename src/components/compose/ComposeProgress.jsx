import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';

const SOURCE_LABELS = {
  PRODUCT: 'Product Data',
  STOCK: 'Stock Media',
  AI_GENERATED: 'AI Generated',
};

const STEPS_BY_SOURCE = {
  PRODUCT: ['Fetching product data', 'Processing images', 'Applying overlay', 'Generating caption'],
  STOCK: ['Downloading stock images', 'Processing images', 'Applying overlay', 'Generating caption'],
  AI_GENERATED: ['Generating AI images', 'Processing images', 'Applying overlay', 'Generating caption'],
};

export default function ComposeProgress({ source }) {
  const label = SOURCE_LABELS[source] || source;
  const steps = STEPS_BY_SOURCE[source] || STEPS_BY_SOURCE.PRODUCT;

  return (
    <div className="csp__progress">
      <span className="cc__spinner cc__spinner--lg" />
      <h4 className="csp__progress-title">Creating your post...</h4>
      <p className="csp__progress-subtitle">Source: {label}</p>
      <ul className="csp__progress-steps">
        {steps.map((step, i) => (
          <li key={i} className="csp__progress-step">
            {i === 0 ? (
              <span className="csp__progress-icon csp__progress-icon--active">
                <span className="cc__spinner" />
              </span>
            ) : (
              <MdRadioButtonUnchecked className="csp__progress-icon" />
            )}
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
