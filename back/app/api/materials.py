from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_session
from app.db.models import User
from app.utils.deps import get_current_user
from app.repo.material import MaterialRepository, MaterialProgressRepository
from app.repo.course import StudentCourseRepository
from app.schemas.material import (
    CourseMaterialsResponse,
    ModuleResponse,
    MaterialResponse,
    MaterialDetailResponse,
    MaterialProgressRequest
)

router = APIRouter(
    prefix="/api",
    tags=["materials"]
)


@router.get("/courses/{course_id}/materials", response_model=CourseMaterialsResponse)
async def get_course_materials(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить структуру материалов курса"""
    material_repo = MaterialRepository(session)
    student_course_repo = StudentCourseRepository(session)
    
    # Проверяем, что студент зачислен на курс
    student_course = await student_course_repo.get_by_student_and_course(current_user.id, course_id)
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    modules = await material_repo.get_by_course(course_id)
    
    modules_response = []
    for module in modules:
        materials_response = []
        for material in module.materials:
            materials_response.append(MaterialResponse.model_validate(material))
        modules_response.append(ModuleResponse(
            id=module.id,
            title=module.title,
            description=module.description,
            order=module.order,
            materials=materials_response
        ))
    
    return CourseMaterialsResponse(modules=modules_response)


@router.get("/materials/{material_id}", response_model=MaterialDetailResponse)
async def get_material_detail(
    material_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить детальную информацию о материале"""
    material_repo = MaterialRepository(session)
    progress_repo = MaterialProgressRepository(session)
    
    material = await material_repo.get_by_id_with_relations(material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    # Проверяем доступ к курсу
    student_course_repo = StudentCourseRepository(session)
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        material.module.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    # Получаем прогресс
    progress = await progress_repo.get_by_student_and_material(current_user.id, material_id)
    progress_percent = progress.progress_percent if progress else 0.0
    is_completed = progress.is_completed if progress else False
    
    # Связанные задания
    related_assignments = []
    if material.assignment:
        related_assignments.append({
            "id": str(material.assignment.id),
            "title": material.assignment.title
        })
    
    return MaterialDetailResponse(
        id=material.id,
        title=material.title,
        description=material.description,
        type=material.type.value,
        content_url=material.content_url,
        content_text=material.content_text,
        module_id=material.module_id,
        module_title=material.module.title,
        course_id=material.module.course_id,
        course_title=material.module.course.title,
        progress_percent=progress_percent,
        is_completed=is_completed,
        related_assignments=related_assignments
    )


@router.post("/materials/{material_id}/progress")
async def update_material_progress(
    material_id: UUID,
    request: MaterialProgressRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Обновить прогресс изучения материала"""
    material_repo = MaterialRepository(session)
    progress_repo = MaterialProgressRepository(session)
    
    material = await material_repo.get_by_id(material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    
    # Проверяем доступ
    student_course_repo = StudentCourseRepository(session)
    student_course = await student_course_repo.get_by_student_and_course(
        current_user.id, 
        material.module.course_id
    )
    if not student_course:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course")
    
    await progress_repo.upsert_progress(
        current_user.id,
        material_id,
        request.progress_percent,
        request.is_completed
    )
    
    return {"message": "Progress updated successfully"}

