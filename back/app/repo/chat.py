from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.models import ChatChannel, Message
from app.repo.base import BaseRepository


class ChatChannelRepository(BaseRepository[ChatChannel]):
    def __init__(self, session: AsyncSession):
        super().__init__(ChatChannel, session)

    async def get_by_course(self, course_id: UUID) -> List[ChatChannel]:
        result = await self.session.execute(
            select(ChatChannel)
            .where(ChatChannel.course_id == course_id)
            .order_by(ChatChannel.created_at)
        )
        return list(result.scalars().all())

    async def get_with_unread_count(
        self, 
        course_id: UUID, 
        user_id: UUID
    ) -> List[dict]:
        # Получаем каналы с количеством непрочитанных сообщений
        channels = await self.get_by_course(course_id)
        result = []
        for channel in channels:
            unread_count = await self.session.execute(
                select(func.count(Message.id))
                .where(
                    Message.channel_id == channel.id,
                    Message.sender_id != user_id,
                    Message.created_at > func.now() - func.make_interval(days=30)  # пример: за последние 30 дней
                )
            )
            result.append({
                "channel": channel,
                "unread_count": unread_count.scalar_one() or 0
            })
        return result


class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(Message, session)

    async def get_by_channel(
        self, 
        channel_id: UUID, 
        cursor: Optional[UUID] = None, 
        limit: int = 50
    ) -> List[Message]:
        query = select(Message).options(
            selectinload(Message.sender)
        ).where(Message.channel_id == channel_id)
        
        if cursor:
            query = query.where(Message.id < cursor)
        
        query = query.order_by(Message.created_at.desc()).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())

