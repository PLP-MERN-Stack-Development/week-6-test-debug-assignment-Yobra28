import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as api from '../../services/api';
import { vi } from 'vitest';

vi.spyOn(api, 'login').mockResolvedValue({ token: 'mocktoken', email: 'user@test.com', role: 'user' });
vi.spyOn(api, 'getProfile').mockResolvedValue({ firstName: 'Test', lastName: 'User', email: 'user@test.com' });
vi.spyOn(api, 'updateProfile').mockImplementation(async (data) => {
  if (data.firstName === 'Updated') return { ...data, email: 'user@test.com' };
  throw new Error('Update failed');
});

describe('Profile Update Integration Flow', () => {
  it('should allow user to update profile and see success', async () => {
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

    // Wait for profile page link
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    // Navigate to profile
    fireEvent.click(screen.getByText(/profile/i));

    // Wait for profile form
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update first name
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/success|updated/i)).toBeInTheDocument();
    });
  });
}); 