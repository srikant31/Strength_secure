import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: 13,
      }}>
        <span className="spinner" style={{ marginRight: 10 }} /> Verifying session…
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
