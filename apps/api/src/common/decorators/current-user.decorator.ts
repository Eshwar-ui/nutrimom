import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@nutrimom/shared';

// Shape attached to the request by JwtStrategy.validate().
export interface RequestUser {
  id: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
