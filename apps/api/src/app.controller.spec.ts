import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  async function build(queryRaw: () => Promise<unknown>) {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();
    return app.get<AppController>(AppController);
  }

  function fakeRes() {
    return { status: jest.fn().mockReturnThis() } as unknown as import('express').Response & {
      status: jest.Mock;
    };
  }

  describe('health', () => {
    it('reports ok and 200 when the database responds', async () => {
      const controller = await build(() => Promise.resolve([{ 1: 1 }]));
      const res = fakeRes();
      const result = await controller.health(res);

      expect(result.status).toBe('ok');
      expect(result.database).toBe('up');
      expect(result.service).toBe('nutrimom-api');
      expect(typeof result.uptime).toBe('number');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('reports degraded and 503 when the database is unreachable', async () => {
      const controller = await build(() => Promise.reject(new Error('no db')));
      const res = fakeRes();
      const result = await controller.health(res);

      expect(result.status).toBe('degraded');
      expect(result.database).toBe('down');
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });
});
