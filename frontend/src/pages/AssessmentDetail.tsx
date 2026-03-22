import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, type SessionResponse, ApiError } from '../api/client';
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
  if (r.includes('finance') || r.includes('account')) return '💰';
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
    return [...baseSkills, 'Technical depth', 'Collaboration'];
  }
  if (r.includes('product') || r.includes('pm')) {
    return [...baseSkills, 'Prioritization', 'Stakeholder mgmt'];
  }
  if (r.includes('design')) {
    return [...baseSkills, 'Design thinking', 'Feedback handling'];
  }
  if (r.includes('sales')) {
    return [...baseSkills, 'Negotiation', 'Relationship building'];
  }
  if (r.includes('manager') || r.includes('lead')) {
    return [...baseSkills, 'Decision making', 'Team leadership'];
  }
  if (r.includes('data') || r.includes('analyst')) {
    return [...baseSkills, 'Analytical thinking', 'Data storytelling'];
  }
  if (r.includes('support') || r.includes('customer')) {
    return [...baseSkills, 'Empathy', 'Conflict resolution'];
  }
  return [...baseSkills, 'Critical thinking', 'Adaptability'];
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      if (!token) return;

      try {
        const response = await sessions.list(token);
        setAllSessions(response.sessions);
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

    loadSessions();
  }, [token]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !workSim) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">{error || 'WorkSim not found'}</p>
          <Link to="/" className="text-dark hover:opacity-70">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const completedCount = workSimSessions.filter(s => s.status === 'complete').length;
  const pendingCount = workSimSessions.filter(s => s.status === 'pending').length;
  const inProgressCount = workSimSessions.filter(s => s.status === 'in_progress').length;
  const emoji = getRoleEmoji(workSim.role);
  const skills = getTestedSkills(workSim.role);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link to="/" className="text-sm text-muted hover:text-dark transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">{emoji}</span>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Assessment WorkSim</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{workSim.role}</h1>
              <p className="text-white/70 text-lg mb-4">{workSim.org_name || 'Custom Organization'}</p>

              {/* Duration */}
              <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                20-30 min simulation
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{completedCount}</div>
                  <div className="text-white/60 text-xs">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{inProgressCount}</div>
                  <div className="text-white/60 text-xs">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{pendingCount}</div>
                  <div className="text-white/60 text-xs">Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assign New */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-dark">Assign to Candidate</h2>
              <p className="text-sm text-muted mt-1">Send this WorkSim to a new candidate</p>
            </div>
            <Link
              to={`/setup?role=${encodeURIComponent(workSim.role)}&org=${encodeURIComponent(workSim.org_name || '')}`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign New Candidate
            </Link>
          </div>
        </div>

        {/* Candidates List */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-dark">Assigned Candidates</h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Candidate</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Type</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Status</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Date</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Link</th>
                <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">Report</th>
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
                      <button
                        onClick={() => copyLink(session.session_id, session.candidate_link)}
                        className="text-sm text-muted hover:text-dark transition-colors"
                      >
                        {copiedId === session.session_id ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {session.has_report ? (
                        <Link
                          to={`/report/${session.session_id}`}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100"
                        >
                          View
                        </Link>
                      ) : session.status === 'complete' ? (
                        <button
                          onClick={() => generateReport(session.session_id)}
                          disabled={generatingReportId === session.session_id}
                          className="px-2 py-1 bg-dark text-white rounded text-xs font-medium hover:bg-dark/90 disabled:opacity-50"
                        >
                          {generatingReportId === session.session_id ? '...' : 'Generate'}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
