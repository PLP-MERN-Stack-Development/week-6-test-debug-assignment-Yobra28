const request = require('supertest');
const server = require('../server');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

describe('Users Endpoints', () => {
  let adminToken, userToken, adminUser, regularUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin3@test.com',
      username: 'admin3',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user3@test.com',
      username: 'user3',
      password: 'password123',
      role: 'user'
    });
    userToken = generateToken(regularUser._id);
  });

  describe('GET /api/users/profile', () => {
    it('should get the profile for the logged-in user', async () => {
      const res = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body.email).toBe(regularUser.email);
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
    it('should not allow regular user to get all users', async () => {
      await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update the profile for the logged-in user', async () => {
      const res = await request(server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Updated', lastName: 'User' })
        .expect(200);
      expect(res.body.firstName).toBe('Updated');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow admin to get a user by id', async () => {
      const res = await request(server)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.user.email).toBe(regularUser.email);
    });
    it('should not allow non-admin to get another user', async () => {
      await request(server)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow admin to update a user', async () => {
      const res = await request(server)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'AdminUpdated' })
        .expect(200);
      expect(res.body.firstName).toBe('AdminUpdated');
    });
    it('should not allow non-admin to update another user', async () => {
      await request(server)
        .put(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'ShouldNotWork' })
        .expect(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to delete a user', async () => {
      await request(server)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    it('should not allow non-admin to delete another user', async () => {
      await request(server)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/users/dashboard/stats', () => {
    it('should allow admin to get dashboard stats', async () => {
      const res = await request(server)
        .get('/api/users/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('totalUsers');
    });
    it('should not allow non-admin to get dashboard stats', async () => {
      await request(server)
        .get('/api/users/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/users/transactions', () => {
    it('should get the logged-in user\'s transactions', async () => {
      const res = await request(server)
        .get('/api/users/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
}); 