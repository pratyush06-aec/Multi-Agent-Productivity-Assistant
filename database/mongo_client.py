from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
from typing import Optional
import config

class MongoDB:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=2000)
            cls._instance.db = cls._instance.client[config.DATABASE_NAME]
        return cls._instance
    
    # Tasks Collection
    def create_task(self, title: str, description: str = "", priority: str = "medium", due_date: Optional[datetime] = None) -> dict:
        task = {
            "title": title,
            "description": description,
            "status": "pending",
            "priority": priority,
            "due_date": due_date,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        result = self.db.tasks.insert_one(task)
        task["_id"] = str(result.inserted_id)
        return task
    
    def get_tasks(self, status: Optional[str] = None) -> list:
        query = {"status": status} if status else {}
        tasks = list(self.db.tasks.find(query))
        for task in tasks:
            task["_id"] = str(task["_id"])
        return tasks
    
    def update_task(self, task_id: str, updates: dict) -> dict:
        updates["updated_at"] = datetime.now()
        self.db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": updates}
        )
        task = self.db.tasks.find_one({"_id": ObjectId(task_id)})
        if task:
            task["_id"] = str(task["_id"])
        return task
    
    def delete_task(self, task_id: str) -> bool:
        result = self.db.tasks.delete_one({"_id": ObjectId(task_id)})
        return result.deleted_count > 0
    
    # Events Collection
    def create_event(self, title: str, datetime_start: datetime, datetime_end: Optional[datetime] = None, location: str = "") -> dict:
        event = {
            "title": title,
            "datetime_start": datetime_start,
            "datetime_end": datetime_end,
            "location": location,
            "created_at": datetime.now()
        }
        result = self.db.events.insert_one(event)
        event["_id"] = str(result.inserted_id)
        return event
    
    def get_events(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> list:
        query = {}
        if start_date and end_date:
            query["datetime_start"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            query["datetime_start"] = {"$gte": start_date}
        events = list(self.db.events.find(query).sort("datetime_start", 1))
        for event in events:
            event["_id"] = str(event["_id"])
        return events
    
    def delete_event(self, event_id: str) -> bool:
        result = self.db.events.delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    
    # Notes Collection
    def create_note(self, content: str, tags: list = None) -> dict:
        note = {
            "content": content,
            "tags": tags or [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        result = self.db.notes.insert_one(note)
        note["_id"] = str(result.inserted_id)
        return note
    
    def get_notes(self, tag: Optional[str] = None) -> list:
        query = {"tags": tag} if tag else {}
        notes = list(self.db.notes.find(query).sort("created_at", -1))
        for note in notes:
            note["_id"] = str(note["_id"])
        return notes
    
    def search_notes(self, keyword: str) -> list:
        notes = list(self.db.notes.find(
            {"content": {"$regex": keyword, "$options": "i"}}
        ))
        for note in notes:
            note["_id"] = str(note["_id"])
        return notes
    
    def delete_note(self, note_id: str) -> bool:
        result = self.db.notes.delete_one({"_id": ObjectId(note_id)})
        return result.deleted_count > 0


# Singleton instance
db = MongoDB()
