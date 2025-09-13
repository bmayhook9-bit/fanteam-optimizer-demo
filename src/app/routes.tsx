import { Navigate } from 'react-router-dom';

export function requireAuth(token: string | null, element: JSX.Element) {
  return token ? element : <Navigate to="/signup" />;
}
