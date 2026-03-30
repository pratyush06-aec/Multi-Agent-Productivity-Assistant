from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


# ---------------- ENUMS ---------------- #

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ---------------- VALIDATION HELPER ---------------- #

def validate_type(value, expected_type, field_name):
    if value is not None and not isinstance(value, expected_type):
        raise ValueError(f"{field_name} must be of type {expected_type.__name__}")


# ---------------- TASK MODELS ---------------- #

@dataclass
class TaskCreate:
    title: str
    description: Optional[str] = ""
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[datetime] = None

    def validate(self):
        validate_type(self.title, str, "title")
        validate_type(self.description, str, "description")
        if not isinstance(self.priority, TaskPriority):
            raise ValueError("Invalid priority")
        if self.due_date and not isinstance(self.due_date, datetime):
            raise ValueError("due_date must be datetime")


@dataclass
class TaskUpdate:
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

    def validate(self):
        if self.title:
            validate_type(self.title, str, "title")
        if self.description:
            validate_type(self.description, str, "description")
        if self.status and not isinstance(self.status, TaskStatus):
            raise ValueError("Invalid status")
        if self.priority and not isinstance(self.priority, TaskPriority):
            raise ValueError("Invalid priority")


# ---------------- EVENT ---------------- #

@dataclass
class EventCreate:
    title: str
    datetime_start: datetime
    datetime_end: Optional[datetime] = None
    location: Optional[str] = ""

    def validate(self):
        validate_type(self.title, str, "title")
        if not isinstance(self.datetime_start, datetime):
            raise ValueError("datetime_start must be datetime")


# ---------------- NOTE ---------------- #

@dataclass
class NoteCreate:
    content: str
    tags: Optional[List[str]] = field(default_factory=list)

    def validate(self):
        validate_type(self.content, str, "content")
        if not isinstance(self.tags, list):
            raise ValueError("tags must be a list")


# ---------------- AGENT ---------------- #

@dataclass
class AgentRequest:
    query: str

    def validate(self):
        validate_type(self.query, str, "query")


@dataclass
class AgentResponse:
    action: str
    agent: str
    result: Dict
    message: str

    def validate(self):
        validate_type(self.action, str, "action")
        validate_type(self.agent, str, "agent")
        validate_type(self.result, dict, "result")
        validate_type(self.message, str, "message")


# ---------------- HELPER ---------------- #

def to_dict(obj):
    return asdict(obj)