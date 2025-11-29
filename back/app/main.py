import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from fastapi import HTTPException
from app.db.session import engine
from app.db.base import Base
from app.api import (
    health_router,
    auth_router,
    profile_router,
    courses_router,
    materials_router,
    assignments_router,
    tests_router,
    chat_router,
    grades_router,
    calendar_router,
    notifications_router,
)

# Настройка структурированного логирования
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting application")
    
    # Создаем таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created")
    
    # Инициализируем тестовые данные
    try:
        from app.db.init_data import init_test_data
        await init_test_data()
        logger.info("Test data initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize test data: {e}")
    
    yield
    # Shutdown
    logger.info("Shutting down application")


app = FastAPI(
    title="Teaching Platform API",
    description="API для образовательной платформы",
    version="1.0.0",
    lifespan=lifespan
)
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",     # на всякий, если вдруг Vite на дефолтном порту
    "http://127.0.0.1:5173",
]

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для логирования запросов
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None
    )
    response = await call_next(request)
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code
    )
    return response

# Обработчик исключений
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(
        "Unhandled exception",
        exception=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Подключаем роутеры
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(courses_router)
app.include_router(materials_router)
app.include_router(assignments_router)
app.include_router(tests_router)
app.include_router(chat_router)
app.include_router(grades_router)
app.include_router(calendar_router)
app.include_router(notifications_router)


@app.get("/")
async def root():
    return {"message": "Teaching Platform API", "version": "1.0.0"}

