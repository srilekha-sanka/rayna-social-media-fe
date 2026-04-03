import { TEMPLATE_VISUALS, DEFAULT_TEMPLATE_VISUAL } from './constants';

export default function DesignTemplateCard({ template, selected, onSelect }) {
  const { icon: Icon, gradient } = TEMPLATE_VISUALS[template.slug] || DEFAULT_TEMPLATE_VISUAL;

  return (
    <button
      className={`csp__tpl-card ${selected ? 'csp__tpl-card--selected' : ''}`}
      onClick={() => onSelect(template.id)}
      type="button"
    >
      <div className="csp__tpl-thumb">
        {template.thumbnail_url ? (
          <img src={template.thumbnail_url} alt={template.name} className="csp__tpl-thumb-img" />
        ) : (
          <div className="csp__tpl-thumb-gradient" style={{ background: gradient }}>
            <Icon className="csp__tpl-thumb-icon" />
          </div>
        )}
        {selected && <div className="csp__tpl-check">✓</div>}
      </div>
      <div className="csp__tpl-info">
        <span className="csp__tpl-name">{template.name}</span>
        <span className="csp__tpl-desc">{template.description}</span>
      </div>
    </button>
  );
}
