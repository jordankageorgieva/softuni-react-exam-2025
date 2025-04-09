import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { BrowserRouter } from 'react-router';
import { UserContext } from '../../hookContext/userContext';

describe('RegisterPage Component', () => {
    test('renders with the correct label', () => {
        render(
            <BrowserRouter> {/* Use BrowserRouter instead of MemoryRouter */}
                <UserContext.Provider value={{ putLoginActionData: () => { } }}>
                    <RegisterPage />
                </UserContext.Provider>
            </BrowserRouter>
        );
        // Check if the login form is rendered
        expect(screen.getByText('Register')).toBeInTheDocument();
    });

});
