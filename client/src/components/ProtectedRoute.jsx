import { Navigate, useLocation } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading && !user) {
    return <p className="p-8 text-center text-slate-500">{t('common.loading')}</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return children;
}
