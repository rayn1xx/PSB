from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import User, UserProfile, NotificationSettings
from app.repo.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_profile(self, user_id: UUID) -> Optional[User]:
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.notifications_settings))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_with_profile(self, user: User) -> User:
        # Сначала сохраняем пользователя, чтобы получить его ID
        self.session.add(user)
        await self.session.flush()  # Получаем ID пользователя без коммита
        
        # Теперь создаем профиль и настройки уведомлений с правильным user_id
        profile = UserProfile(user_id=user.id)
        settings = NotificationSettings(user_id=user.id)
        self.session.add(profile)
        self.session.add(settings)
        
        # Коммитим все изменения
        await self.session.commit()
        await self.session.refresh(user)
        return user

