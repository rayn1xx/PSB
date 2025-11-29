from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class AssignmentListItem(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    max_score: float
    deadline: Optional[datetime]
    status: str
    score: Optional[float]

    class Config:
        from_attributes = True


class AssignmentsListResponse(BaseModel):
    assignments: List[AssignmentListItem]


class AssignmentDetailResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    max_score: float
    deadline: Optional[datetime]
    status: str
    criteria: Optional[str]
    teacher_files: List[dict]

    class Config:
        from_attributes = True


class SubmissionFileResponse(BaseModel):
    id: UUID
    file_url: str
    file_name: str
    file_size: Optional[int]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    id: UUID
    comment: Optional[str]
    score: Optional[float]
    teacher_comment: Optional[str]
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime]
    files: List[SubmissionFileResponse]

    class Config:
        from_attributes = True


class SubmissionsListResponse(BaseModel):
    submissions: List[SubmissionResponse]


class SubmissionCreateRequest(BaseModel):
    comment: Optional[str] = None

