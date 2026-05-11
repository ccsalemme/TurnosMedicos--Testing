from __future__ import annotations

from .config import get_settings
from .store import MockDataStore


def main() -> None:
    settings = get_settings()
    store = MockDataStore(
        data_file_path=settings.mock_data_file,
        jwt_secret=settings.jwt_secret,
        jwt_expires_in=settings.jwt_expires_in,
        default_cancellation_window_hours=settings.default_cancellation_window_hours
    )
    store.reset_to_bootstrap()
    print(f'Datos de ejemplo regenerados en {settings.mock_data_file}')


if __name__ == '__main__':
    main()
