import { MdLink } from 'react-icons/md';

function StepUTMBuilder({ data, onChange, campaign, selectedPlatforms }) {
  function set(field, value) {
    onChange({ ...data, [field]: value });
  }

  const baseUrl = data.base_url || '';
  const source = data.source || selectedPlatforms[0] || 'instagram';
  const medium = data.medium || 'social';
  const campaignParam = data.campaign || campaign.name?.toLowerCase().replace(/\s+/g, '_') || '';
  const content = data.content || '';
  const term = data.term || '';

  const params = [];
  if (source) params.push(`utm_source=${encodeURIComponent(source)}`);
  if (medium) params.push(`utm_medium=${encodeURIComponent(medium)}`);
  if (campaignParam) params.push(`utm_campaign=${encodeURIComponent(campaignParam)}`);
  if (content) params.push(`utm_content=${encodeURIComponent(content)}`);
  if (term) params.push(`utm_term=${encodeURIComponent(term)}`);

  const fullUrl = baseUrl ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.join('&')}` : '';

  return (
    <div className="panel">
      <div className="panel__header">
        <div className="panel__title">
          <span className="panel__title-icon panel__title-icon--green"><MdLink /></span>
          UTM Builder
        </div>
      </div>

      <div className="panel__body">
        <div className="campaign-form">
          <div className="form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="form-field__label">Base URL (Product Page)</label>
            <input
              className="form-field__input"
              placeholder="https://rayna.com/product/dubai-tour"
              value={baseUrl}
              onChange={(e) => set('base_url', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">utm_source</label>
            <input
              className="form-field__input"
              placeholder="instagram"
              value={source}
              onChange={(e) => set('source', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">utm_medium</label>
            <input
              className="form-field__input"
              placeholder="social"
              value={medium}
              onChange={(e) => set('medium', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">utm_campaign</label>
            <input
              className="form-field__input"
              placeholder="dubai_summer_sale"
              value={campaignParam}
              onChange={(e) => set('campaign', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">utm_content</label>
            <input
              className="form-field__input"
              placeholder="carousel_offer"
              value={content}
              onChange={(e) => set('content', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">utm_term</label>
            <input
              className="form-field__input"
              placeholder="video1, image_carousel"
              value={term}
              onChange={(e) => set('term', e.target.value)}
            />
          </div>
        </div>

        {fullUrl && (
          <div className="utm-preview">
            <span className="utm-base">{baseUrl}</span>
            <br />
            {params.map((p, i) => {
              const [key, val] = p.split('=');
              return (
                <span key={i}>
                  {i === 0 ? '?' : '&'}
                  <span className="utm-param">{key}</span>=<span className="utm-value">{decodeURIComponent(val)}</span>
                  <br />
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StepUTMBuilder;
