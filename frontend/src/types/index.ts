export interface Agent {
  agent_id: string;
  name: string;
  role: string;
  relationship_to_candidate: 'manager' | 'report' | 'peer' | 'client' | 'system';
  archetype: 'standard' | 'difficult' | 'client';
  persona_prompt: string;
  artifact_knowledge: string | null;
  hidden_information: string;
  relationship_score_baseline: number;
  escalation_threshold: number;
  avatar_url?: string;
}

export interface StressInject {
  id: string;
  trigger_seconds: number;
  agent_id: string;
  message: string;
  thread_id: string;
}

export interface Thread {
  thread_id: string;
  from_agent_id: string;
  subject: string;
  preview: string;
  is_urgent: boolean;
  is_unread: boolean;
  messages: Message[];
}

export interface MessageContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: string;
}

export interface Message {
  id: string;
  sender: 'agent' | 'candidate' | 'system';
  agent_id?: string;
  content: string | MessageContentBlock[];  // Text or multimodal content
  timestamp: number;
}

export interface TaskRequirement {
  agent_id: string;
  info_needed: string;
  obtained: boolean;
}

export interface Task {
  task_id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  completed: boolean;
  // Task-driven simulation fields
  required_info?: TaskRequirement[];
  completion_type?: 'checkbox' | 'chat_validation' | 'artifact_edit' | 'deliverable';
  validating_agent_id?: string;
  deliverable_prompt?: string;
}

export interface Session {
  session_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_link: string;
  org_name: string;
  role: string;
  industry: string;
  stage: string;
  function: string;
  status: 'pending' | 'in_progress' | 'complete' | 'expired';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface ArtifactSection {
  section_id: string;
  title: string;
  content: string;
  linked_task_id?: string;
  editable: boolean;
  has_error?: boolean;
  error_hint?: string;
}

export interface ArtifactContent {
  title: string;
  type: string;
  sections: ArtifactSection[];
}

export interface Environment {
  company_name: string;
  company_description: string;
  scenario_tension: string;
  agents: Agent[];
  inbox: Thread[];
  tasks: Task[];
  artifact_content: ArtifactContent;
  inject_schedule: StressInject[];
}

export type Role = 'PM' | 'Analyst' | 'Ops Lead' | 'Sales' | 'Eng Manager' | 'Custom';
export type Industry = 'B2B SaaS' | 'Fintech' | 'BFSI' | 'Consulting' | 'E-commerce' | 'Healthcare' | 'Logistics' | 'Other';
export type Stage = 'Seed' | 'Series A' | 'Series B' | 'Scale-up' | 'Enterprise';
export type Function = 'Product' | 'Engineering' | 'Revenue' | 'Operations' | 'Finance' | 'Strategy';
