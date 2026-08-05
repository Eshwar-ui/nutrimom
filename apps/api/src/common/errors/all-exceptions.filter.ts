import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RequestUser } from '../decorators/current-user.decorator';
import { ErrorReporter } from './error-reporter';

// `getStatus()` returns a plain number, so compare against one rather than
// against the HttpStatus enum member.
const SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Catches everything that reaches the top of a request. Expected HTTP errors
 * (400/401/403/404 …) pass through with their own body untouched — those are
 * the API talking to a client, not faults. Anything else is a real server
 * fault: it gets reported, and the client gets a generic message rather than
 * an internal stack or ORM error text.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly reporter: ErrorReporter) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { user?: RequestUser }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // 5xx thrown deliberately (e.g. a failed gateway call) is still a fault
      // worth alerting on, even though it carries a curated message.
      if (status >= SERVER_ERROR) {
        this.report(exception, req, status);
      }
      res.status(status).json(exception.getResponse());
      return;
    }

    this.report(exception, req, HttpStatus.INTERNAL_SERVER_ERROR);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again.',
    });
  }

  private report(
    exception: unknown,
    req: Request & { user?: RequestUser },
    statusCode: number,
  ) {
    this.reporter.capture({
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      method: req.method,
      // `route.path` keeps ids out of the alert so the same fault groups
      // together instead of fanning out one alert per order id.
      path: (req.route as { path?: string } | undefined)?.path ?? req.url,
      statusCode,
      userId: req.user?.id,
    });
  }
}
