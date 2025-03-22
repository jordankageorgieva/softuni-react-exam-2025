import { useActionState, useContext } from "react";
import { UserContext } from "../../hookContext/userContext";
import { useRegister } from "../../api/authApi";
import { useNavigate } from "react-router";

export default function RegisterPage() {

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

            if ( confirm_password !== state.password ){
                confirm("Passwords are not the same!");
                return;
            }
    
            // we use the register function in the costom hook to make a POST request with email + pass and to register the user in the Soft Uni practice server
            const authData = await register(state.email, state.password);
    
            // putLoginActionData in Context hook to populate the authentication data
            // we call the authentication handler for loggin
            putLoginActionData(authData);
    
            navigate("/");
        }
    
        // state can be _  [ in JS underscore _ means that this value is not nessecary]
        const [state, registerAction, isPending] = useActionState(registerHandler, { email: '', password: '' });

    return (
        <>
            {/* <!-- Register Page ( Only for Guest users ) --> */}
            <section id="register-page" className="content auth">
                <form id="register" action={registerAction}>
                    <div className="container">
                        <div className="brand-logo"></div>
                        <h1>Register</h1>

                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" placeholder="maria@email.com" autoComplete="email" />

                        <label htmlFor="pass">Password:</label>
                        <input type="password" name="password" id="register-password"  autoComplete="password"/>

                        <label htmlFor="con-pass">Confirm Password:</label>
                        <input type="password" name="confirm-password" id="confirm-password" autoComplete="confirm-password"/>

                        <input className="btn submit" type="submit" value="Register" />

                        <p className="field">
                            <span>If you already have profile click <a href="#">here</a></span>
                        </p>
                    </div>
                </form>
            </section>
        </>
    );
}