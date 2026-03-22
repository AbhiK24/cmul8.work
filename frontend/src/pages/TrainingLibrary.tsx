import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { templates, type TemplateListItem } from '../api/client';

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

export default function TrainingLibrary() {
  const { token } = useAuth();
  const [templateList, setTemplateList] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    </div>
  );
}
