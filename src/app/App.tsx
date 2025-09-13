import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import AuthForm from '../components/Auth/AuthForm';
import { requireAuth } from './routes';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const handleSuccess = (t: string) => setToken(t);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signup"
          element={<AuthForm mode="signup" onSuccess={handleSuccess} />}
        />
        <Route
          path="/login"
          element={<AuthForm mode="login" onSuccess={handleSuccess} />}
        />
        <Route path="/" element={requireAuth(token, <div>Welcome</div>)} />
      </Routes>
    </BrowserRouter>
  );
}
