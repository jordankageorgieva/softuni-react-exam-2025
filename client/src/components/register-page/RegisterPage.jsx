import { useActionState, useContext, useState } from "react";
import { UserContext } from "../../hookContext/userContext";
import { useRegister } from "../../api/authApi";
import { useNavigate, Link } from "react-router";
import './RegisterPage.css';
import { Button } from 'antd';
import useFormValidation from "../../hookCustom/useFormValidation"; // Import the custom hook

export default function RegisterPage() {
    const [error, setError] = useState(null);
    const { validationErrors, validateForm } = useFormValidation(); // Use the custom hook for validation
    const navigate = useNavigate();
    const { putLoginActionData } = useContext(UserContext);
    const { register } = useRegister();

    const registerHandler = async (previusstate, formData) => {
        const state = Object.fromEntries(formData);
        const confirmPassword = formData.get('confirm-password');

        // Validate the form
        const errors = validateForm(state);
        if (!state.password || state.password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(errors).length > 0) {
            setError(null); // Clear any previous error
            return;
        }

        try {
            // Register the user
            const authData = await register(state.email, state.password);
            console.log('Register successful:', authData);

            // Update context with authentication data
            putLoginActionData(authData);

            // Redirect to the home page
            navigate("/");
        } catch (error) {
            console.error('Error during registration:', error);
            if (error.message.includes('409')) {
                setError('Email already registered. Please use a different email.');
            } else {
                setError('An error occurred during registration. Please try again.');
            }
        }
    };

    const [state, registerAction, isPending] = useActionState(registerHandler, { email: '', password: '' });

    return (
        <>
            {/* <!-- Register Page (Only for Guest users) --> */}
            <div className="register-form">
                <form id="register" action={registerAction}>
                    <div className="container">
                        <div className="brand-logo"></div>
                        <h1>Register Form</h1>

                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="maria@email.com"
                            autoComplete="email"
                        />
                        {validationErrors.email && <p style={{ color: 'red' }}>{validationErrors.email}</p>}

                        <label htmlFor="pass">Password:</label>
                        <input
                            type="password"
                            name="password"
                            id="register-password"
                            autoComplete="password"
                        />
                        {validationErrors.password && <p style={{ color: 'red' }}>{validationErrors.password}</p>}

                        <label htmlFor="con-pass">Confirm Password:</label>
                        <input
                            type="password"
                            name="confirm-password"
                            id="confirm-password"
                            autoComplete="confirm-password"
                        />
                        {validationErrors.confirmPassword && (
                            <p style={{ color: 'red' }}>{validationErrors.confirmPassword}</p>
                        )}

                        <Button htmlType="submit" type="primary" className="btn submit" disabled={isPending}>
                            Register
                        </Button>

                        <p className="field">
                            <span>If you already have a profile, click <Link to="/login">here</Link></span>
                        </p>
                    </div>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </>
    );
}