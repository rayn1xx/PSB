from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class ChatChannelResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    unread_count: int

    class Config:
        from_attributes = True


class ChannelsListResponse(BaseModel):
    channels: List[ChatChannelResponse]


class MessageResponse(BaseModel):
    id: UUID
    content: str
    sender_id: UUID
    sender_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessagesListResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[UUID] = None


class MessageCreateRequest(BaseModel):
    content: str

