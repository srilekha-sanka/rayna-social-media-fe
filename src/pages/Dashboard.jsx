import { PLATFORMS } from '../utils/platforms';
import '../styles/pages.css';

const stats = [
  { label: 'Total Followers', value: '124.5K', change: '+12.5%', trend: 'up' },
  { label: 'Engagement Rate', value: '4.8%', change: '+0.6%', trend: 'up' },
  { label: 'Scheduled Posts', value: '28', change: '+8', trend: 'up' },
  { label: 'Impressions', value: '289.2K', change: '-2.1%', trend: 'down' },
];

const recentPosts = [
  { id: 1, title: 'Product Launch Announcement', platforms: ['instagram', 'facebook', 'x'], engagement: '2.4K', status: 'Published', date: '2026-03-22' },
  { id: 2, title: 'Behind the Scenes Video', platforms: ['tiktok', 'youtube', 'instagram'], engagement: '5.1K', status: 'Published', date: '2026-03-21' },
  { id: 3, title: 'Customer Spotlight Thread', platforms: ['x', 'linkedin', 'threads'], engagement: '892', status: 'Scheduled', date: '2026-03-25' },
  { id: 4, title: 'Weekly Tips Carousel', platforms: ['instagram', 'pinterest', 'facebook'], engagement: '-', status: 'Draft', date: '-' },
];

function PlatformIcons({ platformIds }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {platformIds.map((id) => {
        const p = PLATFORMS.find((pl) => pl.id === id);
        if (!p) return null;
        const Icon = p.icon;
        return (
          <span
            key={id}
            title={p.name}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: p.color === '#000000' ? '#1a1a2e' : p.color + '15',
              color: p.color === '#000000' ? '#1a1a2e' : p.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}
          >
            <Icon />
          </span>
        );
      })}
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h2>Welcome back!</h2>
        <p>Here's what's happening across your 12 social channels.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <p className="stat-card__label">{stat.label}</p>
            <p className="stat-card__value">{stat.value}</p>
            <span className={`stat-card__change stat-card__change--${stat.trend}`}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Connected Platforms */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__header">
          <h3 className="card__title">Connected Platforms</h3>
          <button className="btn btn--outline btn--sm">Manage</button>
        </div>
        <div className="platform-grid">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="platform-chip platform-chip--selected">
                <span className="platform-chip__icon" style={{ color: p.color }}>
                  <Icon />
                </span>
                {p.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Recent Posts</h3>
          <button className="btn btn--outline btn--sm">View All</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Platforms</th>
                <th>Engagement</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.id}>
                  <td style={{ fontWeight: 600 }}>{post.title}</td>
                  <td><PlatformIcons platformIds={post.platforms} /></td>
                  <td>{post.engagement}</td>
                  <td>
                    <span className={`badge badge--${post.status === 'Published' ? 'active' : post.status === 'Scheduled' ? 'paused' : 'draft'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
