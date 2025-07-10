import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as api from '../../services/api';
import { vi } from 'vitest';

const mockBooks = [
  {
    _id: '1',
    title: 'Test Book',
    author: 'Author',
    genre: 'Fiction',
    availability: { availableCopies: 2 },
  },
];

vi.spyOn(api, 'getBooks').mockResolvedValue({ books: mockBooks });
vi.spyOn(api, 'requestBook').mockImplementation(async (bookId) => {
  if (bookId === '1') return { message: 'Request successful' };
  throw new Error('Request failed');
});
vi.spyOn(api, 'login').mockResolvedValue({ token: 'mocktoken', email: 'user@test.com', role: 'user' });

describe('Book Request Integration Flow', () => {
  it('should allow user to request a book and see confirmation', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Log in
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for books page
    await waitFor(() => {
      expect(screen.getByText(/test book/i)).toBeInTheDocument();
    });

    // Click request button
    fireEvent.click(screen.getByRole('button', { name: /request/i }));

    // Wait for confirmation
    await waitFor(() => {
      expect(screen.getByText(/request successful/i)).toBeInTheDocument();
    });
  });
}); 