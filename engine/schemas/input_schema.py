"""Input schemas for the engine API."""
from pydantic import BaseModel
from typing import Optional, Union


class MessageContentBlock(BaseModel):
    """A content block in a multimodal message."""
    type: str  # "text" or "image_url"
    text: Optional[str] = None
    image_url: Optional[str] = None


class GenerateRequest(BaseModel):
    """Request to generate a new simulation environment."""
    session_id: str
    org_name: Optional[str] = None
    role: str
    industry: str
    stage: str
    function: str
    candidate_name: str
    # Additional org context for richer scenario generation
    company_size: Optional[str] = None
    company_description: Optional[str] = None
    hiring_focus: Optional[str] = None
    # Job description from uploaded PDF
    job_description: Optional[str] = None
    # Image generation (optional - adds realism with diagrams, scenes, notes)
    generate_images: bool = False


class MessageRequest(BaseModel):
    """Request to send a message to an agent."""
    session_id: str
    agent_id: str
    message_text: Union[str, list[MessageContentBlock]]  # Text or multimodal content
    elapsed_seconds: float
    thread_id: Optional[str] = None


class ArtifactCommentRequest(BaseModel):
    """Request to comment on an artifact section."""
    session_id: str
    section_id: str
    comment_text: str


class ScoreRequest(BaseModel):
    """Request to score a completed session."""
    session_id: str
