import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/layout.css';

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout__content">
        <Header />
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
