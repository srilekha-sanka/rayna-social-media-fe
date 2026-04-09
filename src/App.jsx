import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthGuard from './components/common/AuthGuard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContentStudioHome from './pages/studio/ContentStudioHome';
import CarouselStudio from './pages/studio/CarouselStudio';
import ComingSoon from './pages/studio/ComingSoon';
import Calendar from './pages/Calendar';
import ContentCalendar from './pages/ContentCalendar';
import ReviewQueue from './pages/ReviewQueue';
import Analytics from './pages/Analytics';
import TopPosts from './pages/analytics/TopPosts';
import CampaignAnalytics from './pages/analytics/CampaignAnalytics';
import PostAnalytics from './pages/analytics/PostAnalytics';
import AccountFeed from './pages/analytics/AccountFeed';
import Audience from './pages/Audience';
import Platforms from './pages/Platforms';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/studio" element={<ContentStudioHome />} />
        <Route path="/studio/carousel" element={<CarouselStudio />} />
        <Route path="/studio/:type" element={<ComingSoon />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/content-calendar" element={<ContentCalendar />} />
        <Route path="/review-queue" element={<ReviewQueue />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/analytics/top-posts" element={<TopPosts />} />
        <Route path="/analytics/campaigns/:campaignId" element={<CampaignAnalytics />} />
        <Route path="/analytics/posts/:postId" element={<PostAnalytics />} />
        <Route path="/analytics/accounts/:accountId" element={<AccountFeed />} />
        <Route path="/audience" element={<Audience />} />
        <Route path="/platforms" element={<Platforms />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
