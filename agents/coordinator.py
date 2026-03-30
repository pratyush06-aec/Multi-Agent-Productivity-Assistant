import google.generativeai as genai
from datetime import datetime
from dateutil import parser as date_parser
import json
import re
from typing import Optional

from agents.task_agent import task_agent
from agents.calendar_agent import calendar_agent
from agents.notes_agent import notes_agent
import config

# Configure Gemini
genai.configure(api_key=config.GEMINI_API_KEY)

class CoordinatorAgent:
    """
    Primary agent that coordinates sub-agents based on user input.
    Uses Gemini to understand intent and route to appropriate sub-agent.
    """
    
    def __init__(self):
        self.name = "coordinator"
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Tool registry mapping actions to agent methods
        self.tools = {
            # Task operations
            "add_task": task_agent.add_task,
            "list_tasks": task_agent.list_tasks,
            "complete_task": task_agent.complete_task,
            "update_task": task_agent.update_task,
            "delete_task": task_agent.delete_task,
            "get_pending_tasks": task_agent.get_pending_tasks,
            "get_high_priority_tasks": task_agent.get_high_priority_tasks,
            
            # Calendar operations
            "add_event": calendar_agent.add_event,
            "list_events": calendar_agent.list_events,
            "get_today_events": calendar_agent.get_today_events,
            "get_upcoming_events": calendar_agent.get_upcoming_events,
            "delete_event": calendar_agent.delete_event,
            "check_availability": calendar_agent.check_availability,
            
            # Notes operations
            "save_note": notes_agent.save_note,
            "list_notes": notes_agent.list_notes,
            "search_notes": notes_agent.search_notes,
            "delete_note": notes_agent.delete_note,
            "get_notes_by_tag": notes_agent.get_notes_by_tag,
            "get_recent_notes": notes_agent.get_recent_notes,
        }
        
        self.system_prompt = """You are a coordinator AI that routes user requests to the appropriate agent.

Available actions and their parameters:

TASK AGENT:
- add_task: title (required), description, priority (low/medium/high), due_date (ISO format)
- list_tasks: status (pending/in_progress/completed, optional)
- complete_task: task_id (required)
- update_task: task_id (required), title, description, status, priority
- delete_task: task_id (required)
- get_pending_tasks: no params
- get_high_priority_tasks: no params

CALENDAR AGENT:
- add_event: title (required), datetime_start (ISO format, required), datetime_end, location
- list_events: start_date, end_date (ISO format)
- get_today_events: no params
- get_upcoming_events: days (default 7)
- delete_event: event_id (required)
- check_availability: datetime_check (ISO format, required)

NOTES AGENT:
- save_note: content (required), tags (list of strings)
- list_notes: tag (optional filter)
- search_notes: keyword (required)
- delete_note: note_id (required)
- get_notes_by_tag: tag (required)
- get_recent_notes: limit (default 10)

Based on the user's input, determine the action and extract parameters.
Return ONLY a JSON object with this structure:
{
    "action": "action_name",
    "agent": "task_agent|calendar_agent|notes_agent",
    "params": {parameter dictionary}
}

For dates, convert natural language to ISO format (e.g., "tomorrow at 3pm" -> proper datetime).
Current datetime: """ + datetime.now().isoformat()

    def _parse_llm_response(self, response_text: str) -> dict:
        """Extract JSON from LLM response."""
        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        return None

    def _convert_datetime_params(self, params: dict) -> dict:
        """Convert string datetime params to datetime objects."""
        datetime_fields = ['due_date', 'datetime_start', 'datetime_end', 'start_date', 'end_date', 'datetime_check']
        
        for field in datetime_fields:
            if field in params and params[field]:
                try:
                    if isinstance(params[field], str):
                        params[field] = date_parser.parse(params[field])
                except:
                    params[field] = None
        
        return params

    def route_request(self, user_input: str) -> dict:
        """
        Process user input and route to appropriate agent.
        """
        try:
            # Get LLM to interpret the request
            prompt = f"{self.system_prompt}\n\nUser request: {user_input}"
            response = self.model.generate_content(prompt)
            
            # Parse the LLM response
            parsed = self._parse_llm_response(response.text)
            
            if not parsed:
                return {
                    "success": False,
                    "action": "unknown",
                    "agent": "coordinator",
                    "result": {},
                    "message": "Could not understand the request. Please try rephrasing."
                }
            
            action = parsed.get("action")
            agent_name = parsed.get("agent")
            params = parsed.get("params", {})
            
            # Convert datetime strings to datetime objects
            params = self._convert_datetime_params(params)
            
            # Execute the action
            if action in self.tools:
                result = self.tools[action](**params)
                return {
                    "success": result.get("success", True),
                    "action": action,
                    "agent": agent_name,
                    "result": result,
                    "message": result.get("message", "Action completed")
                }
            else:
                return {
                    "success": False,
                    "action": action,
                    "agent": agent_name,
                    "result": {},
                    "message": f"Unknown action: {action}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "action": "error",
                "agent": "coordinator",
                "result": {"error": str(e)},
                "message": f"Error processing request: {str(e)}"
            }

    def execute_direct(self, action: str, params: dict) -> dict:
        """
        Execute an action directly without LLM interpretation.
        Useful for programmatic access.
        """
        if action not in self.tools:
            return {
                "success": False,
                "action": action,
                "agent": "unknown",
                "result": {},
                "message": f"Unknown action: {action}"
            }
        
        params = self._convert_datetime_params(params)
        
        try:
            result = self.tools[action](**params)
            
            # Determine which agent handled the action
            agent_name = "unknown"
            if action.startswith(("add_task", "list_task", "complete", "update_task", "delete_task", "get_pending", "get_high")):
                agent_name = "task_agent"
            elif action.startswith(("add_event", "list_event", "get_today", "get_upcoming", "delete_event", "check")):
                agent_name = "calendar_agent"
            elif action.startswith(("save_note", "list_note", "search", "delete_note", "get_note", "get_recent")):
                agent_name = "notes_agent"
            
            return {
                "success": result.get("success", True),
                "action": action,
                "agent": agent_name,
                "result": result,
                "message": result.get("message", "Action completed")
            }
        except Exception as e:
            return {
                "success": False,
                "action": action,
                "agent": "unknown",
                "result": {"error": str(e)},
                "message": f"Error: {str(e)}"
            }


coordinator = CoordinatorAgent()
