import { useActionState, useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useLogin } from "../../api/authApi";
import { UserContext } from "../../hookContext/userContext";
import useFormValidation from "../../hookCustom/useFormValidation"; // Import the custom hook
import './LoginForm.css';
import { Button } from 'antd';

export default function LoginPage() {
    const [error, setError] = useState(null);
    const { validationErrors, validateForm } = useFormValidation(); // Use data validation

    const navigate = useNavigate();
    const location = useLocation();
    console.log("PrivateRoute location Login:", location);

    const from = location.state?.from?.pathname || "/";

    const { putLoginActionData } = useContext(UserContext);
    const { login } = useLogin();

    const loginHandler = async (previusstate, formData) => {
        const state = Object.fromEntries(formData);

        // Validate the form
        const errors = validateForm(state);
        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const authData = await login(state.email, state.password);
            console.log('Login successful:', authData);

            putLoginActionData(authData);
            navigate(from, { replace: true }); // go back to the originally requested page
        } catch (error) {
            console.error('Error during login:', error);

            if (error.message.includes('401')) {
                setError('Invalid email or password. Please try again.');
            } else if (error.message.includes('403')) {
                setError('Your account is not authorized. Please contact support.');
            } else if (error.message.includes('500')) {
                setError('Server error. Please try again later.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };

    const [state, loginAction, isPending] = useActionState(loginHandler, { email: '', password: '' });

    return (
        <>
            <div className="login-form">
                <form id="login" action={loginAction}>
                    <div className="container">
                        <div className="brand-logo"></div>
                        <h1>Login Form</h1>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Sokka@gmail.com"
                            autoComplete="email"
                        />
                        {validationErrors.email && <p style={{ color: 'red' }}>{validationErrors.email}</p>}

                        <label htmlFor="login-password">Password:</label>
                        <input
                            type="password"
                            id="login-password"
                            name="password"
                            autoComplete="password"
                        />
                        {validationErrors.password && <p style={{ color: 'red' }}>{validationErrors.password}</p>}

                        <Button htmlType="submit" type="primary" className="btn submit" disabled={isPending}>
                            Login
                        </Button>
                        <p className="field">
                            <span>If you don't have profile click <Link to="/register">here</Link></span>
                        </p>
                    </div>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </>
    );
}