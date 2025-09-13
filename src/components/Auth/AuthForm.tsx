import { useEffect, useRef, useState } from 'react';
import { showToast } from '../../utils/showToast';

export interface AuthFormProps {
  mode: 'signup' | 'login';
  onSuccess(token: string): void;
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    userRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        containerRef.current?.blur();
      } else if (e.key === 'Tab') {
        const focusable = [
          userRef.current,
          passRef.current,
          submitRef.current,
        ].filter(Boolean) as HTMLElement[];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (document.activeElement === last && !e.shiftKey) {
          e.preventDefault();
          first.focus();
        } else if (document.activeElement === first && e.shiftKey) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    const cur = containerRef.current;
    cur?.addEventListener('keydown', handleKeyDown);
    return () => cur?.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(
        `/api/auth/${mode === 'signup' ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Auth failed';
        setError(msg);
        showToast(msg, 'error');
        return;
      }
      localStorage.setItem('token', data.token);
      showToast('Signed in', 'success');
      onSuccess(data.token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          ref={userRef}
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-describedby={error ? 'auth-error' : undefined}
        />
        <label htmlFor="password">Password</label>
        <input
          ref={passRef}
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={error ? 'auth-error' : undefined}
        />
        {error && (
          <div id="auth-error" role="status" aria-live="polite">
            {error}
          </div>
        )}
        <button ref={submitRef} type="submit">
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
