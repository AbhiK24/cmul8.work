import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sessions, ApiError } from '../api/client';

interface SessionContext {
  candidate_name: string;
  company_name: string;
  role: string;
  status: string;
  ready: boolean;
  scenario_tension?: string;
}

export default function CandidateLanding() {
  const navigate = useNavigate();
  const { sessionId, token } = useParams();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function loadContext() {
      if (!sessionId || !token) return;

      try {
        const data = await sessions.getContext(sessionId, token);
        setContext(data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError('Invalid session link. Please check your invitation email for the correct link.');
          } else if (err.status === 404) {
            setError('Session not found. It may have been deleted.');
          } else if (err.status === 410) {
            setError('This session has expired.');
          } else {
            setError(err.message || 'Unable to load session');
          }
        } else {
          setError('Session not found or expired');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadContext();

    // Poll for ready status if generating
    const interval = setInterval(async () => {
      if (!sessionId || !token) return;
      try {
        const data = await sessions.getContext(sessionId, token);
        setContext(data);
        if (data.ready) clearInterval(interval);
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, token]);

  const handleStart = async () => {
    if (!context?.ready) return;
    setIsStarting(true);
    navigate(`/sim/${sessionId}/${token}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-medium text-dark mb-2">Session Unavailable</h1>
          <p className="text-muted text-sm">{error || 'This session could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold text-dark mb-2">{context.company_name}</h1>
        <p className="text-muted text-sm mb-8">{context.role}</p>

        <div className="border-t border-border my-8" />

        {context.ready ? (
          <>
            <p className="text-mid text-sm leading-relaxed mb-8">
              Welcome, <span className="font-medium">{context.candidate_name}</span>. Your simulation is ready.
              You'll have 45 minutes to navigate a realistic work scenario with competing priorities and stakeholder interactions.
            </p>

            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all"
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting...
                </span>
              ) : (
                'Start simulation'
              )}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted text-sm">Generating your simulation environment...</p>
            <p className="text-xs text-muted mt-2">This may take a minute.</p>
          </div>
        )}

        <p className="text-xs text-muted mt-6">This session is recorded for assessment purposes.</p>
      </div>
    </div>
  );
}
