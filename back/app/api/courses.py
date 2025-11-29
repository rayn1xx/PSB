from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_session
from app.db.models import User, CourseStatus
from app.utils.deps import get_current_user
from app.repo.course import CourseRepository, StudentCourseRepository
from app.schemas.course import CourseListResponse, CourseListItem, CourseOverviewResponse

router = APIRouter(
    prefix="/api",
    tags=["courses"]
)


@router.get("/student/courses", response_model=CourseListResponse)
async def get_student_courses(
    status: Optional[CourseStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить список курсов студента"""
    repo = StudentCourseRepository(session)
    student_courses = await repo.get_student_courses(current_user.id, status)
    
    courses = []
    for sc in student_courses:
        courses.append(CourseListItem(
            id=sc.course.id,
            title=sc.course.title,
            description=sc.course.description,
            teacher_id=sc.course.teacher_id,
            teacher_name=f"{sc.course.teacher.first_name or ''} {sc.course.teacher.last_name or ''}".strip() or None,
            progress=sc.progress,
            status=sc.status.value,
            nearest_deadline=None  # TODO: вычислить ближайший дедлайн
        ))
    
    return CourseListResponse(courses=courses)


@router.get("/courses/{course_id}/overview", response_model=CourseOverviewResponse)
async def get_course_overview(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить обзор курса"""
    course_repo = CourseRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    course = await course_repo.get_by_id_with_relations(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    # Вычисляем ближайшие дедлайны
    nearest_deadlines = []
    for assignment in course.assignments:
        if assignment.deadline:
            nearest_deadlines.append({
                "type": "assignment",
                "id": str(assignment.id),
                "title": assignment.title,
                "deadline": assignment.deadline.isoformat()
            })
    for test in course.tests:
        if test.deadline:
            nearest_deadlines.append({
                "type": "test",
                "id": str(test.id),
                "title": test.title,
                "deadline": test.deadline.isoformat()
            })
    
    nearest_deadlines.sort(key=lambda x: x["deadline"])
    
    return CourseOverviewResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        teacher_id=course.teacher_id,
        teacher_name=f"{course.teacher.first_name or ''} {course.teacher.last_name or ''}".strip() or None,
        progress=student_course.progress,
        modules_count=len(course.modules),
        assignments_count=len(course.assignments),
        tests_count=len(course.tests),
        nearest_deadlines=nearest_deadlines[:5]  # Топ 5 ближайших
    )

