import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Debrief() {
  const { sessionId } = useParams();
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState({
    q1: '',
    q2: '',
    q3: '',
  });

  const isValid = form.q1.length >= 50 && form.q2.length >= 30 && form.q3.length >= 30;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);

    // Mock API call - scoring takes ~30s
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h1 className="text-2xl font-semibold text-dark mb-2">Session complete</h1>
          <p className="text-muted text-sm mb-6">
            Your responses have been recorded. Your personalized report is being generated.
          </p>
          <a
            href={`/report/${sessionId}/candidate`}
            className="inline-flex bg-primary text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            View your report
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-medium text-dark">Before you go</h1>
          <div
            className={`font-mono text-sm px-3 py-1 rounded-full ${
              timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-surface text-muted'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <p className="text-muted text-sm mb-8">Three quick questions — there are no right answers.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              What did you prioritise in the session, and why?
            </label>
            <textarea
              value={form.q1}
              onChange={(e) => setForm({ ...form, q1: e.target.value })}
              className="w-full border border-border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your answer..."
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${form.q1.length >= 50 ? 'text-green-600' : 'text-muted'}`}>
                Min 50 characters
              </span>
              <span className="text-xs text-muted">{form.q1.length} characters</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              What do you think you missed or underweighted?
            </label>
            <textarea
              value={form.q2}
              onChange={(e) => setForm({ ...form, q2: e.target.value })}
              className="w-full border border-border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your answer..."
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${form.q2.length >= 30 ? 'text-green-600' : 'text-muted'}`}>
                Min 30 characters
              </span>
              <span className="text-xs text-muted">{form.q2.length} characters</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              If you had another hour, what would you do differently?
            </label>
            <textarea
              value={form.q3}
              onChange={(e) => setForm({ ...form, q3: e.target.value })}
              className="w-full border border-border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your answer..."
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${form.q3.length >= 30 ? 'text-green-600' : 'text-muted'}`}>
                Min 30 characters
              </span>
              <span className="text-xs text-muted">{form.q3.length} characters</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full bg-primary text-white py-3 px-4 rounded-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isSubmitting ? (
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
                Generating your report...
              </span>
            ) : (
              'Submit and see results'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
