import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, type SessionResponse, type SessionDetailResponse, ApiError } from '../api/client';
import Logo from '../components/Logo';

// Role-based emoji mapping
function getRoleEmoji(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('engineer') || r.includes('developer') || r.includes('software')) return '💻';
  if (r.includes('product') || r.includes('pm')) return '🎯';
  if (r.includes('design') || r.includes('ux') || r.includes('ui')) return '🎨';
  if (r.includes('sales') || r.includes('account')) return '🤝';
  if (r.includes('marketing')) return '📣';
  if (r.includes('manager') || r.includes('lead') || r.includes('director')) return '👔';
  if (r.includes('data') || r.includes('analyst')) return '📊';
  if (r.includes('hr') || r.includes('people') || r.includes('recruit')) return '👥';
  if (r.includes('finance')) return '💰';
  if (r.includes('support') || r.includes('customer') || r.includes('success')) return '🎧';
  if (r.includes('ops') || r.includes('operation')) return '⚙️';
  if (r.includes('legal') || r.includes('compliance')) return '⚖️';
  if (r.includes('content') || r.includes('writer') || r.includes('editor')) return '✍️';
  if (r.includes('research')) return '🔬';
  return '💼';
}

// Skills tested based on role
function getTestedSkills(role: string): string[] {
  const r = role.toLowerCase();
  const baseSkills = ['Communication', 'Problem-solving'];

  if (r.includes('engineer') || r.includes('developer')) {
    return [...baseSkills, 'Technical depth', 'Collaboration', 'Code review'];
  }
  if (r.includes('product') || r.includes('pm')) {
    return [...baseSkills, 'Prioritization', 'Stakeholder mgmt', 'Strategic thinking'];
  }
  if (r.includes('design')) {
    return [...baseSkills, 'Design thinking', 'Feedback handling', 'User empathy'];
  }
  if (r.includes('sales')) {
    return [...baseSkills, 'Negotiation', 'Relationship building', 'Objection handling'];
  }
  if (r.includes('manager') || r.includes('lead')) {
    return [...baseSkills, 'Decision making', 'Team leadership', 'Conflict resolution'];
  }
  if (r.includes('data') || r.includes('analyst')) {
    return [...baseSkills, 'Analytical thinking', 'Data storytelling', 'Attention to detail'];
  }
  if (r.includes('support') || r.includes('customer')) {
    return [...baseSkills, 'Empathy', 'Conflict resolution', 'Patience'];
  }
  return [...baseSkills, 'Critical thinking', 'Adaptability'];
}

// Difficulty based on role seniority
function getRoleDifficulty(role: string): 'beginner' | 'intermediate' | 'advanced' {
  const r = role.toLowerCase();
  if (r.includes('senior') || r.includes('sr') || r.includes('lead') || r.includes('principal')) {
    return 'advanced';
  }
  if (r.includes('manager') || r.includes('director') || r.includes('head') || r.includes('vp')) {
    return 'advanced';
  }
  if (r.includes('mid') || r.includes('ii') || r.includes('2')) {
    return 'intermediate';
  }
  if (r.includes('junior') || r.includes('jr') || r.includes('entry') || r.includes('associate')) {
    return 'beginner';
  }
  return 'intermediate';
}

const difficultyConfig = {
  beginner: { label: 'Beginner', bars: 1, color: 'bg-emerald-500' },
  intermediate: { label: 'Intermediate', bars: 2, color: 'bg-amber-500' },
  advanced: { label: 'Advanced', bars: 3, color: 'bg-red-500' },
};

const statusConfig = {
  generating: { label: 'Generating', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  pending: { label: 'Ready', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  complete: { label: 'Complete', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  expired: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssessmentDetail() {
  const { role } = useParams();
  const { token } = useAuth();
  const [allSessions, setAllSessions] = useState<SessionResponse[]>([]);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ name: '', email: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedLink, setAssignedLink] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!token) return;

      try {
        const response = await sessions.list(token);
        setAllSessions(response.sessions);

        // Find first session for this role and get its details
        const firstSession = response.sessions.find(
          s => s.mode !== 'train' && s.role === decodeURIComponent(role || '')
        );
        if (firstSession) {
          const detail = await sessions.get(token, firstSession.session_id);
          setSessionDetail(detail);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load sessions');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token, role]);

  // Filter sessions for this WorkSim (by role)
  const workSimSessions = allSessions.filter(
    s => s.mode !== 'train' && s.role === decodeURIComponent(role || '')
  );

  // Get WorkSim info from first session
  const workSim = workSimSessions[0];

  const copyLink = (sessionId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateReport = async (sessionId: string) => {
    if (!token) return;
    setGeneratingReportId(sessionId);
    try {
      await sessions.generateReport(token, sessionId);
      const response = await sessions.list(token);
      setAllSessions(response.sessions);
    } catch {
      // Silent fail
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !sessionDetail || !assignForm.name || !assignForm.email) return;

    setIsAssigning(true);
    try {
      const orgParams = sessionDetail.org_params || {};
      const newSession = await sessions.create(token, {
        org_name: orgParams.org_name || workSim.org_name || '',
        role: workSim.role,
        industry: orgParams.industry || '',
        stage: orgParams.stage || '',
        function: orgParams.function || '',
        candidate_name: assignForm.name,
        candidate_email: assignForm.email,
        candidate_type: 'external',
      });
      setAssignedLink(newSession.candidate_link);
      // Refresh sessions list
      const response = await sessions.list(token);
      setAllSessions(response.sessions);
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setIsAssigning(false);
    }
  };

  const copyAssignedLink = () => {
    navigator.clipboard.writeText(assignedLink);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !workSim) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium text-dark mb-2">Error</h1>
          <p className="text-muted text-sm mb-4">{error || 'WorkSim not found'}</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = workSimSessions.filter(s => s.status === 'complete').length;
  const pendingCount = workSimSessions.filter(s => s.status === 'pending').length;
  const inProgressCount = workSimSessions.filter(s => s.status === 'in_progress').length;
  const emoji = getRoleEmoji(workSim.role);
  const skills = getTestedSkills(workSim.role);
  const difficultyLevel = getRoleDifficulty(workSim.role);
  const difficulty = difficultyConfig[difficultyLevel];

  // Extract scenario info from session detail
  const env = sessionDetail?.env as Record<string, unknown> | undefined;
  const companyName = env?.company_name as string || workSim.org_name || 'Custom Organization';
  const companyDescription = env?.company_description as string;
  const scenarioTension = env?.scenario_tension as string;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            to="/"
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
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-3xl">{emoji}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-semibold text-dark">{workSim.role}</h1>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  Assessment
                </span>
              </div>
              <p className="text-mid leading-relaxed">
                {companyName} • Evaluate candidates through realistic workplace scenarios
              </p>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~25 minutes
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
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="ml-auto flex items-center gap-1.5 bg-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Assign Candidate
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* The Scenario - if available */}
            {(companyDescription || scenarioTension) && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  The Scenario
                </h2>
                <div className="bg-surface rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-dark mb-1">{companyName}</p>
                  {companyDescription && (
                    <p className="text-sm text-mid">{companyDescription}</p>
                  )}
                </div>
                {scenarioTension && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800 mb-1">Current Situation</p>
                    <p className="text-sm text-amber-900">{scenarioTension}</p>
                  </div>
                )}
              </div>
            )}

            {/* What's Tested */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Skills Evaluated
              </h2>
              <ul className="space-y-3">
                {skills.map((skill, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-mid">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats Overview */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span>
                Assessment Stats
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
                  <div className="text-xs text-emerald-600">Completed</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
                  <div className="text-xs text-blue-600">In Progress</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
                  <div className="text-xs text-amber-600">Ready</div>
                </div>
              </div>
            </div>

            {/* Assigned Candidates Table */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-dark flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  Assigned Candidates
                </h2>
              </div>

              {workSimSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted text-sm">No candidates assigned yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Candidate</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Type</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Date</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workSimSessions.map((session) => {
                      const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
                      return (
                        <tr key={session.session_id} className="border-b border-border last:border-0 hover:bg-surface/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                                {session.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-dark text-sm">{session.candidate_name}</div>
                                <div className="text-xs text-muted">{session.candidate_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              session.candidate_type === 'internal' ? 'bg-dark/10 text-dark' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {session.candidate_type === 'internal' ? 'Benchmark' : 'External'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">{formatDate(session.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyLink(session.session_id, session.candidate_link)}
                                className="px-2 py-1 text-xs text-muted hover:text-dark transition-colors"
                              >
                                {copiedId === session.session_id ? '✓ Copied' : 'Copy Link'}
                              </button>
                              {session.has_report ? (
                                <Link
                                  to={`/report/${session.session_id}`}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100"
                                >
                                  View Report
                                </Link>
                              ) : session.status === 'complete' ? (
                                <button
                                  onClick={() => generateReport(session.session_id)}
                                  disabled={generatingReportId === session.session_id}
                                  className="px-2 py-1 bg-dark text-white rounded text-xs font-medium hover:bg-dark/90 disabled:opacity-50"
                                >
                                  {generatingReportId === session.session_id ? '...' : 'Generate'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Quick Info
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted mb-1">Organization</p>
                  <p className="text-sm font-medium text-dark">{companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Role</p>
                  <p className="text-sm font-medium text-dark">{workSim.role}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Difficulty</p>
                  <div className="flex items-center gap-1.5">
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
                    <span className="text-sm text-dark">{difficulty.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Duration</p>
                  <p className="text-sm font-medium text-dark">~25 minutes</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Total Candidates</p>
                  <p className="text-sm font-medium text-dark">{workSimSessions.length}</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="font-semibold text-dark mb-4 flex items-center gap-2">
                <span className="text-lg">💡</span>
                How It Works
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
                    1
                  </div>
                  <p className="text-sm text-mid">Candidate receives unique link</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
                    2
                  </div>
                  <p className="text-sm text-mid">They interact with AI coworkers in realistic scenarios</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
                    3
                  </div>
                  <p className="text-sm text-mid">You get detailed report on their soft skills</p>
                </div>
              </div>
            </div>

            {/* Assign Button */}
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full bg-dark text-white py-3 rounded-xl font-medium hover:bg-dark/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign New Candidate
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
                    <h3 className="text-lg font-semibold text-dark">Candidate Assigned!</h3>
                    <p className="text-sm text-muted mt-1">
                      Share this link with {assignForm.name}
                    </p>
                  </div>

                  <div className="bg-surface rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted mb-1">Assessment Link</p>
                    <p className="text-sm text-dark break-all font-mono">{assignedLink}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyAssignedLink}
                      className="flex-1 bg-dark text-white py-2.5 rounded-lg font-medium hover:bg-dark/90 transition-colors"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignModal(false);
                        setAssignedLink('');
                        setAssignForm({ name: '', email: '' });
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
                    Assign: {workSim.role}
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Enter candidate details to send them this assessment.
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
                          placeholder="John Smith"
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
                          placeholder="john@example.com"
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
                          'Send Assessment'
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
