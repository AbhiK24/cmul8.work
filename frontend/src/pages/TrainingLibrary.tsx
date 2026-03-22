import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { templates, type TemplateListItem, type SessionResponse } from '../api/client';

interface TrainingLibraryProps {
  trainingSessions?: SessionResponse[];
}

const difficultyConfig = {
  beginner: { label: 'Beginner', bars: 1, color: 'text-emerald-600' },
  intermediate: { label: 'Intermediate', bars: 2, color: 'text-amber-600' },
  advanced: { label: 'Advanced', bars: 3, color: 'text-red-600' },
};

const categoryIcons: Record<string, string> = {
  feedback: '💬',
  prioritization: '📋',
  communication: '🔥',
  assertiveness: '✋',
};

function DifficultyBars({ level }: { level: string }) {
  const config = difficultyConfig[level as keyof typeof difficultyConfig] || difficultyConfig.beginner;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-3 rounded-sm ${
            i <= config.bars ? 'bg-current' : 'bg-gray-200'
          } ${config.color}`}
        />
      ))}
      <span className={`ml-1.5 text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}

const statusConfig = {
  generating: { label: 'Generating', bg: 'bg-surface', text: 'text-muted' },
  pending: { label: 'Ready', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700' },
  complete: { label: 'Complete', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  expired: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrainingLibrary({ trainingSessions = [] }: TrainingLibraryProps) {
  const { token } = useAuth();
  const [templateList, setTemplateList] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (sessionId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    async function loadTemplates() {
      if (!token) return;

      try {
        const data = await templates.list(token);
        setTemplateList(data);
      } catch (err) {
        setError('Failed to load training library');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-dark hover:opacity-70 transition-opacity"
        >
          Try again
        </button>
      </div>
    );
  }

  if (templateList.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="text-lg font-medium text-dark mb-2">Training Library Coming Soon</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Pre-built simulations to develop your team's soft skills are being prepared.
          Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-dark">Training Library</h2>
        <p className="text-muted text-sm mt-1">
          Pre-built simulations to develop your team's soft skills
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templateList.map((template) => (
          <Link
            key={template.template_id}
            to={`/training/${template.slug}`}
            className="group bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">
                {categoryIcons[template.skill_category] || '📚'}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="font-semibold text-dark mb-1 group-hover:text-indigo-700 transition-colors">
              {template.title}
            </h3>
            <p className="text-sm text-muted mb-4 line-clamp-2">
              {template.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {template.duration_minutes} min
              </div>
              <DifficultyBars level={template.difficulty} />
            </div>

            {/* Learning objectives preview */}
            {template.learning_objectives.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted mb-2">You'll learn:</p>
                <ul className="space-y-1">
                  {template.learning_objectives.slice(0, 2).map((obj, i) => (
                    <li key={i} className="text-xs text-mid flex items-start gap-1.5">
                      <svg className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {obj}
                    </li>
                  ))}
                  {template.learning_objectives.length > 2 && (
                    <li className="text-xs text-muted">
                      +{template.learning_objectives.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* View button */}
            <div className="mt-4 flex items-center justify-end">
              <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                View details
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}

        {/* Coming soon placeholder */}
        <div className="bg-surface border border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
          <span className="text-2xl mb-2">🚀</span>
          <p className="text-sm font-medium text-muted">More coming soon</p>
          <p className="text-xs text-muted mt-1">
            Conflict resolution, delegation, and more
          </p>
        </div>
      </div>

      {/* Training History */}
      {trainingSessions.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-dark">Training History</h2>
            <p className="text-muted text-sm">Assigned training sessions</p>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Participant
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Training
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Assigned
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Link
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted font-medium">
                    Report
                  </th>
                </tr>
              </thead>
              <tbody>
                {trainingSessions.map((session) => {
                  const status = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.pending;
                  return (
                    <tr key={session.session_id} className="border-b border-border last:border-0 hover:bg-surface/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-dark text-sm">{session.candidate_name}</div>
                        <div className="text-xs text-muted">{session.candidate_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-mid">{session.role}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyLink(session.session_id, session.candidate_link)}
                          className="text-sm text-muted hover:text-dark transition-colors"
                        >
                          {copiedId === session.session_id ? 'Copied!' : 'Copy link'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {session.has_report ? (
                          <Link
                            to={`/training-report/${session.session_id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-100"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View
                          </Link>
                        ) : session.status === 'complete' ? (
                          <Link
                            to={`/training-report/${session.session_id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            Generate
                          </Link>
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
        </div>
      )}
    </div>
  );
}
