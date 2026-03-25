import '../styles/pages.css';

function Calendar() {
  return (
    <div>
      <div className="page-header">
        <h2>Content Calendar</h2>
        <p>Plan and schedule your posts across all platforms.</p>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">March 2026</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--outline btn--sm">Month</button>
            <button className="btn btn--outline btn--sm">Week</button>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">📅</div>
          <h3>Calendar View Coming Soon</h3>
          <p>Drag & drop scheduling with platform-specific post previews.</p>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
