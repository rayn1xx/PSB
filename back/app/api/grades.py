from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_session
from app.db.models import User
from app.utils.deps import get_current_user
from app.repo.course import CourseRepository, StudentCourseRepository
from app.repo.assignment import AssignmentRepository, SubmissionRepository
from app.repo.test import TestRepository, TestAttemptRepository
from app.schemas.grades import GradesResponse, GradeItem

router = APIRouter(
    prefix="/api",
    tags=["grades"]
)


@router.get("/courses/{course_id}/grades", response_model=GradesResponse)
async def get_course_grades(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить журнал успеваемости по курсу"""
    course_repo = CourseRepository(session)
    student_course_repo = StudentCourseRepository(session)
    assignment_repo = AssignmentRepository(session)
    submission_repo = SubmissionRepository(session)
    test_repo = TestRepository(session)
    attempt_repo = TestAttemptRepository(session)
    
    course = await course_repo.get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    items = []
    total_score = 0.0
    max_total_score = 0.0
    
    # Обрабатываем задания
    assignments = await assignment_repo.get_by_course(course_id)
    for assignment in assignments:
        max_total_score += assignment.max_score
        submissions = await submission_repo.get_by_assignment_and_student(assignment.id, current_user.id)
        latest_submission = submissions[0] if submissions else None
        score = latest_submission.score if latest_submission and latest_submission.score else None
        if score:
            total_score += score
        
        items.append(GradeItem(
            assignment_id=assignment.id,
            test_id=None,
            title=assignment.title,
            type="assignment",
            score=score,
            max_score=assignment.max_score,
            graded_at=latest_submission.graded_at if latest_submission else None
        ))
    
    # Обрабатываем тесты
    tests = await test_repo.get_by_course(course_id)
    for test in tests:
        best_attempt = await attempt_repo.get_best_attempt(test.id, current_user.id)
        
        # Для тестов max_score берем из попытки, если есть, иначе None
        test_max_score = best_attempt.max_score if best_attempt else None
        if test_max_score:
            max_total_score += test_max_score
        
        if best_attempt:
            total_score += best_attempt.score
        
        items.append(GradeItem(
            assignment_id=None,
            test_id=test.id,
            title=test.title,
            type="test",
            score=best_attempt.score if best_attempt else None,
            max_score=test_max_score,
            graded_at=best_attempt.completed_at if best_attempt else None
        ))
    
    percentage = (total_score / max_total_score * 100) if max_total_score > 0 else 0
    
    return GradesResponse(
        course_id=course_id,
        course_title=course.title,
        total_score=total_score,
        max_total_score=max_total_score,
        percentage=percentage,
        items=items
    )

