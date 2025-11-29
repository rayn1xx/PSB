from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List, Dict
from datetime import datetime


class TestListItem(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    deadline: Optional[datetime]
    max_attempts: int
    attempts_count: int
    best_score: Optional[float]
    max_score: Optional[float]

    class Config:
        from_attributes = True


class TestsListResponse(BaseModel):
    tests: List[TestListItem]


class TestQuestionResponse(BaseModel):
    id: UUID
    question_text: str
    options: List[str]
    order: int
    points: float

    class Config:
        from_attributes = True


class TestDetailResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    time_limit_minutes: Optional[int]
    deadline: Optional[datetime]
    max_attempts: int
    questions: List[TestQuestionResponse]

    class Config:
        from_attributes = True


class TestAttemptRequest(BaseModel):
    answers: Dict[str, int]  # {"question_id": "answer_index"}


class TestQuestionResult(BaseModel):
    question_id: UUID
    is_correct: bool
    user_answer: int
    correct_answer: int


class TestAttemptResponse(BaseModel):
    score: float
    max_score: float
    percentage: float
    is_passed: bool
    question_results: List[TestQuestionResult]

