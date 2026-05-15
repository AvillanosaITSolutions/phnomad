import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    setAccessToken(token);
    navigate('/dashboard', { replace: true });
  }, [navigate, searchParams, setAccessToken]);

  return <div className="p-8 text-center text-slate-600">Signing you in...</div>;
}