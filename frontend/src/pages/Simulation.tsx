import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidate, sessions } from '../api/client';
import type { Agent, Thread, Message, Task, ArtifactSection, ArtifactContent } from '../types';
import { antiCheat } from '../utils/antiCheat';
import Onboarding from './Onboarding';

interface SimulationEnv {
  company_name: string;
  company_description: string;
  scenario_tension: string;
  agents: Agent[];
  inbox: Thread[];
  tasks: Task[];
  artifact_content: ArtifactContent;
  inject_schedule: { inject_id: string; trigger_seconds: number; message: string; from_agent_id: string }[];
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
  idle: 'bg-amber-500',
  away: 'bg-gray-400',
};

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

      const agentReply: Message = {
        id: crypto.randomUUID(),
        sender: 'agent',
        agent_id: activeThread.from_agent_id,
        content: response.reply,
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
      setAgents((prev) =>
        prev.map((a) =>
          a.agent_id === activeThread.from_agent_id
            ? { ...a, relationship_score: response.relationship_score ?? a.relationship_score }
            : a
        )
      );
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

    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, completed: !t.completed } : t))
    );
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
      {/* End confirmation modal */}
      {showEndConfirm && (
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
              <button
                onClick={() => setShowArtifact(false)}
                className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
        {/* Left - Company info */}
        <div className="flex items-center gap-4 w-52">
          <div>
            <span className="font-semibold text-dark text-sm">{env.company_name}</span>
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
              {agents.map((agent, idx) => (
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
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusColors[agent.status] || 'bg-gray-400'} border-2 border-white`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-dark truncate">{agent.name}</div>
                      <div className="text-[10px] text-muted truncate">{agent.role}</div>
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
              ))}
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
              {/* Thread header */}
              <div className="h-12 border-b border-border px-4 flex items-center shrink-0">
                <div>
                  <div className="text-sm font-medium text-dark">{activeThread.subject}</div>
                  <div className="text-[10px] text-muted">with {activeAgent?.name}</div>
                </div>
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
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-dark/5 text-dark rounded-lg px-3 py-2 max-w-md">
                          {renderContent(msg.content)}
                          <p className="text-[10px] text-muted mt-1">{formatTime(msg.timestamp)}</p>
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

        {/* Right panel - Tasks */}
        <div className="border-l border-border overflow-y-auto">
          <div className="p-3">
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
