from datetime import datetime, timedelta
from typing import Optional
from database.mongo_client import db

class CalendarAgent:
    """Handles all calendar and scheduling operations."""
    
    def __init__(self):
        self.name = "calendar_agent"
    
    def add_event(self, title: str, datetime_start: datetime, datetime_end: Optional[datetime] = None, location: str = "") -> dict:
        """Create a new calendar event."""
        event = db.create_event(
            title=title,
            datetime_start=datetime_start,
            datetime_end=datetime_end,
            location=location
        )
        return {
            "success": True,
            "action": "create_event",
            "data": event,
            "message": f"Event '{title}' scheduled for {datetime_start.strftime('%Y-%m-%d %H:%M')}"
        }
    
    def list_events(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> dict:
        """List events within a date range."""
        events = db.get_events(start_date=start_date, end_date=end_date)
        return {
            "success": True,
            "action": "list_events",
            "data": events,
            "message": f"Found {len(events)} events"
        }
    
    def get_today_events(self) -> dict:
        """Get all events for today."""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        return self.list_events(start_date=today_start, end_date=today_end)
    
    def get_upcoming_events(self, days: int = 7) -> dict:
        """Get events for the next N days."""
        start = datetime.now()
        end = start + timedelta(days=days)
        events = db.get_events(start_date=start, end_date=end)
        return {
            "success": True,
            "action": "upcoming_events",
            "data": events,
            "message": f"Found {len(events)} events in the next {days} days"
        }
    
    def delete_event(self, event_id: str) -> dict:
        """Delete a calendar event."""
        success = db.delete_event(event_id)
        return {
            "success": success,
            "action": "delete_event",
            "data": {"event_id": event_id},
            "message": "Event deleted" if success else "Event not found"
        }
    
    def check_availability(self, datetime_check: datetime) -> dict:
        """Check if there are any events at a specific time."""
        # Check events within a 1-hour window
        start = datetime_check - timedelta(minutes=30)
        end = datetime_check + timedelta(minutes=30)
        events = db.get_events(start_date=start, end_date=end)
        
        is_available = len(events) == 0
        return {
            "success": True,
            "action": "check_availability",
            "data": {
                "datetime": datetime_check.isoformat(),
                "available": is_available,
                "conflicting_events": events
            },
            "message": "Time slot is available" if is_available else f"Found {len(events)} conflicting event(s)"
        }


calendar_agent = CalendarAgent()
