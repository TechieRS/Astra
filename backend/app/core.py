from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./astra.db"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    nasa_images_url: str = "https://images-api.nasa.gov/search"
    nasa_cache_seconds: int = 3600
    enable_nasa_network: bool = True

    @field_validator("database_url")
    @classmethod
    def postgres_driver(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value


@lru_cache
def settings() -> Settings:
    return Settings()

