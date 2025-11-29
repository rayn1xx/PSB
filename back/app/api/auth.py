from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, SignupRequest, AuthResponse, RefreshTokenRequest, RefreshTokenResponse, UserResponse
from app.utils.deps import get_current_user
from app.db.models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """Вход в систему"""
    service = AuthService(session)
    return await service.login(request.email, request.password)


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignupRequest,
    session: AsyncSession = Depends(get_session)
):
    """Регистрация нового пользователя"""
    service = AuthService(session)
    return await service.signup(
        request.email,
        request.password,
        request.first_name,
        request.last_name
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о текущем пользователе"""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    """Обновить access token"""
    service = AuthService(session)
    return await service.refresh_token(request.refresh_token)

