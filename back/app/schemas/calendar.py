from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class CalendarEvent(BaseModel):
    id: UUID
    title: str
    type: str  # "assignment", "test", "lecture", etc.
    course_id: UUID
    course_title: str
    entity_id: Optional[UUID]  # ID задания, теста и т.д.
    datetime: datetime
    description: Optional[str]

    class Config:
        from_attributes = True


class CalendarResponse(BaseModel):
    events: list[CalendarEvent]

