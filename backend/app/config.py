from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./sql_app.db"
    
    # JWT
    jwt_secret: str = "super-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    jwt_refresh_expiration_days: int = 7
    
    # OpenAI
    openai_api_key: str = ""
    deepseek_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    groq_api_key: str = ""
    
    # Internal lists for rotation (can be populated from comma-separated env vars if we added parsing logic, 
    # but for now we will assume the single key fields might contain commas or we rely on the user updating the single field to a CSV)
    # Actually, let's properly support CSV parsing for these:
    
    @property
    def openai_keys(self) -> List[str]:
        return [k.strip() for k in self.openai_api_key.split(",") if k.strip()]

    @property
    def deepseek_keys(self) -> List[str]:
        return [k.strip() for k in self.deepseek_api_key.split(",") if k.strip()]

    @property
    def gemini_keys(self) -> List[str]:
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    @property
    def anthropic_keys(self) -> List[str]:
        return [k.strip() for k in self.anthropic_api_key.split(",") if k.strip()]

    @property
    def groq_keys(self) -> List[str]:
        return [k.strip() for k in self.groq_api_key.split(",") if k.strip()]

    # CORS - parse as comma-separated string from env
    allowed_origins: str = "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3001,http://127.0.0.1:3002"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def get_allowed_origins(self) -> List[str]:
        """Convert comma-separated string to list"""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

@lru_cache()
def get_settings():
    return Settings()
