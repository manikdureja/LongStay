import { Navigate, useOutletContext } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { profile } = useOutletContext() || {};
  if (!profile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
