import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

export interface ReportedError {
  message: string;
  stack?: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  requestId?: string;
}

/**
 * Where unhandled server errors go. Deliberately vendor-free: the only
 * built-in sink is an HTTP webhook (`ERROR_WEBHOOK_URL`), which already works
 * with Slack, Discord, Better Stack, Axiom and anything else that accepts a
 * JSON POST — so error capture works today without committing the project to
 * a paid vendor.
 *
 * Wiring Sentry (or similar) later means adding an adapter that implements
 * `capture` and selecting it here; nothing else in the app changes, since
 * everything reports through AllExceptionsFilter.
 *
 * With no URL configured this logs and returns — errors still reach the
 * application log, which is what Render captures.
 */
@Injectable()
export class ErrorReporter {
  private readonly logger = new Logger(ErrorReporter.name);
  private readonly webhookUrl?: string;
  private readonly environment: string;

  constructor(config: ConfigService<Env, true>) {
    this.webhookUrl = config.get('ERROR_WEBHOOK_URL', { infer: true });
    this.environment = config.get('NODE_ENV', { infer: true });
  }

  get enabled(): boolean {
    return !!this.webhookUrl;
  }

  capture(error: ReportedError): void {
    this.logger.error(
      `${error.statusCode} ${error.method} ${error.path} — ${error.message}`,
      error.stack,
    );
    if (!this.webhookUrl) return;

    // Fire-and-forget: an alerting sink being down must never turn a 500 into
    // a hung request, and must never itself throw into the response path.
    void this.send(error).catch((err) =>
      this.logger.warn(`Error webhook delivery failed: ${String(err)}`),
    );
  }

  private async send(error: ReportedError): Promise<void> {
    const summary = `[${this.environment}] ${error.statusCode} ${error.method} ${error.path} — ${error.message}`;
    await fetch(this.webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `text` is what Slack/Discord render; the rest is there for structured
      // sinks that keep unknown fields.
      body: JSON.stringify({
        text: summary,
        environment: this.environment,
        ...error,
      }),
      signal: AbortSignal.timeout(5000),
    });
  }
}
