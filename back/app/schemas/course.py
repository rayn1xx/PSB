from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class CourseOverviewResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    teacher_id: UUID
    teacher_name: Optional[str]
    progress: float
    modules_count: int
    assignments_count: int
    tests_count: int
    nearest_deadlines: List[dict]

    class Config:
        from_attributes = True


class CourseListItem(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    teacher_id: UUID
    teacher_name: Optional[str]
    progress: float
    status: str
    nearest_deadline: Optional[datetime]

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    courses: List[CourseListItem]

