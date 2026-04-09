import { useLocation } from 'react-router-dom';
import { MdSearch, MdNotificationsNone } from 'react-icons/md';

const pageTitles = {
  '/': 'Dashboard',
  '/create': 'Create Post',
  '/studio': 'Content Studio',
  '/studio/carousel': 'Image Carousel',
  '/analytics': 'Analytics',
  '/analytics/top-posts': 'Top Posts',
  '/campaigns': 'Campaigns',
  '/calendar': 'Calendar',
  '/audience': 'Audience',
  '/platforms': 'Platforms',
  '/content': 'Content Library',
  '/settings': 'Settings',
};

function Header() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname]
    || (pathname.startsWith('/analytics/campaigns/') ? 'Campaign Analytics'
    : pathname.startsWith('/analytics/posts/') ? 'Post Analytics'
    : pathname.startsWith('/analytics/accounts/') ? 'Account Feed'
    : 'Dashboard');

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{title}</h1>
        <div className="header__search">
          <MdSearch size={18} color="var(--text-secondary)" />
          <input type="text" placeholder="Search content, campaigns..." />
        </div>
      </div>

      <div className="header__right">
        <button className="header__icon-btn">
          <MdNotificationsNone />
          <span className="notification-dot" />
        </button>
        <div className="header__avatar">RS</div>
      </div>
    </header>
  );
}

export default Header;
