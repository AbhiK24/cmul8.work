import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profile, type OrgProfile, ApiError } from '../api/client';
import Logo from '../components/Logo';

const INDUSTRIES = ['B2B SaaS', 'Fintech', 'BFSI', 'Consulting', 'E-commerce', 'Healthcare', 'Logistics', 'Other'];
const STAGES = ['Seed', 'Series A', 'Series B', 'Scale-up', 'Enterprise'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function Profile() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<OrgProfile>({
    email: '',
    company_name: '',
    industry: '',
    stage: '',
    company_size: '',
    description: '',
    website: '',
    hiring_focus: '',
    profile_completed: false,
  });

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;

      try {
        const data = await profile.get(token);
        setForm(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await profile.update(token, {
        company_name: form.company_name || undefined,
        industry: form.industry || undefined,
        stage: form.stage || undefined,
        company_size: form.company_size || undefined,
        description: form.description || undefined,
        website: form.website || undefined,
        hiring_focus: form.hiring_focus || undefined,
      });
      setForm(updated);
      setSuccess('Profile saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link to="/dashboard" className="text-sm text-muted hover:text-dark transition-colors">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-dark tracking-tight">Organization Profile</h2>
          <p className="text-muted text-sm mt-2">
            This information helps generate more relevant simulations for your candidates.
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-8">
          {error && (
            <div className="mb-6 p-3 bg-surface border border-border rounded-lg text-sm text-dark">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-dark/5 border border-dark/10 rounded-lg text-sm text-dark">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                disabled
                value={form.email}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface text-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Company Name <span className="text-dark">*</span>
              </label>
              <input
                type="text"
                value={form.company_name || ''}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Your company name"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                  Industry <span className="text-dark">*</span>
                </label>
                <select
                  value={form.industry || ''}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                >
                  <option value="">Select...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                  Stage
                </label>
                <select
                  value={form.stage || ''}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                >
                  <option value="">Select...</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                  Company Size
                </label>
                <select
                  value={form.company_size || ''}
                  onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 bg-white"
                >
                  <option value="">Select...</option>
                  {SIZES.map((size) => (
                    <option key={size} value={size}>{size} employees</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                  Website
                </label>
                <input
                  type="url"
                  value={form.website || ''}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Company Description
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of what your company does..."
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1.5 font-medium">
                Hiring Focus
              </label>
              <textarea
                value={form.hiring_focus || ''}
                onChange={(e) => setForm({ ...form, hiring_focus: e.target.value })}
                placeholder="What roles are you typically hiring for? What skills matter most?"
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dark/20 focus:border-dark/40 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-6 bg-dark text-white py-3 px-4 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-85 transition-all duration-200 hover:-translate-y-0.5"
            >
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
