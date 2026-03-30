from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional

from models.schemas import (
    AgentRequest, AgentResponse,
    TaskCreate, TaskUpdate,
    EventCreate, NoteCreate
)
from agents.coordinator import coordinator
from agents.task_agent import task_agent
from agents.calendar_agent import calendar_agent
from agents.notes_agent import notes_agent


app = FastAPI(
    title="Multi-Agent AI System",
    description="API for task management, scheduling, and notes via AI agents",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HELPER ====================

async def parse_request(request: Request, schema_class):
    try:
        data = await request.json()
        obj = schema_class(**data)
        obj.validate()
        return obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Main Endpoint ====================

@app.post("/execute")
async def execute_query(request: Request):
    req = await parse_request(request, AgentRequest)

    result = coordinator.route_request(req.query)

    response = AgentResponse(**result)
    response.validate()

    return response.__dict__


# ==================== Task Endpoints ====================

@app.post("/tasks")
async def create_task(request: Request):
    task = await parse_request(request, TaskCreate)

    return task_agent.add_task(
        title=task.title,
        description=task.description,
        priority=task.priority.value,
        due_date=task.due_date
    )


@app.get("/tasks")
async def list_tasks(status: Optional[str] = None):
    return task_agent.list_tasks(status=status)


@app.patch("/tasks/{task_id}")
async def update_task(task_id: str, request: Request):
    task = await parse_request(request, TaskUpdate)

    updates = {k: v for k, v in task.__dict__.items() if v is not None}

    if 'status' in updates:
        updates['status'] = updates['status'].value
    if 'priority' in updates:
        updates['priority'] = updates['priority'].value

    return task_agent.update_task(task_id, **updates)


@app.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    return task_agent.complete_task(task_id)


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    return task_agent.delete_task(task_id)


# ==================== Calendar Endpoints ====================

@app.post("/events")
async def create_event(request: Request):
    event = await parse_request(request, EventCreate)

    return calendar_agent.add_event(
        title=event.title,
        datetime_start=event.datetime_start,
        datetime_end=event.datetime_end,
        location=event.location
    )


@app.get("/events")
async def list_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    return calendar_agent.list_events(start_date=start_date, end_date=end_date)


@app.get("/events/today")
async def get_today_events():
    return calendar_agent.get_today_events()


@app.get("/events/upcoming")
async def get_upcoming_events(days: int = 7):
    return calendar_agent.get_upcoming_events(days=days)


@app.delete("/events/{event_id}")
async def delete_event(event_id: str):
    return calendar_agent.delete_event(event_id)


# ==================== Notes Endpoints ====================

@app.post("/notes")
async def create_note(request: Request):
    note = await parse_request(request, NoteCreate)

    return notes_agent.save_note(
        content=note.content,
        tags=note.tags
    )


@app.get("/notes")
async def list_notes(tag: Optional[str] = None):
    return notes_agent.list_notes(tag=tag)


@app.get("/notes/search")
async def search_notes(keyword: str):
    return notes_agent.search_notes(keyword=keyword)


@app.get("/notes/recent")
async def get_recent_notes(limit: int = 10):
    return notes_agent.get_recent_notes(limit=limit)


@app.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    return notes_agent.delete_note(note_id)


# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }