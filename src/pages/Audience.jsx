import '../styles/pages.css';

function Audience() {
  return (
    <div>
      <div className="page-header">
        <h2>Audience</h2>
        <p>Understand your followers and target demographics.</p>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Audience Insights</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">👥</div>
          <h3>Audience Analytics</h3>
          <p>Demographics, growth trends, and engagement heatmaps will appear here.</p>
        </div>
      </div>
    </div>
  );
}

export default Audience;
