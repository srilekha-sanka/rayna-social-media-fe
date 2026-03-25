import '../styles/pages.css';

const metrics = [
  { label: 'Profile Views', value: '12.8K', change: '+18.2%', trend: 'up' },
  { label: 'Link Clicks', value: '3.2K', change: '+5.4%', trend: 'up' },
  { label: 'Shares', value: '876', change: '-1.2%', trend: 'down' },
  { label: 'Avg. Watch Time', value: '2m 34s', change: '+12s', trend: 'up' },
];

function Analytics() {
  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Track performance across all your social media platforms.</p>
      </div>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <div className="stat-card" key={metric.label}>
            <p className="stat-card__label">{metric.label}</p>
            <p className="stat-card__value">{metric.value}</p>
            <span className={`stat-card__change stat-card__change--${metric.trend}`}>
              {metric.change}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Engagement Over Time</h3>
          <button className="btn btn--outline">Last 30 Days</button>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">📊</div>
          <h3>Chart Coming Soon</h3>
          <p>This area will display engagement trends and performance graphs.</p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
