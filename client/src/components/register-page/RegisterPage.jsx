import { useActionState, useContext, useState } from "react";
import { UserContext } from "../../hookContext/userContext";
import { useRegister } from "../../api/authApi";
import { useNavigate, Link } from "react-router";
import './RegisterPage.css';

export default function RegisterPage() {

    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // use Context hook for authenticationn data
    const { putLoginActionData } = useContext(UserContext);

    //useRegister is a custom hook and we use the function register to send the data
    const { register } = useRegister();

    // previusstate can be _ - in JS this value is not nessecary 
    const registerHandler = async (previusstate, formData) => {

        const state = Object.fromEntries(formData);

        const confirm_password = formData.get('confirm-password');

        console.log(confirm_password + ' conf pass');
        console.log(state.password + ' pass');

        if (confirm_password !== state.password) {
            confirm("Passwords are not the same!");
            return;
        }
        try {
            // we use the register function in the costom hook to make a POST request with email + pass and to register the user in the Soft Uni practice server
            const authData = await register(state.email, state.password);

            console.log('Register successful ', authData);
            // Handle successful login (e.g., redirect, update context, etc.)

            // putLoginActionData in Context hook to populate the authentication data
            // we call the authentication handler for loggin
            putLoginActionData(authData);

            navigate("/");


        } catch (error) {
            console.log('Error during registration:', error);
            if (error.message.includes('409')) {
                setError('Email already registered. Please use a different email.');
            } else {
                console.log('Error during registration:', error);
                setError('An error occurred during registration. Please try again.');
            }
        }

    }

    // state can be _  [ in JS underscore _ means that this value is not nessecary]
    const [state, registerAction, isPending] = useActionState(registerHandler, { email: '', password: '' });

    return (
        <>
            {/* <!-- Register Page ( Only for Guest users ) --> */}
            <div className="register-form">
                <form id="register" action={registerAction}>
                    <div className="container">
                        <div className="brand-logo"></div>
                        <h1>Register</h1>

                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" placeholder="maria@email.com" autoComplete="email" />

                        <label htmlFor="pass">Password:</label>
                        <input type="password" name="password" id="register-password" autoComplete="password" />

                        <label htmlFor="con-pass">Confirm Password:</label>
                        <input type="password" name="confirm-password" id="confirm-password" autoComplete="confirm-password" />

                        <input className="btn submit" type="submit" value="Register" />

                        <p className="field">
                            <span>If you already have profile click <Link to="/login">here</Link></span>
                        </p>
                    </div>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </>
    );
}