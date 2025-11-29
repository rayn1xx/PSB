from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Dict
from datetime import datetime


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    metadata: Optional[Dict]
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    notifications: list[NotificationResponse]

