const request = require('supertest');
const server = require('../server');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

describe('Auth Middleware Integration', () => {
  let adminToken, userToken, adminUser, regularUser;

  beforeEach(async () => {
    adminUser = await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin5@test.com', username: 'admin5', password: 'password123', role: 'admin'
    });
    adminToken = generateToken(adminUser._id);
    regularUser = await User.create({
      firstName: 'Regular', lastName: 'User', email: 'user5@test.com', username: 'user5', password: 'password123', role: 'user'
    });
    userToken = generateToken(regularUser._id);
  });

  it('should reject requests without a token', async () => {
    await request(server)
      .get('/api/users/profile')
      .expect(401);
  });

  it('should reject requests with an invalid token', async () => {
    await request(server)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });

  it('should allow access to protected endpoint with valid token', async () => {
    await request(server)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('should reject non-admin user from admin-only endpoint', async () => {
    await request(server)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should allow admin user to access admin-only endpoint', async () => {
    await request(server)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
}); 