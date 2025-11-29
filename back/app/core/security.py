from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.settings import settings

logger = structlog.get_logger(__name__)

# Инициализируем CryptContext с обработкой ошибок при инициализации
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Принудительно инициализируем backend, чтобы избежать проблем с detect_wrap_bug
    # Используем короткий тестовый пароль для инициализации
    _ = pwd_context.hash("test")
except Exception as e:
    logger.warning("Error initializing bcrypt context", error=str(e))
    # Если не удалось инициализировать, создаем контекст без автоматической детекции
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityManager:
    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def create_access_token(
        subject: str,
        token_type: Optional[str] = "access",
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Простой access JWT для фронта (HS256, без iss/aud).
        """
        now = SecurityManager._now()
        expire = now + (expires_delta or timedelta(
            minutes=(settings.ACCESS_TOKEN_EXPIRE_MINUTES or 45)
        ))

        to_encode: dict[str, Any] = {
            "sub":  subject,
            "type": token_type,
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }

        token = jwt.encode(
            claims=to_encode,
            key=settings.SECRET_KEY,
            algorithm=(settings.ALGORITHM or "HS256"),
        )
        return token

    @staticmethod
    def create_robot_token(
        robot_id: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Создаёт JWT-токен для робота.
        type = "robot".
        Обычно его можно сделать очень "долгоживущим".
        """
        now = SecurityManager._now()
        expire = now + (expires_delta or timedelta(days=30))  # например, на месяц

        to_encode: dict[str, Any] = {
            "sub": robot_id,          # это robot_id, типа 'RB-001'
            "type": "robot",          # маркер что это робот
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }

        token = jwt.encode(
            claims=to_encode,
            key=settings.SECRET_KEY,
            algorithm=(settings.ALGORITHM or "HS256"),
        )
        return token


    @staticmethod
    def verify_token(
        token: str,
        allowed_types: Optional[set[str]] = None,
    ) -> Optional[dict[str, Any]]:
        """
        Проверяет подпись JWT, exp, nbf и т.д.
        Если allowed_types задан, проверяет, что payload["type"] в этом списке.
        Возвращает payload (dict) или None.
        """

        options = {
            "verify_aud": False,
            "leeway": 30,  # немного терпимости к рассинхрону часов
        }

        try:
            payload = jwt.decode(
                token=token,
                key=settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM or "HS256"],
                options=options,
            )

        except JWTError as e:
            logger.warning("JWT verification failed", error=str(e))
            return None

        token_type = payload.get("type")
        if allowed_types is not None:
            if token_type not in allowed_types:
                logger.warning(
                    "JWT type mismatch",
                    actual=token_type,
                    allowed=allowed_types,
                )
                return None

        return payload
    

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        # bcrypt ограничение: максимум 72 байта
        # Безопасно обрезаем пароль до 72 байт перед проверкой
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            # Обрезаем до 72 байт, но убеждаемся что не обрезаем середину UTF-8 символа
            truncated = password_bytes[:72]
            # Удаляем неполные UTF-8 последовательности в конце
            while truncated and truncated[-1] & 0x80 and not (truncated[-1] & 0x40):
                truncated = truncated[:-1]
            plain_password = truncated.decode('utf-8', errors='ignore')
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        # bcrypt ограничение: максимум 72 байта
        # Безопасно обрезаем пароль до 72 байт перед хешированием
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Обрезаем до 72 байт, но убеждаемся что не обрезаем середину UTF-8 символа
            truncated = password_bytes[:72]
            # Удаляем неполные UTF-8 последовательности в конце
            while truncated and truncated[-1] & 0x80 and not (truncated[-1] & 0x40):
                truncated = truncated[:-1]
            password = truncated.decode('utf-8', errors='ignore')
        try:
            return pwd_context.hash(password)
        except ValueError as e:
            # Если все еще ошибка (например, при инициализации passlib), обрезаем еще раз
            if "longer than 72 bytes" in str(e):
                password_bytes = password.encode('utf-8')[:72]
                while password_bytes and password_bytes[-1] & 0x80 and not (password_bytes[-1] & 0x40):
                    password_bytes = password_bytes[:-1]
                password = password_bytes.decode('utf-8', errors='ignore')
                return pwd_context.hash(password)
            raise

    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        if len(password) < settings.PASSWORD_MIN_LENGTH:
            return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
        # bcrypt ограничение: максимум 72 байта
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            return False, "Password cannot be longer than 72 bytes"
        return True, "Password is valid"


