const request = require('supertest');
const server = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../middleware/auth');

describe('Transactions Endpoints', () => {
  let adminToken, userToken, adminUser, regularUser, book;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin2@test.com',
      username: 'admin2',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user2@test.com',
      username: 'user2',
      password: 'password123',
      role: 'user'
    });
    userToken = generateToken(regularUser._id);

    // Create a book
    book = await Book.create({
      title: 'Integration Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      isbn: '9876543210',
      availability: {
        totalCopies: 3,
        availableCopies: 3
      },
      isActive: true,
      addedBy: adminUser._id
    });
  });

  describe('GET /api/transactions', () => {
    it('should get all transactions for admin', async () => {
      const res = await request(server)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
    it('should get user\'s own transactions for regular user', async () => {
      const res = await request(server)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
  });

  describe('POST /api/transactions/request', () => {
    it('should allow user to request a book', async () => {
      const res = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id })
        .expect(201);
      expect(res.body.book._id).toBe(book._id.toString());
      expect(res.body.user._id).toBe(regularUser._id.toString());
    });
    it('should not allow request for unavailable book', async () => {
      await Book.findByIdAndUpdate(book._id, { isActive: false });
      await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id })
        .expect(400);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get a transaction by id for the owner', async () => {
      // User requests a book
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      // User fetches their transaction
      const res = await request(server)
        .get(`/api/transactions/${transaction._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body._id).toBe(transaction._id);
    });
    it('should not allow another user to get the transaction', async () => {
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      // Admin can get any transaction
      await request(server)
        .get(`/api/transactions/${transaction._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      // New user cannot get another user's transaction
      const otherUser = await User.create({
        firstName: 'Other', lastName: 'User', email: 'other@test.com', username: 'other', password: 'password123', role: 'user'
      });
      const otherToken = generateToken(otherUser._id);
      await request(server)
        .get(`/api/transactions/${transaction._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/transactions/:id/status', () => {
    it('should allow admin to approve a pending transaction', async () => {
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      const res = await request(server)
        .put(`/api/transactions/${transaction._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);
      expect(res.body.status).toBe('approved');
    });
    it('should not allow non-admin to approve a transaction', async () => {
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      await request(server)
        .put(`/api/transactions/${transaction._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'approved' })
        .expect(403);
    });
  });

  describe('POST /api/transactions/return', () => {
    it('should allow user to return a book', async () => {
      // Request and approve a book
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      await request(server)
        .put(`/api/transactions/${transaction._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      // User returns the book
      const res = await request(server)
        .post('/api/transactions/return')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id })
        .expect(201);
      expect(res.body.type).toBe('return');
      expect(res.body.user._id).toBe(regularUser._id.toString());
    });
  });

  describe('PUT /api/transactions/:id/complete', () => {
    it('should allow admin to complete a return transaction', async () => {
      // Request and approve a book
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      await request(server)
        .put(`/api/transactions/${transaction._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      // User returns the book
      const { body: returnTx } = await request(server)
        .post('/api/transactions/return')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      // Admin approves the return transaction
      await request(server)
        .put(`/api/transactions/${returnTx._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      // Admin completes the return
      const res = await request(server)
        .put(`/api/transactions/${returnTx._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.transaction.status).toBe('completed');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should allow admin to delete a transaction', async () => {
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      await request(server)
        .delete(`/api/transactions/${transaction._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    it('should not allow non-admin to delete a transaction', async () => {
      const { body: transaction } = await request(server)
        .post('/api/transactions/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: book._id });
      await request(server)
        .delete(`/api/transactions/${transaction._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
}); 