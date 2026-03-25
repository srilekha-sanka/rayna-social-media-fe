import { MdPsychology } from 'react-icons/md';

function StepDecisionEngine({ data, onChange, product, campaign }) {
  const [mode, setMode] = [data._mode || 'auto', (m) => onChange({ ...data, _mode: m })];

  function set(field, value) {
    onChange({ ...data, [field]: value });
  }

  // Auto-compute intent from campaign data
  const offer = campaign.usp || product?.offers?.[0] || '';
  const usp = campaign.usp || product?.usp || '';

  let autoIntent = 'ENGAGEMENT';
  if (offer) autoIntent = 'SELL';
  else if (usp) autoIntent = 'VALUE';

  const intent = data.intent || autoIntent;

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--purple"><MdPsychology /></span>
          Decision Engine
        </div>
        <span className={`intent-badge intent-badge--${intent.toLowerCase()}`}>
          Intent: {intent}
        </span>
      </div>

      <div className="panel__body">
        {/* Mode Tabs */}
        <div className="decision-mode-tabs">
          <button
            className={`decision-mode-tab${data._mode === 'auto' || !data._mode ? ' decision-mode-tab--active-auto' : ''}`}
            onClick={() => { set('_mode', 'auto'); set('intent', autoIntent); }}
          >
            🤖 Auto (AI)
          </button>
          <button
            className={`decision-mode-tab${data._mode === 'edit' ? ' decision-mode-tab--active-edit' : ''}`}
            onClick={() => set('_mode', 'edit')}
          >
            ✏️ Edit Output
          </button>
          <button
            className={`decision-mode-tab${data._mode === 'manual' ? ' decision-mode-tab--active-manual' : ''}`}
            onClick={() => set('_mode', 'manual')}
          >
            📝 Manual Mode
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          {data._mode === 'auto' || !data._mode
            ? 'AI determines the post intent, visual hook, and CTA based on product & campaign data.'
            : data._mode === 'edit'
            ? 'AI generates first, then you can tweak any field before proceeding.'
            : 'You fill in every field manually — full creative control.'
          }
        </p>

        <div className="campaign-form">
          {/* What is this post about? */}
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="form-field__label">What is this post about?</label>
            <input
              className="form-field__input"
              placeholder={data._mode === 'auto' || !data._mode ? '(auto-filled by AI)' : 'Describe the post...'}
              value={data.post_about || ''}
              onChange={(e) => set('post_about', e.target.value)}
              readOnly={!data._mode || data._mode === 'auto'}
              style={(!data._mode || data._mode === 'auto') ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}}
            />
          </div>

          {/* What we sell */}
          <div className="form-field">
            <label className="form-field__label">What we sell?</label>
            <input
              className="form-field__input"
              placeholder={product?.name || 'Product name'}
              value={data.what_we_sell || product?.name || ''}
              onChange={(e) => set('what_we_sell', e.target.value)}
              readOnly={!data._mode || data._mode === 'auto'}
              style={(!data._mode || data._mode === 'auto') ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}}
            />
          </div>

          {/* USP */}
          <div className="form-field">
            <label className="form-field__label">USP</label>
            <input
              className="form-field__input"
              placeholder="Unique selling point..."
              value={data.usp || campaign.usp || ''}
              onChange={(e) => set('usp', e.target.value)}
              readOnly={!data._mode || data._mode === 'auto'}
              style={(!data._mode || data._mode === 'auto') ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}}
            />
          </div>

          {/* Visual Hook */}
          <div className="form-field">
            <label className="form-field__label">Visual Hook</label>
            <input
              className="form-field__input"
              placeholder="e.g. 46% OFF headline, product action shot"
              value={data.visual_hook || ''}
              onChange={(e) => set('visual_hook', e.target.value)}
              readOnly={!data._mode || data._mode === 'auto'}
              style={(!data._mode || data._mode === 'auto') ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}}
            />
          </div>

          {/* CTA */}
          <div className="form-field">
            <label className="form-field__label">CTA</label>
            <input
              className="form-field__input"
              placeholder="e.g. Book Now, Grab Deal"
              value={data.cta || ''}
              onChange={(e) => set('cta', e.target.value)}
              readOnly={!data._mode || data._mode === 'auto'}
              style={(!data._mode || data._mode === 'auto') ? { background: 'var(--bg-primary)', color: 'var(--text-secondary)' } : {}}
            />
          </div>

          {/* Intent Override */}
          <div className="form-field">
            <label className="form-field__label">Intent</label>
            <select
              className="form-field__input"
              value={intent}
              onChange={(e) => set('intent', e.target.value)}
              disabled={!data._mode || data._mode === 'auto'}
            >
              <option value="SELL">SELL (has offer)</option>
              <option value="VALUE">VALUE (has USP)</option>
              <option value="ENGAGEMENT">ENGAGEMENT</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepDecisionEngine;
