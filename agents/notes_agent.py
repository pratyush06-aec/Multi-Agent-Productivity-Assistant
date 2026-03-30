from typing import Optional, List
from database.mongo_client import db

class NotesAgent:
    """Handles all note-taking operations."""
    
    def __init__(self):
        self.name = "notes_agent"
    
    def save_note(self, content: str, tags: Optional[List[str]] = None) -> dict:
        """Create a new note."""
        note = db.create_note(content=content, tags=tags or [])
        return {
            "success": True,
            "action": "create_note",
            "data": note,
            "message": "Note saved successfully"
        }
    
    def list_notes(self, tag: Optional[str] = None) -> dict:
        """List all notes, optionally filtered by tag."""
        notes = db.get_notes(tag=tag)
        return {
            "success": True,
            "action": "list_notes",
            "data": notes,
            "message": f"Found {len(notes)} notes"
        }
    
    def search_notes(self, keyword: str) -> dict:
        """Search notes by keyword."""
        notes = db.search_notes(keyword=keyword)
        return {
            "success": True,
            "action": "search_notes",
            "data": notes,
            "message": f"Found {len(notes)} notes matching '{keyword}'"
        }
    
    def delete_note(self, note_id: str) -> dict:
        """Delete a note."""
        success = db.delete_note(note_id)
        return {
            "success": success,
            "action": "delete_note",
            "data": {"note_id": note_id},
            "message": "Note deleted" if success else "Note not found"
        }
    
    def get_notes_by_tag(self, tag: str) -> dict:
        """Get all notes with a specific tag."""
        return self.list_notes(tag=tag)
    
    def get_recent_notes(self, limit: int = 10) -> dict:
        """Get the most recent notes."""
        notes = db.get_notes()[:limit]
        return {
            "success": True,
            "action": "recent_notes",
            "data": notes,
            "message": f"Retrieved {len(notes)} recent notes"
        }


notes_agent = NotesAgent()
