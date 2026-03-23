import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { b2cCatalog, type B2CSkillCategory, type B2CUserSession } from '../api/client';

// Skill track icons and colors
const skillTrackMeta: Record<string, { icon: ReactNode; color: string }> = {
  feedback: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    color: 'from-purple-500 to-purple-600',
  },
  prioritization: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
  },
  communication: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
  },
  assertiveness: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'from-emerald-500 to-green-600',
  },
  interview: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
  },
  stakeholder: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-600',
  },
  leadership: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    color: 'from-rose-500 to-pink-600',
  },
  negotiation: {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-cyan-500 to-blue-500',
  },
};

// Default icon for unknown categories
const defaultMeta = {
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  color: 'from-gray-500 to-gray-600',
};

export default function Practice() {
  const { b2cUser, b2cToken, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<B2CSkillCategory[]>([]);
  const [recentSessions, setRecentSessions] = useState<B2CUserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!b2cToken) return;

      try {
        const [cats, sessions] = await Promise.all([
          b2cCatalog.listCategories(b2cToken),
          b2cCatalog.listSessions(b2cToken),
        ]);
        setCategories(cats);
        setRecentSessions(sessions.slice(0, 5));
      } catch (error) {
        console.error('Failed to load catalog:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [b2cToken]);

  const handleStartScenario = async (slug: string) => {
    if (!b2cToken || startingSession) return;

    setStartingSession(slug);
    try {
      const response = await b2cCatalog.startSession(b2cToken, slug);
      navigate(response.session_url);
    } catch (error) {
      console.error('Failed to start session:', error);
      setStartingSession(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-amber-100 text-amber-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'ready':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg className="w-7 h-4" viewBox="0 0 28 16" fill="none">
              <path d="M7 8c0-2.5 2-4.5 4.5-4.5S16 5.5 16 8s-2 4.5-4.5 4.5S7 10.5 7 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8s-2 4.5-4.5 4.5S12 10.5 12 8z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="1" y1="8" x2="27" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
              <polygon points="25,6 27,8 25,10" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-dark">WorkSim</span>
          </Link>

          <div className="flex items-center gap-4">
            {b2cUser && (
              <div className="flex items-center gap-3">
                {b2cUser.avatar_url ? (
                  <img
                    src={b2cUser.avatar_url}
                    alt={b2cUser.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-dark">
                    {(b2cUser.name || b2cUser.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-dark hidden sm:block">
                  {b2cUser.name || b2cUser.email}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm text-muted hover:text-dark transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-dark mb-1">
            Welcome{b2cUser?.name ? `, ${b2cUser.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted">Pick a scenario to practice</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center">
            <p className="text-muted">No scenarios available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Skill Categories */}
            <div className="space-y-8">
              {categories.map((category) => {
                const meta = skillTrackMeta[category.id] || defaultMeta;

                return (
                  <div key={category.id}>
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${meta.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                        {meta.icon}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-dark">{category.name}</h2>
                        <p className="text-sm text-muted">{category.description}</p>
                      </div>
                    </div>

                    {/* Scenarios Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.scenarios.map((scenario) => (
                        <button
                          key={scenario.slug}
                          onClick={() => handleStartScenario(scenario.slug)}
                          disabled={startingSession === scenario.slug}
                          className="group relative bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left disabled:opacity-70"
                        >
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                              {scenario.difficulty}
                            </span>
                            <span className="text-xs text-muted">
                              {scenario.duration_minutes} min
                            </span>
                            {scenario.user_completed_count > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                Completed {scenario.user_completed_count}x
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <h3 className="font-medium text-dark mb-1 group-hover:text-indigo-600 transition-colors">
                            {scenario.title}
                          </h3>
                          <p className="text-sm text-muted line-clamp-2 mb-3">
                            {scenario.description}
                          </p>

                          {/* Learning objectives preview */}
                          <div className="text-xs text-muted">
                            <span className="font-medium">Learn:</span>{' '}
                            {scenario.learning_objectives.slice(0, 2).join(', ')}
                            {scenario.learning_objectives.length > 2 && '...'}
                          </div>

                          {/* Start indicator */}
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {startingSession === scenario.slug ? (
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-dark mb-4">Recent Activity</h2>
              {recentSessions.length === 0 ? (
                <div className="bg-white border border-border rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-muted mb-2">No practice sessions yet</p>
                  <p className="text-sm text-muted">Pick a scenario above to get started</p>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Scenario</th>
                        <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Score</th>
                        <th className="text-left text-xs font-medium text-muted uppercase px-4 py-3">Date</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentSessions.map((session) => (
                        <tr key={session.session_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-dark">{session.template_title}</div>
                            <div className="text-sm text-muted">{session.skill_category}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {session.score !== null ? (
                              <span className="font-medium text-dark">{session.score}%</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {session.status === 'ready' && (
                              <button
                                onClick={() => handleStartScenario(session.template_slug)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Continue
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
