from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_session
from app.db.models import User
from app.utils.deps import get_current_user
from app.repo.notification import NotificationRepository
from app.schemas.notification import NotificationsListResponse, NotificationResponse

router = APIRouter(
    prefix="/api",
    tags=["notifications"]
)


@router.get("/notifications", response_model=NotificationsListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить список уведомлений"""
    repo = NotificationRepository(session)
    notifications = await repo.get_by_user(current_user.id, skip, limit)
    
    return NotificationsListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications]
    )


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Пометить уведомление как прочитанное"""
    repo = NotificationRepository(session)
    notification = await repo.mark_as_read(notification_id, current_user.id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}

