from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import Course, StudentCourse, CourseStatus
from app.repo.base import BaseRepository


class CourseRepository(BaseRepository[Course]):
    def __init__(self, session: AsyncSession):
        super().__init__(Course, session)

    async def get_by_id_with_relations(self, course_id: UUID) -> Optional[Course]:
        result = await self.session.execute(
            select(Course)
            .options(
                selectinload(Course.teacher),
                selectinload(Course.modules).selectinload("materials"),
                selectinload(Course.assignments),
                selectinload(Course.tests)
            )
            .where(Course.id == course_id)
        )
        return result.scalar_one_or_none()

class StudentCourseRepository(BaseRepository[StudentCourse]):
    def __init__(self, session: AsyncSession):
        super().__init__(StudentCourse, session)

    async def get_student_courses(
        self, 
        student_id: UUID, 
        status: Optional[CourseStatus] = None
    ) -> List[StudentCourse]:
        query = select(StudentCourse).options(
            selectinload(StudentCourse.course).selectinload(Course.teacher)
        ).where(StudentCourse.student_id == student_id)
        
        if status:
            query = query.where(StudentCourse.status == status)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_student_and_course(
        self, 
        student_id: UUID, 
        course_id: UUID
    ) -> Optional[StudentCourse]:
        result = await self.session.execute(
            select(StudentCourse)
            .where(
                StudentCourse.student_id == student_id,
                StudentCourse.course_id == course_id
            )
        )
        return result.scalar_one_or_none()

