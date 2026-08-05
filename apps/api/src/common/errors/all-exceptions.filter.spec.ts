import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function makeFilter() {
  const reporter = { capture: jest.fn() };
  // Typed body so the assertions below read real fields rather than `any`.
  type ErrorBody = { statusCode: number; error: string; message: string };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn<unknown, [ErrorBody]>().mockReturnThis(),
  };
  const req = {
    method: 'POST',
    url: '/orders/abc123',
    route: { path: '/orders/:id' },
    user: { id: 'u1' },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  };
  const filter = new AllExceptionsFilter(reporter as any);
  return { filter, reporter, res, host };
}

describe('AllExceptionsFilter', () => {
  it('passes a 4xx body through untouched and does not alert', () => {
    const { filter, reporter, res, host } = makeFilter();

    filter.catch(new BadRequestException('Not a valid reason'), host as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Not a valid reason' }) as object,
    );
    // Client errors are the API talking to a caller, not a fault to page on.
    expect(reporter.capture).not.toHaveBeenCalled();
  });

  it('replaces a deliberate 5xx body with the generic one', () => {
    const { filter, res, host } = makeFilter();

    filter.catch(
      new InternalServerErrorException(
        'Razorpay refund failed: acct_secret_xyz',
      ),
      host as any,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    // The curated message may look safe, but a provider error can carry
    // vendor payloads or connection strings — none of it ships to the client.
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe(
      'Something went wrong on our end. Please try again.',
    );
    expect(JSON.stringify(body)).not.toContain('acct_secret_xyz');
  });

  it('reports a deliberate 5xx even though the client sees a generic body', () => {
    const { filter, reporter, host } = makeFilter();

    filter.catch(new InternalServerErrorException('gateway down'), host as any);

    expect(reporter.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'gateway down',
        statusCode: 500,
        userId: 'u1',
        // The route pattern, not the concrete URL — so one fault groups into
        // one alert instead of fanning out per order id.
        path: '/orders/:id',
      }) as object,
    );
  });

  it('never leaks an unexpected error to the client', () => {
    const { filter, reporter, res, host } = makeFilter();

    filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:5432'), host as any);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    expect(reporter.capture).toHaveBeenCalled();
  });

  it('still reports a 404 without alerting', () => {
    const { filter, reporter, res, host } = makeFilter();

    filter.catch(new NotFoundException('Order not found'), host as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(reporter.capture).not.toHaveBeenCalled();
  });
});
