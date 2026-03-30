import google.generativeai as genai
from google.protobuf.json_format import MessageToDict
from datetime import datetime
from dateutil import parser as date_parser
from typing import Optional, List, Dict
import config

from agents.task_agent import task_agent
from agents.calendar_agent import calendar_agent
from agents.notes_agent import notes_agent

genai.configure(api_key=config.GEMINI_API_KEY)

from google.generativeai.types import FunctionDeclaration, Tool
# ==================== Tool Implementations ====================
def add_task(title: str, description: str = "", priority: str = "medium", due_date: str = "") -> dict:
    dt = date_parser.parse(due_date) if due_date else None
    return task_agent.add_task(title=title, description=description, priority=priority, due_date=dt)

def list_tasks(status: str = "") -> dict:
    return task_agent.list_tasks(status=status if status else None)

def complete_task(task_id: str) -> dict:
    return task_agent.complete_task(task_id=task_id)

def add_event(title: str, start_time: str, end_time: str = "", location: str = "") -> dict:
    start = date_parser.parse(start_time)
    end = date_parser.parse(end_time) if end_time else None
    return calendar_agent.add_event(title=title, datetime_start=start, datetime_end=end, location=location)

def get_today_events() -> dict:
    return calendar_agent.get_today_events()

def check_availability(datetime_check: str) -> dict:
    dt = date_parser.parse(datetime_check)
    return calendar_agent.check_availability(datetime_check=dt)

def save_note(content: str, tags: list[str] = None) -> dict:
    return notes_agent.save_note(content=content, tags=tags)

def search_notes(keyword: str) -> dict:
    return notes_agent.search_notes(keyword=keyword)

# ==================== Tool Schemas ====================
add_task_schema = FunctionDeclaration(
    name="add_task",
    description="Create a new task in the user's task list.",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "The name of the task."},
            "description": {"type": "string", "description": "Details about the task."},
            "priority": {"type": "string", "description": "Priority level ('low', 'medium', 'high')."},
            "due_date": {"type": "string", "description": "Optional ISO 8601 string."}
        },
        "required": ["title"]
    }
)

list_tasks_schema = FunctionDeclaration(
    name="list_tasks",
    description="Get all tasks, optionally filtered by status ('pending', 'in_progress', 'completed').",
    parameters={
        "type": "object",
        "properties": {
            "status": {"type": "string", "description": "Status filter."}
        }
    }
)

complete_task_schema = FunctionDeclaration(
    name="complete_task",
    description="Mark a specific task as completed.",
    parameters={
        "type": "object",
        "properties": {
            "task_id": {"type": "string", "description": "The task ID."}
        },
        "required": ["task_id"]
    }
)

add_event_schema = FunctionDeclaration(
    name="add_event",
    description="Create a new calendar event.",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Event title."},
            "start_time": {"type": "string", "description": "Start time ISO 8601 string."},
            "end_time": {"type": "string", "description": "End time ISO 8601 string."},
            "location": {"type": "string", "description": "Where the event is located."}
        },
        "required": ["title", "start_time"]
    }
)

get_today_events_schema = FunctionDeclaration(
    name="get_today_events",
    description="Get all calendar events scheduled for today."
)

check_availability_schema = FunctionDeclaration(
    name="check_availability",
    description="Check if the user has any events at a specific time.",
    parameters={
        "type": "object",
        "properties": {
            "datetime_check": {"type": "string", "description": "Time to check (ISO 8601 string)."}
        },
        "required": ["datetime_check"]
    }
)

save_note_schema = FunctionDeclaration(
    name="save_note",
    description="Create a new note. You should use this to remember concepts, summaries, ideas.",
    parameters={
        "type": "object",
        "properties": {
            "content": {"type": "string", "description": "The actual note content."},
            "tags": {"type": "array", "items": {"type": "string"}, "description": "A list of string tags."}
        },
        "required": ["content"]
    }
)

search_notes_schema = FunctionDeclaration(
    name="search_notes",
    description="Search all notes for a specific keyword.",
    parameters={
        "type": "object",
        "properties": {
            "keyword": {"type": "string", "description": "The word or phrase to search for."}
        },
        "required": ["keyword"]
    }
)

agent_tool = Tool(
    function_declarations=[
        add_task_schema, list_tasks_schema, complete_task_schema,
        add_event_schema, get_today_events_schema, check_availability_schema,
        save_note_schema, search_notes_schema
    ]
)

# Map func names to callables
TOOL_MAP = {
    "add_task": add_task,
    "list_tasks": list_tasks,
    "complete_task": complete_task,
    "add_event": add_event,
    "get_today_events": get_today_events,
    "check_availability": check_availability,
    "save_note": save_note,
    "search_notes": search_notes
}

class CoordinatorAgent:
    """
    The central intelligence using Gemini Function Calling.
    It orchestrates the conversation and delegates tool calls appropriately.
    """
    
    def __init__(self):
        self.name = "coordinator"
        
        system_instruction = (
            f"You are Personal Assistant, a highly capable multi-agent system. "
            f"You manage the user's tasks, calendar, and notes using the provided tools. "
            f"The current local datetime is {datetime.now().isoformat()}. "
            "Never tell the user you don't have access to tools; execute them sequentially to fulfill their requests. "
            "If asked about events today, call get_today_events. If asked to add a task, call add_task, etc. "
            "Always be conversational, concise, and professional in your final responses."
        )
        
        self.model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            tools=[agent_tool],
            system_instruction=system_instruction
        )
        
        # Keep conversation history and context
        self.chat_session = self.model.start_chat()

    def route_request(self, user_input: str) -> dict:
        """
        Process user input through a native tool-calling loop.
        """
        executed_actions = []
        
        try:
            # Note: We send the message manually and handle loops to track tool execution properly
            response = self.chat_session.send_message(user_input)
            
            while True:
                # Identify if there is a function call in the response parts
                part = response.parts[0] if response.parts else None
                
                if part and getattr(part, "function_call", None):
                    fc = part.function_call
                    name = fc.name
                    # Convert protobuf map to pure dict
                    args = MessageToDict(fc._pb).get("args", {})
                    
                    executed_actions.append({"tool": name, "args": args})
                    
                    # Execute locally
                    print(f"Executing tool {name} with args {args}")
                    if name in TOOL_MAP:
                        func = TOOL_MAP[name]
                        try:
                            # Pass kwargs (the tool mapped to the dict keys)
                            res = func(**args)
                            func_response = {"result": res}
                        except Exception as e:
                            print(f"Error executing {name}: {e}")
                            func_response = {"error": str(e)}
                    else:
                        func_response = {"error": f"Unknown tool: {name}"}
                    
                    # Send result back to Gemini so it reads it and either calls another tool or outputs text
                    response = self.chat_session.send_message(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=name,
                                response=func_response
                            )
                        )
                    )
                else:
                    # No more function calls, we have the final text!
                    break
            
            return {
                "success": True,
                "action": "chat",
                "agent": "coordinator",
                "result": {},
                "message": response.text,
                "executed_actions": executed_actions
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "action": "error",
                "agent": "coordinator",
                "result": {"error": str(e)},
                "message": f"I hit an error: {str(e)}",
                "executed_actions": executed_actions
            }

coordinator = CoordinatorAgent()
