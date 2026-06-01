"""
Sistema de logging para la aplicación Turnos Médicos.
Configura logging estructurado con diferentes niveles y formateo claro.
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime
from typing import Any


class ColoredFormatter(logging.Formatter):
    """Formateador con colores para consola."""
    
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logger(name: str = 'turnos_medicos', level: int = logging.INFO) -> logging.Logger:
    """
    Configura y retorna un logger para la aplicación.
    
    Args:
        name: Nombre del logger
        level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evitar duplicar handlers si ya está configurado
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Formato detallado
    formatter = ColoredFormatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    return logger


def log_operation(logger: logging.Logger, operation: str, details: dict[str, Any] | None = None) -> None:
    """
    Log de operación estructurado.
    
    Args:
        logger: Logger a usar
        operation: Nombre de la operación
        details: Detalles adicionales de la operación
    """
    details_str = f" | {details}" if details else ""
    logger.info(f"OPERACIÓN: {operation}{details_str}")


def log_error(logger: logging.Logger, error: Exception, context: dict[str, Any] | None = None) -> None:
    """
    Log de error con contexto.
    
    Args:
        logger: Logger a usar
        error: Excepción capturada
        context: Contexto adicional del error
    """
    context_str = f" | Contexto: {context}" if context else ""
    logger.error(f"ERROR: {type(error).__name__}: {str(error)}{context_str}", exc_info=True)


def log_request(logger: logging.Logger, method: str, path: str, user_id: str | None = None) -> None:
    """
    Log de request HTTP.
    
    Args:
        logger: Logger a usar
        method: Método HTTP
        path: Path del endpoint
        user_id: ID del usuario que hace el request (si está autenticado)
    """
    user_info = f" | Usuario: {user_id}" if user_id else " | Usuario: anónimo"
    logger.info(f"REQUEST: {method} {path}{user_info}")


def log_response(logger: logging.Logger, path: str, status: int, duration_ms: float) -> None:
    """
    Log de response HTTP.
    
    Args:
        logger: Logger a usar
        path: Path del endpoint
        status: Status code
        duration_ms: Duración en milisegundos
    """
    logger.info(f"RESPONSE: {path} | Status: {status} | Duración: {duration_ms:.2f}ms")


# Logger global de la aplicación
app_logger = setup_logger('turnos_medicos', level=logging.INFO)
