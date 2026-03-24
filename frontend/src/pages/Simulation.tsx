import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidate, sessions } from '../api/client';
import type { FrameworkReference, DocPresence, DocComment } from '../api/client';
import type { Agent, Thread, Message, Task, ArtifactSection, ArtifactContent } from '../types';
import { antiCheat } from '../utils/antiCheat';
import Onboarding from './Onboarding';

// Training mode types
interface TrainingContext {
  mode: 'test' | 'train';
  frameworkName?: string;
  frameworkReference?: FrameworkReference;
  coachingPrompts?: Record<string, string[]>;
  learningObjectives?: string[];
}

interface EndCondition {
  type: 'win' | 'fail';
  trigger: 'relationship_threshold' | 'task_completion' | 'time_limit' | 'agent_escalation';
  description: string;
  threshold?: number;
  agent_id?: string;
  task_ids?: string[];
  trigger_seconds?: number;  // For time_limit: when to check
  required_task_id?: string; // For time_limit: task that must be complete
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

// Colorful but minimal palette for relationships
const relationshipColors: Record<string, string> = {
  manager: 'bg-indigo-600',
  report: 'bg-emerald-600',
  peer: 'bg-sky-600',
  client: 'bg-amber-600',
  system: 'bg-gray-500',
};

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
  idle: 'bg-amber-500',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  busy: 'Busy',
  in_meeting: 'In a meeting',
  away: 'Away',
  dnd: 'Do not disturb',
};

interface AvailabilitySlot {
  at_seconds: number;
  state: string;
  duration_seconds?: number;
  reason?: string;
}

// Compute current availability based on schedule and elapsed time
function getCurrentAvailability(
  schedule: AvailabilitySlot[] | undefined,
  elapsedSeconds: number
): { state: string; reason?: string } {
  if (!schedule || schedule.length === 0) {
    return { state: 'active' };
  }

  // Sort by time and find the most recent state change
  const sorted = [...schedule].sort((a, b) => a.at_seconds - b.at_seconds);
  let currentState = 'active';
  let currentReason: string | undefined;

  for (const slot of sorted) {
    if (slot.at_seconds <= elapsedSeconds) {
      // Check if this state has expired (duration passed)
      if (slot.duration_seconds) {
        const endTime = slot.at_seconds + slot.duration_seconds;
        if (elapsedSeconds < endTime) {
          currentState = slot.state;
          currentReason = slot.reason;
        } else {
          currentState = 'active'; // Reverted to active after duration
          currentReason = undefined;
        }
      } else {
        currentState = slot.state;
        currentReason = slot.reason;
      }
    }
  }

  return { state: currentState, reason: currentReason };
}

// Generate DiceBear avatar URL for agents without one (retroactive support)
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

export default function Simulation() {
  const navigate = useNavigate();
  const { sessionId, token } = useParams();

  const [env, setEnv] = useState<SimulationEnv | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<{ name: string; role: string } | null>(null);
  const [agents, setAgents] = useState<(Agent & { relationship_score: number; status: string })[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [injectAlert, setInjectAlert] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);
  const [artifactSections, setArtifactSections] = useState<ArtifactSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Multi-agent doc collaboration state
  const [docPresence, setDocPresence] = useState<DocPresence[]>([]);
  const [docComments, setDocComments] = useState<DocComment[]>([]);

  // Win/Fail state
  const [endCondition, setEndCondition] = useState<{
    type: 'win' | 'fail' | null;
    reason: string;
    agentName?: string;
  }>({ type: null, reason: '' });

  // Score change animation
  const [scoreChange, setScoreChange] = useState<{
    agentId: string;
    delta: number;
    timestamp: number;
  } | null>(null);

  // Training mode state
  const [trainingContext, setTrainingContext] = useState<TrainingContext | null>(null);
  const [showCoachingSidebar, setShowCoachingSidebar] = useState(true);
  const [activeCoachingHint, setActiveCoachingHint] = useState<string | null>(null);

  // Tools/Browser state
  const [showTools, setShowTools] = useState(false);
  const [activeTool, setActiveTool] = useState<{ id: string; name: string; url: string } | null>(null);
  const [toolEvents, setToolEvents] = useState<{ tool: string; action: string; data: Record<string, unknown>; timestamp: number }[]>([]);

  // Milestone toasts state
  const [milestones, setMilestones] = useState<{ id: string; text: string; icon: string; timestamp: number }[]>([]);
  const [achievedMilestones, setAchievedMilestones] = useState<Set<string>>(new Set());

  // Activity feed state
  const [activityFeed, setActivityFeed] = useState<{ id: string; text: string; timestamp: number; type: 'agent' | 'system' | 'task' }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolIframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.thread_id === activeThreadId);
  const activeAgent = agents.find((a) => a.agent_id === activeThread?.from_agent_id);

  // Tools/Browser postMessage listener
  useEffect(() => {
    const handleToolMessage = (event: MessageEvent) => {
      // Validate origin in production (for now, accept all for development)
      // In production: if (event.origin !== 'https://tools.yourapp.com') return;

      const { type, tool, action, data } = event.data || {};

      if (type === 'TOOL_EVENT' && tool && action) {
        // Record the event
        const toolEvent = {
          tool,
          action,
          data: data || {},
          timestamp: Date.now(),
          elapsed_seconds: elapsedSeconds,
        };
        setToolEvents(prev => [...prev, toolEvent]);

        // Send to backend for tracing
        if (sessionId && token) {
          candidate.trace({
            session_id: sessionId,
            token: token,
            event_type: 'tool_event' as 'thread_open',
            elapsed_seconds: elapsedSeconds,
            content: toolEvent,
          }).catch(() => {});
        }

        // Handle specific tool events
        if (action === 'task_complete' && data?.task_id) {
          // Auto-complete associated task
          const taskId = data.task_id;
          setTasks(prev => prev.map(t =>
            t.task_id === taskId ? { ...t, completed: true } : t
          ));
        }

        if (action === 'close') {
          // Tool requested to close
          setShowTools(false);
          setActiveTool(null);
        }
      }

      // Tool is requesting simulation context
      if (type === 'REQUEST_CONTEXT') {
        sendToolContext();
      }
    };

    window.addEventListener('message', handleToolMessage);
    return () => window.removeEventListener('message', handleToolMessage);
  }, [sessionId, token, elapsedSeconds]);

  // Send context to tool iframe
  const sendToolContext = () => {
    if (!toolIframeRef.current?.contentWindow) return;

    toolIframeRef.current.contentWindow.postMessage({
      type: 'SIMULATION_CONTEXT',
      context: {
        session_id: sessionId,
        candidate_name: candidateInfo?.name,
        candidate_role: candidateInfo?.role,
        company_name: env?.company_name,
        elapsed_seconds: elapsedSeconds,
        agents: agents.map(a => ({
          agent_id: a.agent_id,
          name: a.name,
          role: a.role,
          relationship_score: a.relationship_score,
        })),
        tasks: tasks.map(t => ({
          task_id: t.task_id,
          title: t.title,
          completed: t.completed,
        })),
        recent_tool_events: toolEvents.slice(-20),
      }
    }, '*');
  };

  // Open a tool in the browser panel
  const openTool = (tool: { id: string; name: string; url: string }) => {
    setActiveTool(tool);
    setShowTools(true);
    // Send context once iframe loads
    setTimeout(sendToolContext, 500);
  };

  // Load environment on mount
  useEffect(() => {
    async function loadEnv() {
      if (!sessionId || !token) return;

      try {
        // Fetch candidate info and environment in parallel
        const [contextData, envResponse] = await Promise.all([
          sessions.getContext(sessionId, token),
          candidate.getEnvironment(sessionId, token)
        ]);

        setCandidateInfo({
          name: contextData.candidate_name,
          role: contextData.role
        });

        // Set training context if in train mode
        if (contextData.mode === 'train') {
          setTrainingContext({
            mode: 'train',
            frameworkName: contextData.framework_name,
            frameworkReference: contextData.framework_reference,
            coachingPrompts: contextData.coaching_prompts,
            learningObjectives: contextData.learning_objectives,
          });
        } else {
          setTrainingContext({ mode: 'test' });
        }

        const envData = envResponse as unknown as SimulationEnv;
        setEnv(envData);

        // Initialize agents with scores (all start at 0.5 midpoint)
        setAgents(envData.agents.map(a => ({
          ...a,
          relationship_score: 0.5,
          status: 'active'
        })));

        // Initialize threads
        setThreads(envData.inbox || []);
        if (envData.inbox?.length > 0) {
          setActiveThreadId(envData.inbox[0].thread_id);
        }

        // Initialize tasks
        setTasks(envData.tasks || []);

        // Initialize artifact sections
        if (envData.artifact_content?.sections) {
          setArtifactSections(envData.artifact_content.sections);
        }

        startTimeRef.current = Date.now();

        // Initialize anti-cheat detector
        if (sessionId) {
          antiCheat.init(sessionId);
        }
      } catch (err) {
        setError('Failed to load simulation');
      } finally {
        setIsLoading(false);
      }
    }

    loadEnv();

    // Cleanup anti-cheat on unmount
    return () => {
      antiCheat.destroy();
    };
  }, [sessionId, token]);

  // Timer - uses real time, not interval counter (works in background)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);

      if (elapsed >= 45 * 60) {
        clearInterval(interval);
        navigate(`/debrief/${sessionId}/${token}`);
        return;
      }

      setElapsedSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate, sessionId, token]);

  // Agent Autonomy Loop - agents can initiate contact
  useEffect(() => {
    if (!sessionId || !token || !onboardingComplete || endCondition.type) return;

    // Random interval between 45-90 seconds for natural feel
    const getRandomInterval = () => 45000 + Math.random() * 45000;

    let timeoutId: ReturnType<typeof setTimeout>;

    const checkAutonomy = async () => {
      try {
        const response = await candidate.autonomyTick(sessionId, token, elapsedSeconds);

        if (response.should_act && response.agent_id && response.message) {
          const agentId = response.agent_id;
          const messageContent = response.message;

          if (response.is_new_thread && response.thread_id) {
            // Create new thread
            const newThread: Thread = {
              thread_id: response.thread_id,
              from_agent_id: agentId,
              subject: response.subject || `Message from ${response.agent_name}`,
              preview: messageContent.slice(0, 50),
              is_urgent: false,
              is_unread: true,
              messages: [{
                id: crypto.randomUUID(),
                sender: 'agent',
                agent_id: agentId,
                content: messageContent,
                timestamp: Date.now(),
              }],
            };
            setThreads(prev => [newThread, ...prev]);
            setInjectAlert(`${response.agent_name}: ${messageContent.slice(0, 60)}...`);
            setTimeout(() => setInjectAlert(null), 5000);
          } else {
            // Add to existing thread
            const existingThread = threads.find(t => t.from_agent_id === agentId);
            if (existingThread) {
              setThreads(prev => prev.map(t =>
                t.thread_id === existingThread.thread_id
                  ? {
                      ...t,
                      is_unread: true,
                      messages: [...t.messages, {
                        id: crypto.randomUUID(),
                        sender: 'agent' as const,
                        agent_id: agentId,
                        content: messageContent,
                        timestamp: Date.now(),
                      }]
                    }
                  : t
              ));
              setInjectAlert(`${response.agent_name}: ${messageContent.slice(0, 60)}...`);
              setTimeout(() => setInjectAlert(null), 5000);
            }
          }
        }
      } catch (err) {
        // Silently fail - don't disrupt simulation
      }

      // Schedule next check
      timeoutId = setTimeout(checkAutonomy, getRandomInterval());
    };

    // Start after initial delay (give user time to settle)
    timeoutId = setTimeout(checkAutonomy, 30000);

    return () => clearTimeout(timeoutId);
  }, [sessionId, token, onboardingComplete, endCondition.type, agents, threads, elapsedSeconds]);

  // Time-based end condition check
  useEffect(() => {
    if (!env?.end_conditions || !onboardingComplete || endCondition.type) return;

    const timeConditions = env.end_conditions.filter(
      ec => ec.type === 'fail' && ec.trigger === 'time_limit' && ec.trigger_seconds
    );

    for (const condition of timeConditions) {
      // Check if we've passed the trigger time
      if (elapsedSeconds >= (condition.trigger_seconds || 0)) {
        // Check if required task is completed
        const requiredTask = condition.required_task_id
          ? tasks.find(t => t.task_id === condition.required_task_id)
          : null;

        // If task exists and is NOT completed, trigger fail
        if (requiredTask && !requiredTask.completed) {
          setEndCondition({
            type: 'fail',
            reason: condition.description || `Time ran out! "${requiredTask.title}" was not completed in time.`,
          });

          // Log time-based fail
          if (sessionId && token) {
            candidate.trace({
              session_id: sessionId,
              token: token,
              event_type: 'session_end' as 'thread_open',
              elapsed_seconds: elapsedSeconds,
              content: {
                end_type: 'fail',
                reason: 'time_limit',
                task_id: condition.required_task_id,
                trigger_seconds: condition.trigger_seconds,
              }
            }).catch(() => {});
          }
          break;
        }
      }
    }
  }, [elapsedSeconds, env, tasks, onboardingComplete, endCondition.type, sessionId, token]);

  // Stress injects - only start after onboarding completes
  useEffect(() => {
    if (!env?.inject_schedule || !onboardingComplete) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    env.inject_schedule.forEach((inject) => {
      const timeout = setTimeout(() => {
        const agent = agents.find(a => a.agent_id === inject.from_agent_id);
        setInjectAlert(`${agent?.name || 'System'}: ${inject.message}`);

        // Add inject message to appropriate thread or create new one
        const existingThread = threads.find(t => t.from_agent_id === inject.from_agent_id);
        if (existingThread) {
          setThreads(prev => prev.map(t =>
            t.thread_id === existingThread.thread_id
              ? {
                  ...t,
                  is_unread: true,
                  is_urgent: true,
                  messages: [...t.messages, {
                    id: crypto.randomUUID(),
                    sender: 'agent' as const,
                    agent_id: inject.from_agent_id,
                    content: inject.message,
                    timestamp: Date.now()
                  }]
                }
              : t
          ));
        }

        setTimeout(() => setInjectAlert(null), 5000);
      }, inject.trigger_seconds * 1000);

      timeouts.push(timeout);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [env, agents, threads, onboardingComplete]);

  // Doc Activity Polling - check for agent presence/comments when artifact is open
  useEffect(() => {
    if (!sessionId || !token || !showArtifact || endCondition.type) return;

    const checkDocActivity = async () => {
      try {
        const response = await candidate.docActivity(sessionId, token, elapsedSeconds);
        if (response.has_activity) {
          setDocPresence(response.presence || []);
          // Append new comments (avoid duplicates)
          if (response.new_comments?.length) {
            setDocComments(prev => {
              const existingIds = new Set(prev.map(c => c.comment_id));
              const newComments = response.new_comments.filter(c => !existingIds.has(c.comment_id));
              return [...prev, ...newComments];
            });
          }
        } else {
          // Clear presence when no activity
          setDocPresence([]);
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Check immediately and then every 5 seconds
    checkDocActivity();
    const interval = setInterval(checkDocActivity, 5000);

    return () => clearInterval(interval);
  }, [sessionId, token, showArtifact, elapsedSeconds, endCondition.type]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  // Milestone detection
  useEffect(() => {
    if (!onboardingComplete) return;

    const checkMilestones = () => {
      const newMilestones: { id: string; text: string; icon: string }[] = [];

      // First task completed
      const completedTasks = tasks.filter(t => t.completed).length;
      if (completedTasks === 1 && !achievedMilestones.has('first_task')) {
        newMilestones.push({ id: 'first_task', text: 'First task completed!', icon: '✅' });
      }

      // All tasks completed
      if (completedTasks === tasks.length && tasks.length > 0 && !achievedMilestones.has('all_tasks')) {
        newMilestones.push({ id: 'all_tasks', text: 'All tasks completed!', icon: '🎯' });
      }

      // Built rapport with someone (score > 0.7)
      agents.forEach(agent => {
        const milestoneId = `rapport_${agent.agent_id}`;
        if (agent.relationship_score >= 0.7 && !achievedMilestones.has(milestoneId)) {
          newMilestones.push({ id: milestoneId, text: `Built rapport with ${agent.name}!`, icon: '🤝' });
        }
      });

      // First message sent
      const totalMessages = threads.reduce((sum, t) => sum + t.messages.filter(m => m.sender === 'candidate').length, 0);
      if (totalMessages === 1 && !achievedMilestones.has('first_message')) {
        newMilestones.push({ id: 'first_message', text: 'First message sent!', icon: '💬' });
      }

      // 5 minutes in
      if (elapsedSeconds >= 300 && !achievedMilestones.has('five_min')) {
        newMilestones.push({ id: 'five_min', text: '5 minutes into the simulation!', icon: '⏱️' });
      }

      // Add new milestones
      if (newMilestones.length > 0) {
        const now = Date.now();
        setAchievedMilestones(prev => {
          const next = new Set(prev);
          newMilestones.forEach(m => next.add(m.id));
          return next;
        });
        setMilestones(prev => [
          ...prev,
          ...newMilestones.map(m => ({ ...m, timestamp: now }))
        ]);

        // Remove milestone toasts after 4 seconds
        setTimeout(() => {
          setMilestones(prev => prev.filter(m => Date.now() - m.timestamp < 4000));
        }, 4500);
      }
    };

    checkMilestones();
  }, [tasks, agents, threads, elapsedSeconds, onboardingComplete, achievedMilestones]);

  // Activity feed generation
  useEffect(() => {
    if (!onboardingComplete || !agents.length) return;

    // Generate random activity every 15-30 seconds
    const generateActivity = () => {
      const activities = [
        () => {
          const agent = agents[Math.floor(Math.random() * agents.length)];
          return { text: `${agent.name} is reviewing the project docs...`, type: 'agent' as const };
        },
        () => {
          const agent = agents[Math.floor(Math.random() * agents.length)];
          return { text: `${agent.name} updated their status`, type: 'agent' as const };
        },
        () => {
          const agent = agents[Math.floor(Math.random() * agents.length)];
          return { text: `${agent.name} joined a quick call`, type: 'agent' as const };
        },
        () => {
          const unreadCount = threads.filter(t => t.is_unread).length;
          if (unreadCount > 0) {
            return { text: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`, type: 'system' as const };
          }
          return null;
        },
        () => {
          const pendingTasks = tasks.filter(t => !t.completed).length;
          if (pendingTasks > 0) {
            return { text: `${pendingTasks} task${pendingTasks > 1 ? 's' : ''} still pending`, type: 'task' as const };
          }
          return null;
        },
      ];

      const activity = activities[Math.floor(Math.random() * activities.length)]();
      if (activity) {
        setActivityFeed(prev => [
          { id: crypto.randomUUID(), ...activity, timestamp: Date.now() },
          ...prev.slice(0, 4) // Keep only last 5 activities
        ]);
      }
    };

    // Initial activity after 10 seconds
    const initialTimeout = setTimeout(generateActivity, 10000);

    // Then every 15-30 seconds
    const interval = setInterval(() => {
      generateActivity();
    }, 15000 + Math.random() * 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [onboardingComplete, agents, threads, tasks]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 4MB for base64)
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large. Please use an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachedImage) || !activeThreadId || !activeThread || !sessionId || !token) return;

    // Track anti-cheat signal for message send
    const cheatCheck = antiCheat.messageSent(message.length);
    if (cheatCheck.suspicious) {
      console.log('Anti-cheat signal:', cheatCheck.reason);
    }

    // Build message content (multimodal if image attached)
    const messageContent: string | { type: 'text' | 'image_url'; text?: string; image_url?: string }[] =
      attachedImage
        ? [
            { type: 'text' as const, text: message || '(image attached)' },
            { type: 'image_url' as const, image_url: attachedImage },
          ]
        : message;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'candidate',
      content: messageContent,
      timestamp: Date.now(),
    };

    // Add candidate message immediately
    setThreads((prev) =>
      prev.map((t) =>
        t.thread_id === activeThreadId
          ? { ...t, messages: [...t.messages, newMessage], is_unread: false }
          : t
      )
    );
    setMessage('');
    setAttachedImage(null);
    setIsTyping(true);

    try {
      // Call API for agent response
      const response = await candidate.sendMessage({
        session_id: sessionId,
        token: token,
        agent_id: activeThread.from_agent_id,
        message_text: messageContent,
        elapsed_seconds: elapsedSeconds,
        thread_id: activeThreadId,
      });

      // Handle multimodal or text response
      const replyContent = typeof response.reply === 'string'
        ? response.reply
        : response.reply.map(block => ({
            type: block.type as 'text' | 'image_url',
            text: block.text,
            image_url: block.image_url,
          }));

      const agentReply: Message = {
        id: crypto.randomUUID(),
        sender: 'agent',
        agent_id: activeThread.from_agent_id,
        content: replyContent,
        timestamp: Date.now(),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.thread_id === activeThreadId
            ? { ...t, messages: [...t.messages, agentReply] }
            : t
        )
      );

      // Update relationship score (API returns absolute score, not delta)
      const newScore = response.relationship_score ?? 0.5;
      const scoringAgent = agents.find(a => a.agent_id === activeThread.from_agent_id);
      const oldScore = scoringAgent?.relationship_score ?? 0.5;
      const scoreDelta = newScore - oldScore;

      setAgents((prev) =>
        prev.map((a) =>
          a.agent_id === activeThread.from_agent_id
            ? { ...a, relationship_score: newScore }
            : a
        )
      );

      // Trigger score change animation if delta is significant
      if (Math.abs(scoreDelta) >= 0.01) {
        setScoreChange({
          agentId: activeThread.from_agent_id,
          delta: scoreDelta,
          timestamp: Date.now(),
        });
        // Clear animation after 2 seconds
        setTimeout(() => setScoreChange(null), 2000);
      }

      // ESCALATION DETECTION: Check if agent escalated to their boss
      if (response.escalated && !endCondition.type) {
        setEndCondition({
          type: 'fail',
          reason: `${scoringAgent?.name || 'A team member'} has escalated concerns about your interactions to their manager. ${response.escalation_reason || ''}`,
          agentName: scoringAgent?.name,
        });

        // Log escalation fail event
        if (sessionId && token) {
          candidate.trace({
            session_id: sessionId,
            token: token,
            event_type: 'session_end' as 'thread_open',
            elapsed_seconds: elapsedSeconds,
            content: {
              end_type: 'fail',
              reason: 'agent_escalation',
              agent_id: activeThread.from_agent_id,
              escalation_reason: response.escalation_reason,
              final_score: newScore,
            }
          }).catch(() => {});
        }
      }

      // FAIL DETECTION: Check end conditions from environment (with defaults)
      const defaultFailConditions: EndCondition[] = [{
        type: 'fail',
        trigger: 'relationship_threshold',
        description: `Your relationship with ${scoringAgent?.name || 'a team member'} has deteriorated beyond repair.`,
        threshold: 0.15,
      }];
      const failConditions = (env?.end_conditions?.filter(ec => ec.type === 'fail') || []).length > 0
        ? env!.end_conditions!.filter(ec => ec.type === 'fail')
        : defaultFailConditions;
      for (const condition of failConditions) {
        if (endCondition.type) break; // Already triggered

        if (condition.trigger === 'relationship_threshold') {
          const threshold = condition.threshold ?? 0.15;
          // Check if this specific agent or any agent
          const checkAgent = condition.agent_id
            ? condition.agent_id === activeThread.from_agent_id
            : true;

          if (checkAgent && newScore <= threshold) {
            setEndCondition({
              type: 'fail',
              reason: condition.description || `Your relationship with ${scoringAgent?.name || 'a team member'} has deteriorated beyond repair.`,
              agentName: scoringAgent?.name,
            });

            // Log fail event
            if (sessionId && token) {
              candidate.trace({
                session_id: sessionId,
                token: token,
                event_type: 'session_end' as 'thread_open',
                elapsed_seconds: elapsedSeconds,
                content: {
                  end_type: 'fail',
                  reason: condition.trigger,
                  agent_id: activeThread.from_agent_id,
                  final_score: newScore,
                  condition_description: condition.description,
                }
              }).catch(() => {});
            }
            break;
          }
        }
      }
    } catch (err) {
      // Show error in thread
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'system',
        content: 'Failed to send message. Please try again.',
        timestamp: Date.now(),
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.thread_id === activeThreadId
            ? { ...t, messages: [...t.messages, errorMessage] }
            : t
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find(t => t.task_id === taskId);
    const newCompleted = !task?.completed;

    // Log task_update event
    if (sessionId && token) {
      candidate.trace({
        session_id: sessionId,
        token: token,
        event_type: 'task_update',
        elapsed_seconds: elapsedSeconds,
        task_id: taskId,
        content: { completed: newCompleted, title: task?.title },
      }).catch(() => {}); // Fire and forget
    }

    const updatedTasks = tasks.map((t) => (t.task_id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updatedTasks);

    // WIN DETECTION: Check end conditions from environment (with defaults)
    const defaultWinConditions: EndCondition[] = [{
      type: 'win',
      trigger: 'task_completion',
      description: 'Excellent work! You completed all tasks while maintaining positive relationships.',
      task_ids: updatedTasks.map(t => t.task_id),
      threshold: 0.4,
    }];
    const winConditions = (env?.end_conditions?.filter(ec => ec.type === 'win') || []).length > 0
      ? env!.end_conditions!.filter(ec => ec.type === 'win')
      : defaultWinConditions;
    const avgRelationship = agents.reduce((sum, a) => sum + a.relationship_score, 0) / agents.length;

    for (const condition of winConditions) {
      if (endCondition.type) break; // Already triggered

      if (condition.trigger === 'task_completion') {
        // Check if required tasks are completed
        const requiredTaskIds = condition.task_ids || updatedTasks.map(t => t.task_id);
        const requiredTasksComplete = requiredTaskIds.every(
          tid => updatedTasks.find(t => t.task_id === tid)?.completed
        );

        // Also require good relationships (default 0.4 threshold)
        const relationshipThreshold = condition.threshold ?? 0.4;
        const allRelationshipsGood = agents.every(a => a.relationship_score >= relationshipThreshold);

        if (requiredTasksComplete && allRelationshipsGood) {
          setEndCondition({
            type: 'win',
            reason: condition.description || `Excellent work! You completed all tasks while maintaining positive relationships.`,
          });

          // Log win event
          if (sessionId && token) {
            candidate.trace({
              session_id: sessionId,
              token: token,
              event_type: 'session_end' as 'thread_open',
              elapsed_seconds: elapsedSeconds,
              content: {
                end_type: 'win',
                reason: condition.trigger,
                avg_relationship: avgRelationship,
                tasks_completed: updatedTasks.filter(t => t.completed).length,
                condition_description: condition.description,
              }
            }).catch(() => {});
          }
          break;
        }
      }
    }
  };

  const openNewThread = (agentId: string) => {
    const agent = agents.find((a) => a.agent_id === agentId);
    if (!agent) return;

    const existingThread = threads.find((t) => t.from_agent_id === agentId);
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

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.thread_id);
  };

  const handleEndWorkSim = () => {
    // Log anti-cheat summary before navigating
    const summary = antiCheat.getSummary();
    console.log('Anti-cheat summary:', summary);

    // Send integrity data to backend
    if (sessionId && token) {
      candidate.trace({
        session_id: sessionId,
        token: token,
        event_type: 'session_end' as 'thread_open',  // Type hack - backend will handle
        elapsed_seconds: elapsedSeconds,
        content: {
          integrity: summary,
          signals: antiCheat.getSignals().slice(-50)  // Last 50 signals
        }
      }).catch(() => {});
    }

    navigate(`/debrief/${sessionId}/${token}`);
  };

  const handleOpenArtifact = () => {
    // Log artifact_view event
    if (sessionId && token) {
      candidate.trace({
        session_id: sessionId,
        token: token,
        event_type: 'artifact_view',
        elapsed_seconds: elapsedSeconds,
      }).catch(() => {});
    }
    setShowArtifact(true);
  };

  const handleSectionEdit = (sectionId: string, newContent: string) => {
    setArtifactSections(prev =>
      prev.map(s => s.section_id === sectionId ? { ...s, content: newContent } : s)
    );

    // Log artifact edit and save to backend
    if (sessionId && token) {
      candidate.artifactComment({
        session_id: sessionId,
        token: token,
        section_id: sectionId,
        comment_text: newContent,
        elapsed_seconds: elapsedSeconds,
      }).catch(() => {});
    }

    // Check if this edit completes a task
    const linkedTask = tasks.find(t =>
      t.completion_type === 'artifact_edit' &&
      artifactSections.find(s => s.section_id === sectionId)?.linked_task_id === t.task_id
    );
    if (linkedTask && !linkedTask.completed) {
      setTasks(prev =>
        prev.map(t => t.task_id === linkedTask.task_id ? { ...t, completed: true } : t)
      );
    }
  };

  // Calculate time remaining for progress
  const totalSeconds = 45 * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = (elapsedSeconds / totalSeconds) * 100;
  const isLowTime = remainingSeconds < 10 * 60; // Less than 10 minutes

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-dark border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted text-sm">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (error || !env) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-xl font-medium text-dark mb-2">Error</h1>
          <p className="text-muted text-sm">{error || 'Failed to load simulation'}</p>
        </div>
      </div>
    );
  }

  // Show onboarding before simulation starts
  if (!onboardingComplete) {
    return (
      <Onboarding
        companyName={env.company_name}
        companyDescription={env.company_description}
        scenarioTension={env.scenario_tension}
        candidateName={candidateInfo?.name || 'Candidate'}
        role={candidateInfo?.role || 'Team Member'}
        agents={env.agents}
        tasks={env.tasks || []}
        artifact={env.artifact_content}
        onComplete={() => {
          setOnboardingComplete(true);
          startTimeRef.current = Date.now(); // Reset timer when simulation actually starts
        }}
      />
    );
  }

  // Calculate progress metrics
  const tasksCompleted = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0;
  const avgRelationship = agents.length > 0 ? agents.reduce((sum, a) => sum + a.relationship_score, 0) / agents.length : 0.5;
  const relationshipProgress = avgRelationship * 100;
  const overallProgress = (taskProgress + relationshipProgress) / 2;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f8fafc]">
      {/* CSS for animations and patterns */}
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
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .milestone-toast {
          animation: slideInRight 0.3s ease-out;
        }
        .modal-backdrop {
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          animation: slideUp 0.3s ease-out;
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-dark {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .chat-pattern {
          background-color: #ffffff;
          background-image:
            radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.03) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(99, 102, 241, 0.03) 2px, transparent 0);
          background-size: 100px 100px;
        }
        .typing-indicator span {
          animation: typing-dot 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
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
      {/* Win/Fail End Condition Modal */}
      {endCondition.type && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className={`modal-content glass-morphism rounded-3xl p-8 max-w-md mx-4 shadow-2xl text-center border ${
            endCondition.type === 'fail' ? 'border-red-200' : 'border-emerald-200'
          }`}>
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl opacity-20 blur-xl -z-10 ${
              endCondition.type === 'fail' ? 'bg-red-500' : 'bg-emerald-500'
            }`} />

            {/* Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg ${
              endCondition.type === 'fail'
                ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
            }`}>
              {endCondition.type === 'fail' ? (
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-2xl font-bold mb-2 ${
              endCondition.type === 'fail' ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {endCondition.type === 'fail' ? 'Simulation Failed' : 'Simulation Complete!'}
            </h3>

            {/* Reason */}
            <p className="text-slate-600 mb-6">{endCondition.reason}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Time Elapsed</div>
                <div className="text-xl font-bold text-slate-800">{formatTimer(elapsedSeconds)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Tasks Completed</div>
                <div className="text-xl font-bold text-slate-800">{tasks.filter(t => t.completed).length}/{tasks.length}</div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleEndWorkSim}
              className={`w-full px-6 py-4 rounded-2xl text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                endCondition.type === 'fail'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30'
              }`}
            >
              Continue to Debrief →
            </button>
          </div>
        </div>
      )}

      {/* End confirmation modal */}
      {showEndConfirm && !endCondition.type && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content glass-morphism rounded-3xl p-8 max-w-sm mx-4 shadow-2xl border border-white/50">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">End Early?</h3>
            <p className="text-sm text-slate-600 mb-6 text-center">
              You still have <span className="font-semibold text-amber-600">{Math.floor(remainingSeconds / 60)} minutes</span> remaining.
              Are you sure you want to finish?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Keep Working
              </button>
              <button
                onClick={handleEndWorkSim}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                End & Debrief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools/Browser Modal */}
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
      {showArtifact && env?.artifact_content && (
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
                      {/* Show agents who might be viewing */}
                      {(docPresence.length > 0 ? docPresence : agents.slice(0, 2)).slice(0, 3).map((item, idx) => {
                        const agentData = 'agent_id' in item
                          ? agents.find(a => a.agent_id === item.agent_id)
                          : item;
                        return (
                          <div key={idx} className="relative">
                            <img
                              src={agentData ? getAvatarUrl(agentData as Agent, idx) : `https://api.dicebear.com/7.x/avataaars/svg?seed=Agent${idx}`}
                              alt="Collaborator"
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="pl-1">
                      <div className="text-xs font-semibold text-slate-700">
                        {docPresence.length > 0 ? `${docPresence.length} collaborator${docPresence.length > 1 ? 's' : ''}` : 'Team online'}
                      </div>
                      {docPresence.some(p => p.action === 'typing') ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                          <span>typing</span>
                          <span className="typing-indicator flex gap-0.5">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500">viewing document</div>
                      )}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>{docComments.length} comments</span>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable Document */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50">
              <div className="max-w-3xl mx-auto p-8 space-y-6">
                {artifactSections.map((section, sectionIdx) => {
                  const linkedTask = tasks.find(t => t.task_id === section.linked_task_id);
                  const isEditing = editingSection === section.section_id;
                  const sectionComments = docComments.filter(c => c.section_id === section.section_id);
                  const sectionPresence = docPresence.filter(p => p.section_id === section.section_id);

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
                      {/* Section presence indicator */}
                      {sectionPresence.length > 0 && (
                        <div className="absolute -top-3 -right-2 flex -space-x-1">
                          {sectionPresence.map((p, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.agent_name}`}
                                alt={p.agent_name}
                                className="w-6 h-6 rounded-full border-2 border-white shadow"
                              />
                              {p.action === 'typing' && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

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
                        {/* Typing indicator */}
                        {sectionPresence.some(p => p.action === 'typing') && (
                          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            {sectionPresence.filter(p => p.action === 'typing').map((p, idx) => (
                              <span key={idx} className="flex items-center gap-1.5 text-xs text-emerald-700">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.agent_name}`}
                                  alt={p.agent_name}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="font-medium">{p.agent_name}</span>
                                <span>is typing</span>
                                <span className="typing-indicator flex gap-0.5">
                                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        {isEditing ? (
                          <textarea
                            value={section.content}
                            onChange={(e) => handleSectionEdit(section.section_id, e.target.value)}
                            className="w-full min-h-[180px] p-4 border-2 border-indigo-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 resize-y bg-white"
                            placeholder="Edit this section..."
                          />
                        ) : (
                          <div
                            className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: (section.content || '').replace(/\n/g, '<br/>') }}
                          />
                        )}

                        {/* Comments Thread */}
                        {sectionComments.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-700">{sectionComments.length} Comment{sectionComments.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="space-y-2">
                              {sectionComments.map(comment => {
                                const commentAgent = agents.find(a => a.agent_id === comment.agent_id);
                                const agentIdx = agents.findIndex(a => a.agent_id === comment.agent_id);
                                return (
                                  <div key={comment.comment_id} className="flex gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                    <img
                                      src={commentAgent ? getAvatarUrl(commentAgent, agentIdx >= 0 ? agentIdx : 0) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.agent_name}`}
                                      alt={comment.agent_name}
                                      className="w-8 h-8 rounded-full border-2 border-white shadow shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-800">{comment.agent_name}</span>
                                        <span className="text-[10px] text-slate-500">{formatTime(comment.timestamp * 1000)}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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
        {/* Left - Company info + Training Mode Badge */}
        <div className="flex items-center gap-4 w-64">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-dark text-sm">{env.company_name}</span>
              {trainingContext?.mode === 'train' && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                  Training Mode
                </span>
              )}
            </div>
            {candidateInfo && (
              <div className="text-[10px] text-muted">
                {candidateInfo.name} · {candidateInfo.role}
              </div>
            )}
          </div>
        </div>

        {/* Center - Prominent Timer */}
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center">
            <div className={`font-mono text-2xl font-bold ${isLowTime ? 'text-red-600' : 'text-dark'}`}>
              {formatTimer(remainingSeconds)}
            </div>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-1000 ${isLowTime ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-muted mt-0.5">remaining</div>
          </div>
        </div>

        {/* Right - Alert + End button */}
        <div className="flex items-center gap-3 w-52 justify-end">
          {injectAlert && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium max-w-[180px] truncate">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
              <span className="truncate">{injectAlert}</span>
            </div>
          )}
          <button
            onClick={() => setShowEndConfirm(true)}
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
          {/* Agents */}
          <div className="p-3 border-b border-border">
            <h3 className="text-[9px] uppercase tracking-widest text-muted mb-2">Team</h3>
            <div className="space-y-1">
              {agents.map((agent, idx) => {
                // Compute current availability from schedule
                const availability = getCurrentAvailability(
                  (env?.agents?.find(a => a.agent_id === agent.agent_id) as any)?.availability_schedule,
                  elapsedSeconds
                );
                const availState = availability.state;
                const availReason = availability.reason;

                return (
                <div key={agent.agent_id} className="relative">
                  <button
                    onClick={() => openNewThread(agent.agent_id)}
                    onMouseEnter={() => setHoveredAgent(agent.agent_id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-surface transition-colors text-left"
                  >
                    <div className="relative">
                      <img
                        src={getAvatarUrl(agent, idx)}
                        alt={agent.name}
                        className="w-8 h-8 rounded-full bg-surface shadow-sm"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusColors[availState] || 'bg-gray-400'} border-2 border-white`}
                        title={statusLabels[availState] || availState}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-dark truncate">{agent.name}</div>
                      <div className="text-[10px] text-muted truncate">
                        {availState !== 'active' ? (
                          <span className={availState === 'in_meeting' || availState === 'dnd' ? 'text-red-600' : 'text-amber-600'}>
                            {availReason || statusLabels[availState]}
                          </span>
                        ) : agent.role}
                      </div>
                    </div>
                    <span className={`text-sm ${getMoodColor(agent.relationship_score)}`} title={`${Math.round(agent.relationship_score * 100)}% rapport`}>
                      {getMoodEmoji(agent.relationship_score)}
                    </span>
                  </button>

                  {/* Hover tooltip */}
                  {hoveredAgent === agent.agent_id && (
                    <div className="absolute left-full top-0 ml-2 z-50 w-56 p-3 bg-white rounded-lg shadow-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={getAvatarUrl(agent, idx)}
                          alt={agent.name}
                          className="w-10 h-10 rounded-full bg-surface"
                        />
                        <div>
                          <div className="text-sm font-medium text-dark">{agent.name}</div>
                          <div className="text-[10px] text-muted">{agent.role}</div>
                        </div>
                      </div>
                      {/* Availability status */}
                      {availState !== 'active' && (
                        <div className={`mb-2 px-2 py-1 rounded text-[10px] font-medium ${
                          availState === 'in_meeting' || availState === 'dnd'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {availReason || statusLabels[availState]}
                        </div>
                      )}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            (relationshipColors[agent.relationship_to_candidate] || 'bg-gray-600').replace('bg-', 'bg-').replace('-600', '-100')
                          } ${(relationshipColors[agent.relationship_to_candidate] || 'bg-gray-600').replace('bg-', 'text-')}`}>
                            {relationshipLabels[agent.relationship_to_candidate] || agent.relationship_to_candidate || 'Colleague'}
                          </span>
                        </div>
                        <p className="text-muted leading-relaxed">
                          {archetypeHints[agent.archetype] || 'Standard colleague'}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-muted">Rapport:</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                agent.relationship_score > 0.65 ? 'bg-emerald-500' :
                                agent.relationship_score > 0.4 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${agent.relationship_score * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium">{Math.round(agent.relationship_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>

          {/* Inbox */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-[9px] uppercase tracking-widest text-muted p-3 pb-2">Inbox</h3>
            <div className="space-y-0.5">
              {threads.map((thread) => {
                const agent = agents.find((a) => a.agent_id === thread.from_agent_id);
                const isActive = thread.thread_id === activeThreadId;
                return (
                  <button
                    key={thread.thread_id}
                    onClick={() => {
                      // Log thread_open event
                      if (sessionId && token && thread.thread_id !== activeThreadId) {
                        candidate.trace({
                          session_id: sessionId,
                          token: token,
                          event_type: 'thread_open',
                          elapsed_seconds: elapsedSeconds,
                          thread_id: thread.thread_id,
                          agent_id: thread.from_agent_id,
                        }).catch(() => {}); // Fire and forget
                      }
                      setActiveThreadId(thread.thread_id);
                      setThreads((prev) =>
                        prev.map((t) =>
                          t.thread_id === thread.thread_id ? { ...t, is_unread: false } : t
                        )
                      );
                    }}
                    className={`w-full p-3 text-left transition-colors ${
                      isActive ? 'bg-surface border-l-2 border-dark' : 'hover:bg-surface/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {thread.is_unread && <span className="w-1.5 h-1.5 bg-dark rounded-full" />}
                      {thread.is_urgent && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                      <span className={`text-xs ${thread.is_unread ? 'font-medium text-dark' : 'text-mid'}`}>
                        {agent?.name}
                      </span>
                      <span className="text-[10px] text-muted ml-auto">
                        {formatTime(thread.messages[thread.messages.length - 1]?.timestamp || Date.now())}
                      </span>
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
              {/* Thread header with live relationship meter */}
              <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0 bg-white/80">
                <div className="flex items-center gap-3">
                  {activeAgent && (
                    <img
                      src={getAvatarUrl(activeAgent, agents.findIndex(a => a.agent_id === activeAgent.agent_id))}
                      alt={activeAgent.name}
                      className="w-9 h-9 rounded-full bg-surface"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-dark">{activeAgent?.name}</div>
                    <div className="text-[10px] text-muted">{activeAgent?.role}</div>
                  </div>
                </div>

                {/* Live Relationship Meter */}
                {activeAgent && (
                  <div className="flex items-center gap-3 relative">
                    <div className="text-right">
                      <div className="text-[10px] text-muted">Relationship</div>
                      <div className={`text-sm font-bold ${
                        activeAgent.relationship_score > 0.65 ? 'text-emerald-600' :
                        activeAgent.relationship_score > 0.4 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {Math.round(activeAgent.relationship_score * 100)}%
                      </div>
                    </div>
                    <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          activeAgent.relationship_score > 0.65 ? 'bg-emerald-500' :
                          activeAgent.relationship_score > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${activeAgent.relationship_score * 100}%` }}
                      />
                    </div>

                    {/* Score Change Animation */}
                    {scoreChange && scoreChange.agentId === activeAgent.agent_id && (
                      <div
                        className={`absolute -top-8 right-12 px-2 py-1 rounded-full text-sm font-bold shadow-lg transition-all ${
                          scoreChange.delta > 0
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                        style={{
                          animation: 'fadeSlideUp 1.5s ease-out forwards',
                        }}
                      >
                        {scoreChange.delta > 0 ? '↑ +' : '↓ '}{Math.round(scoreChange.delta * 100)}%
                      </div>
                    )}

                    {activeAgent.relationship_score <= 0.25 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-medium text-red-700">At Risk</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.map((msg) => {
                  const msgAgent = agents.find((a) => a.agent_id === msg.agent_id);

                  // Helper to render content (text + optional image)
                  const renderContent = (content: string | { type: string; text?: string; image_url?: string }[]) => {
                    if (typeof content === 'string') {
                      return <p className="text-xs leading-relaxed">{content}</p>;
                    }
                    // Multimodal content
                    return (
                      <div className="space-y-2">
                        {content.map((block, idx) => {
                          if (block.type === 'text' && block.text) {
                            return <p key={idx} className="text-xs leading-relaxed">{block.text}</p>;
                          }
                          if (block.type === 'image_url' && block.image_url) {
                            return (
                              <img
                                key={idx}
                                src={block.image_url}
                                alt="Attached"
                                className="max-w-full max-h-48 rounded-lg border border-border"
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  };

                  if (msg.sender === 'candidate') {
                    // Check if message has been "seen" (agent responded after this message)
                    const msgIndex = activeThread.messages.findIndex(m => m.id === msg.id);
                    const hasAgentResponseAfter = activeThread.messages
                      .slice(msgIndex + 1)
                      .some(m => m.sender === 'agent');

                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-dark/5 text-dark rounded-lg px-3 py-2 max-w-md">
                          {renderContent(msg.content)}
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[10px] text-muted">{formatTime(msg.timestamp)}</span>
                            {hasAgentResponseAfter && (
                              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                                <svg className="w-3 h-3 -ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        <p className="text-xs text-amber-800">{typeof msg.content === 'string' ? msg.content : ''}</p>
                      </div>
                    );
                  }
                  const agentIdx = agents.findIndex(a => a.agent_id === msg.agent_id);
                  return (
                    <div key={msg.id} className="flex gap-2">
                      <img
                        src={msgAgent ? getAvatarUrl(msgAgent, agentIdx >= 0 ? agentIdx : 0) : `https://api.dicebear.com/7.x/avataaars/svg?seed=System`}
                        alt={msgAgent?.name || 'Agent'}
                        className="w-7 h-7 rounded-full bg-surface shrink-0"
                      />
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
                    <img
                      src={getAvatarUrl(activeAgent, agents.findIndex(a => a.agent_id === activeAgent.agent_id))}
                      alt={activeAgent.name}
                      className="w-7 h-7 rounded-full bg-surface"
                    />
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

              {/* Composer */}
              <div className="border-t border-border p-3 shrink-0">
                {/* Image preview */}
                {attachedImage && (
                  <div className="mb-2 relative inline-block">
                    <img
                      src={attachedImage}
                      alt="Attached"
                      className="max-h-24 rounded-lg border border-border"
                    />
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {/* Image upload button */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 border border-border rounded-lg text-muted hover:bg-surface transition-colors flex items-center justify-center"
                    title="Attach image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      // Track typing start
                      if (!message && e.target.value) {
                        antiCheat.startTyping();
                      }
                      setMessage(e.target.value);
                    }}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText) {
                        antiCheat.detectPaste(pastedText);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 border border-border rounded-lg p-2 text-sm resize-none h-14 focus:outline-none focus:ring-1 focus:ring-dark/20"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!message.trim() && !attachedImage) || isTyping}
                    className="px-4 bg-dark text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:opacity-85 transition-all"
                  >
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1.5">
                  {activeAgent?.archetype === 'difficult'
                    ? 'This person seems guarded. Consider building rapport first.'
                    : 'Press Enter to send. Attach images for diagrams/wireframes.'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a thread or start a new conversation
            </div>
          )}
        </div>

        {/* Right panel - Coaching + Tasks */}
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

          {/* Coaching Sidebar (Training Mode Only) */}
          {trainingContext?.mode === 'train' && trainingContext.frameworkReference && (
            <div className={`border-b border-border bg-gradient-to-b from-emerald-50 to-white ${showCoachingSidebar ? '' : 'hidden'}`}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800">Coach</span>
                </div>
                <button
                  onClick={() => setShowCoachingSidebar(false)}
                  className="text-emerald-600 hover:text-emerald-800 text-xs"
                >
                  Hide
                </button>
              </div>

              {/* Framework Reference */}
              <div className="p-3">
                <div className="text-[10px] uppercase tracking-wider text-emerald-600 mb-2 font-medium">
                  {trainingContext.frameworkName || 'Framework'}
                </div>
                <div className="space-y-2">
                  {trainingContext.frameworkReference.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer group"
                      onClick={() => setActiveCoachingHint(activeCoachingHint === step.letter ? null : step.letter)}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {step.letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-dark">{step.name}</div>
                        {activeCoachingHint === step.letter && (
                          <div className="mt-1 space-y-1">
                            <p className="text-[10px] text-muted">{step.description}</p>
                            {step.example && (
                              <p className="text-[10px] text-emerald-700 italic bg-emerald-50 px-2 py-1 rounded">
                                "{step.example}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <svg
                        className={`w-3 h-3 text-muted transition-transform ${activeCoachingHint === step.letter ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Pro Tip */}
                {trainingContext.frameworkReference.pro_tip && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-amber-700">Pro Tip</span>
                    </div>
                    <p className="text-[10px] text-amber-800">{trainingContext.frameworkReference.pro_tip}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsed Coach Toggle */}
          {trainingContext?.mode === 'train' && !showCoachingSidebar && (
            <button
              onClick={() => setShowCoachingSidebar(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-700">Show Coach</span>
            </button>
          )}

          {/* Tasks Section */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-[9px] uppercase tracking-widest text-muted mb-3">Tasks</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.task_id}
                  className={`p-2 rounded-lg border ${task.completed ? 'bg-surface border-border opacity-60' : 'bg-white border-border'}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleTaskToggle(task.task_id)}
                      className="mt-0.5 w-3.5 h-3.5 rounded-sm border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${task.completed ? 'line-through text-muted' : 'text-dark'}`}>
                        {task.title}
                      </div>
                      <div className="text-[10px] text-muted">{task.description}</div>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                        task.urgency === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.urgency === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.urgency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools & Artifact Buttons */}
          <div className="p-3 border-t border-border space-y-2">
            {/* Tools Button - for browser-based work tools */}
            {env?.tools && env.tools.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-muted font-medium px-1">Work Tools</div>
                {env.tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => openTool(tool)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 hover:from-slate-100 hover:to-gray-100 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      {tool.icon === 'email' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : tool.icon === 'crm' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

            {/* Artifact Button */}
            <button
              onClick={handleOpenArtifact}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-indigo-900">
                  {env?.artifact_content?.title || 'View Artifact'}
                </div>
                <div className="text-[10px] text-indigo-600">
                  {artifactSections.filter(s => s.linked_task_id && !tasks.find(t => t.task_id === s.linked_task_id)?.completed).length > 0
                    ? `${artifactSections.filter(s => s.linked_task_id && !tasks.find(t => t.task_id === s.linked_task_id)?.completed).length} sections need attention`
                    : 'Review and edit work document'}
                </div>
              </div>
              <svg className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
