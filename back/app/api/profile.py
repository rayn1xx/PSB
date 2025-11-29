from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import User
from app.utils.deps import get_current_user
from app.repo.user import UserRepository
from app.repo.notification import NotificationSettingsRepository
from app.core.security import SecurityManager
from app.core.exeptions import InvalidCredentialsException
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdateRequest,
    NotificationSettingsResponse,
    NotificationSettingsUpdateRequest,
    ChangePasswordRequest
)

router = APIRouter(
    prefix="/api/profile",
    tags=["profile"]
)


@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Получить профиль пользователя"""
    return ProfileResponse.model_validate(current_user)


@router.put("", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Обновить профиль пользователя"""
    repo = UserRepository(session)
    update_data = request.model_dump(exclude_unset=True)
    updated_user = await repo.update(current_user.id, **update_data)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return ProfileResponse.model_validate(updated_user)


@router.get("/notifications-settings", response_model=NotificationSettingsResponse)
async def get_notifications_settings(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Получить настройки уведомлений"""
    repo = NotificationSettingsRepository(session)
    settings = await repo.get_by_user_id(current_user.id)
    if not settings:
        # Создаем настройки по умолчанию
        from app.db.models import NotificationSettings
        settings = NotificationSettings(user_id=current_user.id)
        settings = await repo.create(settings)
    return NotificationSettingsResponse.model_validate(settings)


@router.put("/notifications-settings", response_model=NotificationSettingsResponse)
async def update_notifications_settings(
    request: NotificationSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Обновить настройки уведомлений"""
    repo = NotificationSettingsRepository(session)
    settings = await repo.get_by_user_id(current_user.id)
    if not settings:
        from app.db.models import NotificationSettings
        settings = NotificationSettings(user_id=current_user.id)
        settings = await repo.create(settings)
    
    update_data = request.model_dump(exclude_unset=True)
    updated_settings = await repo.update(settings.id, **update_data)
    if not updated_settings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not found")
    return NotificationSettingsResponse.model_validate(updated_settings)


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Изменить пароль"""
    if not SecurityManager.verify_password(request.old_password, current_user.password_hash):
        raise InvalidCredentialsException("Old password is incorrect")
    
    is_valid, message = SecurityManager.validate_password_strength(request.new_password)
    if not is_valid:
        raise InvalidCredentialsException(message)
    
    repo = UserRepository(session)
    new_password_hash = SecurityManager.get_password_hash(request.new_password)
    await repo.update(current_user.id, password_hash=new_password_hash)
    
    return {"message": "Password changed successfully"}

