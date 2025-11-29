from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_session
from app.db.models import User, Message
from app.utils.deps import get_current_user
from app.repo.chat import ChatChannelRepository, MessageRepository
from app.repo.course import StudentCourseRepository
from app.schemas.chat import (
    ChannelsListResponse,
    ChatChannelResponse,
    MessagesListResponse,
    MessageResponse,
    MessageCreateRequest
)

router = APIRouter(
    prefix="/api",
    tags=["chat"]
)


@router.get("/courses/{course_id}/chat/channels", response_model=ChannelsListResponse)
async def get_course_channels(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить список чатов для курса"""
    channel_repo = ChatChannelRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    channels_with_unread = await channel_repo.get_with_unread_count(course_id, current_user.id)
    
    channels = []
    for item in channels_with_unread:
        channels.append(ChatChannelResponse(
            id=item["channel"].id,
            name=item["channel"].name,
            description=item["channel"].description,
            unread_count=item["unread_count"]
        ))
    
    return ChannelsListResponse(channels=channels)


@router.get("/chat/channels/{channel_id}/messages", response_model=MessagesListResponse)
async def get_channel_messages(
    channel_id: UUID,
    cursor: Optional[UUID] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить сообщения канала"""
    channel_repo = ChatChannelRepository(session)
    message_repo = MessageRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    channel = await channel_repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        channel.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    messages = await message_repo.get_by_channel(channel_id, cursor, limit)
    
    next_cursor = messages[-1].id if messages and len(messages) == limit else None
    
    return MessagesListResponse(
        messages=[MessageResponse(
            id=m.id,
            content=m.content,
            sender_id=m.sender_id,
            sender_name=f"{m.sender.first_name or ''} {m.sender.last_name or ''}".strip() or m.sender.email,
            created_at=m.created_at
        ) for m in reversed(messages)],  # Переворачиваем, чтобы новые были в конце
        next_cursor=next_cursor
    )


@router.post("/chat/channels/{channel_id}/messages")
async def create_message(
    channel_id: UUID,
    request: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Отправить сообщение в канал"""
    channel_repo = ChatChannelRepository(session)
    message_repo = MessageRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    channel = await channel_repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        channel.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    message = Message(
        channel_id=channel_id,
        sender_id=current_user.id,
        content=request.content
    )
    message = await message_repo.create(message)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        sender_id=message.sender_id,
        sender_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email,
        created_at=message.created_at
    )

