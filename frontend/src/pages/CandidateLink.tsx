import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CandidateLink() {
  const { sessionId } = useParams();
  const [copied, setCopied] = useState(false);

  // Mock candidate link
  const candidateToken = 'mock-token-abc123xyz';
  const candidateLink = `${window.location.origin}/s/${sessionId}/${candidateToken}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(candidateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-dark">WorkSim</h1>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-medium text-dark">Simulation ready</h2>
          </div>

          <p className="text-sm text-muted mb-4">
            Share this link with your candidate. They'll have 45 minutes to complete the simulation.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={candidateLink}
              className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm font-mono text-mid"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors min-w-[80px]"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-muted mt-3">Link expires in 7 days</p>

          <div className="mt-8 pt-6 border-t border-border">
            <Link to="/" className="text-sm text-primary hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
