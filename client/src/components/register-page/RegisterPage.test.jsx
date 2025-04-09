import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { BrowserRouter } from 'react-router';
import { UserContext } from '../../hookContext/userContext';

describe('RegisterPage Component', () => {
    test('renders the registration form', () => {
        render(
            <BrowserRouter>
                <UserContext.Provider value={{}}>
                    <RegisterPage />
                </UserContext.Provider>
            </BrowserRouter>
        );

        // Check if the form elements are rendered
        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
});
