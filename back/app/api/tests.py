from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.db.session import get_session
from app.db.models import User, TestAttempt
from app.utils.deps import get_current_user
from app.repo.test import TestRepository, TestAttemptRepository
from app.repo.course import StudentCourseRepository
from app.schemas.test import (
    TestsListResponse,
    TestListItem,
    TestDetailResponse,
    TestQuestionResponse,
    TestAttemptRequest,
    TestAttemptResponse,
    TestQuestionResult
)

router = APIRouter(
    prefix="/api",
    tags=["tests"]
)


@router.get("/courses/{course_id}/tests", response_model=TestsListResponse)
async def get_course_tests(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить список тестов по курсу"""
    test_repo = TestRepository(session)
    attempt_repo = TestAttemptRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    tests = await test_repo.get_by_course(course_id)
    
    tests_list = []
    for test in tests:
        attempts_count = await attempt_repo.get_attempt_count(test.id, current_user.id)
        best_attempt = await attempt_repo.get_best_attempt(test.id, current_user.id)
        
        tests_list.append(TestListItem(
            id=test.id,
            title=test.title,
            description=test.description,
            deadline=test.deadline,
            max_attempts=test.max_attempts,
            attempts_count=attempts_count,
            best_score=best_attempt.score if best_attempt else None,
            max_score=best_attempt.max_score if best_attempt else None
        ))
    
    return TestsListResponse(tests=tests_list)


@router.get("/tests/{test_id}", response_model=TestDetailResponse)
async def get_test_detail(
    test_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить структуру теста"""
    test_repo = TestRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    test = await test_repo.get_by_id_with_questions(test_id)
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        test.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    questions = []
    for question in test.questions:
        options = question.options.get("options", [])
        questions.append(TestQuestionResponse(
            id=question.id,
            question_text=question.question_text,
            options=options,
            order=question.order,
            points=question.points
        ))
    
    return TestDetailResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        time_limit_minutes=test.time_limit_minutes,
        deadline=test.deadline,
        max_attempts=test.max_attempts,
        questions=questions
    )


@router.post("/tests/{test_id}/attempts", response_model=TestAttemptResponse)
async def submit_test_attempt(
    test_id: UUID,
    request: TestAttemptRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Отправить ответы на тест"""
    test_repo = TestRepository(session)
    attempt_repo = TestAttemptRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    test = await test_repo.get_by_id_with_questions(test_id)
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        test.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    # Проверяем количество попыток
    attempts_count = await attempt_repo.get_attempt_count(test_id, current_user.id)
    if attempts_count >= test.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Maximum attempts ({test.max_attempts}) reached"
        )
    
    # Проверяем дедлайн
    if test.deadline and datetime.now(test.deadline.tzinfo) > test.deadline:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Test deadline has passed")
    
    # Проверяем ответы и считаем результат
    score = 0.0
    max_score = 0.0
    question_results = []
    
    for question in test.questions:
        max_score += question.points
        user_answer = request.answers.get(str(question.id))
        correct_answer = question.options.get("correct", 0)
        
        is_correct = user_answer == correct_answer
        if is_correct:
            score += question.points
        
        question_results.append(TestQuestionResult(
            question_id=question.id,
            is_correct=is_correct,
            user_answer=user_answer if user_answer is not None else -1,
            correct_answer=correct_answer
        ))
    
    percentage = (score / max_score * 100) if max_score > 0 else 0
    is_passed = percentage >= 60  # Порог прохождения 60%
    
    # Создаем попытку
    attempt = TestAttempt(
        test_id=test_id,
        student_id=current_user.id,
        answers=request.answers,
        score=score,
        max_score=max_score,
        is_passed=is_passed,
        completed_at=datetime.now()
    )
    attempt = await attempt_repo.create(attempt)
    
    return TestAttemptResponse(
        score=score,
        max_score=max_score,
        percentage=percentage,
        is_passed=is_passed,
        question_results=question_results
    )

