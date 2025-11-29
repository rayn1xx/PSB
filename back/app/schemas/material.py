from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class MaterialResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    type: str
    content_url: Optional[str]
    content_text: Optional[str]
    order: int

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    order: int
    materials: List[MaterialResponse]

    class Config:
        from_attributes = True


class CourseMaterialsResponse(BaseModel):
    modules: List[ModuleResponse]


class MaterialDetailResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    type: str
    content_url: Optional[str]
    content_text: Optional[str]
    module_id: UUID
    module_title: str
    course_id: UUID
    course_title: str
    progress_percent: float
    is_completed: bool
    related_assignments: List[dict]

    class Config:
        from_attributes = True


class MaterialProgressRequest(BaseModel):
    progress_percent: float
    is_completed: bool

