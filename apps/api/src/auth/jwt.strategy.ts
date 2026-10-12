import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@nutrimom/shared';
import type { Env } from '../config/env.validation';
import type { RequestUser } from '../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  /**
   * User.tokenVersion at mint time. Checked on refresh only — verifying it on
   * every access-token request would add a DB read to every authenticated
   * call, and the 15-minute access TTL already bounds the window.
   *
   * Optional on the type because a token from before this shipped genuinely
   * won't carry it — but `refresh()` rejects that case rather than treating
   * it as legacy-and-allowed, which would leave revocation bypassable.
   */
  tv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
