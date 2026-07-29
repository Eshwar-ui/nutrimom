import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates `req.user` when a valid Bearer token is present, but lets the
 * request through when it isn't. For endpoints that are public yet answer
 * differently for a signed-in caller — e.g. listing detail, which hides
 * unapproved listings from the public but must stay visible to the admin
 * reviewing it and to the seller who owns it.
 *
 * Never throws on a missing or invalid token; callers must treat `user` as
 * optional and fall back to public behaviour.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | undefined {
    return user || undefined;
  }
}
