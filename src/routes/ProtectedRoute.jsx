import { Navigate, useLocation } from 'react-router-dom';
import useAppStore from 'store/appStore';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { accessToken } = useAppStore();

  if (!accessToken) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}
