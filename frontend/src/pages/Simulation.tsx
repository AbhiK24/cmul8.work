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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find((t) => t.thread_id === activeThreadId);
  const activeAgent = agents.find((a) => a.agent_id === activeThread?.from_agent_id);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* CSS for score change animation */}
      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
      {/* Win/Fail End Condition Modal */}
      {endCondition.type && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center ${
            endCondition.type === 'fail' ? 'border-4 border-red-500' : 'border-4 border-emerald-500'
          }`}>
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              endCondition.type === 'fail' ? 'bg-red-100' : 'bg-emerald-100'
            }`}>
              {endCondition.type === 'fail' ? (
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <p className="text-muted mb-6">
              {endCondition.reason}
            </p>

            {/* Stats */}
            <div className={`rounded-lg p-4 mb-6 ${
              endCondition.type === 'fail' ? 'bg-red-50' : 'bg-emerald-50'
            }`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted text-xs">Time Elapsed</div>
                  <div className="font-bold">{formatTimer(elapsedSeconds)}</div>
                </div>
                <div>
                  <div className="text-muted text-xs">Tasks Completed</div>
                  <div className="font-bold">{tasks.filter(t => t.completed).length} / {tasks.length}</div>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleEndWorkSim}
              className={`w-full px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                endCondition.type === 'fail'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Continue to Debrief
            </button>
          </div>
        </div>
      )}

      {/* End confirmation modal */}
      {showEndConfirm && !endCondition.type && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-dark mb-2">End WorkSim Early?</h3>
            <p className="text-sm text-muted mb-4">
              You still have {Math.floor(remainingSeconds / 60)} minutes remaining.
              Are you sure you want to finish and proceed to debrief?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
              >
                Continue Working
              </button>
              <button
                onClick={handleEndWorkSim}
                className="flex-1 px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              >
                End & Debrief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Modal */}
      {showArtifact && env?.artifact_content && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-dark">{env.artifact_content.title}</h2>
                <p className="text-xs text-muted capitalize">{env.artifact_content.type} Document</p>
              </div>

              {/* Presence indicators - who's viewing */}
              <div className="flex items-center gap-2">
                {docPresence.length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <div className="flex -space-x-2">
                      {docPresence.slice(0, 3).map((p, idx) => {
                        const presenceAgent = agents.find(a => a.agent_id === p.agent_id);
                        return (
                          <img
                            key={p.agent_id}
                            src={presenceAgent ? getAvatarUrl(presenceAgent, idx) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.agent_name}`}
                            alt={p.agent_name}
                            className="w-6 h-6 rounded-full border-2 border-white"
                            title={`${p.agent_name} is ${p.action}${p.section_id ? ` in a section` : ''}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium ml-1">
                      {docPresence.length === 1
                        ? `${docPresence[0].agent_name} is ${docPresence[0].action}`
                        : `${docPresence.length} people viewing`}
                    </span>
                    {docPresence.some(p => p.action === 'typing') && (
                      <div className="flex gap-0.5 ml-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowArtifact(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-dark transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {artifactSections.map((section) => {
                const linkedTask = tasks.find(t => t.task_id === section.linked_task_id);
                const isEditing = editingSection === section.section_id;

                return (
                  <div
                    key={section.section_id}
                    className={`rounded-lg border ${
                      linkedTask && !linkedTask.completed
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-border bg-white'
                    }`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-dark">{section.title}</h3>
                        {linkedTask && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            linkedTask.completed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {linkedTask.completed ? 'Completed' : `Task: ${linkedTask.title}`}
                          </span>
                        )}
                        {section.has_error && !linkedTask?.completed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                            Needs Review
                          </span>
                        )}
                      </div>
                      {section.editable && (
                        <button
                          onClick={() => setEditingSection(isEditing ? null : section.section_id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            isEditing
                              ? 'bg-indigo-500 text-white'
                              : 'bg-surface text-muted hover:text-dark'
                          }`}
                        >
                          {isEditing ? 'Done Editing' : 'Edit'}
                        </button>
                      )}
                    </div>

                    {/* Section Content */}
                    <div className="p-4">
                      {/* Typing indicator for this section */}
                      {docPresence.some(p => p.action === 'typing' && p.section_id === section.section_id) && (
                        <div className="flex items-center gap-2 mb-2 text-emerald-600 text-[10px]">
                          {docPresence.filter(p => p.action === 'typing' && p.section_id === section.section_id).map(p => (
                            <span key={p.agent_id} className="flex items-center gap-1">
                              <span>{p.agent_name} is typing</span>
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </span>
                          ))}
                        </div>
                      )}

                      {isEditing ? (
                        <textarea
                          value={section.content}
                          onChange={(e) => handleSectionEdit(section.section_id, e.target.value)}
                          className="w-full min-h-[150px] p-3 border border-indigo-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
                          placeholder="Edit this section..."
                        />
                      ) : (
                        <div
                          className="prose prose-sm max-w-none text-mid leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: (section.content || '').replace(/\n/g, '<br/>') }}
                        />
                      )}

                      {/* Comments on this section */}
                      {docComments.filter(c => c.section_id === section.section_id).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                          <div className="text-[10px] uppercase tracking-wider text-muted font-medium">Comments</div>
                          {docComments.filter(c => c.section_id === section.section_id).map(comment => {
                            const commentAgent = agents.find(a => a.agent_id === comment.agent_id);
                            const agentIdx = agents.findIndex(a => a.agent_id === comment.agent_id);
                            return (
                              <div key={comment.comment_id} className="flex gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                <img
                                  src={commentAgent ? getAvatarUrl(commentAgent, agentIdx >= 0 ? agentIdx : 0) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.agent_name}`}
                                  alt={comment.agent_name}
                                  className="w-6 h-6 rounded-full bg-white border border-amber-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-amber-900">{comment.agent_name}</span>
                                    <span className="text-[10px] text-amber-600">{formatTime(comment.timestamp * 1000)}</span>
                                  </div>
                                  <p className="text-xs text-amber-800 mt-0.5">{comment.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface/50 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  Click "Edit" on any section to make changes. Your edits are saved automatically.
                </p>
                <button
                  onClick={() => setShowArtifact(false)}
                  className="px-4 py-2 bg-dark text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
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
                    <div className="w-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          agent.relationship_score > 0.65 ? 'bg-emerald-500' :
                          agent.relationship_score > 0.4 ? 'bg-amber-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${agent.relationship_score * 100}%` }}
                      />
                    </div>
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
        <div className="flex flex-col overflow-hidden">
          {activeThread ? (
            <>
              {/* Thread header with live relationship meter */}
              <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0">
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
        <div className="border-l border-border overflow-y-auto flex flex-col">
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

          {/* Prominent Artifact Button */}
          <div className="p-3 border-t border-border">
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
