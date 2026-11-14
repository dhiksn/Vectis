import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AGENT_HOST: str = "127.0.0.1"
    AGENT_PORT: int = 8000
    AGENT_API_KEY: str = "vps-agent-secret-key-38f9b2"
    DATABASE_PATH: str = "vps_control.db"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3050,http://127.0.0.1:3050"
    METRICS_INTERVAL: int = 3
    SERVICE_ALLOWLIST: str = "nginx,ssh,sshd,docker,cron,ufw,mysql,postgresql,ollama,redis,systemd-journald"
    ADMIN_USERNAME: str = "admin"
    # Default bcrypt hash for "admin123"
    # In production, set via ADMIN_PASSWORD_HASH env var
    ADMIN_PASSWORD_HASH: str = "$2b$12$OWde5hNSe2FmLm9rcBhfgeV5AIOZzG0hjZEoxqCHRqCD9dCK7y0Ka"
    JWT_SECRET_KEY: str = "vps-control-center-super-secure-jwt-secret-key-92841"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATA_RETENTION_HOURS: int = 48

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def service_allowlist_set(self) -> set:
        return {s.strip().lower() for s in self.SERVICE_ALLOWLIST.split(",") if s.strip()}


settings = Settings()
