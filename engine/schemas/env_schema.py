"""Environment and response schemas for the engine API."""
from pydantic import BaseModel
from typing import Optional, Union


class TaskKnowledge(BaseModel):
    """What an agent knows about a specific task."""
    task_id: str
    info_description: str  # What info this agent has for this task
    will_share_if: str  # Condition for sharing (e.g., "asked directly", "relationship > 0.6")


class Agent(BaseModel):
    """An AI agent in the simulation."""
    agent_id: str
    name: str
    role: str
    relationship_to_candidate: str  # manager|report|peer|client|system
    archetype: str  # standard|difficult|client
    persona_prompt: str
    artifact_knowledge: Optional[str] = None
    hidden_information: str
    task_knowledge: list[TaskKnowledge] = []  # What this agent knows per task
    relationship_score_baseline: float = 0.5
    escalation_threshold: float = 0.7
    avatar_url: Optional[str] = None  # DiceBear avatar URL
    # Autonomy fields - agents can initiate contact
    proactivity: float = 0.3  # 0-1, how likely to reach out unprompted
    current_concern: Optional[str] = None  # What's on their mind right now
    will_initiate_about: Optional[list[str]] = None  # Topics they might bring up


class StressInject(BaseModel):
    """A scheduled stress injection event."""
    id: str
    trigger_seconds: int
    agent_id: str
    message: str
    thread_id: str


class MessageContent(BaseModel):
    """A content block in a multimodal message."""
    type: str  # text|image_url
    text: Optional[str] = None
    image_url: Optional[str] = None  # base64 data URL or hosted URL


class Message(BaseModel):
    """A message in a thread."""
    id: str
    sender: str  # agent|candidate|system
    agent_id: Optional[str] = None
    content: Union[str, list[MessageContent]]  # Text or multimodal content
    timestamp: float


class AgentChatter(BaseModel):
    """Background conversation between agents."""
    id: str
    agent_a_id: str
    agent_b_id: str
    topic: str
    summary: str  # What they discussed (for reference in convos)
    timestamp: float


class Thread(BaseModel):
    """An inbox thread."""
    thread_id: str
    from_agent_id: str
    subject: str
    preview: str
    is_urgent: bool = False
    is_unread: bool = True
    messages: list[Message] = []


class TaskRequirement(BaseModel):
    """Information required from an agent to complete a task."""
    agent_id: str
    info_needed: str  # What info is needed from this agent
    obtained: bool = False  # Whether candidate has obtained this info


class Task(BaseModel):
    """A task in the task queue."""
    task_id: str
    title: str
    description: str
    urgency: str  # high|medium|low
    completed: bool = False
    # Task-driven simulation fields
    required_info: list[TaskRequirement] = []  # Info needed from agents
    completion_type: str = "checkbox"  # checkbox|chat_validation|artifact_edit|deliverable
    validating_agent_id: Optional[str] = None  # Agent who validates completion
    deliverable_prompt: Optional[str] = None  # What deliverable is expected (for chat_validation)
    linked_artifact_section: Optional[str] = None  # section_id if completion_type is artifact_edit


class ArtifactSection(BaseModel):
    """A section in the artifact document."""
    section_id: str
    title: str
    content: str  # HTML or markdown content
    linked_task_id: Optional[str] = None  # Task that requires editing this section
    editable: bool = True
    has_error: bool = False  # Whether this section contains intentional errors
    error_hint: Optional[str] = None  # Hint about what's wrong (for scoring)


class ArtifactContent(BaseModel):
    """The artifact document structure."""
    title: str
    type: str  # prd|analysis|spec|proposal|process
    sections: list[ArtifactSection] = []


class EndCondition(BaseModel):
    """Win or fail condition for the simulation."""
    type: str  # win|fail
    trigger: str  # relationship_threshold|task_completion|time_limit|agent_escalation
    description: str  # Human-readable description of condition
    threshold: Optional[float] = None  # For relationship-based triggers
    agent_id: Optional[str] = None  # For agent-specific triggers
    task_ids: Optional[list[str]] = None  # For task-based triggers
    trigger_seconds: Optional[int] = None  # For time_limit: seconds when condition is checked
    required_task_id: Optional[str] = None  # For time_limit: task that must be complete by trigger_seconds


class EnvironmentResponse(BaseModel):
    """The generated simulation environment."""
    company_name: str
    company_description: str
    scenario_tension: str
    agents: list[Agent]
    inbox: list[Thread]
    tasks: list[Task]
    artifact_content: ArtifactContent
    inject_schedule: list[StressInject]
    background_chatter: list[AgentChatter] = []  # Agent-to-agent conversations
    end_conditions: list[EndCondition] = []  # Win/fail conditions for the simulation


class MessageResponse(BaseModel):
    """Response from an agent message."""
    reply: str
    relationship_score: float
    agent_id: str
    escalated: bool = False  # True if agent escalated to their manager
    escalation_reason: Optional[str] = None  # Why they escalated


class TraceEvent(BaseModel):
    """A behavioral trace event."""
    event_id: str
    session_id: str
    timestamp: float
    elapsed_seconds: float
    event_type: str  # thread_open|reply_sent|task_update|inject_fired|artifact_view|artifact_comment|debrief
    agent_id: Optional[str] = None
    thread_id: Optional[str] = None
    content: dict
    annotation: Optional[str] = None
