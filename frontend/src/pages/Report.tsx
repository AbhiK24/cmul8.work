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
  const bgColor = score >= 7 ? 'bg-emerald-50' : score >= 5 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 h-2.5 ${bgColor} rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`text-sm font-semibold w-8 text-right ${score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>
        {score}
      </span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-dark/5 flex items-center justify-center text-dark">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-dark">{title}</h2>
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
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-dark via-dark to-dark/90 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0xMHY2aDZ2LTZoLTZ6bTAtMTB2Nmg2di02aC02em0tMTAgMTB2Nmg2di02aC02em0wIDEwdjZoNnYtNmgtNnptLTEwLTEwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">Candidate Assessment Report</p>
              <h1 className="text-3xl font-bold mb-2">{session.candidate_name}</h1>
              <p className="text-white/70 mb-1">{session.candidate_email}</p>
              <p className="text-white/50 text-sm">
                {session.org_params?.role} at {session.org_params?.org_name || 'Company'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-5 py-2.5 rounded-xl text-sm font-bold border-2 ${bandColors[report.overall_band] || bandColors['Calibrating']}`}>
                {report.overall_band}
              </span>
              <div className="mt-4 bg-white/10 rounded-lg px-4 py-2 backdrop-blur">
                <p className="text-2xl font-bold">{avgScore}<span className="text-lg text-white/60">/10</span></p>
                <p className="text-xs text-white/50">Average Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trait Scores */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <SectionHeader
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title="Behavioral Scores"
          />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {Object.entries(report.trait_scores).map(([key, trait]) => (
              <div key={key} className="p-4 bg-surface/50 rounded-xl hover:bg-surface transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-dark">{traitLabels[key] || key}</span>
                </div>
                <ScoreBar score={trait.score} />
                <p className="text-xs text-muted leading-relaxed mt-2">{trait.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Debriefs */}
        {report.agent_debriefs && report.agent_debriefs.length > 0 && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <SectionHeader
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              title="Simulated Colleague Perspectives"
            />
            <div className="space-y-4">
              {report.agent_debriefs.map((agent, idx) => (
                <div key={idx} className="p-5 bg-surface/50 rounded-xl border border-border/50 hover:border-border transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center text-dark font-semibold">
                        {agent.agent_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-dark">{agent.agent_name}</span>
                        <p className="text-muted text-xs">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-dark">{(agent.final_score * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted">{agent.score_change}</div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        agent.would_work_with_again ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {agent.would_work_with_again ? 'Would collaborate again' : 'Hesitant'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-mid leading-relaxed">{agent.perception}</p>
                  {agent.key_interaction && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-border/50">
                      <p className="text-xs text-muted mb-1">Key moment</p>
                      <p className="text-sm text-mid italic">"{agent.key_interaction}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Analysis */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <SectionHeader
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Session Metrics"
          />
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
              <div className="text-3xl font-bold text-blue-600">{report.time_analysis?.first_response_seconds || 0}<span className="text-lg">s</span></div>
              <div className="text-xs text-blue-600/70 font-medium mt-1">First Response</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl text-center border border-purple-100">
              <div className="text-3xl font-bold text-purple-600">{report.time_analysis?.threads_opened || 0}</div>
              <div className="text-xs text-purple-600/70 font-medium mt-1">Threads Opened</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-center border border-emerald-100">
              <div className="text-3xl font-bold text-emerald-600">
                {report.time_analysis?.tasks_completed || 0}<span className="text-lg text-emerald-400">/{report.time_analysis?.tasks_total || 0}</span>
              </div>
              <div className="text-xs text-emerald-600/70 font-medium mt-1">Tasks Completed</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl text-center border border-amber-100">
              <div className="text-3xl font-bold text-amber-600">{report.time_analysis?.artifact_viewed ? 'Yes' : 'No'}</div>
              <div className="text-xs text-amber-600/70 font-medium mt-1">Viewed Artifact</div>
            </div>
          </div>
        </div>

        {/* Key Observations & Flags */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
              title="Key Observations"
            />
            <ul className="space-y-3">
              {report.key_observations?.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-mid">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              title="Flagged Signals"
            />
            {report.flagged_signals?.length > 0 ? (
              <ul className="space-y-3">
                {report.flagged_signals.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-red-700 p-3 bg-red-50 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg text-emerald-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">No concerning signals flagged</span>
              </div>
            )}
          </div>
        </div>

        {/* Self-Report Delta - only show if has meaningful data */}
        {report.self_report_delta &&
         report.self_report_delta.candidate_said &&
         !report.self_report_delta.candidate_said.toLowerCase().includes('n/a') &&
         !report.self_report_delta.candidate_said.toLowerCase().includes('no debrief') && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6 shadow-sm">
            <SectionHeader
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>}
              title="Self-Awareness Check"
            />
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="text-xs uppercase tracking-widest text-blue-600 font-semibold">Candidate Said</h3>
                </div>
                <p className="text-sm text-blue-900 italic leading-relaxed">"{report.self_report_delta.candidate_said}"</p>
              </div>
              <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h3 className="text-xs uppercase tracking-widest text-purple-600 font-semibold">We Observed</h3>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed">{report.self_report_delta.we_observed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Interview Questions */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <SectionHeader
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Suggested Follow-up Questions"
          />
          <div className="space-y-3">
            {report.suggested_interview_questions?.map((q, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-surface/50 rounded-xl hover:bg-surface transition-colors">
                <span className="w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-mid pt-1.5 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
