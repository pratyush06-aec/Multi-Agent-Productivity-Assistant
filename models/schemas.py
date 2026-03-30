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
        if isinstance(self.priority, str):
            try:
                self.priority = TaskPriority(self.priority)
            except ValueError:
                raise ValueError("Invalid priority")
        elif not isinstance(self.priority, TaskPriority):
            raise ValueError("Invalid priority")
        if self.due_date and isinstance(self.due_date, str):
            from dateutil import parser
            self.due_date = parser.parse(self.due_date)
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
        
        if self.status:
            if isinstance(self.status, str):
                try:
                    self.status = TaskStatus(self.status)
                except ValueError:
                    raise ValueError("Invalid status")
            elif not isinstance(self.status, TaskStatus):
                raise ValueError("Invalid status")
                
        if self.priority:
            if isinstance(self.priority, str):
                try:
                    self.priority = TaskPriority(self.priority)
                except ValueError:
                    raise ValueError("Invalid priority")
            elif not isinstance(self.priority, TaskPriority):
                raise ValueError("Invalid priority")
                
        if self.due_date and isinstance(self.due_date, str):
            from dateutil import parser
            self.due_date = parser.parse(self.due_date)


# ---------------- EVENT ---------------- #

@dataclass
class EventCreate:
    title: str
    datetime_start: datetime
    datetime_end: Optional[datetime] = None
    location: Optional[str] = ""

    def validate(self):
        validate_type(self.title, str, "title")
        if isinstance(self.datetime_start, str):
            from dateutil import parser
            self.datetime_start = parser.parse(self.datetime_start)
        if not isinstance(self.datetime_start, datetime):
            raise ValueError("datetime_start must be datetime")
        if self.datetime_end and isinstance(self.datetime_end, str):
            from dateutil import parser
            self.datetime_end = parser.parse(self.datetime_end)


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
    success: bool
    action: str
    agent: str
    result: Dict
    message: str
    executed_actions: Optional[List[Dict]] = field(default_factory=list)

    def validate(self):
        validate_type(self.success, bool, "success")
        validate_type(self.action, str, "action")
        validate_type(self.agent, str, "agent")
        validate_type(self.result, dict, "result")
        validate_type(self.message, str, "message")
        if self.executed_actions is not None:
            validate_type(self.executed_actions, list, "executed_actions")


# ---------------- HELPER ---------------- #

def to_dict(obj):
    return asdict(obj)