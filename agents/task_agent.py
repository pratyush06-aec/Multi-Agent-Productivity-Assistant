# agents/task_agent.py
from datetime import datetime
from typing import Optional
from database.mongo_client import db

class TaskAgent:
    """Handles all task-related operations."""
    
    def __init__(self):
        self.name = "task_agent"
    
    def add_task(self, title: str, description: str = "", priority: str = "medium", due_date: Optional[datetime] = None) -> dict:
        """Create a new task."""
        task = db.create_task(
            title=title,
            description=description,
            priority=priority,
            due_date=due_date
        )
        return {
            "success": True,
            "action": "create_task",
            "data": task,
            "message": f"Task '{title}' created successfully"
        }
    
    def list_tasks(self, status: Optional[str] = None) -> dict:
        """List all tasks, optionally filtered by status."""
        tasks = db.get_tasks(status=status)
        return {
            "success": True,
            "action": "list_tasks",
            "data": tasks,
            "message": f"Found {len(tasks)} tasks"
        }
    
    def complete_task(self, task_id: str) -> dict:
        """Mark a task as completed."""
        task = db.update_task(task_id, {"status": "completed"})
        if task:
            return {
                "success": True,
                "action": "complete_task",
                "data": task,
                "message": f"Task marked as completed"
            }
        return {
            "success": False,
            "action": "complete_task",
            "data": None,
            "message": "Task not found"
        }
    
    def update_task(self, task_id: str, **updates) -> dict:
        """Update task details."""
        # Filter out None values
        updates = {k: v for k, v in updates.items() if v is not None}
        task = db.update_task(task_id, updates)
        if task:
            return {
                "success": True,
                "action": "update_task",
                "data": task,
                "message": "Task updated successfully"
            }
        return {
            "success": False,
            "action": "update_task",
            "data": None,
            "message": "Task not found"
        }
    
    def delete_task(self, task_id: str) -> dict:
        """Delete a task."""
        success = db.delete_task(task_id)
        return {
            "success": success,
            "action": "delete_task",
            "data": {"task_id": task_id},
            "message": "Task deleted" if success else "Task not found"
        }
    
    def get_pending_tasks(self) -> dict:
        """Get all pending tasks."""
        return self.list_tasks(status="pending")
    
    def get_high_priority_tasks(self) -> dict:
        """Get high priority tasks."""
        tasks = [t for t in db.get_tasks() if t.get("priority") == "high"]
        return {
            "success": True,
            "action": "high_priority_tasks",
            "data": tasks,
            "message": f"Found {len(tasks)} high priority tasks"
        }


task_agent = TaskAgent()
