import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock environment data for preview
const mockEnv = {
  company_name: 'Meridian Analytics',
  company_description: 'Series A B2B SaaS company building predictive analytics for supply chain optimization.',
  scenario_tension: 'The team is dealing with a critical client escalation while preparing for a board meeting.',
  agents: [
    { agent_id: '1', name: 'Sarah Chen', role: 'VP Product', relationship: 'manager' },
    { agent_id: '2', name: 'Marcus Webb', role: 'Senior Analyst', relationship: 'report' },
    { agent_id: '3', name: 'Priya Patel', role: 'Data Engineer', relationship: 'peer' },
    { agent_id: '4', name: 'James Morrison', role: 'Client Success', relationship: 'client' },
  ],
};

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
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Mock regeneration
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRegenerating(false);
  };

  const handleApprove = () => {
    navigate(`/link/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-dark">WorkSim</h1>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {isRegenerating ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-muted text-sm">Regenerating environment...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-dark">{mockEnv.company_name}</h2>
                <p className="text-muted text-sm mt-1">{mockEnv.company_description}</p>
              </div>

              <div className="flex items-start gap-2 mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <svg
                  className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-amber-800 italic">{mockEnv.scenario_tension}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wide text-muted mb-3">Agent cast</h3>
                <div className="flex gap-4 flex-wrap">
                  {mockEnv.agents.map((agent) => (
                    <div key={agent.agent_id} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full ${relationshipColors[agent.relationship]} text-white flex items-center justify-center text-xs font-medium`}
                      >
                        {getInitials(agent.name)}
                      </div>
                      <span className="text-xs font-medium text-dark mt-1">{agent.name}</span>
                      <span className="text-[10px] text-muted">{agent.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-2.5 px-4 rounded-md font-medium text-sm border border-border text-mid hover:bg-surface transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-primary text-white py-2.5 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
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
