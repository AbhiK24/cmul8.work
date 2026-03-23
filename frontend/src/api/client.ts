/**
 * API client for WorkSim backend
 */

export const API_URL = import.meta.env.VITE_API_URL || 'https://shell-production-7135.up.railway.app';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(error.detail || 'Request failed', response.status);
  }

  return response.json();
}

// Auth types
export interface UserInfo {
  user_id: string;
  email: string;
  name: string | null;
  user_type: 'b2b' | 'b2c';
  org?: {
    org_id: string;
    name: string;
    slug: string;
    role: 'admin' | 'member';
  };
}

export interface OrgMember {
  user_id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'inactive';
  joined_at: string | null;
}

export interface OrgInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
  expires_at: string;
}

export interface InviteInfo {
  org_name: string;
  inviter_email: string;
  role: 'admin' | 'member';
}

// Auth endpoints
export const auth = {
  register: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>('/auth/register', {
      method: 'POST',
      body: { email, password },
    }),

  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  // Clerk-based login (verifies Clerk token and ensures work email)
  clerkLogin: (clerkToken: string) =>
    apiRequest<{ id: string; email: string }>('/auth/clerk', {
      method: 'POST',
      token: clerkToken,
    }),

  me: (token: string) =>
    apiRequest<UserInfo>('/auth/me', { token }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  // B2B Create Org - creates org for Clerk-authenticated user
  createOrg: (token: string, data: { org_name: string; industry?: string; company_size?: string }) =>
    apiRequest<{ access_token: string; user: UserInfo; org: { id: string; name: string; slug: string; role: string } }>('/auth/create-org', {
      method: 'POST',
      body: data,
      token,
    }),

  // Invite a member to org
  inviteMember: (token: string, email: string, role: 'admin' | 'member' = 'member') =>
    apiRequest<{ message: string; invitation_id: string }>('/auth/invite', {
      method: 'POST',
      body: { email, role },
      token,
    }),

  // List org members
  listMembers: (token: string) =>
    apiRequest<{ members: OrgMember[]; invitations: OrgInvitation[] }>('/auth/members', { token }),

  // Get invite info (public - no auth)
  getInviteInfo: (inviteToken: string) =>
    apiRequest<InviteInfo>(`/auth/invite/${inviteToken}`),

  // Accept an invitation
  acceptInvite: (token: string, inviteToken: string, name?: string, password?: string) =>
    apiRequest<{ access_token: string; user: UserInfo }>('/auth/invite/accept', {
      method: 'POST',
      body: { invite_token: inviteToken, name, password },
      token,
    }),

  // Remove a member from org (admin only)
  removeMember: (token: string, userId: string) =>
    apiRequest<{ message: string }>(`/auth/members/${userId}`, {
      method: 'DELETE',
      token,
    }),

  // Update member role (admin only)
  updateMemberRole: (token: string, userId: string, role: 'admin' | 'member') =>
    apiRequest<{ message: string }>(`/auth/members/${userId}/role`, {
      method: 'PATCH',
      body: { role },
      token,
    }),

  // Revoke invitation (admin only)
  revokeInvitation: (token: string, invitationId: string) =>
    apiRequest<{ message: string }>(`/auth/invitations/${invitationId}`, {
      method: 'DELETE',
      token,
    }),
};

// B2C Auth endpoints (Social OAuth)
export interface B2CUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  job_role: string | null;
  experience_level: string | null;
}

export const b2cAuth = {
  // Get current B2C user
  me: (token: string) =>
    apiRequest<B2CUser>('/b2c/me', { token }),

  // Update B2C profile
  updateProfile: (token: string, data: {
    name?: string;
    job_role?: string;
    experience_level?: string;
    goals?: string[];
  }) =>
    apiRequest<{ message: string }>('/b2c/me', {
      method: 'PATCH',
      body: data,
      token,
    }),

  // Note: Google/LinkedIn auth are browser redirects, not API calls
  // Use window.location.href = `${API_URL}/b2c/auth/google`
};

// Session endpoints
export interface CreateSessionRequest {
  org_name?: string;
  role: string;
  industry: string;
  stage: string;
  function: string;
  model?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_type?: 'internal' | 'external';
}

export interface SessionResponse {
  session_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_link: string;
  candidate_type: 'internal' | 'external';
  status: string;
  created_at: string;
  org_name?: string;
  role: string;
  score?: number;
  has_report?: boolean;
  mode?: 'test' | 'train';
}

export interface SessionDetailResponse extends SessionResponse {
  started_at?: string;
  completed_at?: string;
  org_params: Record<string, string>;
  env?: Record<string, unknown>;
  report?: Record<string, unknown>;
}

export const sessions = {
  create: async (token: string, data: CreateSessionRequest, jdFile?: File): Promise<SessionResponse> => {
    const API_URL_BASE = import.meta.env.VITE_API_URL || 'https://shell-production-7135.up.railway.app';

    // Always use FormData - backend expects multipart form
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (jdFile) {
      formData.append('jd_file', jdFile);
    }

    const response = await fetch(`${API_URL_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(error.detail || 'Request failed', response.status);
    }

    return response.json();
  },

  list: (token: string) =>
    apiRequest<{ sessions: SessionResponse[] }>('/sessions', { token }),

  get: (token: string, sessionId: string) =>
    apiRequest<SessionDetailResponse>(`/sessions/${sessionId}`, { token }),

  getContext: (sessionId: string, candidateToken: string) =>
    apiRequest<{
      candidate_name: string;
      company_name: string;
      role: string;
      status: string;
      ready: boolean;
      mode?: 'test' | 'train';
      framework_name?: string;
      framework_reference?: FrameworkReference;
      coaching_prompts?: Record<string, string[]>;
      learning_objectives?: string[];
    }>(`/sessions/${sessionId}/context?token=${candidateToken}`),

  generateReport: (token: string, sessionId: string) =>
    apiRequest<{ status: string; message: string }>(`/sessions/${sessionId}/score`, {
      method: 'POST',
      token,
    }),
};

// Profile endpoints
export interface OrgProfile {
  email: string;
  company_name?: string;
  industry?: string;
  stage?: string;
  company_size?: string;
  description?: string;
  website?: string;
  hiring_focus?: string;
  custom_roles?: string[];
  profile_completed: boolean;
}

export interface UpdateProfileRequest {
  company_name?: string;
  industry?: string;
  stage?: string;
  company_size?: string;
  description?: string;
  website?: string;
  hiring_focus?: string;
}

export const profile = {
  get: (token: string) =>
    apiRequest<OrgProfile>('/profile', { token }),

  update: (token: string, data: UpdateProfileRequest) =>
    apiRequest<OrgProfile>('/profile', {
      method: 'PUT',
      body: data,
      token,
    }),

  addCustomRole: (token: string, role: string) =>
    apiRequest<OrgProfile>('/profile/custom-roles', {
      method: 'POST',
      body: { role },
      token,
    }),
};

// Candidate endpoints
export interface MessageContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: string;
}

export interface MessageRequest {
  session_id: string;
  token: string;
  agent_id: string;
  message_text: string | MessageContentBlock[];  // Text or multimodal content
  elapsed_seconds: number;
  thread_id?: string;
}

export interface TraceRequest {
  session_id: string;
  token: string;
  event_type: 'thread_open' | 'task_update' | 'artifact_view';
  elapsed_seconds: number;
  agent_id?: string;
  thread_id?: string;
  task_id?: string;
  content?: Record<string, unknown>;
}

export interface ArtifactCommentRequest {
  session_id: string;
  token: string;
  section_id: string;
  comment_text: string;
  elapsed_seconds: number;
}

export const candidate = {
  sendMessage: (data: MessageRequest) =>
    apiRequest<{ reply: string; relationship_score: number; agent_id: string }>('/candidate/message', {
      method: 'POST',
      body: data,
    }),

  getEnvironment: (sessionId: string, token: string) =>
    apiRequest<Record<string, unknown>>(`/candidate/env/${sessionId}?token=${token}`),

  submitDebrief: (
    sessionId: string,
    token: string,
    q1: string,
    q2: string,
    q3: string
  ) =>
    apiRequest<{ status: string; message: string; report_url?: string }>(
      `/sessions/${sessionId}/debrief`,
      {
        method: 'POST',
        body: { token, q1, q2, q3 },
      }
    ),

  // Trace endpoints for behavioral logging
  trace: (data: TraceRequest) =>
    apiRequest<{ status: string; event_id: string }>('/candidate/trace', {
      method: 'POST',
      body: data,
    }),

  artifactComment: (data: ArtifactCommentRequest) =>
    apiRequest<{ status: string; event_id: string }>('/candidate/artifact-comment', {
      method: 'POST',
      body: data,
    }),
};

// Training templates
export interface TemplateListItem {
  template_id: string;
  slug: string;
  title: string;
  skill_category: string;
  description: string;
  duration_minutes: number;
  difficulty: string;
  learning_objectives: string[];
}

export interface FrameworkStep {
  letter: string;
  name: string;
  description: string;
  example: string;
}

export interface FrameworkReference {
  title: string;
  steps: FrameworkStep[];
  pro_tip?: string;
}

export interface TemplateDetail extends TemplateListItem {
  company_context: {
    company_name: string;
    company_description: string;
    scenario_tension: string;
    candidate_role: string;
  };
  agents: {
    agent_id: string;
    name: string;
    role: string;
    relationship_to_candidate: string;
    description: string;
    avatar_url?: string;
  }[];
  tasks: {
    task_id: string;
    title: string;
    description: string;
    urgency: string;
  }[];
  framework_name?: string;
  framework_reference?: FrameworkReference;
}

export interface CreateTrainingSessionRequest {
  template_slug: string;
  candidate_name: string;
  candidate_email: string;
}

export const templates = {
  list: (token: string) =>
    apiRequest<TemplateListItem[]>('/templates', { token }),

  get: (token: string, slug: string) =>
    apiRequest<TemplateDetail>(`/templates/${slug}`, { token }),

  createSession: (token: string, data: CreateTrainingSessionRequest) =>
    apiRequest<SessionResponse>('/sessions/training', {
      method: 'POST',
      body: data,
      token,
    }),
};

// B2C Catalog Types
export interface B2CScenario {
  template_id: string;
  slug: string;
  title: string;
  skill_category: string;
  description: string;
  duration_minutes: number;
  difficulty: string;
  learning_objectives: string[];
  user_completed_count: number;
  user_best_score: number | null;
}

export interface B2CScenarioDetail extends B2CScenario {
  company_context: {
    company_name: string;
    company_description: string;
    scenario_tension: string;
    candidate_role: string;
  };
  agents: {
    agent_id: string;
    name: string;
    role: string;
    relationship_to_candidate: string;
    avatar_url?: string;
  }[];
  tasks: {
    task_id: string;
    title: string;
    description: string;
    urgency: string;
  }[];
  framework_name?: string;
  framework_reference?: FrameworkReference;
}

export interface B2CSkillCategory {
  id: string;
  name: string;
  description: string;
  scenarios: B2CScenario[];
}

export interface B2CUserSession {
  session_id: string;
  template_slug: string;
  template_title: string;
  skill_category: string;
  status: string;
  score: number | null;
  created_at: string;
  completed_at: string | null;
  candidate_token: string | null;
}

export interface B2CStartSessionResponse {
  session_id: string;
  session_url: string;
}

// B2C Catalog API
export const b2cCatalog = {
  // List all scenarios
  listScenarios: (token: string) =>
    apiRequest<B2CScenario[]>('/b2c/catalog/scenarios', { token }),

  // Get scenario details
  getScenario: (token: string, slug: string) =>
    apiRequest<B2CScenarioDetail>(`/b2c/catalog/scenarios/${slug}`, { token }),

  // List scenarios grouped by category
  listCategories: (token: string) =>
    apiRequest<B2CSkillCategory[]>('/b2c/catalog/categories', { token }),

  // Start a new practice session
  startSession: (token: string, slug: string) =>
    apiRequest<B2CStartSessionResponse>(`/b2c/catalog/sessions/${slug}/start`, {
      method: 'POST',
      token,
    }),

  // List user's practice sessions
  listSessions: (token: string) =>
    apiRequest<B2CUserSession[]>('/b2c/catalog/sessions', { token }),

  // Get specific session
  getSession: (token: string, sessionId: string) =>
    apiRequest<B2CUserSession>(`/b2c/catalog/sessions/${sessionId}`, { token }),

  // Get session detail with report (for training report page)
  getSessionDetail: (token: string, sessionId: string) =>
    apiRequest<{
      session_id: string;
      candidate_name: string;
      candidate_email: string;
      status: string;
      org_params: Record<string, unknown>;
      env: Record<string, unknown>;
      report: Record<string, unknown> | null;
    }>(`/b2c/catalog/sessions/${sessionId}/detail`, { token }),
};
