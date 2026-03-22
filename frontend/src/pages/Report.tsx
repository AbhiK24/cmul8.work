import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, ApiError } from '../api/client';
import Logo from '../components/Logo';

interface TraitScore {
  score: number;
  evidence: string;
}

interface AgentDebrief {
  agent_name: string;
  role: string;
  relationship_to_candidate: string;
  final_score: number;
  score_change: string;
  interactions_count: number;
  perception: string;
  would_work_with_again: boolean;
  key_interaction: string;
}

interface TimeAnalysis {
  first_response_seconds: number;
  avg_response_time_seconds: number;
  urgent_thread_response_seconds: number;
  threads_opened: number;
  tasks_completed: number;
  tasks_total: number;
  artifact_viewed: boolean;
  artifact_comments_count: number;
}

interface Report {
  trait_scores: Record<string, TraitScore>;
  time_analysis: TimeAnalysis;
  agent_debriefs: AgentDebrief[];
  overall_band: string;
  key_observations: string[];
  flagged_signals: string[];
  suggested_interview_questions: string[];
  self_report_delta?: {
    candidate_said: string;
    we_observed: string;
  };
}

interface SessionDetail {
  session_id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  org_params: {
    role?: string;
    org_name?: string;
  };
  report?: Report;
}

const traitLabels: Record<string, string> = {
  prioritization: 'Prioritization',
  communication: 'Communication',
  stakeholder_management: 'Stakeholder Mgmt',
  problem_solving: 'Problem Solving',
  time_management: 'Time Management',
  adaptability: 'Adaptability',
  attention_to_detail: 'Attention to Detail',
  empathy: 'Empathy',
  self_awareness: 'Self-Awareness',
};

const bandColors: Record<string, string> = {
  'Strong fit': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Moderate fit': 'bg-amber-100 text-amber-800 border-amber-200',
  'Further review': 'bg-red-100 text-red-800 border-red-200',
  'Calibrating': 'bg-gray-100 text-gray-800 border-gray-200',
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const percent = (score / max) * 100;
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm font-medium w-6 text-right">{score}</span>
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');

  const handleGenerateReport = async () => {
    if (!token || !sessionId) return;

    setIsGenerating(true);
    setGenerationStatus('Analyzing session data...');
    setError('');

    try {
      // Simulate progress updates
      const statuses = [
        'Analyzing session data...',
        'Evaluating behavioral patterns...',
        'Scoring communication traits...',
        'Generating insights...',
        'Compiling final report...'
      ];

      let statusIdx = 0;
      const statusInterval = setInterval(() => {
        statusIdx = (statusIdx + 1) % statuses.length;
        setGenerationStatus(statuses[statusIdx]);
      }, 2000);

      await sessions.generateReport(token, sessionId);

      clearInterval(statusInterval);
      setGenerationStatus('Report generated! Loading...');

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
      setGenerationStatus('');
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
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
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

  if (!report) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="bg-white border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" />
            <Link
              to="/"
              className="text-sm text-muted hover:text-dark transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            {isGenerating ? (
              <>
                <div className="mb-6">
                  <div className="animate-spin h-12 w-12 border-3 border-dark border-t-transparent rounded-full mx-auto" />
                </div>
                <h2 className="text-xl font-semibold text-dark mb-2">Generating Report</h2>
                <p className="text-muted mb-4">{generationStatus}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-dark rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-dark mb-2">Report Not Generated</h2>
                <p className="text-muted mb-6">
                  {session.status === 'complete'
                    ? 'This session is complete. Generate a report to see behavioral insights and scores.'
                    : 'This session is still in progress. The report will be available once the candidate completes the simulation.'}
                </p>
                {session.status === 'complete' && (
                  <button
                    onClick={handleGenerateReport}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-dark text-white rounded-lg hover:bg-dark/90 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
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

  // Calculate average score
  const scores = Object.values(report.trait_scores).map(t => t.score);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link
            to="/"
            className="text-sm text-muted hover:text-dark transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark">{session.candidate_name}</h1>
              <p className="text-muted">{session.candidate_email}</p>
              <p className="text-sm text-mid mt-1">
                {session.org_params?.role} at {session.org_params?.org_name || 'Company'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold border ${bandColors[report.overall_band] || bandColors['Calibrating']}`}>
                {report.overall_band}
              </span>
              <p className="text-sm text-muted mt-2">Avg Score: {avgScore}/10</p>
            </div>
          </div>
        </div>

        {/* Trait Scores */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Behavioral Scores</h2>
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(report.trait_scores).map(([key, trait]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark">{traitLabels[key] || key}</span>
                </div>
                <ScoreBar score={trait.score} />
                <p className="text-xs text-muted leading-relaxed">{trait.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Debriefs */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Agent Perspectives</h2>
          <div className="space-y-4">
            {report.agent_debriefs?.map((agent, idx) => (
              <div key={idx} className="p-4 bg-surface rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-dark">{agent.agent_name}</span>
                    <span className="text-muted text-sm ml-2">({agent.role})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{(agent.final_score * 100).toFixed(0)}%</div>
                      <div className="text-xs text-muted">{agent.score_change}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.would_work_with_again ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {agent.would_work_with_again ? 'Would work again' : 'Hesitant'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-mid mb-2">{agent.perception}</p>
                {agent.key_interaction && (
                  <p className="text-xs text-muted italic">Key moment: "{agent.key_interaction}"</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Analysis */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Session Metrics</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-surface rounded-lg text-center">
              <div className="text-2xl font-semibold text-dark">{report.time_analysis?.first_response_seconds || 0}s</div>
              <div className="text-xs text-muted">First Response</div>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <div className="text-2xl font-semibold text-dark">{report.time_analysis?.threads_opened || 0}</div>
              <div className="text-xs text-muted">Threads Opened</div>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <div className="text-2xl font-semibold text-dark">
                {report.time_analysis?.tasks_completed || 0}/{report.time_analysis?.tasks_total || 0}
              </div>
              <div className="text-xs text-muted">Tasks Completed</div>
            </div>
            <div className="p-3 bg-surface rounded-lg text-center">
              <div className="text-2xl font-semibold text-dark">{report.time_analysis?.artifact_viewed ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted">Viewed Artifact</div>
            </div>
          </div>
        </div>

        {/* Key Observations & Flags */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">Key Observations</h2>
            <ul className="space-y-2">
              {report.key_observations?.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-mid">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  {obs}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark mb-4">Flagged Signals</h2>
            {report.flagged_signals?.length > 0 ? (
              <ul className="space-y-2">
                {report.flagged_signals.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No concerning signals flagged</p>
            )}
          </div>
        </div>

        {/* Self-Report Delta */}
        {report.self_report_delta && (
          <div className="bg-white border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-dark mb-4">Self-Awareness Check</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-surface rounded-lg">
                <h3 className="text-xs uppercase tracking-widest text-muted font-medium mb-2">Candidate Said</h3>
                <p className="text-sm text-mid italic">"{report.self_report_delta.candidate_said}"</p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <h3 className="text-xs uppercase tracking-widest text-muted font-medium mb-2">We Observed</h3>
                <p className="text-sm text-mid">{report.self_report_delta.we_observed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Interview Questions */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Suggested Interview Questions</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {report.suggested_interview_questions?.map((q, idx) => (
              <li key={idx} className="text-sm text-mid">{q}</li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
