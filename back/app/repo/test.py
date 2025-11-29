from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.models import Test, TestQuestion, TestAttempt
from app.repo.base import BaseRepository


class TestRepository(BaseRepository[Test]):
    def __init__(self, session: AsyncSession):
        super().__init__(Test, session)

    async def get_by_id_with_questions(self, test_id: UUID) -> Optional[Test]:
        result = await self.session.execute(
            select(Test)
            .options(
                selectinload(Test.course),
                selectinload(Test.questions)
            )
            .where(Test.id == test_id)
        )
        return result.scalar_one_or_none()

    async def get_by_course(self, course_id: UUID) -> List[Test]:
        result = await self.session.execute(
            select(Test)
            .where(Test.course_id == course_id)
            .order_by(Test.deadline)
        )
        return list(result.scalars().all())


class TestAttemptRepository(BaseRepository[TestAttempt]):
    def __init__(self, session: AsyncSession):
        super().__init__(TestAttempt, session)

    async def get_best_attempt(
        self, 
        test_id: UUID, 
        student_id: UUID
    ) -> Optional[TestAttempt]:
        result = await self.session.execute(
            select(TestAttempt)
            .where(
                TestAttempt.test_id == test_id,
                TestAttempt.student_id == student_id
            )
            .order_by(TestAttempt.score.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_attempt_count(
        self, 
        test_id: UUID, 
        student_id: UUID
    ) -> int:
        result = await self.session.execute(
            select(func.count(TestAttempt.id))
            .where(
                TestAttempt.test_id == test_id,
                TestAttempt.student_id == student_id
            )
        )
        return result.scalar_one() or 0

