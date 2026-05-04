import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const parsed = this.parseExceptionResponse(exceptionResponse);

    response.status(status).json({
      success: false,
      error: {
        status,
        message: parsed.message,
        details: parsed.details
      },
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }

  private parseExceptionResponse(
    exceptionResponse: string | object | null
  ): { message: string; details: unknown } {
    if (!exceptionResponse) {
      return {
        message: 'Error interno del servidor',
        details: null
      };
    }

    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        details: null
      };
    }

    const asRecord = exceptionResponse as Record<string, unknown>;
    const message =
      typeof asRecord.message === 'string'
        ? asRecord.message
        : 'Error en la solicitud';

    return {
      message,
      details: asRecord
    };
  }
}
