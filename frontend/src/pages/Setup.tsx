import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, profile, ApiError, type OrgProfile } from '../api/client';
import type { Function } from '../types';
import Logo from '../components/Logo';
import ErrorAlert, { parseError, type ParsedError } from '../components/ErrorAlert';

const DEFAULT_ROLES: string[] = ['PM', 'Analyst', 'Ops Lead', 'Sales', 'Eng Manager'];
const FUNCTIONS: Function[] = ['Product', 'Engineering', 'Revenue', 'Operations', 'Finance', 'Strategy'];
const MODELS = [
  { id: 'cmul8-workenv1', name: 'cmul8-workenv1', description: 'Standard simulation' },
  { id: 'cmul8-workenv2', name: 'cmul8-workenv2', description: 'Advanced simulation' },
];

const LOADING_STEPS = [
  'Analyzing role requirements...',
  'Simulating coworkers...',
  'Creating project tasks...',
  'Adding stress triggers...',
  'Finalizing environment...',
];

export default function Setup() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<ParsedError | null>(null);
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(null);
  const [form, setForm] = useState({
    role: '',
    custom_role: '',
    function: '' as Function | '',
    model: 'cmul8-workenv1',
    candidate_name: '',
    candidate_email: '',
    candidate_type: 'external' as 'internal' | 'external',
  });
  const [jdFile, setJdFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const token = await getToken();
      if (!token) return;
      try {
        const data = await profile.get(token);
        setOrgProfile(data);
      } catch (err) {
        // Profile fetch failed, continue without it
      }
    }
    loadProfile();
  }, [getToken]);

  // Combine default roles with saved custom roles
  const customRoles = orgProfile?.custom_roles || [];
  const allRoles = [...DEFAULT_ROLES, ...customRoles, 'Custom'];

  const isValid =
    (form.role === 'Custom' ? form.custom_role : form.role) &&
    form.function &&
    form.candidate_name &&
    form.candidate_email &&
    orgProfile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const token = await getToken();
    if (!token) {
      setError({ type: 'error', title: 'Session expired', message: 'Please refresh the page and try again.' });
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);

    // Animate through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const actualRole = form.role === 'Custom' ? form.custom_role : form.role;

      // Save custom role for future use if it's new
      if (form.role === 'Custom' && form.custom_role && !customRoles.includes(form.custom_role)) {
        profile.addCustomRole(token, form.custom_role).catch(() => {
          // Silently fail - not critical
        });
      }

      const response = await sessions.create(token, {
        org_name: orgProfile?.company_name || undefined,
        role: actualRole,
        industry: orgProfile?.industry || '',
        stage: orgProfile?.stage || '',
        function: form.function,
        model: form.model,
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        candidate_type: form.candidate_type,
      }, jdFile || undefined);

      clearInterval(stepInterval);
      navigate(`/preview/${response.session_id}`, {
        state: {
          ...form,
          org_name: orgProfile?.company_name,
          industry: orgProfile?.industry,
          stage: orgProfile?.stage,
          role: form.role === 'Custom' ? form.custom_role : form.role,
          session: response,
        },
      });
    } catch (err) {
      clearInterval(stepInterval);
      const statusCode = err instanceof ApiError ? err.status : undefined;
      setError(parseError(err, statusCode));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-dark tracking-tight">Create WorkSim</h2>
          <p className="text-muted text-sm mt-2">Configure the scenario for your candidate assessment.</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {error && (
            <ErrorAlert error={error} onDismiss={() => setError(null)} />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
              >
                <option value="">Select role...</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {form.role === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom role"
                  value={form.custom_role}
                  onChange={(e) => setForm({ ...form, custom_role: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                />
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Job Description (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="jd-upload"
                />
                <label
                  htmlFor="jd-upload"
                  className="flex items-center justify-center gap-2 w-full border border-dashed border-border rounded-lg px-3 py-4 text-sm cursor-pointer hover:border-dark/40 hover:bg-surface/50 transition-colors"
                >
                  {jdFile ? (
                    <span className="flex items-center gap-2 text-dark">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {jdFile.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload JD PDF for more accurate simulation
                    </span>
                  )}
                </label>
                {jdFile && (
                  <button
                    type="button"
                    onClick={() => setJdFile(null)}
                    className="absolute top-2 right-2 text-muted hover:text-dark"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted mt-1">PDF containing job description to tailor the simulation</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Function
              </label>
              <select
                value={form.function}
                onChange={(e) => setForm({ ...form, function: e.target.value as Function })}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
              >
                <option value="">Select function...</option>
                {FUNCTIONS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Simulation Model
              </label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} — {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <p className="text-xs uppercase tracking-widest text-muted mb-4 font-medium">Candidate</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, candidate_type: 'external' })}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                        form.candidate_type === 'external'
                          ? 'bg-dark text-white border-dark'
                          : 'bg-white text-muted border-border hover:border-dark/40'
                      }`}
                    >
                      External
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, candidate_type: 'internal' })}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                        form.candidate_type === 'internal'
                          ? 'bg-dark text-white border-dark'
                          : 'bg-white text-muted border-border hover:border-dark/40'
                      }`}
                    >
                      Internal (Benchmark)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.candidate_name}
                    onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.candidate_email}
                    onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-6 space-y-4">
                {/* Progress bar */}
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-dark rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>

                {/* Current step */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="animate-pulse">{LOADING_STEPS[loadingStep]}</span>
                </div>

                {/* Step indicators */}
                <div className="flex justify-center gap-1.5">
                  {LOADING_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                        idx <= loadingStep ? 'bg-dark' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!isValid}
                className="w-full mt-6 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
              >
                Generate simulation
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
