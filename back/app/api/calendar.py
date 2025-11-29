from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional

from app.db.session import get_session
from app.db.models import User
from app.utils.deps import get_current_user
from app.repo.course import StudentCourseRepository, CourseRepository
from app.repo.assignment import AssignmentRepository
from app.repo.test import TestRepository
from app.schemas.calendar import CalendarResponse, CalendarEvent

router = APIRouter(
    prefix="/api",
    tags=["calendar"]
)


@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить события календаря за период"""
    student_course_repo = StudentCourseRepository(session)
    course_repo = CourseRepository(session)
    assignment_repo = AssignmentRepository(session)
    test_repo = TestRepository(session)
    
    # Получаем все курсы студента
    student_courses = await student_course_repo.get_student_courses(current_user.id)
    course_ids = [sc.course_id for sc in student_courses]
    
    # Получаем информацию о курсах
    courses_map = {}
    for course_id in course_ids:
        course = await course_repo.get_by_id(course_id)
        if course:
            courses_map[course_id] = course
    
    events = []
    
    # Получаем дедлайны заданий
    for course_id in course_ids:
        course = courses_map.get(course_id)
        if not course:
            continue
            
        assignments = await assignment_repo.get_by_course(course_id)
        for assignment in assignments:
            if assignment.deadline:
                if from_date and assignment.deadline < from_date:
                    continue
                if to_date and assignment.deadline > to_date:
                    continue
                
                events.append(CalendarEvent(
                    id=assignment.id,
                    title=assignment.title,
                    type="assignment",
                    course_id=course_id,
                    course_title=course.title,
                    entity_id=assignment.id,
                    datetime=assignment.deadline,
                    description=assignment.description
                ))
        
        # Получаем дедлайны тестов
        tests = await test_repo.get_by_course(course_id)
        for test in tests:
            if test.deadline:
                if from_date and test.deadline < from_date:
                    continue
                if to_date and test.deadline > to_date:
                    continue
                
                events.append(CalendarEvent(
                    id=test.id,
                    title=test.title,
                    type="test",
                    course_id=course_id,
                    course_title=course.title,
                    entity_id=test.id,
                    datetime=test.deadline,
                    description=test.description
                ))
    
    # Сортируем по дате
    events.sort(key=lambda x: x.datetime)
    
    return CalendarResponse(events=events)

