import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, type SessionResponse, ApiError } from '../api/client';
import Logo from '../components/Logo';
import TrainingLibrary from './TrainingLibrary';

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

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

type TabType = 'assess' | 'train' | 'history';

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('assess');
  const [sessionList, setSessionList] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Filter state for History tab
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    mode: '',
    candidateType: '',
  });

  useEffect(() => {
    async function loadSessions() {
      if (!token) return;

      try {
        const response = await sessions.list(token);
        setSessionList(response.sessions);
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

  // Separate sessions by mode
  const assessSessions = useMemo(() => {
    return sessionList.filter(s => s.mode !== 'train');
  }, [sessionList]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(sessionList.map(s => s.role));
    return Array.from(roles).sort();
  }, [sessionList]);

  // Filter sessions for History tab
  const filteredSessions = useMemo(() => {
    return sessionList.filter(session => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = session.candidate_name.toLowerCase().includes(search);
        const matchesEmail = session.candidate_email.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail) return false;
      }
      if (filters.role && session.role !== filters.role) return false;
      if (filters.status && session.status !== filters.status) return false;
      if (filters.mode && session.mode !== filters.mode) return false;
      if (filters.candidateType && session.candidate_type !== filters.candidateType) return false;
      return true;
    });
  }, [sessionList, filters]);

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
      setSessionList(response.sessions);
    } catch {
      // Silent fail - user can retry
    } finally {
      setGeneratingReportId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', role: '', status: '', mode: '', candidateType: '' });
  };

  const hasActiveFilters = filters.search || filters.role || filters.status || filters.mode || filters.candidateType;

  // Stats for header
  const stats = useMemo(() => ({
    totalAssess: assessSessions.length,
    completedAssess: assessSessions.filter(s => s.status === 'complete').length,
    totalTrain: sessionList.filter(s => s.mode === 'train').length,
    completedTrain: sessionList.filter(s => s.mode === 'train' && s.status === 'complete').length,
  }), [sessionList, assessSessions]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-dark transition-colors px-3 py-2 rounded-lg hover:bg-surface"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Org Profile
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-dark transition-colors px-3 py-2 rounded-lg hover:bg-surface"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('assess')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assess'
                  ? 'border-dark text-dark'
                  : 'border-transparent text-muted hover:text-mid'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Assess
              {stats.totalAssess > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-surface rounded text-xs">{stats.totalAssess}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('train')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'train'
                  ? 'border-dark text-dark'
                  : 'border-transparent text-muted hover:text-mid'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Train
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-dark text-dark'
                  : 'border-transparent text-muted hover:text-mid'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              {sessionList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-surface rounded text-xs">{sessionList.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ============ ASSESS TAB ============ */}
        {activeTab === 'assess' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-dark">Assessment Library</h2>
                <p className="text-muted text-sm mt-1">Generated WorkSims for candidate assessment</p>
              </div>
              <Link
                to="/setup"
                className="flex items-center gap-1.5 bg-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Assessment
              </Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-muted mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="text-dark hover:opacity-70">
                  Try again
                </button>
              </div>
            ) : assessSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-medium text-dark mb-2">No assessments yet</h3>
                <p className="text-muted text-sm mb-6 max-w-md mx-auto">
                  Create your first WorkSim to start assessing candidates with realistic workplace simulations.
                </p>
                <Link
                  to="/setup"
                  className="inline-flex items-center gap-2 bg-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Assessment
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessSessions.map((session) => {
                  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
                  return (
                    <div
                      key={session.session_id}
                      className="bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                          <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                        </div>
                        <span className="text-xs text-muted">{formatDateShort(session.created_at)}</span>
                      </div>

                      {/* Role */}
                      <h3 className="font-semibold text-dark mb-1 group-hover:text-indigo-700 transition-colors">
                        {session.role}
                      </h3>
                      <p className="text-sm text-muted mb-3">{session.org_name || 'Custom Organization'}</p>

                      {/* Candidate */}
                      <div className="flex items-center gap-2 p-2 bg-surface rounded-lg mb-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                          {session.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-dark truncate">{session.candidate_name}</div>
                          <div className="text-xs text-muted truncate">{session.candidate_email}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          session.candidate_type === 'internal' ? 'bg-dark/10 text-dark' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {session.candidate_type === 'internal' ? 'Benchmark' : 'External'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyLink(session.session_id, session.candidate_link)}
                          className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-medium text-muted hover:text-dark hover:border-dark/30 transition-colors"
                        >
                          {copiedId === session.session_id ? 'Copied!' : 'Copy Link'}
                        </button>
                        {session.has_report ? (
                          <Link
                            to={`/report/${session.session_id}`}
                            className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium text-center hover:bg-indigo-100 transition-colors"
                          >
                            View Report
                          </Link>
                        ) : session.status === 'complete' ? (
                          <button
                            onClick={() => generateReport(session.session_id)}
                            disabled={generatingReportId === session.session_id}
                            className="flex-1 px-3 py-2 bg-dark text-white rounded-lg text-xs font-medium hover:bg-dark/90 transition-colors disabled:opacity-50"
                          >
                            {generatingReportId === session.session_id ? 'Generating...' : 'Generate Report'}
                          </button>
                        ) : (
                          <div className="flex-1 px-3 py-2 bg-surface text-muted rounded-lg text-xs font-medium text-center">
                            Awaiting completion
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Create new card */}
                <Link
                  to="/setup"
                  className="bg-surface border border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center mb-3 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                    <svg className="w-6 h-6 text-muted group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted group-hover:text-indigo-700">Create New Assessment</p>
                </Link>
              </div>
            )}
          </>
        )}

        {/* ============ TRAIN TAB ============ */}
        {activeTab === 'train' && <TrainingLibrary />}

        {/* ============ HISTORY TAB ============ */}
        {activeTab === 'history' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-dark">Session History</h2>
              <p className="text-muted text-sm mt-1">All assessment and training sessions</p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20"
                />
              </div>

              {/* Mode filter */}
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-dark/20"
              >
                <option value="">All modes</option>
                <option value="test">Assess</option>
                <option value="train">Train</option>
              </select>

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-dark/20"
              >
                <option value="">All statuses</option>
                <option value="generating">Generating</option>
                <option value="pending">Ready</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>

              {/* Role filter */}
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-dark/20"
              >
                <option value="">All roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {/* Type filter */}
              <select
                value={filters.candidateType}
                onChange={(e) => setFilters({ ...filters, candidateType: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-dark/20"
              >
                <option value="">All types</option>
                <option value="external">External</option>
                <option value="internal">Benchmark</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-muted hover:text-dark transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <p className="text-sm text-muted mb-4">
                Showing {filteredSessions.length} of {sessionList.length} sessions
              </p>
            )}

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-16 bg-white border border-border rounded-xl">
                <p className="text-muted">No sessions match your filters</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Participant</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Mode</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Role / Training</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Type</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => {
                      const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
                      const isTrain = session.mode === 'train';
                      return (
                        <tr key={session.session_id} className="border-b border-border last:border-0 hover:bg-surface/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-dark text-sm">{session.candidate_name}</div>
                            <div className="text-xs text-muted">{session.candidate_email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              isTrain ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {isTrain ? 'Train' : 'Assess'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-mid">{session.role}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              session.candidate_type === 'internal' ? 'bg-dark/10 text-dark' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {session.candidate_type === 'internal' ? 'Benchmark' : 'External'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted">{formatDate(session.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyLink(session.session_id, session.candidate_link)}
                                className="text-xs text-muted hover:text-dark transition-colors"
                              >
                                {copiedId === session.session_id ? 'Copied!' : 'Copy'}
                              </button>
                              {session.has_report ? (
                                <Link
                                  to={isTrain ? `/training-report/${session.session_id}` : `/report/${session.session_id}`}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    isTrain ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                  }`}
                                >
                                  Report
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
