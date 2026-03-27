import { NavLink } from 'react-router-dom';
import {
  MdDashboard,
  MdBarChart,
  MdCampaign,
  MdAddCircle,
  MdCalendarMonth,
  MdPeopleAlt,
  MdSettings,
  MdShare,
  MdArticle,
  MdAutoAwesome,
  MdLogout,
} from 'react-icons/md';
import { logout } from '../../services/api';

const navItems = [
  {
    section: 'Main',
    links: [
      { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
      { to: '/create', label: 'Create Post', icon: <MdAddCircle /> },
      { to: '/studio', label: 'Content Studio', icon: <MdAutoAwesome />, badge: 'AI' },
      { to: '/campaigns', label: 'Campaigns', icon: <MdCampaign /> },
      { to: '/content', label: 'Content Library', icon: <MdArticle /> },
      { to: '/calendar', label: 'Calendar', icon: <MdCalendarMonth /> },
      { to: '/content-calendar', label: 'Content Planner', icon: <MdCalendarMonth />, badge: 'AI' },
    ],
  },
  {
    section: 'Insights',
    links: [
      { to: '/analytics', label: 'Analytics', icon: <MdBarChart /> },
      { to: '/audience', label: 'Audience', icon: <MdPeopleAlt /> },
      { to: '/platforms', label: 'Platforms', icon: <MdShare /> },
    ],
  },
  {
    section: 'System',
    links: [
      { to: '/settings', label: 'Settings', icon: <MdSettings /> },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">R</div>
        <h2>Rayna Social</h2>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="sidebar__section-title">{group.section}</p>
            <ul>
              {group.links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                    }
                  >
                    <span className="sidebar__link-icon">{link.icon}</span>
                    {link.label}
                    {link.badge && <span className="sidebar__badge">{link.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={logout}
        className="sidebar__link"
        style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}
      >
        <span className="sidebar__link-icon"><MdLogout /></span>
        Sign Out
      </button>
    </aside>
  );
}

export default Sidebar;
