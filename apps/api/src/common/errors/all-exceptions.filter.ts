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

    // 4xx is the API talking to a client — its body is written for them, so
    // it passes through untouched.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status < SERVER_ERROR) {
        res.status(status).json(exception.getResponse());
        return;
      }
      // A deliberate 5xx is still a fault: report it, and answer with the
      // same generic body as any other server error. Its curated message may
      // read as safe, but nothing guarantees that — an InternalServerError
      // raised deep in a provider can carry vendor payloads or connection
      // strings, and this is the one place that can guarantee it doesn't ship.
      this.report(exception, req, status);
      this.sendGeneric(res, status);
      return;
    }

    this.report(exception, req, HttpStatus.INTERNAL_SERVER_ERROR);
    this.sendGeneric(res, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private sendGeneric(res: Response, statusCode: number) {
    res.status(statusCode).json({
      statusCode,
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
