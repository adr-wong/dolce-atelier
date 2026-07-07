/**
 * @jest-environment node
 */
import { getApiUrl } from '@/lib/get-api-url';

describe('getApiUrl (server environment)', () => {
  const savedEnv = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = savedEnv;
    }
  });

  it('should return env var when on server (no window)', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://backend:3001';
    expect(getApiUrl()).toBe('http://backend:3001');
  });

  it('should return default localhost when env var is missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiUrl()).toBe('http://localhost:3001');
  });
});
