import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { b2cCatalog, type B2CSkillCategory, type B2CUserSession } from '../api/client';

// Category icons
const categoryIcons: Record<string, string> = {
  feedback: '💬',
  prioritization: '📋',
  communication: '🔥',
  assertiveness: '✋',
  interview: '🎯',
  stakeholder: '🤝',
  leadership: '📈',
  negotiation: '💰',
};

// Difficulty config
const difficultyConfig = {
  beginner: { label: 'Beginner', bars: 1, color: 'text-emerald-600', barColor: 'bg-emerald-500' },
  intermediate: { label: 'Intermediate', bars: 2, color: 'text-amber-600', barColor: 'bg-amber-500' },
  advanced: { label: 'Advanced', bars: 3, color: 'text-red-600', barColor: 'bg-red-500' },
};

function DifficultyBars({ level }: { level: string }) {
  const config = difficultyConfig[level as keyof typeof difficultyConfig] || difficultyConfig.beginner;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-sm ${
            i <= config.bars ? config.barColor : 'bg-gray-200'
          }`}
        />
      ))}
      <span className={`ml-1.5 text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}

export default function Practice() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<B2CSkillCategory[]>([]);
  const [recentSessions, setRecentSessions] = useState<B2CUserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingSession, setStartingSession] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [cats, sessions] = await Promise.all([
          b2cCatalog.listCategories(token),
          b2cCatalog.listSessions(token),
        ]);
        setCategories(cats);
        setRecentSessions(sessions.slice(0, 5));
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError('Failed to load scenarios');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const handleStartScenario = async (slug: string) => {
    if (!token || startingSession) return;

    setStartingSession(slug);
    try {
      const response = await b2cCatalog.startSession(token, slug);
      navigate(response.session_url);
    } catch (err) {
      console.error('Failed to start session:', err);
      setStartingSession(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'ready':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Flatten scenarios for grid view
  const allScenarios = categories.flatMap(cat =>
    cat.scenarios.map(s => ({ ...s, categoryName: cat.name }))
  );

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
            {user && (
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-dark">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-dark hidden sm:block">
                  {user.name || user.email}
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
            Practice Library
          </h1>
          <p className="text-muted">
            Build workplace skills with AI-powered simulations
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-border rounded-xl">
            <p className="text-muted mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-dark hover:opacity-70 transition-opacity"
            >
              Try again
            </button>
          </div>
        ) : allScenarios.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h2 className="text-lg font-medium text-dark mb-2">No scenarios available yet</h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              Practice scenarios are being prepared. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {allScenarios.map((scenario) => (
                <button
                  key={scenario.slug}
                  onClick={() => handleStartScenario(scenario.slug)}
                  disabled={startingSession === scenario.slug}
                  className="group bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 text-left disabled:opacity-70"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">
                      {categoryIcons[scenario.skill_category] || '📚'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-dark mb-1 group-hover:text-emerald-700 transition-colors">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2">
                    {scenario.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-1 text-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {scenario.duration_minutes} min
                    </div>
                    <DifficultyBars level={scenario.difficulty} />
                  </div>

                  {/* Learning objectives preview */}
                  {scenario.learning_objectives.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted mb-2">You'll learn:</p>
                      <ul className="space-y-1">
                        {scenario.learning_objectives.slice(0, 2).map((obj, i) => (
                          <li key={i} className="text-xs text-mid flex items-start gap-1.5">
                            <svg className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {obj}
                          </li>
                        ))}
                        {scenario.learning_objectives.length > 2 && (
                          <li className="text-xs text-muted">
                            +{scenario.learning_objectives.length - 2} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Completion badge */}
                  {scenario.user_completed_count > 0 && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed {scenario.user_completed_count}x
                      </span>
                      {scenario.user_best_score && (
                        <span className="text-xs text-muted">
                          Best: {scenario.user_best_score}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Start indicator on hover */}
                  <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {startingSession === scenario.slug ? (
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        Start practice
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            {recentSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-dark mb-4">Recent Activity</h2>
                <div className="bg-white border border-border rounded-xl overflow-hidden">
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
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
