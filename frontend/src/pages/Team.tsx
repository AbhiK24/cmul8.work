import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import type { OrgMember, OrgInvitation } from '../api/client';
import Logo from '../components/Logo';

export default function Team() {
  const { getToken, user } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await auth.listMembers(token);
      setMembers(data.members);
      setInvitations(data.invitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setIsInviting(true);

    try {
      const token = await getToken();
      if (!token) return;

      await auth.inviteMember(token, inviteEmail, inviteRole);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      loadMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await auth.revokeInvitation(token, invitationId);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await auth.removeMember(token, userId);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const token = await getToken();
      if (!token) return;

      await auth.updateMemberRole(token, userId, newRole);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo linkTo="/dashboard" size="md" />
            <span className="text-muted">|</span>
            <h1 className="text-lg font-semibold text-dark">Team</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-muted hover:text-dark">
              Dashboard
            </Link>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:bg-dark/90 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite Member
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Members */}
        <div className="bg-white border border-border rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-dark">Team Members</h2>
            <p className="text-sm text-muted">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.user_id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {(member.name || member.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark">{member.name || member.email}</span>
                      {member.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          Admin
                        </span>
                      )}
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.user_id !== user?.id && member.status === 'active' && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value as 'admin' | 'member')}
                        className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  {member.user_id === user?.id && (
                    <span className="text-sm text-muted">You</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-dark">Pending Invitations</h2>
              <p className="text-sm text-muted">{invitations.length} invitation{invitations.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="divide-y divide-border">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-muted">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-dark">{invitation.email}</p>
                      <p className="text-sm text-muted">
                        Invited as {invitation.role} · Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeInvite(invitation.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">Invite Team Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteError('');
                  setInviteSuccess('');
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  {inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-dark/20"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted font-medium mb-2">
                  Role
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-colors ${
                    inviteRole === 'member' ? 'border-dark bg-dark/5' : 'border-border hover:border-dark/30'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={inviteRole === 'member'}
                      onChange={() => setInviteRole('member')}
                      className="sr-only"
                    />
                    <div className="font-medium text-dark">Member</div>
                    <div className="text-xs text-muted">Can create sessions and view reports</div>
                  </label>
                  <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-colors ${
                    inviteRole === 'admin' ? 'border-dark bg-dark/5' : 'border-border hover:border-dark/30'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={inviteRole === 'admin'}
                      onChange={() => setInviteRole('admin')}
                      className="sr-only"
                    />
                    <div className="font-medium text-dark">Admin</div>
                    <div className="text-xs text-muted">Full access + manage team</div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="w-full py-3 bg-dark text-white rounded-xl font-medium hover:bg-dark/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isInviting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
