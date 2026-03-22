import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { templates, type TemplateDetail } from '../api/client';
import Logo from '../components/Logo';

const difficultyConfig = {
  beginner: { label: 'Beginner', bars: 1, color: 'bg-emerald-500' },
  intermediate: { label: 'Intermediate', bars: 2, color: 'bg-amber-500' },
  advanced: { label: 'Advanced', bars: 3, color: 'bg-red-500' },
};

const categoryIcons: Record<string, string> = {
  feedback: '💬',
  prioritization: '📋',
  communication: '🔥',
  assertiveness: '✋',
};

// DiceBear avatar helper
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
};

export default function TrainingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ name: '', email: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedLink, setAssignedLink] = useState('');

  useEffect(() => {
    async function loadTemplate() {
      if (!token || !slug) return;

      try {
        const data = await templates.get(token, slug);
        setTemplate(data);
      } catch (err) {
        setError('Template not found');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplate();
  }, [token, slug]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !slug || !assignForm.name || !assignForm.email) return;

    setIsAssigning(true);
    try {
      const session = await templates.createSession(token, {
        template_slug: slug,
        candidate_name: assignForm.name,
        candidate_email: assignForm.email,
      });
      setAssignedLink(session.candidate_link);
    } catch (err) {
      setError('Failed to create training session');
    } finally {
      setIsAssigning(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(assignedLink);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium text-dark mb-2">Error</h1>
          <p className="text-muted text-sm mb-4">{error || 'Template not found'}</p>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const difficulty = difficultyConfig[template.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            to="/dashboard"
            className="text-sm text-muted hover:text-dark transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-3xl">
                {categoryIcons[template.skill_category] || '📚'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-dark mb-2">{template.title}</h1>
              <p className="text-mid leading-relaxed">{template.description}</p>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~{template.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-3 rounded-sm ${
                          i <= difficulty.bars ? difficulty.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted">{difficulty.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Objectives */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                What You'll Learn
              </h2>
              <ul className="space-y-3">
                {template.learning_objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-mid">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Scenario */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">📖</span>
                The Scenario
              </h2>
              <div className="bg-surface rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-dark mb-1">
                  {template.company_context.company_name}
                </p>
                <p className="text-sm text-mid">
                  {template.company_context.company_description}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-1">Current Situation</p>
                <p className="text-sm text-amber-900">
                  {template.company_context.scenario_tension}
                </p>
              </div>
            </div>

            {/* Framework Reference */}
            {template.framework_reference && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  Framework: {template.framework_name}
                </h2>
                <div className="space-y-4">
                  {template.framework_reference.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-semibold shrink-0">
                        {step.letter}
                      </div>
                      <div>
                        <p className="font-medium text-dark">{step.name}</p>
                        <p className="text-sm text-muted">{step.description}</p>
                        {step.example && (
                          <p className="text-sm text-indigo-600 mt-1 italic">"{step.example}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {template.framework_reference.pro_tip && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-800">
                      <strong>Pro tip:</strong> {template.framework_reference.pro_tip}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Who You'll Meet */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">👥</span>
                Who You'll Meet
              </h2>
              <div className="space-y-4">
                {template.agents.map((agent, i) => (
                  <div key={agent.agent_id} className="flex items-start gap-3">
                    <img
                      src={getAvatarUrl(agent.name, agent.avatar_url, i)}
                      alt={agent.name}
                      className="w-10 h-10 rounded-full bg-surface"
                    />
                    <div>
                      <p className="font-medium text-dark text-sm">{agent.name}</p>
                      <p className="text-xs text-muted">{agent.role}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        agent.relationship_to_candidate === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                        agent.relationship_to_candidate === 'report' ? 'bg-emerald-100 text-emerald-700' :
                        agent.relationship_to_candidate === 'client' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {relationshipLabels[agent.relationship_to_candidate] || 'Colleague'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            {template.tasks.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Tasks
                </h2>
                <div className="space-y-3">
                  {template.tasks.map((task) => (
                    <div key={task.task_id} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        task.urgency === 'high' ? 'bg-red-500' :
                        task.urgency === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-dark">{task.title}</p>
                        <p className="text-xs text-muted">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign Button */}
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full bg-dark text-white py-3 rounded-xl font-medium hover:bg-dark/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Assign to Team Member
            </button>
          </div>
        </div>
      </main>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              {assignedLink ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-dark">Training Assigned!</h3>
                    <p className="text-sm text-muted mt-1">
                      Share this link with {assignForm.name}
                    </p>
                  </div>

                  <div className="bg-surface rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted mb-1">Training Link</p>
                    <p className="text-sm text-dark break-all font-mono">{assignedLink}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyLink}
                      className="flex-1 bg-dark text-white py-2.5 rounded-lg font-medium hover:bg-dark/90 transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignModal(false);
                        setAssignedLink('');
                        setAssignForm({ name: '', email: '' });
                        navigate('/dashboard');
                      }}
                      className="flex-1 border border-border py-2.5 rounded-lg font-medium hover:bg-surface transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-dark mb-1">
                    Assign Training: {template.title}
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Enter the team member's details to create their training session.
                  </p>

                  <form onSubmit={handleAssign}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={assignForm.name}
                          onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                          placeholder="Alex Thompson"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={assignForm.email}
                          onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                          placeholder="alex@company.com"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        className="flex-1 border border-border py-2.5 rounded-lg font-medium hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAssigning || !assignForm.name || !assignForm.email}
                        className="flex-1 bg-dark text-white py-2.5 rounded-lg font-medium hover:bg-dark/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isAssigning ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating...
                          </>
                        ) : (
                          'Create Training Session'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
