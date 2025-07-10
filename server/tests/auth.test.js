const request = require('supertest');
const server = require('../server');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        username: 'johndoe',
        password: 'password123'
      };

      const res = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(userData.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        username: 'johndoe',
        password: 'password123'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
        username: 'janedoe',
        password: 'password123'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      // Then login
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'jane@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(userData.email);
    });
  });
});