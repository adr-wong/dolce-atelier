import { getApiUrl } from '@/lib/get-api-url';

describe('getApiUrl (client environment)', () => {
  it('should return empty string when window exists', () => {
    expect(getApiUrl()).toBe('');
  });
});
