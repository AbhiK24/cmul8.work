/**
 * Debug Simulation Page
 *
 * Secret route for testing simulation UI without creating real sessions.
 * Access via: /debug/sim
 *
 * This loads the Simulation component with mock data so you can:
 * - Test UI changes quickly
 * - See how tools/features look
 * - Debug without going through the full flow
 */

import { useState, useEffect, useRef } from 'react';
import type { Agent, Thread, Message, Task, ArtifactSection, ArtifactContent } from '../types';

interface EndCondition {
  type: 'win' | 'fail';
  trigger: 'relationship_threshold' | 'task_completion' | 'time_limit' | 'agent_escalation';
  description: string;
  threshold?: number;
  agent_id?: string;
  task_ids?: string[];
  trigger_seconds?: number;
  required_task_id?: string;
}

interface SimulationTool {
  id: string;
  name: string;
  url: string;
  icon?: 'email' | 'crm' | 'calendar' | 'support' | 'analytics' | 'default';
  description?: string;
  linked_task_id?: string;
}

interface SimulationEnv {
  company_name: string;
  company_description: string;
  scenario_tension: string;
  agents: Agent[];
  inbox: Thread[];
  tasks: Task[];
  artifact_content: ArtifactContent;
  inject_schedule: { inject_id: string; trigger_seconds: number; message: string; from_agent_id: string }[];
  end_conditions?: EndCondition[];
  tools?: SimulationTool[];
}

const relationshipLabels: Record<string, string> = {
  manager: 'Your Manager',
  report: 'Reports to You',
  peer: 'Peer',
  client: 'Client/External',
  system: 'System',
};

const archetypeHints: Record<string, string> = {
  standard: 'Generally cooperative and professional',
  difficult: 'May be guarded - build rapport first',
  client: 'Focused on outcomes and deadlines',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  busy: 'bg-amber-500',
  in_meeting: 'bg-red-500',
  away: 'bg-gray-400',
  dnd: 'bg-red-600',
};

// Generate DiceBear avatar URL
const avatarStyles = ['avataaars', 'personas', 'notionists', 'lorelei', 'adventurer'];
function getAvatarUrl(agent: { name: string; avatar_url?: string }, index: number = 0): string {
  if (agent.avatar_url) return agent.avatar_url;
  const style = avatarStyles[index % avatarStyles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${agent.name.replace(/\s+/g, '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function formatTime(ts: number) {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Get mood emoji based on relationship score
function getMoodEmoji(score: number): string {
  if (score >= 0.75) return '😊';
  if (score >= 0.6) return '🙂';
  if (score >= 0.45) return '😐';
  if (score >= 0.3) return '😕';
  return '😠';
}

// Get mood color based on relationship score
function getMoodColor(score: number): string {
  if (score >= 0.75) return 'text-emerald-500';
  if (score >= 0.6) return 'text-emerald-400';
  if (score >= 0.45) return 'text-amber-500';
  if (score >= 0.3) return 'text-orange-500';
  return 'text-red-500';
}

// Progress Ring SVG component
function ProgressRing({ progress, size = 60, strokeWidth = 4, color = '#10b981' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

// ============ MOCK DATA ============
const MOCK_ENV: SimulationEnv = {
  company_name: 'TechNova Solutions',
  company_description: 'A fast-growing B2B SaaS startup building enterprise workflow automation tools.',
  scenario_tension: 'The team is under pressure to ship a critical feature for a key client while dealing with conflicting priorities and a recent team restructure.',
  agents: [
    {
      agent_id: 'agent_001',
      name: 'Sarah Chen',
      role: 'Engineering Manager',
      relationship_to_candidate: 'manager',
      archetype: 'standard',
      persona_prompt: 'Supportive but busy. Values clear communication and proactive updates.',
      artifact_knowledge: null,
      hidden_information: 'The board is considering layoffs if Q4 targets are missed.',
      relationship_score_baseline: 0.6,
      escalation_threshold: 0.25,
    },
    {
      agent_id: 'agent_002',
      name: 'Marcus Johnson',
      role: 'Senior Developer',
      relationship_to_candidate: 'peer',
      archetype: 'difficult',
      persona_prompt: 'Experienced but skeptical of new approaches. Needs to be convinced with data.',
      artifact_knowledge: 'Knows the legacy codebase intimately.',
      hidden_information: 'Frustrated about being passed over for promotion.',
      relationship_score_baseline: 0.45,
      escalation_threshold: 0.2,
    },
    {
      agent_id: 'agent_003',
      name: 'Emily Rodriguez',
      role: 'Product Manager',
      relationship_to_candidate: 'peer',
      archetype: 'standard',
      persona_prompt: 'Enthusiastic and collaborative. Always thinking about user impact.',
      artifact_knowledge: null,
      hidden_information: 'Has been interviewing at other companies.',
      relationship_score_baseline: 0.65,
      escalation_threshold: 0.3,
    },
    {
      agent_id: 'agent_004',
      name: 'David Kim',
      role: 'Client Success Lead',
      relationship_to_candidate: 'client',
      archetype: 'client',
      persona_prompt: 'Represents the key client. Pushes for deadlines and commitments.',
      artifact_knowledge: null,
      hidden_information: 'The client is evaluating competitors.',
      relationship_score_baseline: 0.5,
      escalation_threshold: 0.3,
    },
  ],
  inbox: [
    {
      thread_id: 'thread_001',
      from_agent_id: 'agent_001',
      subject: 'Q4 Feature Priorities',
      preview: 'Hey, wanted to sync on the roadmap...',
      is_urgent: false,
      is_unread: true,
      messages: [
        {
          id: 'msg_001',
          sender: 'agent',
          agent_id: 'agent_001',
          content: 'Hey, wanted to sync on the Q4 feature priorities. The client is pushing hard on the integration feature. Can you give me an update on where we stand?',
          timestamp: Date.now() - 3600000,
        },
      ],
    },
    {
      thread_id: 'thread_002',
      from_agent_id: 'agent_002',
      subject: 'Code Review Request',
      preview: 'I have some concerns about the PR...',
      is_urgent: true,
      is_unread: true,
      messages: [
        {
          id: 'msg_002',
          sender: 'agent',
          agent_id: 'agent_002',
          content: 'I reviewed your PR and I have some concerns about the approach. The way you\'re handling the database connections could cause issues at scale. Can we discuss?',
          timestamp: Date.now() - 1800000,
        },
      ],
    },
    {
      thread_id: 'thread_003',
      from_agent_id: 'agent_004',
      subject: 'Demo Timeline',
      preview: 'The client needs confirmation...',
      is_urgent: true,
      is_unread: false,
      messages: [
        {
          id: 'msg_003',
          sender: 'agent',
          agent_id: 'agent_004',
          content: 'Hi there, the client is asking for a confirmed demo date. They\'re getting pressure from their leadership. Can we commit to next Thursday?',
          timestamp: Date.now() - 7200000,
        },
        {
          id: 'msg_004',
          sender: 'candidate',
          content: 'Let me check with the team and get back to you by EOD.',
          timestamp: Date.now() - 7000000,
        },
        {
          id: 'msg_005',
          sender: 'agent',
          agent_id: 'agent_004',
          content: 'Thanks. Please keep in mind they\'re evaluating other options if we can\'t deliver on time.',
          timestamp: Date.now() - 6800000,
        },
      ],
    },
  ],
  tasks: [
    {
      task_id: 'task_001',
      title: 'Review and respond to code feedback',
      description: 'Address Marcus\'s concerns about the database connection handling in your PR.',
      urgency: 'high',
      completed: false,
    },
    {
      task_id: 'task_002',
      title: 'Confirm demo timeline',
      description: 'Coordinate with the team and confirm a realistic demo date for the client.',
      urgency: 'high',
      completed: false,
    },
    {
      task_id: 'task_003',
      title: 'Update project documentation',
      description: 'Update the technical spec with the new integration approach.',
      urgency: 'medium',
      completed: false,
    },
    {
      task_id: 'task_004',
      title: 'Schedule team sync',
      description: 'Set up a meeting to align on Q4 priorities with Sarah and Emily.',
      urgency: 'low',
      completed: true,
    },
  ],
  artifact_content: {
    title: 'Integration Feature Spec',
    type: 'spec',
    sections: [
      {
        section_id: 'sec_001',
        title: 'Overview',
        content: 'This document outlines the technical approach for the enterprise integration feature requested by Acme Corp.',
        editable: true,
      },
      {
        section_id: 'sec_002',
        title: 'Technical Approach',
        content: 'We will use a webhook-based architecture with retry logic and dead-letter queues for reliability.\n\nKey components:\n- Webhook receiver service\n- Event processing pipeline\n- Integration status dashboard',
        linked_task_id: 'task_003',
        editable: true,
        has_error: true,
        error_hint: 'Missing error handling strategy',
      },
      {
        section_id: 'sec_003',
        title: 'Timeline',
        content: 'Phase 1: Core webhook infrastructure (Week 1-2)\nPhase 2: Event processing (Week 3)\nPhase 3: Dashboard and monitoring (Week 4)',
        editable: true,
      },
    ],
  },
  inject_schedule: [
    {
      inject_id: 'inject_001',
      trigger_seconds: 120,
      from_agent_id: 'agent_003',
      message: 'Quick heads up - just got out of a meeting with leadership. They\'re really focused on the Acme integration. Let me know if you need any help prioritizing!',
    },
  ],
  tools: [
    {
      id: 'tool_crm',
      name: 'Customer CRM',
      url: '/tools/mock-crm.html',
      icon: 'crm',
      description: 'View and manage customer records',
    },
    {
      id: 'tool_calendar',
      name: 'Team Calendar',
      url: '/tools/mock-crm.html', // Reusing mock for demo
      icon: 'calendar',
      description: 'Schedule meetings and check availability',
    },
  ],
};

export default function DebugSimulation() {
  const [env] = useState<SimulationEnv>(MOCK_ENV);
  const [candidateInfo] = useState({ name: 'Test User', role: 'Software Engineer' });
  const [agents, setAgents] = useState<(Agent & { relationship_score: number; status: string })[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [injectAlert, setInjectAlert] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [artifactSections, setArtifactSections] = useState<ArtifactSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  // Tools state
  const [showTools, setShowTools] = useState(false);
  const [activeTool, setActiveTool] = useState<{ id: string; name: string; url: string } | null>(null);
  const [toolEvents, setToolEvents] = useState<{ tool: string; action: string; data: Record<string, unknown>; timestamp: number }[]>([]);

  // Score change animation
  const [scoreChange, setScoreChange] = useState<{
    agentId: string;
    delta: number;
    timestamp: number;
  } | null>(null);

  // Milestone toasts state (static for debug)
  const [milestones] = useState<{ id: string; text: string; icon: string; timestamp: number }[]>([]);

  // Activity feed state (static mock data for debug)
  const [activityFeed] = useState<{ id: string; text: string; timestamp: number; type: 'agent' | 'system' | 'task' }[]>([
    { id: '1', text: 'Sarah Chen is reviewing project docs...', timestamp: Date.now(), type: 'agent' },
    { id: '2', text: 'You have 2 unread messages', timestamp: Date.now() - 10000, type: 'system' },
    { id: '3', text: '3 tasks still pending', timestamp: Date.now() - 20000, type: 'task' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolIframeRef = useRef<HTMLIFrameElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.thread_id === activeThreadId);
  const activeAgent = agents.find((a) => a.agent_id === activeThread?.from_agent_id);

  // Initialize on mount
  useEffect(() => {
    setAgents(env.agents.map((a, idx) => ({
      ...a,
      relationship_score: a.relationship_score_baseline,
      status: idx === 1 ? 'busy' : 'active', // Marcus is busy for demo
    })));
    setThreads(env.inbox);
    setTasks(env.tasks);
    setArtifactSections(env.artifact_content.sections);
    if (env.inbox.length > 0) {
      setActiveThreadId(env.inbox[0].thread_id);
    }
  }, [env]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stress injects
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    env.inject_schedule.forEach((inject) => {
      const timeout = setTimeout(() => {
        const agent = agents.find(a => a.agent_id === inject.from_agent_id);
        setInjectAlert(`${agent?.name || 'System'}: ${inject.message}`);
        setTimeout(() => setInjectAlert(null), 5000);
      }, inject.trigger_seconds * 1000);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(t => clearTimeout(t));
  }, [env, agents]);

  // postMessage listener for tools
  useEffect(() => {
    const handleToolMessage = (event: MessageEvent) => {
      const { type, tool, action, data } = event.data || {};
      if (type === 'TOOL_EVENT' && tool && action) {
        setToolEvents(prev => [...prev, { tool, action, data: data || {}, timestamp: Date.now() }]);
      }
      if (type === 'REQUEST_CONTEXT') {
        sendToolContext();
      }
    };
    window.addEventListener('message', handleToolMessage);
    return () => window.removeEventListener('message', handleToolMessage);
  }, [agents, tasks, elapsedSeconds]);

  const sendToolContext = () => {
    if (!toolIframeRef.current?.contentWindow) return;
    toolIframeRef.current.contentWindow.postMessage({
      type: 'SIMULATION_CONTEXT',
      context: {
        session_id: 'debug_session',
        candidate_name: candidateInfo.name,
        candidate_role: candidateInfo.role,
        company_name: env.company_name,
        elapsed_seconds: elapsedSeconds,
        agents: agents.map(a => ({ agent_id: a.agent_id, name: a.name, role: a.role, relationship_score: a.relationship_score })),
        tasks: tasks.map(t => ({ task_id: t.task_id, title: t.title, completed: t.completed })),
      }
    }, '*');
  };

  const openTool = (tool: { id: string; name: string; url: string }) => {
    setActiveTool(tool);
    setShowTools(true);
    setTimeout(sendToolContext, 500);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large. Please use an image under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setAttachedImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachedImage) || !activeThreadId || !activeThread) return;

    const messageContent = attachedImage
      ? [{ type: 'text' as const, text: message || '(image attached)' }, { type: 'image_url' as const, image_url: attachedImage }]
      : message;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'candidate',
      content: messageContent,
      timestamp: Date.now(),
    };

    setThreads(prev => prev.map(t =>
      t.thread_id === activeThreadId
        ? { ...t, messages: [...t.messages, newMessage], is_unread: false }
        : t
    ));
    setMessage('');
    setAttachedImage(null);
    setIsTyping(true);

    // Simulate agent response (mock)
    setTimeout(() => {
      const mockReplies = [
        "Thanks for the update. Let me think about this and get back to you.",
        "I appreciate you reaching out. Can you provide more details?",
        "Got it. I'll review this and follow up shortly.",
        "That's a good point. Let me check with the team.",
      ];
      const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];

      const agentReply: Message = {
        id: crypto.randomUUID(),
        sender: 'agent',
        agent_id: activeThread.from_agent_id,
        content: reply,
        timestamp: Date.now(),
      };

      setThreads(prev => prev.map(t =>
        t.thread_id === activeThreadId
          ? { ...t, messages: [...t.messages, agentReply] }
          : t
      ));

      // Random score change
      const delta = (Math.random() - 0.4) * 0.1;
      setAgents(prev => prev.map(a =>
        a.agent_id === activeThread.from_agent_id
          ? { ...a, relationship_score: Math.max(0, Math.min(1, a.relationship_score + delta)) }
          : a
      ));

      if (Math.abs(delta) >= 0.02) {
        setScoreChange({ agentId: activeThread.from_agent_id, delta, timestamp: Date.now() });
        setTimeout(() => setScoreChange(null), 2000);
      }

      setIsTyping(false);
    }, 1500);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const openNewThread = (agentId: string) => {
    const agent = agents.find(a => a.agent_id === agentId);
    if (!agent) return;

    const existingThread = threads.find(t => t.from_agent_id === agentId);
    if (existingThread) {
      setActiveThreadId(existingThread.thread_id);
      return;
    }

    const newThread: Thread = {
      thread_id: crypto.randomUUID(),
      from_agent_id: agentId,
      subject: `Conversation with ${agent.name}`,
      preview: '',
      is_urgent: false,
      is_unread: false,
      messages: [],
    };

    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.thread_id);
  };

  const handleSectionEdit = (sectionId: string, newContent: string) => {
    setArtifactSections(prev => prev.map(s => s.section_id === sectionId ? { ...s, content: newContent } : s));
  };

  // Time calculations
  const totalSeconds = 45 * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = (elapsedSeconds / totalSeconds) * 100;
  const isLowTime = remainingSeconds < 10 * 60;

  // Progress metrics
  const tasksCompleted = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;
  const avgRelationship = agents.length > 0 ? agents.reduce((sum, a) => sum + a.relationship_score, 0) / agents.length : 0.5;
  const relationshipProgress = avgRelationship * 100;
  const overallProgress = (taskProgress + relationshipProgress) / 2;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Debug Banner */}
      <div className="bg-amber-500 text-white text-center py-1 text-xs font-medium">
        DEBUG MODE - Mock Data | <a href="/dashboard" className="underline">Exit to Dashboard</a>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .milestone-toast {
          animation: slideInRight 0.3s ease-out;
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .chat-pattern {
          background-color: #f1f5f9;
          background-image:
            linear-gradient(135deg, rgba(99, 102, 241, 0.03) 25%, transparent 25%),
            linear-gradient(225deg, rgba(99, 102, 241, 0.03) 25%, transparent 25%),
            linear-gradient(45deg, rgba(99, 102, 241, 0.03) 25%, transparent 25%),
            linear-gradient(315deg, rgba(99, 102, 241, 0.03) 25%, transparent 25%);
          background-size: 20px 20px;
          background-position: 0 0, 10px 0, 10px -10px, 0 10px;
        }
        .modal-content {
          animation: slideUp 0.3s ease-out;
        }
        .typing-indicator span {
          animation: typing-dot 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Milestone Toasts */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {milestones.map(milestone => (
          <div
            key={milestone.id}
            className="milestone-toast flex items-center gap-3 px-5 py-4 glass-morphism rounded-2xl shadow-xl border border-white/50 max-w-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-xl">{milestone.icon}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800">{milestone.text}</span>
              <div className="text-[10px] text-emerald-600 font-medium">Achievement unlocked!</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Modal */}
      {showTools && activeTool && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activeTool.name}</h2>
                  <p className="text-xs text-slate-500 truncate max-w-md">{activeTool.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {toolEvents.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-emerald-700">{toolEvents.length} events</span>
                  </div>
                )}
                <button
                  onClick={() => { setShowTools(false); setActiveTool(null); }}
                  className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-dark transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                ref={toolIframeRef}
                src={activeTool.url}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={sendToolContext}
                title={activeTool.name}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 border-t border-border bg-surface/50 shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-muted">
                Actions in this tool are being tracked for your simulation.
              </p>
              <button
                onClick={() => { setShowTools(false); setActiveTool(null); }}
                className="px-3 py-1.5 bg-dark text-white rounded-lg text-xs font-medium hover:opacity-90 transition-colors"
              >
                Close Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Modal - Multi-Agent Document Editor */}
      {showArtifact && env.artifact_content && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
          <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header - Document Title & Collaboration Bar */}
            <div className="shrink-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-slate-200">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{env.artifact_content.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700 capitalize">
                        {env.artifact_content.type}
                      </span>
                      <span className="text-xs text-slate-500">
                        {artifactSections.length} sections • Last edited just now
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collaboration Status Bar */}
                <div className="flex items-center gap-3">
                  {/* Live Presence Indicators */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex -space-x-2">
                      {agents.slice(0, 3).map((agent, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={getAvatarUrl(agent, idx)}
                            alt="Collaborator"
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                      ))}
                    </div>
                    <div className="pl-1">
                      <div className="text-xs font-semibold text-slate-700">Team online</div>
                      <div className="text-[10px] text-slate-500">viewing document</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowArtifact(false)}
                    className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="flex items-center gap-6 px-6 pb-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{artifactSections.filter(s => s.linked_task_id && tasks.find(t => t.task_id === s.linked_task_id)?.completed).length} sections complete</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{artifactSections.filter(s => s.has_error).length} need review</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{agents.length} collaborators</span>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable Document */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50">
              <div className="max-w-3xl mx-auto p-8 space-y-6">
                {artifactSections.map((section, sectionIdx) => {
                  const linkedTask = tasks.find(t => t.task_id === section.linked_task_id);
                  const isEditing = editingSection === section.section_id;

                  return (
                    <div
                      key={section.section_id}
                      className={`relative rounded-2xl border-2 transition-all ${
                        isEditing
                          ? 'border-indigo-300 bg-white shadow-lg shadow-indigo-500/10'
                          : linkedTask && !linkedTask.completed
                          ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                          : section.has_error
                          ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            linkedTask?.completed
                              ? 'bg-emerald-100 text-emerald-600'
                              : section.has_error
                              ? 'bg-red-100 text-red-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sectionIdx + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{section.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {linkedTask && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  linkedTask.completed
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {linkedTask.completed ? '✓ Task Complete' : `⏳ ${linkedTask.title}`}
                                </span>
                              )}
                              {section.has_error && !linkedTask?.completed && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                  ⚠️ Needs Review
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {section.editable && (
                          <button
                            onClick={() => setEditingSection(isEditing ? null : section.section_id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isEditing
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isEditing ? '✓ Done' : '✏️ Edit'}
                          </button>
                        )}
                      </div>

                      {/* Section Content */}
                      <div className="px-5 pb-5">
                        {isEditing ? (
                          <textarea
                            value={section.content}
                            onChange={(e) => handleSectionEdit(section.section_id, e.target.value)}
                            className="w-full min-h-[180px] p-4 border-2 border-indigo-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 resize-y bg-white"
                            placeholder="Edit this section..."
                          />
                        ) : (
                          <div
                            className="prose prose-sm max-w-none text-slate-700 leading-relaxed pt-4"
                            dangerouslySetInnerHTML={{ __html: (section.content || '').replace(/\n/g, '<br/>') }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Changes auto-save as you edit</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowArtifact(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="h-16 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 w-64">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-dark text-sm">{env.company_name}</span>
            </div>
            <div className="text-[10px] text-muted">{candidateInfo.name} · {candidateInfo.role}</div>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center">
            <div className={`font-mono text-2xl font-bold ${isLowTime ? 'text-red-600' : 'text-dark'}`}>
              {formatTimer(remainingSeconds)}
            </div>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div className={`h-full transition-all duration-1000 ${isLowTime ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${100 - progressPercent}%` }} />
            </div>
            <div className="text-[10px] text-muted mt-0.5">remaining</div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-52 justify-end">
          {injectAlert && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium max-w-[180px] truncate">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
              <span className="truncate">{injectAlert}</span>
            </div>
          )}
          <button
            onClick={() => alert('End simulation (debug mode - no action)')}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted hover:bg-surface hover:text-dark transition-colors"
          >
            End WorkSim
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-[220px_1fr_260px] overflow-hidden">
        {/* Left panel - Agents & Inbox */}
        <div className="border-r border-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <h3 className="text-[9px] uppercase tracking-widest text-muted mb-2">Team</h3>
            <div className="space-y-1">
              {agents.map((agent, idx) => (
                <div key={agent.agent_id} className="relative">
                  <button
                    onClick={() => openNewThread(agent.agent_id)}
                    onMouseEnter={() => setHoveredAgent(agent.agent_id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-surface transition-colors text-left"
                  >
                    <div className="relative">
                      <img src={getAvatarUrl(agent, idx)} alt={agent.name} className="w-8 h-8 rounded-full bg-surface shadow-sm" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusColors[agent.status] || 'bg-gray-400'} border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-dark truncate">{agent.name}</div>
                      <div className="text-[10px] text-muted truncate">{agent.role}</div>
                    </div>
                    <span className={`text-sm ${getMoodColor(agent.relationship_score)}`} title={`${Math.round(agent.relationship_score * 100)}% rapport`}>
                      {getMoodEmoji(agent.relationship_score)}
                    </span>
                  </button>
                  {hoveredAgent === agent.agent_id && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-56 p-3 bg-white rounded-lg shadow-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={getAvatarUrl(agent, idx)} alt={agent.name} className="w-10 h-10 rounded-full bg-surface" />
                        <div>
                          <div className="text-sm font-medium text-dark">{agent.name}</div>
                          <div className="text-[10px] text-muted">{agent.role}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-100 text-indigo-600`}>
                            {relationshipLabels[agent.relationship_to_candidate] || 'Colleague'}
                          </span>
                        </div>
                        <p className="text-muted leading-relaxed">{archetypeHints[agent.archetype]}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-muted">Rapport:</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${agent.relationship_score > 0.65 ? 'bg-emerald-500' : agent.relationship_score > 0.4 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${agent.relationship_score * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium">{Math.round(agent.relationship_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-[9px] uppercase tracking-widest text-muted p-3 pb-2">Inbox</h3>
            <div className="space-y-0.5">
              {threads.map((thread) => {
                const agent = agents.find(a => a.agent_id === thread.from_agent_id);
                const isActive = thread.thread_id === activeThreadId;
                return (
                  <button
                    key={thread.thread_id}
                    onClick={() => {
                      setActiveThreadId(thread.thread_id);
                      setThreads(prev => prev.map(t => t.thread_id === thread.thread_id ? { ...t, is_unread: false } : t));
                    }}
                    className={`w-full p-3 text-left transition-colors ${isActive ? 'bg-surface border-l-2 border-dark' : 'hover:bg-surface/50'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {thread.is_unread && <span className="w-1.5 h-1.5 bg-dark rounded-full" />}
                      {thread.is_urgent && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                      <span className={`text-xs ${thread.is_unread ? 'font-medium text-dark' : 'text-mid'}`}>{agent?.name}</span>
                      <span className="text-[10px] text-muted ml-auto">{formatTime(thread.messages[thread.messages.length - 1]?.timestamp || Date.now())}</span>
                    </div>
                    <div className="text-xs text-mid truncate">{thread.subject}</div>
                    <div className="text-[10px] text-muted truncate">{thread.preview}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center panel - Thread */}
        <div className="flex flex-col overflow-hidden bg-white/50">
          {/* Scenario Context Banner */}
          <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-sm">⚡</span>
              <p className="text-xs text-amber-800 font-medium truncate flex-1">
                {env.scenario_tension}
              </p>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-amber-700 font-medium">Live</span>
              </div>
            </div>
          </div>

          {activeThread ? (
            <>
              <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0 bg-white/80">
                <div className="flex items-center gap-3">
                  {activeAgent && <img src={getAvatarUrl(activeAgent, agents.findIndex(a => a.agent_id === activeAgent.agent_id))} alt={activeAgent.name} className="w-9 h-9 rounded-full bg-surface" />}
                  <div>
                    <div className="text-sm font-medium text-dark">{activeAgent?.name}</div>
                    <div className="text-[10px] text-muted">{activeAgent?.role}</div>
                  </div>
                </div>
                {activeAgent && (
                  <div className="flex items-center gap-3 relative">
                    <div className="text-right">
                      <div className="text-[10px] text-muted">Relationship</div>
                      <div className={`text-sm font-bold ${activeAgent.relationship_score > 0.65 ? 'text-emerald-600' : activeAgent.relationship_score > 0.4 ? 'text-amber-600' : 'text-red-600'}`}>
                        {Math.round(activeAgent.relationship_score * 100)}%
                      </div>
                    </div>
                    <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${activeAgent.relationship_score > 0.65 ? 'bg-emerald-500' : activeAgent.relationship_score > 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${activeAgent.relationship_score * 100}%` }}
                      />
                    </div>
                    {scoreChange && scoreChange.agentId === activeAgent.agent_id && (
                      <div
                        className={`absolute -top-8 right-12 px-2 py-1 rounded-full text-sm font-bold shadow-lg ${scoreChange.delta > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                        style={{ animation: 'fadeSlideUp 1.5s ease-out forwards' }}
                      >
                        {scoreChange.delta > 0 ? '↑ +' : '↓ '}{Math.round(scoreChange.delta * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-pattern">
                {activeThread.messages.map((msg) => {
                  const msgAgent = agents.find(a => a.agent_id === msg.agent_id);
                  const renderContent = (content: string | { type: string; text?: string; image_url?: string }[]) => {
                    if (typeof content === 'string') return <p className="text-xs leading-relaxed">{content}</p>;
                    return (
                      <div className="space-y-2">
                        {content.map((block, idx) => {
                          if (block.type === 'text' && block.text) return <p key={idx} className="text-xs leading-relaxed">{block.text}</p>;
                          if (block.type === 'image_url' && block.image_url) return <img key={idx} src={block.image_url} alt="Attached" className="max-w-full max-h-48 rounded-lg border border-border" />;
                          return null;
                        })}
                      </div>
                    );
                  };
                  if (msg.sender === 'candidate') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-dark/5 text-dark rounded-lg px-3 py-2 max-w-md">
                          {renderContent(msg.content)}
                          <div className="text-[10px] text-muted text-right mt-1">{formatTime(msg.timestamp)}</div>
                        </div>
                      </div>
                    );
                  }
                  const agentIdx = agents.findIndex(a => a.agent_id === msg.agent_id);
                  return (
                    <div key={msg.id} className="flex gap-2">
                      <img src={msgAgent ? getAvatarUrl(msgAgent, agentIdx >= 0 ? agentIdx : 0) : `https://api.dicebear.com/7.x/avataaars/svg?seed=System`} alt={msgAgent?.name || 'Agent'} className="w-7 h-7 rounded-full bg-surface shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-dark">{msgAgent?.name}</span>
                          <span className="text-[10px] text-muted">{formatTime(msg.timestamp)}</span>
                        </div>
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  );
                })}
                {isTyping && activeAgent && (
                  <div className="flex gap-2">
                    <img src={getAvatarUrl(activeAgent, agents.findIndex(a => a.agent_id === activeAgent.agent_id))} alt={activeAgent.name} className="w-7 h-7 rounded-full bg-surface" />
                    <div className="bg-surface rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-border p-3 shrink-0">
                {attachedImage && (
                  <div className="mb-2 relative inline-block">
                    <img src={attachedImage} alt="Attached" className="max-h-24 rounded-lg border border-border" />
                    <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => imageInputRef.current?.click()} className="px-3 border border-border rounded-lg text-muted hover:bg-surface transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type your message..."
                    className="flex-1 border border-border rounded-lg p-2 text-sm resize-none h-14 focus:outline-none focus:ring-1 focus:ring-dark/20"
                  />
                  <button onClick={handleSend} disabled={(!message.trim() && !attachedImage) || isTyping} className="px-4 bg-dark text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:opacity-85 transition-all">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center chat-pattern">
              <div className="text-center max-w-sm px-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-2">Your Inbox Awaits</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Select a conversation from your inbox to continue, or wait for new messages from your colleagues.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>{agents.filter(a => a.status === 'active').length} colleagues online</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Tasks */}
        <div className="border-l border-border overflow-y-auto flex flex-col bg-white/50">
          {/* Progress & Score Preview */}
          <div className="p-3 border-b border-border bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              {/* Progress Ring */}
              <div className="relative">
                <ProgressRing
                  progress={overallProgress}
                  size={52}
                  strokeWidth={4}
                  color={overallProgress >= 60 ? '#10b981' : overallProgress >= 40 ? '#f59e0b' : '#ef4444'}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-dark">{Math.round(overallProgress)}%</span>
                </div>
              </div>
              {/* Score Breakdown */}
              <div className="flex-1 space-y-1.5">
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Tasks</span>
                    <span className="font-medium text-dark">{tasksCompleted}/{tasks.length}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted">Relationships</span>
                    <span className="font-medium text-dark">{Math.round(avgRelationship * 100)}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        avgRelationship >= 0.6 ? 'bg-emerald-500' :
                        avgRelationship >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${relationshipProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          {activityFeed.length > 0 && (
            <div className="p-2 border-b border-border bg-slate-50/50">
              <div className="text-[9px] uppercase tracking-widest text-muted mb-1.5 px-1">Activity</div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {activityFeed.slice(0, 3).map(activity => (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] ${
                      activity.type === 'agent' ? 'bg-blue-50 text-blue-700' :
                      activity.type === 'task' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
                    <span className="truncate">{activity.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-[9px] uppercase tracking-widest text-muted mb-3">Tasks</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.task_id} className={`p-2 rounded-lg border ${task.completed ? 'bg-surface border-border opacity-60' : 'bg-white border-border'}`}>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={task.completed} onChange={() => handleTaskToggle(task.task_id)} className="mt-0.5 w-3.5 h-3.5 rounded-sm border-border" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${task.completed ? 'line-through text-muted' : 'text-dark'}`}>{task.title}</div>
                      <div className="text-[10px] text-muted">{task.description}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${task.urgency === 'high' ? 'bg-red-100 text-red-700' : task.urgency === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {task.urgency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools & Artifact Buttons */}
          <div className="p-3 border-t border-border space-y-2">
            {env.tools && env.tools.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-muted font-medium px-1">Work Tools</div>
                {env.tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => openTool(tool)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 hover:from-slate-100 hover:to-gray-100 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      {tool.icon === 'crm' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ) : tool.icon === 'calendar' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">{tool.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">Open tool</div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowArtifact(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-indigo-900">{env.artifact_content.title}</div>
                <div className="text-[10px] text-indigo-600">Review and edit work document</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
