import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { logger } from '../lib/logger';

describe('logger', () => {
  let logCalls: string[];
  let errorCalls: string[];
  const originalLog = console.log;
  const originalError = console.error;

  beforeEach(() => {
    logCalls = [];
    errorCalls = [];
    console.log = (...args: unknown[]) => logCalls.push(args.join(' '));
    console.error = (...args: unknown[]) => errorCalls.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  it('info calls console.log', () => {
    logger.info('hello');
    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toContain('hello');
    expect(errorCalls).toHaveLength(0);
  });

  it('warn calls console.log', () => {
    logger.warn('warning msg');
    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toContain('warning msg');
    expect(errorCalls).toHaveLength(0);
  });

  it('debug calls console.log', () => {
    logger.debug('debug msg');
    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toContain('debug msg');
    expect(errorCalls).toHaveLength(0);
  });

  it('error calls console.error', () => {
    logger.error('err msg');
    expect(errorCalls).toHaveLength(1);
    expect(errorCalls[0]).toContain('err msg');
    expect(logCalls).toHaveLength(0);
  });

  it('includes meta in output', () => {
    logger.info('test', { userId: '123' });
    expect(logCalls[0]).toContain('userId');
    expect(logCalls[0]).toContain('123');
  });

  it('dev mode formats as bracketed string', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    logger.info('dev message');
    expect(logCalls[0]).toMatch(/\[.*\] \[INFO\] dev message/);
    process.env.NODE_ENV = original;
  });

  it('production mode formats as JSON', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    logger.info('prod message');
    const parsed = JSON.parse(logCalls[0]);
    expect(parsed.message).toBe('prod message');
    expect(parsed.level).toBe('info');
    expect(parsed.timestamp).toBeDefined();
    process.env.NODE_ENV = original;
  });

  it('production mode includes meta in JSON', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    logger.warn('warn', { key: 'val' });
    const parsed = JSON.parse(logCalls[0]);
    expect(parsed.key).toBe('val');
    process.env.NODE_ENV = original;
  });

  it('dev mode with meta shows JSON after message', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    logger.info('msg', { a: 1 });
    expect(logCalls[0]).toContain('[INFO] msg');
    expect(logCalls[0]).toContain('{"a":1}');
    process.env.NODE_ENV = original;
  });
});
