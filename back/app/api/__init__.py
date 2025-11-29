from .health import router as health_router
from .auth import router as auth_router
from .profile import router as profile_router
from .courses import router as courses_router
from .materials import router as materials_router
from .assignments import router as assignments_router
from .tests import router as tests_router
from .chat import router as chat_router
from .grades import router as grades_router
from .calendar import router as calendar_router
from .notifications import router as notifications_router

__all__ = [
    "health_router",
    "auth_router",
    "profile_router",
    "courses_router",
    "materials_router",
    "assignments_router",
    "tests_router",
    "chat_router",
    "grades_router",
    "calendar_router",
    "notifications_router",
]
