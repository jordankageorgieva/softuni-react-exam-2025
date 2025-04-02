import { useActionState, useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLogin } from "../../api/authApi";
import { UserContext } from "../../hookContext/userContext";
import './LoginForm.css';
import { Button} from 'antd';

export default function LoginPage() {

    const [error, setError] = useState(null);

    const navigate = useNavigate();
    // use Context hook for authenticationn data
    const { putLoginActionData } = useContext(UserContext);

    //useLogin is a custom hook and we use the function login to send the data
    const { login } = useLogin();

    // previusstate can be _ - in JS this value is not nessecary 
    const loginHandler = async (previusstate, formData) => {

        const state = Object.fromEntries(formData);

        try {
            // we use the login function in the costom hook to make a POST request with email + pass
            const authData = await login(state.email, state.password);
            console.log('Login successful:', authData);
            // Handle successful login (e.g., redirect, update context, etc.)

            // putLoginActionData in Context hook to populate the authentication data
            // we call the authentication handler for loggin
            putLoginActionData(authData);

            navigate("/projects");

        } catch (error) {
            console.error('Error during login:', error);
    
            // Handle specific error messages
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


    }

    // state can be _  [ in JS underscore _ means that this value is not nessecary]
    const [state, loginAction, isPending] = useActionState(loginHandler, { email: '', password: '' });


    return (
        <>
            {/* <!-- Login Page ( Only for Guest users ) --> */}
            <div className="login-form">
                <form id="login" action={loginAction}>
                    <div className="container">
                        <div className="brand-logo"></div>
                        <h1>Login</h1>
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" placeholder="Sokka@gmail.com" autoComplete="email" />
                        <label htmlFor="login-pass">Password:</label>
                        <input type="password" id="login-password" name="password" fdprocessedid="45q4he" autoComplete="password" />
                        {/* <input type="submit" className="btn submit" value="Login" disabled={isPending} /> */}
                        <Button htmlType="submit" type="primary" className="btn submit" disabled={isPending}>Login</Button>
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