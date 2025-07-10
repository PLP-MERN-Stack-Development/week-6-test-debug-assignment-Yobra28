import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as api from '../../services/api';
import { vi } from 'vitest';

// Mock the login API
vi.spyOn(api, 'login').mockImplementation(async (data) => {
  if (data.email === 'user@test.com' && data.password === 'password123') {
    return { token: 'mocktoken', email: 'user@test.com', role: 'user' };
  }
  throw new Error('Invalid credentials');
});

describe('Login Integration Flow', () => {
  it('should log in and redirect to dashboard/profile', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Go to login page if not already there
    if (!screen.queryByLabelText(/email/i)) {
      const loginLink = screen.getByRole('link', { name: /login/i });
      fireEvent.click(loginLink);
    }

    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for redirect to dashboard/profile
    await waitFor(() => {
      expect(
        screen.getByText(/dashboard|profile/i)
      ).toBeInTheDocument();
    });
  });
}); 