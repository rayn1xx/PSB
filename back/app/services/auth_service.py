from datetime import timedelta
from uuid import UUID
from typing import Optional
import structlog

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import SecurityManager
from app.core.settings import settings
from app.core.exeptions import InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException
from app.repo.user import UserRepository
from app.db.models import User
from app.schemas.auth import AuthResponse, UserResponse, RefreshTokenResponse

logger = structlog.get_logger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def login(self, email: str, password: str) -> AuthResponse:
        user = await self.user_repo.get_by_email(email)
        if not user:
            logger.warning("Login attempt with non-existent email", email=email)
            raise InvalidCredentialsException("Email or password is incorrect")

        if not SecurityManager.verify_password(password, user.password_hash):
            logger.warning("Login attempt with wrong password", email=email)
            raise InvalidCredentialsException("Email or password is incorrect")

        access_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="access",
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="refresh",
            expires_delta=timedelta(days=30)
        )

        # Сохраняем refresh token
        user.refresh_token = refresh_token
        await self.session.commit()

        logger.info("User logged in successfully", user_id=str(user.id), email=email)

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    async def signup(self, email: str, password: str, first_name: Optional[str] = None, last_name: Optional[str] = None) -> AuthResponse:
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise UserAlreadyExistsException()

        is_valid, message = SecurityManager.validate_password_strength(password)
        if not is_valid:
            raise InvalidCredentialsException(message)

        password_hash = SecurityManager.get_password_hash(password)
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name
        )

        user = await self.user_repo.create_with_profile(user)

        access_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="access",
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="refresh",
            expires_delta=timedelta(days=30)
        )

        user.refresh_token = refresh_token
        await self.session.commit()

        logger.info("User signed up successfully", user_id=str(user.id), email=email)

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    async def refresh_token(self, refresh_token: str) -> RefreshTokenResponse:
        payload = SecurityManager.verify_token(refresh_token, allowed_types={"refresh"})
        if not payload:
            raise InvalidCredentialsException("Invalid refresh token")

        user_id = UUID(payload["sub"])
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.refresh_token != refresh_token:
            raise InvalidCredentialsException("Invalid refresh token")

        access_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="access",
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Опционально обновляем refresh token
        new_refresh_token = SecurityManager.create_access_token(
            subject=str(user.id),
            token_type="refresh",
            expires_delta=timedelta(days=30)
        )
        user.refresh_token = new_refresh_token
        await self.session.commit()

        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token
        )

