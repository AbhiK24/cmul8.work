import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, type SessionResponse, ApiError } from '../api/client';
import Logo from '../components/Logo';
import TrainingLibrary from './TrainingLibrary';

const statusConfig = {
  generating: { label: 'Generating', bg: 'bg-surface', text: 'text-muted', border: 'border-border' },
  pending: { label: 'Ready', bg: 'bg-surface', text: 'text-dark', border: 'border-border' },
  in_progress: { label: 'In Progress', bg: 'bg-dark', text: 'text-white', border: 'border-dark' },
  complete: { label: 'Complete', bg: 'bg-dark', text: 'text-white', border: 'border-dark' },
  expired: { label: 'Expired', bg: 'bg-surface', text: 'text-muted', border: 'border-border' },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type TabType = 'assess' | 'train';

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('assess');
  const [sessionList, setSessionList] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    candidateType: '',
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(sessionList.map(s => s.role));
    return Array.from(roles).sort();
  }, [sessionList]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessionList.filter(session => {
      // Search filter (candidate name or email)
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = session.candidate_name.toLowerCase().includes(search);
        const matchesEmail = session.candidate_email.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail) return false;
      }

      // Role filter
      if (filters.role && session.role !== filters.role) return false;

      // Status filter
      if (filters.status && session.status !== filters.status) return false;

      // Candidate type filter
      if (filters.candidateType && session.candidate_type !== filters.candidateType) return false;

      return true;
    });
  }, [sessionList, filters]);

  // Benchmark stats
  const benchmarkStats = useMemo(() => {
    const completedSessions = sessionList.filter(s => s.status === 'complete');
    const internalSessions = completedSessions.filter(s => s.candidate_type === 'internal');
    const externalSessions = completedSessions.filter(s => s.candidate_type === 'external');

    // Group by role for comparison
    const roleStats: Record<string, { internal: number[]; external: number[] }> = {};

    completedSessions.forEach(session => {
      if (!roleStats[session.role]) {
        roleStats[session.role] = { internal: [], external: [] };
      }
      if (session.score !== undefined) {
        roleStats[session.role][session.candidate_type].push(session.score);
      }
    });

    return {
      totalInternal: internalSessions.length,
      totalExternal: externalSessions.length,
      roleStats,
    };
  }, [sessionList]);

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
      // Reload sessions to get updated data
      const response = await sessions.list(token);
      setSessionList(response.sessions);
    } catch (err) {
      // Silent fail - user can retry
    } finally {
      setGeneratingReportId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', role: '', status: '', candidateType: '' });
  };

  const hasActiveFilters = filters.search || filters.role || filters.status || filters.candidateType;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <Link
              to="/setup"
              className="flex items-center gap-1.5 bg-dark text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create WorkSim
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
        <div className="max-w-5xl mx-auto px-6">
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
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Training Tab */}
        {activeTab === 'train' ? (
          <TrainingLibrary />
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-dark hover:opacity-70 transition-opacity"
            >
              Try again
            </button>
          </div>
        ) : sessionList.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border border-border rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-dark mb-2">No simulations yet</h2>
            <p className="text-muted text-sm mb-6">Create your first simulation to start assessing candidates.</p>
            <Link
              to="/setup"
              className="inline-flex bg-dark text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
            >
              Create WorkSim
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by candidate name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                  />
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'border-dark bg-dark text-white'
                      : 'border-border text-muted hover:text-dark hover:border-dark/40'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              </div>

              {/* Filter dropdowns */}
              {showFilters && (
                <div className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                      Role
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                    >
                      <option value="">All roles</option>
                      {uniqueRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                    >
                      <option value="">All statuses</option>
                      <option value="generating">Generating</option>
                      <option value="pending">Ready</option>
                      <option value="in_progress">In Progress</option>
                      <option value="complete">Complete</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                      Type
                    </label>
                    <select
                      value={filters.candidateType}
                      onChange={(e) => setFilters({ ...filters, candidateType: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                    >
                      <option value="">All types</option>
                      <option value="external">External</option>
                      <option value="internal">Internal (Benchmark)</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="self-end px-4 py-2 text-sm text-muted hover:text-dark transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {/* Results count */}
              {hasActiveFilters && (
                <p className="text-sm text-muted mt-3">
                  Showing {filteredSessions.length} of {sessionList.length} simulations
                </p>
              )}
            </div>

            {/* Benchmark Summary */}
            {(benchmarkStats.totalInternal > 0 || benchmarkStats.totalExternal > 0) && (
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="bg-white border border-border rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-muted font-medium mb-1">Internal Benchmarks</p>
                  <p className="text-2xl font-medium text-dark">{benchmarkStats.totalInternal}</p>
                  <p className="text-xs text-muted mt-1">completed simulations</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-muted font-medium mb-1">External Candidates</p>
                  <p className="text-2xl font-medium text-dark">{benchmarkStats.totalExternal}</p>
                  <p className="text-xs text-muted mt-1">completed simulations</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-muted font-medium mb-1">Roles with Benchmarks</p>
                  <p className="text-2xl font-medium text-dark">
                    {Object.values(benchmarkStats.roleStats).filter(r => r.internal.length > 0).length}
                  </p>
                  <p className="text-xs text-muted mt-1">roles have internal data</p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Candidate
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Created
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Link
                    </th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted text-sm">
                        No simulations match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
                      const isInternal = session.candidate_type === 'internal';
                      return (
                        <tr
                          key={session.session_id}
                          className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-dark text-sm">{session.candidate_name}</div>
                            <div className="text-xs text-muted">{session.candidate_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                isInternal
                                  ? 'bg-dark/10 text-dark'
                                  : 'bg-surface text-muted'
                              }`}
                            >
                              {isInternal ? 'Benchmark' : 'External'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-mid">{session.role}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {formatDate(session.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            {session.candidate_link ? (
                              <button
                                onClick={() => copyLink(session.session_id, session.candidate_link)}
                                className="text-sm text-muted hover:text-dark transition-colors"
                              >
                                {copiedId === session.session_id ? 'Copied!' : 'Copy link'}
                              </button>
                            ) : (
                              <span className="text-sm text-muted">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {session.has_report ? (
                              <Link
                                to={session.mode === 'train' ? `/training-report/${session.session_id}` : `/report/${session.session_id}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  session.mode === 'train'
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {session.mode === 'train' ? 'View Training Report' : 'View Report'}
                              </Link>
                            ) : (session.status === 'complete' || session.status === 'in_progress') ? (
                              <button
                                onClick={() => generateReport(session.session_id)}
                                disabled={generatingReportId === session.session_id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark text-white rounded-lg text-xs font-medium hover:bg-dark/90 transition-colors disabled:opacity-50"
                              >
                                {generatingReportId === session.session_id ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Report
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
