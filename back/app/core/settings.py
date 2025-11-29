from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str
    ASYNC_DATABASE_URL: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SECRET_KEY: str
    PASSWORD_MIN_LENGTH: int
    ALGORITHM: str = "HS256"
    ISSUER: str | None = None 
    AUDIENCE: str | None = None
    REDIS_URL: str | None = None
    # Yandex S3 настройки
    S3_ENDPOINT: str | None = None  # https://storage.yandexcloud.net
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str | None = None
    S3_REGION: str = "ru-central1"



    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
