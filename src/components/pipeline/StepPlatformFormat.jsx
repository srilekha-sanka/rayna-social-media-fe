import { MdShare } from 'react-icons/md';
import { PLATFORMS } from '../../utils/platforms';

function StepPlatformFormat({ selectedPlatforms, onToggle, onSelectAll }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--blue"><MdShare /></span>
          Platform Formatting
        </div>
        <button
          className="btn btn--outline btn--sm"
          onClick={onSelectAll}
        >
          {selectedPlatforms.length === PLATFORMS.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="panel__body">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Select which platforms to format and publish this content to. Each platform will be auto-formatted to its specs.
        </p>
        <div className="platform-grid">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPlatforms.includes(p.id);
            return (
              <div
                key={p.id}
                className={`platform-chip${isSelected ? ' platform-chip--selected' : ''}`}
                onClick={() => onToggle(p.id)}
              >
                <span className="platform-chip__icon" style={{ color: isSelected ? p.color : undefined }}>
                  <Icon />
                </span>
                {p.name}
              </div>
            );
          })}
        </div>

        {selectedPlatforms.length > 0 && (
          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Posting to <strong style={{ color: 'var(--text-primary)' }}>{selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepPlatformFormat;
