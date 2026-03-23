import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import Logo from '../components/Logo';

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Education',
  'Media & Entertainment',
  'Real Estate',
  'Other',
];

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

export default function OrgOnboarding() {
  const navigate = useNavigate();
  const { getToken, user, refreshOrg } = useAuth();

  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated. Please sign in again.');
        return;
      }

      await auth.createOrg(token, {
        org_name: orgName,
        industry: industry || undefined,
        company_size: companySize || undefined,
      });

      // Refresh org info in auth context before navigating
      await refreshOrg();

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo linkTo="" size="md" />
          <div className="text-sm text-muted">
            {user?.email}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step ? 'bg-emerald-100 text-emerald-700' :
                  s === step ? 'bg-dark text-white' :
                  'bg-gray-100 text-muted'
                }`}>
                  {s < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {s < 2 && (
                  <div className={`w-16 h-0.5 mx-2 ${s < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-dark">Set up your organization</h1>
                <p className="text-muted mt-2">Tell us about your company to get started</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted font-medium mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Inc."
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-dark/20"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted font-medium mb-2">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-dark/20 bg-white"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!orgName.trim()}
                  className="w-full py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-dark">Almost there!</h1>
                <p className="text-muted mt-2">One more detail about {orgName}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted font-medium mb-2">
                    Company Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          companySize === size
                            ? 'border-dark bg-dark text-white'
                            : 'border-border hover:border-dark/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-3 text-muted hover:text-dark transition-colors"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
