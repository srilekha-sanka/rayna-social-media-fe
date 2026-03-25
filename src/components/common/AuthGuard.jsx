import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../../services/api';

function AuthGuard({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default AuthGuard;
