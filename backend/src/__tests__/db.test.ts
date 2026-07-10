import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { connectDB } from '../lib/db';

describe('connectDB', () => {
  const originalUri = process.env.MONGODB_URI;

  afterEach(() => {
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
  });

  it('throws when MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow(/MONGODB_URI/);
  });

  it('throws when MONGODB_URI is an empty string', async () => {
    process.env.MONGODB_URI = '';
    await expect(connectDB()).rejects.toThrow(/MONGODB_URI/);
  });
});
