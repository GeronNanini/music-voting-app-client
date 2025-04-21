import { Navigate } from 'react-router-dom';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const userName = localStorage.getItem('userName');

  if (!userName) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}