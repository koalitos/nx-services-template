import axios from 'axios';

describe('GET /api/health', () => {
  const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

  it('should return a healthy payload', async () => {
    const res = await axios.get(`${baseUrl}/api/health`);

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
    expect(res.data.service).toBe('template-supa');
  });
});
