const request = require('supertest');
const server = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../middleware/auth');

describe('Books Endpoints', () => {
  let adminToken, userToken, adminUser, regularUser, book;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin4@test.com',
      username: 'admin4',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user4@test.com',
      username: 'user4',
      password: 'password123',
      role: 'user'
    });
    userToken = generateToken(regularUser._id);

    // Create a book
    book = await Book.create({
      title: 'Book Test',
      author: 'Book Author',
      genre: 'Fiction',
      isbn: '1111111111',
      availability: {
        totalCopies: 2,
        availableCopies: 2
      },
      isActive: true,
      addedBy: adminUser._id
    });
  });

  describe('GET /api/books', () => {
    it('should get all books for authenticated user', async () => {
      const res = await request(server)
        .get('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body.books)).toBe(true);
    });
  });

  describe('POST /api/books', () => {
    it('should allow admin to create a book', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        genre: 'Nonfiction',
        isbn: '2222222222',
        availability: {
          totalCopies: 1,
          availableCopies: 1
        }
      };
      const res = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);
      expect(res.body.title).toBe(bookData.title);
    });
    it('should not allow regular user to create a book', async () => {
      await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Should Fail', author: 'Nope' })
        .expect(403);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should allow admin to update a book', async () => {
      const res = await request(server)
        .put(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);
      expect(res.body.title).toBe('Updated Title');
    });
    it('should not allow regular user to update a book', async () => {
      await request(server)
        .put(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Should Not Work' })
        .expect(403);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should allow admin to delete a book', async () => {
      await request(server)
        .delete(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    it('should not allow regular user to delete a book', async () => {
      await request(server)
        .delete(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should get a book by id for authenticated user', async () => {
      const res = await request(server)
        .get(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body._id).toBe(book._id.toString());
    });
    it('should return 404 for non-existent book', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(server)
        .get(`/api/books/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});