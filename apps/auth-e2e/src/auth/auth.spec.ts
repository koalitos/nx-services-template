import axios from 'axios';

describe('GET /auth/health', () => {
  const baseUrl = process.env.AUTH_E2E_BASE_URL ?? 'http://localhost:3001';

  it('should return a healthy payload', async () => {
    const res = await axios.get(`${baseUrl}/auth/health`);

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.service).toBe('auth-service');
  });
});
