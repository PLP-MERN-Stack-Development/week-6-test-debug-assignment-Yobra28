import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Books from '../pages/Books';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the books API
vi.mock('../services/api', () => ({
  booksAPI: {
    getBooks: vi.fn(),
    createBook: vi.fn()
  }
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { role: 'admin' },
    isAdmin: true
  })
}));

const BooksWithProviders = () => (
  <BrowserRouter>
    <Books />
  </BrowserRouter>
);

describe('Books Component', () => {
  it('renders books list', async () => {
    const { booksAPI } = await import('../services/api');
    booksAPI.getBooks.mockResolvedValue({
      data: {
        books: [
          {
            _id: '1',
            title: 'Test Book',
            author: 'Test Author',
            genre: 'Fiction',
            availability: { availableCopies: 3, totalCopies: 5 }
          }
        ],
        totalPages: 1
      }
    });

    render(<BooksWithProviders />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
    });
  });

  it('shows add book button for admin', () => {
    render(<BooksWithProviders />);
    
    expect(screen.getByText('Add Book')).toBeInTheDocument();
  });
});