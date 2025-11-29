from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import Notification, NotificationSettings
from app.repo.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: AsyncSession):
        super().__init__(Notification, session)

    async def get_by_user(
        self, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 50
    ) -> List[Notification]:
        result = await self.session.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        notification = await self.get_by_id(notification_id)
        if notification and notification.user_id == user_id:
            notification.is_read = True
            await self.session.commit()
            await self.session.refresh(notification)
            return notification
        return None


class NotificationSettingsRepository(BaseRepository[NotificationSettings]):
    def __init__(self, session: AsyncSession):
        super().__init__(NotificationSettings, session)

    async def get_by_user_id(self, user_id: UUID) -> Optional[NotificationSettings]:
        result = await self.session.execute(
            select(NotificationSettings)
            .where(NotificationSettings.user_id == user_id)
        )
        return result.scalar_one_or_none()

