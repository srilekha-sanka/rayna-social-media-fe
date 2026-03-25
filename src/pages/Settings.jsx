import '../styles/pages.css';

function Settings() {
  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account and application preferences.</p>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Profile Settings</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon">⚙️</div>
          <h3>Settings Panel</h3>
          <p>Profile settings, connected accounts, and notification preferences will be configured here.</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
