import request from 'supertest';
import app from '../backend/server.js';

describe('API', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /projects filtered by skill', async () => {
    const res = await request(app).get('/projects').query({ skill: 'JavaScript', limit: 5 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /profile returns seeded data', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(200);
    expect(res.body.name).toBeTruthy();
    expect(Array.isArray(res.body.projects)).toBe(true);
  });
});
