import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setB2CToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (token) {
      // Store token and redirect to B2C dashboard
      setB2CToken(token);
      navigate('/practice', { replace: true });
    } else {
      setError('No token received');
    }
  }, [searchParams, navigate, setB2CToken]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-dark mb-2">Authentication failed</h1>
          <p className="text-muted mb-6">{error}</p>
          <a
            href="/signup"
            className="inline-block bg-dark text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
        <p className="text-muted">Signing you in...</p>
      </div>
    </div>
  );
}
