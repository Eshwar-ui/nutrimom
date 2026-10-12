import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health(@Res({ passthrough: true }) res: Response) {
    const result = await this.appService.health();
    // 503 when a dependency is down so load balancers / orchestrators can
    // route around this instance; body still carries the detail.
    res.status(
      result.database === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return result;
  }
}
