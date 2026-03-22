import { useState, useEffect } from 'react';
import type { Agent, Task, ArtifactContent } from '../types';

interface OnboardingProps {
  companyName: string;
  companyDescription: string;
  scenarioTension: string;
  candidateName: string;
  role: string;
  agents: Agent[];
  tasks: Task[];
  artifact: ArtifactContent;
  onComplete: () => void;
}

// Generate DiceBear avatar URL
const avatarStyles = ['avataaars', 'personas', 'notionists', 'lorelei', 'adventurer'];
function getAvatarUrl(name: string, avatarUrl?: string, index: number = 0): string {
  if (avatarUrl) return avatarUrl;
  const style = avatarStyles[index % avatarStyles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${name.replace(/\s+/g, '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

const relationshipLabels: Record<string, string> = {
  manager: 'Your Manager',
  report: 'Reports to You',
  peer: 'Peer',
  client: 'Client',
  system: 'System',
};

const urgencyColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function Onboarding({
  companyName,
  companyDescription,
  scenarioTension,
  candidateName,
  role,
  agents,
  tasks,
  artifact,
  onComplete,
}: OnboardingProps) {
  // Random timer between 3-5 minutes (180-300 seconds)
  const [totalTime] = useState(() => Math.floor(Math.random() * 121) + 180);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [currentStep, setCurrentStep] = useState(0);
  const [canProceed, setCanProceed] = useState(false);

  const steps = [
    { id: 'scenario', label: 'Your Scenario' },
    { id: 'team', label: 'Meet Your Team' },
    { id: 'tasks', label: 'Your Tasks' },
    { id: 'ready', label: 'Ready to Start' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanProceed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Allow skipping after viewing all steps (min 30 seconds)
  useEffect(() => {
    if (currentStep === steps.length - 1 && timeLeft < totalTime - 30) {
      setCanProceed(true);
    }
  }, [currentStep, timeLeft, totalTime, steps.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-dark">Simulation Briefing</h1>
              <p className="text-xs text-muted">Read carefully before you begin</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-mono text-lg font-semibold ${timeLeft < 60 ? 'text-amber-600' : 'text-dark'}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-muted">Time to review</p>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-dark transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentStep === idx
                  ? 'bg-dark text-white'
                  : idx < currentStep
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
            >
              {idx < currentStep ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-4 text-center">{idx + 1}</span>
              )}
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Scenario */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <p className="text-sm text-muted mb-2">Welcome, {candidateName}</p>
                <h2 className="text-2xl font-semibold text-dark">Your Role at {companyName}</h2>
              </div>

              <div className="bg-white border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark">{role}</h3>
                    <p className="text-sm text-muted">{companyName}</p>
                  </div>
                </div>
                <p className="text-mid leading-relaxed">{companyDescription}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Current Situation</h3>
                    <p className="text-amber-900 text-sm leading-relaxed">{scenarioTension}</p>
                  </div>
                </div>
              </div>

              {artifact && (
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="font-medium text-dark">Key Document</h3>
                  </div>
                  <p className="text-sm text-mid">
                    You have access to a <strong>{artifact.title}</strong> that you may need to review and update during your session.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Team */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-dark">Meet Your Team</h2>
                <p className="text-muted mt-1">The people you'll be working with today</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {agents.map((agent, idx) => (
                  <div key={agent.agent_id} className="bg-white border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <img
                        src={getAvatarUrl(agent.name, agent.avatar_url, idx)}
                        alt={agent.name}
                        className="w-14 h-14 rounded-full bg-surface"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-dark">{agent.name}</h3>
                        <p className="text-sm text-muted">{agent.role}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                          agent.relationship_to_candidate === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                          agent.relationship_to_candidate === 'report' ? 'bg-emerald-100 text-emerald-700' :
                          agent.relationship_to_candidate === 'client' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {relationshipLabels[agent.relationship_to_candidate] || 'Colleague'}
                        </span>
                      </div>
                    </div>
                    {agent.archetype === 'difficult' && (
                      <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        May require extra rapport-building
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Tasks */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-dark">Your Tasks</h2>
                <p className="text-muted mt-1">What you need to accomplish in this session</p>
              </div>

              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div key={task.task_id} className="bg-white border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-dark text-white rounded-lg flex items-center justify-center text-sm font-semibold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-dark">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${urgencyColors[task.urgency]}`}>
                            {task.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-mid">{task.description}</p>
                        {task.required_info && task.required_info.length > 0 && (
                          <p className="mt-2 text-xs text-muted">
                            You may need information from: {task.required_info.map(r => {
                              const agent = agents.find(a => a.agent_id === r.agent_id);
                              return agent?.name;
                            }).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> You won't be able to complete everything. Prioritize based on urgency and impact.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-dark">You're Ready!</h2>
                <p className="text-muted mt-1">Here's a quick summary before you begin</p>
              </div>

              <div className="bg-white border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted">Company</p>
                    <p className="font-medium text-dark">{companyName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted">Your Role</p>
                    <p className="font-medium text-dark">{role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted">Team Members</p>
                    <p className="font-medium text-dark">{agents.length} colleagues</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted">Tasks</p>
                    <p className="font-medium text-dark">{tasks.length} to prioritize</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="font-medium text-dark mb-2">Remember:</h4>
                <ul className="text-sm text-mid space-y-1">
                  <li>• Respond thoughtfully to your colleagues</li>
                  <li>• Prioritize tasks based on urgency and impact</li>
                  <li>• You can't do everything — that's intentional</li>
                  <li>• Your behavior and decisions are being assessed</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm text-muted hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-dark' : idx < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:bg-dark/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onComplete}
              disabled={!canProceed}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {canProceed ? (
                <>
                  Start Simulation
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Review remaining...
                </>
              )}
            </button>
          )}
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
