import '../styles/pages.css';

const campaigns = [
  { id: 1, name: 'Spring Product Launch', platform: 'Multi-platform', status: 'active', reach: '45.2K', budget: '$2,500' },
  { id: 2, name: 'Brand Awareness Q1', platform: 'Instagram', status: 'active', reach: '28.1K', budget: '$1,800' },
  { id: 3, name: 'Holiday Promo', platform: 'Facebook', status: 'completed', reach: '62.4K', budget: '$3,200' },
  { id: 4, name: 'User Stories Series', platform: 'TikTok', status: 'draft', reach: '-', budget: '$1,000' },
  { id: 5, name: 'Newsletter Drive', platform: 'Twitter', status: 'paused', reach: '8.9K', budget: '$500' },
];

function Campaigns() {
  return (
    <div>
      <div className="page-header">
        <h2>Campaigns</h2>
        <p>Manage and monitor your marketing campaigns.</p>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">All Campaigns</h3>
          <button className="btn btn--primary">+ New Campaign</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Reach</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.platform}</td>
                  <td>
                    <span className={`badge badge--${c.status}`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td>{c.reach}</td>
                  <td>{c.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;
