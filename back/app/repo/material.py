from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models import Material, MaterialProgress, Module
from app.repo.base import BaseRepository


class MaterialRepository(BaseRepository[Material]):
    def __init__(self, session: AsyncSession):
        super().__init__(Material, session)

    async def get_by_id_with_relations(self, material_id: UUID) -> Optional[Material]:
        result = await self.session.execute(
            select(Material)
            .options(
                selectinload(Material.module).selectinload(Module.course),
                selectinload(Material.assignment)
            )
            .where(Material.id == material_id)
        )
        return result.scalar_one_or_none()

    async def get_by_course(self, course_id: UUID) -> List[Module]:
        result = await self.session.execute(
            select(Module)
            .options(selectinload(Module.materials))
            .where(Module.course_id == course_id)
            .order_by(Module.order)
        )
        return list(result.scalars().all())


class MaterialProgressRepository(BaseRepository[MaterialProgress]):
    def __init__(self, session: AsyncSession):
        super().__init__(MaterialProgress, session)

    async def get_by_student_and_material(
        self, 
        student_id: UUID, 
        material_id: UUID
    ) -> Optional[MaterialProgress]:
        result = await self.session.execute(
            select(MaterialProgress)
            .where(
                MaterialProgress.student_id == student_id,
                MaterialProgress.material_id == material_id
            )
        )
        return result.scalar_one_or_none()

    async def upsert_progress(
        self, 
        student_id: UUID, 
        material_id: UUID, 
        progress_percent: float, 
        is_completed: bool
    ) -> MaterialProgress:
        progress = await self.get_by_student_and_material(student_id, material_id)
        if progress:
            progress.progress_percent = progress_percent
            progress.is_completed = is_completed
            await self.session.commit()
            await self.session.refresh(progress)
            return progress
        else:
            progress = MaterialProgress(
                student_id=student_id,
                material_id=material_id,
                progress_percent=progress_percent,
                is_completed=is_completed
            )
            return await self.create(progress)

