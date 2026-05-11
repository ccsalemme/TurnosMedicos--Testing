from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


@dataclass(frozen=True)
class Settings:
    port: int
    mock_data_file: Path
    jwt_secret: str
    jwt_expires_in: str
    cors_origins: list[str]
    default_cancellation_window_hours: int


def get_settings() -> Settings:
    raw_path = os.getenv('MOCK_DATA_FILE', './data/mock-data.json').strip()
    mock_data_file = Path(raw_path)
    if not mock_data_file.is_absolute():
        mock_data_file = (BASE_DIR / mock_data_file).resolve()

    cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:5173')
    cors_origins = [origin.strip() for origin in cors_origin.split(',') if origin.strip()]

    return Settings(
        port=int(os.getenv('PORT', '3000')),
        mock_data_file=mock_data_file,
        jwt_secret=os.getenv('JWT_SECRET', ''),
        jwt_expires_in=os.getenv('JWT_EXPIRES_IN', '8h'),
        cors_origins=cors_origins,
        default_cancellation_window_hours=int(os.getenv('DEFAULT_CANCELLATION_WINDOW_HOURS', '24'))
    )
