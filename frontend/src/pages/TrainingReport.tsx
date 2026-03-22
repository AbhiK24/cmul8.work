import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, ApiError } from '../api/client';
import type { FrameworkReference, FrameworkStep } from '../api/client';
import Logo from '../components/Logo';

interface FrameworkStepScore extends FrameworkStep {
  score: number;
  feedback: string;
  demonstrated: boolean;
}

interface TrainingReport {
  framework_name: string;
  framework_reference: FrameworkReference;
  framework_scores: FrameworkStepScore[];
  overall_score: number;
  learning_objectives_met: string[];
  learning_objectives_missed: string[];
  coaching_notes: string[];
  key_moments: {
    timestamp: number;
    description: string;
    suggestion: string;
  }[];
  next_steps: string[];
}

interface SessionDetail {
  session_id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  org_params: {
    role?: string;
    org_name?: string;
    template_title?: string;
    framework_name?: string;
  };
  env?: {
    framework_name?: string;
    framework_reference?: FrameworkReference;
    learning_objectives?: string[];
  };
  report?: TrainingReport;
}

function CircularProgress({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-dark">{score}%</span>
        <span className="text-xs text-muted">Overall</span>
      </div>
    </div>
  );
}

function StepScoreCard({ step }: { step: FrameworkStepScore }) {
  const bgColor = step.demonstrated
    ? 'bg-emerald-50 border-emerald-200'
    : 'bg-amber-50 border-amber-200';
  const iconColor = step.demonstrated ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className={`p-4 rounded-xl border ${bgColor} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${iconColor} text-white flex items-center justify-center text-lg font-bold shrink-0`}>
          {step.letter}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-dark">{step.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              step.demonstrated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {step.demonstrated ? 'Demonstrated' : 'Needs Practice'}
            </span>
          </div>
          <p className="text-sm text-muted mb-2">{step.description}</p>
          {step.feedback && (
            <div className="p-2 bg-white/60 rounded-lg mt-2">
              <p className="text-xs text-mid">{step.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrainingReport() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    if (!token || !sessionId) return;

    setIsGenerating(true);
    setError('');

    try {
      await sessions.generateReport(token, sessionId);

      // Reload session to get the report
      const data = await sessions.get(token, sessionId);
      setSession(data as unknown as SessionDetail);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate report');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadSession() {
      if (!token || !sessionId) return;

      try {
        const data = await sessions.get(token, sessionId);
        setSession(data as unknown as SessionDetail);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load report');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [token, sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">{error || 'Session not found'}</p>
          <Link to="/" className="text-dark hover:opacity-70">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const report = session.report;

  // If no report yet, show generation prompt or placeholder
  if (!report) {

    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="bg-white border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" />
            <Link to="/" className="text-sm text-muted hover:text-dark transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            {isGenerating ? (
              <>
                <div className="mb-6">
                  <div className="animate-spin h-12 w-12 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                </div>
                <h2 className="text-xl font-semibold text-dark mb-2">Analyzing Your Training</h2>
                <p className="text-muted">Evaluating framework adherence...</p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-dark mb-2">Training Report</h2>
                <p className="text-muted mb-6">
                  {session.status === 'complete'
                    ? 'Your training session is complete. Generate a report to see how well you applied the framework.'
                    : 'Complete your training session to receive personalized feedback on your framework application.'}
                </p>
                {session.status === 'complete' && (
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Training Report
                  </button>
                )}
                {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link to="/" className="text-sm text-muted hover:text-dark transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  Training Report
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{report.framework_name}</h1>
              <p className="text-white/70 mb-1">{session.candidate_name}</p>
              <p className="text-white/50 text-sm">
                {session.org_params?.template_title || 'Skill Training'}
              </p>
            </div>
            <CircularProgress score={report.overall_score} />
          </div>
        </div>

        {/* Framework Steps Breakdown */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-dark">Framework Application</h2>
          </div>

          <div className="space-y-4">
            {report.framework_scores.map((step, idx) => (
              <StepScoreCard key={idx} step={step} />
            ))}
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-dark">Objectives Met</h2>
            </div>
            {report.learning_objectives_met.length > 0 ? (
              <ul className="space-y-2">
                {report.learning_objectives_met.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-mid">{obj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Complete the training to track objectives</p>
            )}
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-dark">Areas for Growth</h2>
            </div>
            {report.learning_objectives_missed.length > 0 ? (
              <ul className="space-y-2">
                {report.learning_objectives_missed.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-mid">{obj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">All objectives achieved!</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Moments */}
        {report.key_moments && report.key_moments.length > 0 && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-dark">Key Coaching Moments</h2>
            </div>

            <div className="space-y-4">
              {report.key_moments.map((moment, idx) => (
                <div key={idx} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-dark mb-2">{moment.description}</p>
                  <div className="flex items-start gap-2 mt-2 p-2 bg-white rounded-lg">
                    <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-xs text-indigo-700">{moment.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Recommended Next Steps</h2>
          </div>

          <div className="space-y-3">
            {report.next_steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-white/80 pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Explore More Training
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
