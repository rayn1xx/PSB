from pydantic import BaseModel, model_serializer
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Преобразуем metadata_json в metadata при валидации
        if hasattr(obj, 'metadata_json'):
            data = {
                'id': obj.id,
                'type': obj.type.value if hasattr(obj.type, 'value') else str(obj.type),
                'title': obj.title,
                'message': obj.message,
                'is_read': obj.is_read,
                'metadata': obj.metadata_json,
                'created_at': obj.created_at
            }
            return cls(**data)
        return super().model_validate(obj, **kwargs)

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    notifications: list[NotificationResponse]

