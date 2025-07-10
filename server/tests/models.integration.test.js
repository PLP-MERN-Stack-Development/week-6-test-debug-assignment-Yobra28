const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

describe('Model Integration', () => {
  let adminUser;

  beforeAll(async () => {
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'adminmodel@test.com',
      username: 'adminmodel',
      password: 'password123',
      role: 'admin'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Book Model', () => {
    it('should not save a book without a title', async () => {
      const book = new Book({ author: 'No Title', genre: 'Fiction', availability: { totalCopies: 1, availableCopies: 1 }, addedBy: adminUser._id });
      let error;
      try {
        await book.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it('should not allow duplicate ISBN', async () => {
      const book1 = new Book({ title: 'Book1', author: 'A', isbn: 'uniqueisbn', genre: 'Fiction', availability: { totalCopies: 1, availableCopies: 1 }, addedBy: adminUser._id });
      const book2 = new Book({ title: 'Book2', author: 'B', isbn: 'uniqueisbn', genre: 'Fiction', availability: { totalCopies: 1, availableCopies: 1 }, addedBy: adminUser._id });
      await book1.save();
      let error;
      try {
        await book2.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });

  describe('User Model', () => {
    it('should not save a user without an email', async () => {
      const user = new User({ username: 'noemail', password: 'password123' });
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it('should hash password before saving', async () => {
      const user = new User({ firstName: 'Test', lastName: 'User', email: 'modeluser@test.com', username: 'modeluser', password: 'plainpass' });
      await user.save();
      expect(user.password).not.toBe('plainpass');
    });
  });

  describe('Transaction Model', () => {
    it('should not save a transaction without a user', async () => {
      const tx = new Transaction({ book: new mongoose.Types.ObjectId(), type: 'issue', status: 'pending' });
      let error;
      try {
        await tx.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
    it('should not save a transaction without a book', async () => {
      const user = new User({ firstName: 'T', lastName: 'X', email: 'txuser@test.com', username: 'txuser', password: 'password123' });
      await user.save();
      const tx = new Transaction({ user: user._id, type: 'issue', status: 'pending' });
      let error;
      try {
        await tx.save();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
}); 