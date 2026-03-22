import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'https://shell-production-7135.up.railway.app';

interface TraitScore {
  score: number;
  evidence: string;
}

interface CandidateReportData {
  candidate_name: string;
  role: string;
  company_name: string;
  overall_band: string;
  trait_scores: Record<string, TraitScore>;
  strengths: string[];
  growth_areas: string[];
  session_summary: string;
}

const traitLabels: Record<string, string> = {
  prioritization: 'Prioritization',
  communication: 'Communication',
  stakeholder_management: 'Stakeholder Management',
  problem_solving: 'Problem Solving',
  time_management: 'Time Management',
  adaptability: 'Adaptability',
  attention_to_detail: 'Attention to Detail',
  empathy: 'Empathy',
  self_awareness: 'Self-Awareness',
};

const bandMessages: Record<string, { title: string; message: string; color: string }> = {
  'Strong fit': {
    title: 'Excellent Performance',
    message: 'You demonstrated strong capabilities across key dimensions.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  'Moderate fit': {
    title: 'Solid Performance',
    message: 'You showed competency with some areas for development.',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  'Further review': {
    title: 'Areas for Growth',
    message: 'This simulation highlighted opportunities for development.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  'Calibrating': {
    title: 'Processing Results',
    message: 'Your results are being analyzed.',
    color: 'bg-gray-50 border-gray-200 text-gray-800',
  },
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const percent = (score / max) * 100;
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-sky-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm font-medium w-8 text-right text-gray-600">{score}/10</span>
    </div>
  );
}

export default function CandidateReport() {
  const { sessionId } = useParams();
  const [report, setReport] = useState<CandidateReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      if (!sessionId) return;

      try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}/report/candidate`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: 'Failed to load report' }));
          throw new ApiError(err.detail || 'Failed to load report', response.status);
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setError('Report not found. It may still be generating.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load report');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-gray-800 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Report Unavailable</h1>
          <p className="text-gray-500 text-sm">{error || 'This report could not be found.'}</p>
        </div>
      </div>
    );
  }

  const bandInfo = bandMessages[report.overall_band] || bandMessages['Calibrating'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your WorkSim Report</h1>
          <p className="text-gray-500 text-sm mt-1">{report.role} simulation at {report.company_name}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome & Overall */}
        <div className={`rounded-xl p-6 mb-6 border ${bandInfo.color}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-75 mb-1">Hi {report.candidate_name},</p>
              <h2 className="text-xl font-semibold">{bandInfo.title}</h2>
              <p className="text-sm mt-1 opacity-90">{bandInfo.message}</p>
            </div>
          </div>
        </div>

        {/* Session Summary */}
        {report.session_summary && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Session Overview</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{report.session_summary}</p>
          </div>
        )}

        {/* Trait Scores */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Scores</h2>
          <div className="space-y-4">
            {Object.entries(report.trait_scores || {}).map(([key, trait]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{traitLabels[key] || key}</span>
                </div>
                <ScoreBar score={trait.score} />
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Strengths
            </h2>
            <ul className="space-y-2">
              {(report.strengths || []).map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {strength}
                </li>
              ))}
              {(!report.strengths || report.strengths.length === 0) && (
                <li className="text-sm text-gray-400 italic">Being analyzed...</li>
              )}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Growth Areas
            </h2>
            <ul className="space-y-2">
              {(report.growth_areas || []).map((area, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {area}
                </li>
              ))}
              {(!report.growth_areas || report.growth_areas.length === 0) && (
                <li className="text-sm text-gray-400 italic">Being analyzed...</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-400 text-xs">
          <p>Powered by WorkSim</p>
          <p className="mt-1">This report reflects your performance in a simulated work scenario.</p>
        </div>
      </main>
    </div>
  );
}
