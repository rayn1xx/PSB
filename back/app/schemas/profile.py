from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class ProfileResponse(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    group: Optional[str]
    university: Optional[str]
    phone: Optional[str]
    timezone: Optional[str]

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    group: Optional[str] = None
    university: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None


class NotificationSettingsResponse(BaseModel):
    email_assignment_graded: bool
    email_test_graded: bool
    email_deadline_reminder: bool
    email_comment_added: bool
    email_course_announcement: bool
    reminder_days_before: int

    class Config:
        from_attributes = True


class NotificationSettingsUpdateRequest(BaseModel):
    email_assignment_graded: Optional[bool] = None
    email_test_graded: Optional[bool] = None
    email_deadline_reminder: Optional[bool] = None
    email_comment_added: Optional[bool] = None
    email_course_announcement: Optional[bool] = None
    reminder_days_before: Optional[int] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

