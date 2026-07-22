import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from '../config/env.validation';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(config: ConfigService<Env, true>) {
    this.resend = new Resend(config.get('RESEND_API_KEY', { infer: true }));
    this.from = config.get('MAIL_FROM_EMAIL', { infer: true });
  }

  /**
   * Best-effort send — logs and swallows failures rather than throwing, so a
   * flaky mail provider can't turn "forgot password" into a 500 that also
   * confirms (via timing/error) whether an email address has an account.
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: `Preloved by The Nurture Moms <${this.from}>`,
        to,
        subject: 'Reset your password',
        html: `
          <p>Someone (hopefully you) asked to reset the password on your Preloved by The Nurture Moms account.</p>
          <p><a href="${resetUrl}">Choose a new password</a></p>
          <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send password-reset email to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
