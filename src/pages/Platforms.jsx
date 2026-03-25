import { PLATFORMS } from '../utils/platforms';
import '../styles/pages.css';

function Platforms() {
  return (
    <div>
      <div className="page-header">
        <h2>Platforms</h2>
        <p>Manage connected social media accounts and view per-platform stats.</p>
      </div>

      <div className="stats-grid">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          return (
            <div className="stat-card" key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: p.color + '15',
                    color: p.color === '#000000' ? '#1a1a2e' : p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  <Icon />
                </span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
              </div>
              <p className="stat-card__label">Connected</p>
              <span className="badge badge--active">Active</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Platforms;
