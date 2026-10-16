"""Centralized application configuration.

All environment-dependent values are read here, once, via pydantic-settings.
Nothing else in the codebase should call `os.environ` directly — import
`settings` from this module instead.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "sqlite:///./fleet.db"

    # Auth
    secret_key: str = "dev-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Simulation / AI mode switches. "simulation" never requires extra
    # hardware or heavy dependencies; "live" does (see README).
    gps_mode: str = "demo"
    ai_mode: str = "demo"
    ai_camera_index: int = 0
    ai_event_cooldown_seconds: int = 30  # min gap between incidents of the same type for the same driver

    environment: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
