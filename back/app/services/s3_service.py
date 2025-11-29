"""
Сервис для работы с Yandex Object Storage (S3-совместимое хранилище)
"""
import uuid
from typing import Optional
from pathlib import Path
import structlog

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.core.settings import settings

logger = structlog.get_logger(__name__)


class S3Service:
    """Сервис для работы с Yandex Object Storage"""
    
    def __init__(self):
        if not all([settings.S3_ENDPOINT, settings.S3_ACCESS_KEY_ID, 
                   settings.S3_SECRET_ACCESS_KEY, settings.S3_BUCKET_NAME]):
            logger.warning("S3 credentials not configured, file uploads will be disabled")
            self.client = None
            self.bucket_name = None
        else:
            self.client = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION
            )
            self.bucket_name = settings.S3_BUCKET_NAME
            logger.info("S3 service initialized", bucket=self.bucket_name)
    
    async def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "uploads",
        prefix: Optional[str] = None
    ) -> dict:
        """
        Загружает файл в S3
        
        Args:
            file: Файл для загрузки
            folder: Папка в S3 (например, "submissions", "materials")
            prefix: Дополнительный префикс (например, user_id или assignment_id)
        
        Returns:
            dict с ключами: file_url, file_name, file_size
        """
        if not self.client:
            raise ValueError("S3 service is not configured")
        
        # Генерируем уникальное имя файла
        file_extension = Path(file.filename).suffix if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Формируем путь в S3
        if prefix:
            s3_key = f"{folder}/{prefix}/{unique_filename}"
        else:
            s3_key = f"{folder}/{unique_filename}"
        
        try:
            # Читаем содержимое файла
            file_content = await file.read()
            file_size = len(file_content)
            
            # Загружаем в S3
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=file.content_type or "application/octet-stream",
                Metadata={
                    "original_filename": file.filename or "unknown",
                    "uploaded_by": "teaching-platform"
                }
            )
            
            # Формируем публичный URL
            file_url = f"{settings.S3_ENDPOINT}/{self.bucket_name}/{s3_key}"
            
            logger.info(
                "File uploaded to S3",
                s3_key=s3_key,
                file_size=file_size,
                original_filename=file.filename
            )
            
            return {
                "file_url": file_url,
                "file_name": file.filename or unique_filename,
                "file_size": file_size,
                "s3_key": s3_key
            }
            
        except ClientError as e:
            logger.error("Failed to upload file to S3", error=str(e), s3_key=s3_key)
            raise Exception(f"Failed to upload file: {str(e)}")
        except Exception as e:
            logger.error("Unexpected error during file upload", error=str(e))
            raise
    
    async def delete_file(self, s3_key: str) -> bool:
        """
        Удаляет файл из S3
        
        Args:
            s3_key: Ключ файла в S3
        
        Returns:
            True если файл удален, False если не найден
        """
        if not self.client:
            return False
        
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info("File deleted from S3", s3_key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                logger.warning("File not found in S3", s3_key=s3_key)
                return False
            logger.error("Failed to delete file from S3", error=str(e), s3_key=s3_key)
            raise
        except Exception as e:
            logger.error("Unexpected error during file deletion", error=str(e))
            raise
    
    async def get_file_url(self, s3_key: str, expires_in: int = 3600) -> Optional[str]:
        """
        Генерирует временный URL для доступа к файлу
        
        Args:
            s3_key: Ключ файла в S3
            expires_in: Время жизни URL в секундах (по умолчанию 1 час)
        
        Returns:
            Временный URL или None если файл не найден
        """
        if not self.client:
            return None
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error("Failed to generate presigned URL", error=str(e), s3_key=s3_key)
            return None
    
    def is_configured(self) -> bool:
        """Проверяет, настроен ли S3 сервис"""
        return self.client is not None


# Глобальный экземпляр сервиса
s3_service = S3Service()

