import { describe, it, expect } from 'bun:test';
import { AppError, ErrorCode } from '../lib/errors';

describe('ErrorCode', () => {
  it('has all expected codes', () => {
    expect(Object.keys(ErrorCode)).toHaveLength(9);
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.CONFLICT).toBe('CONFLICT');
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCode.INTERNAL).toBe('INTERNAL');
    expect(ErrorCode.STRIPE_ERROR).toBe('STRIPE_ERROR');
    expect(ErrorCode.IDEMPOTENCY_ERROR).toBe('IDEMPOTENCY_ERROR');
  });
});

describe('AppError', () => {
  it('constructor sets code, message, and status', () => {
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'bad input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('bad input');
    expect(err.status).toBe(400);
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('constructor sets details when provided', () => {
    const details = { field: 'email' };
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'bad', details);
    expect(err.details).toEqual(details);
  });

  it('constructor leaves details undefined when not provided', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'not found');
    expect(err.details).toBeUndefined();
  });

  it('toJSON returns error object without details when absent', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'not found');
    const json = err.toJSON();
    expect(json).toEqual({
      error: { code: 'NOT_FOUND', message: 'not found' },
    });
    expect(json.error).not.toHaveProperty('details');
  });

  it('toJSON includes details when present', () => {
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'bad', { x: 1 });
    const json = err.toJSON();
    expect(json.error.details).toEqual({ x: 1 });
  });
});

describe('STATUS_MAP', () => {
  const expectedStatuses: [ErrorCode, number][] = [
    ['VALIDATION_ERROR', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['RATE_LIMITED', 429],
    ['IDEMPOTENCY_ERROR', 409],
    ['STRIPE_ERROR', 502],
    ['INTERNAL', 500],
  ];

  for (const [code, status] of expectedStatuses) {
    it(`maps ${code} to ${status}`, () => {
      const err = new AppError(code, 'test');
      expect(err.status).toBe(status);
    });
  }
});
