from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class GradeItem(BaseModel):
    assignment_id: Optional[UUID]
    test_id: Optional[UUID]
    title: str
    type: str  # "assignment" or "test"
    score: Optional[float]
    max_score: Optional[float]
    graded_at: Optional[datetime]

    class Config:
        from_attributes = True


class GradesResponse(BaseModel):
    course_id: UUID
    course_title: str
    total_score: float
    max_total_score: float
    percentage: float
    items: List[GradeItem]

