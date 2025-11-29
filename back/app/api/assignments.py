from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, List
from datetime import datetime

from app.db.session import get_session
from app.db.models import User, AssignmentStatus, Submission, SubmissionFile
from app.utils.deps import get_current_user
from app.repo.assignment import AssignmentRepository, SubmissionRepository
from app.repo.course import StudentCourseRepository
from app.services.s3_service import s3_service
from app.schemas.assignment import (
    AssignmentsListResponse,
    AssignmentListItem,
    AssignmentDetailResponse,
    SubmissionsListResponse,
    SubmissionResponse,
    SubmissionCreateRequest
)

router = APIRouter(
    prefix="/api",
    tags=["assignments"]
)


@router.get("/courses/{course_id}/assignments", response_model=AssignmentsListResponse)
async def get_course_assignments(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить список заданий по курсу"""
    assignment_repo = AssignmentRepository(session)
    student_course_repo = StudentCourseRepository(session)
    submission_repo = SubmissionRepository(session)
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    assignments = await assignment_repo.get_by_course(course_id)
    
    assignments_list = []
    for assignment in assignments:
        # Получаем последнюю отправку
        submissions = await submission_repo.get_by_assignment_and_student(assignment.id, current_user.id)
        latest_submission = submissions[0] if submissions else None
        
        # Определяем статус
        status_value = AssignmentStatus.NOT_STARTED.value
        score = None
        if latest_submission:
            status_value = latest_submission.status.value
            score = latest_submission.score
        
        # Проверяем дедлайн
        if assignment.deadline and datetime.now(assignment.deadline.tzinfo) > assignment.deadline:
            if status_value != AssignmentStatus.GRADED.value:
                status_value = AssignmentStatus.OVERDUE.value
        
        assignments_list.append(AssignmentListItem(
            id=assignment.id,
            title=assignment.title,
            description=assignment.description,
            max_score=assignment.max_score,
            deadline=assignment.deadline,
            status=status_value,
            score=score
        ))
    
    return AssignmentsListResponse(assignments=assignments_list)


@router.get("/assignments/{assignment_id}", response_model=AssignmentDetailResponse)
async def get_assignment_detail(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить детали задания"""
    assignment_repo = AssignmentRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    assignment = await assignment_repo.get_by_id_with_relations(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        assignment.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    # Определяем статус
    submission_repo = SubmissionRepository(session)
    submissions = await submission_repo.get_by_assignment_and_student(assignment_id, current_user.id)
    latest_submission = submissions[0] if submissions else None
    
    status_value = AssignmentStatus.NOT_STARTED.value
    if latest_submission:
        status_value = latest_submission.status.value
    
    if assignment.deadline and datetime.now(assignment.deadline.tzinfo) > assignment.deadline:
        if status_value != AssignmentStatus.GRADED.value:
            status_value = AssignmentStatus.OVERDUE.value
    
    return AssignmentDetailResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        max_score=assignment.max_score,
        deadline=assignment.deadline,
        status=status_value,
        criteria=None,  # TODO: добавить поле criteria в модель
        teacher_files=[]  # TODO: добавить файлы преподавателя
    )


@router.get("/assignments/{assignment_id}/submissions", response_model=SubmissionsListResponse)
async def get_submissions(
    assignment_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить историю отправок задания"""
    assignment_repo = AssignmentRepository(session)
    submission_repo = SubmissionRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        assignment.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    submissions = await submission_repo.get_by_assignment_and_student(assignment_id, current_user.id)
    
    return SubmissionsListResponse(
        submissions=[SubmissionResponse.model_validate(s) for s in submissions]
    )


@router.post("/assignments/{assignment_id}/submissions")
async def create_submission(
    assignment_id: UUID,
    comment: Optional[str] = Form(None),
    files: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Отправить новую версию задания"""
    assignment_repo = AssignmentRepository(session)
    submission_repo = SubmissionRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    # Проверяем доступ
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        assignment.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    # Создаем отправку
    submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        comment=comment,
        status=AssignmentStatus.SUBMITTED
    )
    submission = await submission_repo.create(submission)
    
    # Загружаем файлы в S3
    for file in files:
        try:
            if not s3_service.is_configured():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="File storage is not configured"
                )
            
            # Загружаем файл в S3
            result = await s3_service.upload_file(
                file=file,
                folder="submissions",
                prefix=f"{assignment_id}/{submission.id}"
            )
            
            # Сохраняем информацию о файле в БД
            submission_file = SubmissionFile(
                submission_id=submission.id,
                file_url=result["file_url"],
                file_name=result["file_name"],
                file_size=result["file_size"]
            )
            session.add(submission_file)
            
        except Exception as e:
            # Если загрузка не удалась, откатываем транзакцию
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file {file.filename}: {str(e)}"
            )
    
    await session.commit()
    await session.refresh(submission)
    
    return SubmissionResponse.model_validate(submission)

