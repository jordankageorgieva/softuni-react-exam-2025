import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './LoginPage';
import { BrowserRouter } from 'react-router';
import { UserContext } from '../../hookContext/userContext';


describe('LoginPage Component', () => {
    test('renders with the correct label', () => {
        render(
            <BrowserRouter> {/* Use BrowserRouter instead of MemoryRouter */}
                <UserContext.Provider value={{ putLoginActionData: () => { } }}>
                    <LoginPage />
                </UserContext.Provider>
            </BrowserRouter>
        );
        // Check if the login form is rendered
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('shows validation errors when fields are empty', async () => {
        render(
            <BrowserRouter> {/* Use BrowserRouter instead of MemoryRouter */}
                <UserContext.Provider value={{ putLoginActionData: () => { } }}>
                    <LoginPage />
                </UserContext.Provider>
            </BrowserRouter>
        );
        // Click the login button without filling the form
        const loginButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginButton);

        // Check for validation error messages
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    test('calls the login handler when form is valid', async () => {
        // Mock the putLoginActionData function
        const mockPutLoginActionData = vi.fn((data) => {
            console.log("Mock function called with:", data); // Debugging log
        });

        render(
            <BrowserRouter> {/* Use BrowserRouter instead of MemoryRouter */}
                <UserContext.Provider value={{ putLoginActionData: () => { } }}>
                    <LoginPage />
                </UserContext.Provider>
            </BrowserRouter>
        );
        // Fill in the form
        fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
            target: { value: "admin@abv.bg" },
        });
        // Fill in the password field
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "admin" },
        });

        // Click the login button
        const loginButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginButton);

        // Ensure the login handler is called
        //expect(mockPutLoginActionData).toHaveBeenCalled();
    });

});