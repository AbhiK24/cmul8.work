import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessions, profile, ApiError, type OrgProfile } from '../api/client';
import type { Role, Function } from '../types';
import Logo from '../components/Logo';

const ROLES: Role[] = ['PM', 'Analyst', 'Ops Lead', 'Sales', 'Eng Manager', 'Custom'];
const FUNCTIONS: Function[] = ['Product', 'Engineering', 'Revenue', 'Operations', 'Finance', 'Strategy'];
const MODELS = [
  { id: 'cmul8-workenv1', name: 'cmul8-workenv1', description: 'Standard simulation' },
  { id: 'cmul8-workenv2', name: 'cmul8-workenv2', description: 'Advanced simulation' },
];

export default function Setup() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(null);
  const [form, setForm] = useState({
    role: '' as Role | '',
    custom_role: '',
    function: '' as Function | '',
    model: 'cmul8-workenv1',
    candidate_name: '',
    candidate_email: '',
    candidate_type: 'external' as 'internal' | 'external',
  });

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        const data = await profile.get(token);
        setOrgProfile(data);
      } catch (err) {
        // Profile fetch failed, continue without it
      }
    }
    loadProfile();
  }, [token]);

  const isValid =
    (form.role === 'Custom' ? form.custom_role : form.role) &&
    form.function &&
    form.candidate_name &&
    form.candidate_email &&
    orgProfile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await sessions.create(token, {
        org_name: orgProfile?.company_name || undefined,
        role: form.role === 'Custom' ? form.custom_role : form.role,
        industry: orgProfile?.industry || '',
        stage: orgProfile?.stage || '',
        function: form.function,
        model: form.model,
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        candidate_type: form.candidate_type,
      });

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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create simulation. Please try again.');
      }
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
          <h2 className="text-2xl font-medium text-dark tracking-tight">New simulation</h2>
          <p className="text-muted text-sm mt-2">Configure the scenario for your candidate assessment.</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {error && (
            <div className="mb-6 p-3 bg-surface border border-border rounded-lg text-sm text-dark">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
              >
                <option value="">Select role...</option>
                {ROLES.map((role) => (
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

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full mt-6 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
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
                  Generating...
                </span>
              ) : (
                'Generate simulation'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
