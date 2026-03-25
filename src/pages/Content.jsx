import '../styles/pages.css';

const contentItems = [
  { id: 1, title: 'Product Photography Set', type: 'Image', status: 'Published', platform: 'Instagram', date: '2026-03-22' },
  { id: 2, title: 'How-to Tutorial Video', type: 'Video', status: 'Scheduled', platform: 'YouTube', date: '2026-03-25' },
  { id: 3, title: 'Industry Insights Blog', type: 'Article', status: 'Draft', platform: 'LinkedIn', date: '-' },
  { id: 4, title: 'Customer Testimonial Reel', type: 'Video', status: 'In Review', platform: 'TikTok', date: '2026-03-26' },
];

function Content() {
  return (
    <div>
      <div className="page-header">
        <h2>Content</h2>
        <p>Create, schedule, and manage your social media content.</p>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Content Library</h3>
          <button className="btn btn--primary">+ Create Content</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Platform</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {contentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.status}</td>
                  <td>{item.platform}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Content;
