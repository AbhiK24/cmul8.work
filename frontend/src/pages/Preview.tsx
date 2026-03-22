import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions } from '../api/client';

interface Agent {
  agent_id: string;
  name: string;
  role: string;
  relationship: string;
}

interface EnvData {
  company_name: string;
  company_description: string;
  scenario_tension: string;
  agents: Agent[];
}

interface LocationState {
  org_name?: string;
  role?: string;
  function?: string;
  industry?: string;
  stage?: string;
  session?: { session_id: string };
}

const relationshipColors: Record<string, string> = {
  manager: 'bg-blue-500',
  report: 'bg-amber-500',
  peer: 'bg-teal-500',
  client: 'bg-purple-500',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function Preview() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const { token } = useAuth();
  const state = location.state as LocationState | null;

  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [env, setEnv] = useState<EnvData | null>(null);
  const [error, setError] = useState('');

  // Use org_name from state (employer's actual company name)
  const orgName = state?.org_name || 'Your Company';

  useEffect(() => {
    async function loadSession() {
      if (!sessionId || !token) return;

      try {
        const data = await sessions.get(token, sessionId);
        if (data.env) {
          setEnv(data.env as unknown as EnvData);
        }
      } catch (err) {
        setError('Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [sessionId, token]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // TODO: Call regenerate API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRegenerating(false);
  };

  const handleApprove = () => {
    navigate(`/link/${sessionId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-dark" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted text-sm">Loading environment...</p>
        </div>
      </div>
    );
  }

  // Use env data if available, otherwise use defaults with org_name
  const displayData = {
    company_name: env?.company_name || orgName,
    company_description: env?.company_description || `Simulation environment for ${state?.role || 'the role'} at ${orgName}`,
    scenario_tension: env?.scenario_tension || 'The team is navigating a challenging project with competing priorities.',
    agents: env?.agents || [],
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-dark">WorkSim</h1>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {isRegenerating ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-dark" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-muted text-sm">Regenerating environment...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-dark">{displayData.company_name}</h2>
                <p className="text-muted text-sm mt-1">{displayData.company_description}</p>
              </div>

              <div className="flex items-start gap-2 mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-800 italic">{displayData.scenario_tension}</p>
              </div>

              {displayData.agents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wide text-muted mb-3">Agent cast</h3>
                  <div className="flex gap-4 flex-wrap">
                    {displayData.agents.map((agent) => (
                      <div key={agent.agent_id} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${relationshipColors[agent.relationship] || 'bg-gray-400'} text-white flex items-center justify-center text-xs font-medium`}>
                          {getInitials(agent.name)}
                        </div>
                        <span className="text-xs font-medium text-dark mt-1">{agent.name}</span>
                        <span className="text-[10px] text-muted">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-2.5 px-4 rounded-md font-medium text-sm border border-border text-mid hover:bg-surface transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-dark text-white py-2.5 px-4 rounded-md font-medium text-sm hover:opacity-90 transition-colors"
                >
                  Approve and get link
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
