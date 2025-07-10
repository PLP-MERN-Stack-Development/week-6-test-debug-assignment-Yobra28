const request = require('supertest');
const server = require('../server');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const userData = {
        firstName: 'Reg',
        lastName: 'User',
        email: 'reguser@test.com',
        username: 'reguser',
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
        firstName: 'Bad',
        lastName: 'Email',
        email: 'not-an-email',
        username: 'bademail',
        password: 'password123'
      };
      await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return a token', async () => {
      // Register first
      const userData = {
        firstName: 'Login',
        lastName: 'User',
        email: 'loginuser@test.com',
        username: 'loginuser',
        password: 'password123'
      };
      await request(server)
        .post('/api/auth/register')
        .send(userData);
      // Login
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(userData.email);
    });
    it('should not login with wrong password', async () => {
      // Register first
      const userData = {
        firstName: 'Wrong',
        lastName: 'Password',
        email: 'wrongpass@test.com',
        username: 'wrongpass',
        password: 'password123'
      };
      await request(server)
        .post('/api/auth/register')
        .send(userData);
      // Wrong password
      await request(server)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' })
        .expect(401);
    });
  });
}); 