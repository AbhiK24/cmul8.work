"""Environment and response schemas for the engine API."""
from pydantic import BaseModel
from typing import Optional, Union


class TaskKnowledge(BaseModel):
    """What an agent knows about a specific task."""
    task_id: str
    info_description: str  # What info this agent has for this task
    will_share_if: str  # Condition for sharing (e.g., "asked directly", "relationship > 0.6")


class AgentHelpRequest(BaseModel):
    """A help request an agent might make to the candidate."""
    trigger_seconds: int  # When to potentially ask
    topic: str  # What they need help with
    message: str  # The ask message
    context: Optional[str] = None  # Additional context/attachment description
    priority: str = "normal"  # normal|urgent


class AgentAvailabilitySlot(BaseModel):
    """A scheduled availability change for an agent."""
    at_seconds: int  # When state changes
    state: str  # active|busy|in_meeting|away|dnd
    duration_seconds: Optional[int] = None  # How long (None = until next change)
    reason: Optional[str] = None  # "On a call with client"


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
    # Availability - agents have schedules
    availability_schedule: list[AgentAvailabilitySlot] = []  # Scheduled state changes
    # Help requests - agents can ask candidate for help
    help_requests: list[AgentHelpRequest] = []  # Things they might ask for


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


class DocComment(BaseModel):
    """A comment on an artifact section by an agent."""
    comment_id: str
    agent_id: str
    agent_name: str
    section_id: str
    content: str
    timestamp: float
    resolved: bool = False


class DocPresence(BaseModel):
    """Who is currently viewing/editing the document."""
    agent_id: str
    agent_name: str
    action: str  # viewing|typing|editing
    section_id: Optional[str] = None  # Which section they're on
    started_at: float


class ArtifactSection(BaseModel):
    """A section in the artifact document."""
    section_id: str
    title: str
    content: str  # HTML or markdown content
    linked_task_id: Optional[str] = None  # Task that requires editing this section
    editable: bool = True
    has_error: bool = False  # Whether this section contains intentional errors
    error_hint: Optional[str] = None  # Hint about what's wrong (for scoring)
    # Multi-agent collaboration
    last_edited_by: Optional[str] = None  # agent_id of last editor
    last_edited_at: Optional[float] = None


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


class GeneratedImage(BaseModel):
    """A pre-generated image for the simulation."""
    image_id: str
    image_type: str  # diagram|scene|notes|chart|screenshot
    description: str  # What this image shows
    url: str  # URL to the generated image
    context: Optional[str] = None  # When/how this should be used


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
    generated_images: list[GeneratedImage] = []  # Pre-generated images for the scenario


class MessageResponse(BaseModel):
    """Response from an agent message."""
    reply: Union[str, list[MessageContent]]  # Text or multimodal (text + image)
    relationship_score: float
    agent_id: str
    escalated: bool = False  # True if agent escalated to their manager
    escalation_reason: Optional[str] = None  # Why they escalated
    generated_image: Optional[GeneratedImage] = None  # Image generated by agent


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
