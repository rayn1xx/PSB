from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import Assignment, Submission, SubmissionFile
from app.repo.base import BaseRepository


class AssignmentRepository(BaseRepository[Assignment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Assignment, session)

    async def get_by_id_with_relations(self, assignment_id: UUID) -> Optional[Assignment]:
        result = await self.session.execute(
            select(Assignment)
            .options(
                selectinload(Assignment.course),
                selectinload(Assignment.material)
            )
            .where(Assignment.id == assignment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_course(self, course_id: UUID) -> List[Assignment]:
        result = await self.session.execute(
            select(Assignment)
            .where(Assignment.course_id == course_id)
            .order_by(Assignment.deadline)
        )
        return list(result.scalars().all())


class SubmissionRepository(BaseRepository[Submission]):
    def __init__(self, session: AsyncSession):
        super().__init__(Submission, session)

    async def get_by_assignment_and_student(
        self, 
        assignment_id: UUID, 
        student_id: UUID
    ) -> List[Submission]:
        result = await self.session.execute(
            select(Submission)
            .options(selectinload(Submission.files))
            .where(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student_id
            )
            .order_by(Submission.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id_with_relations(self, submission_id: UUID) -> Optional[Submission]:
        result = await self.session.execute(
            select(Submission)
            .options(
                selectinload(Submission.assignment),
                selectinload(Submission.student),
                selectinload(Submission.files)
            )
            .where(Submission.id == submission_id)
        )
        return result.scalar_one_or_none()

