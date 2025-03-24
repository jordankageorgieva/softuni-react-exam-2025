import { useContext, useEffect, useState } from "react";
import { useLogout } from "../../api/authApi";
import { UserContext } from "../../hookContext/userContext";
import { useNavigate } from "react-router";

export default function LogoutPage() {
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    //useLogout is a custom hook and we use the function login to send the data
    const { logout } = useLogout();

    const { accessToken, putLoginActionData } = useContext(UserContext);

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await logout(accessToken);
                // set data to empty object after logout
                putLoginActionData({});
                navigate('/');
            } catch (error) {
                setError('Logout error:', error);
            }
        };

        handleLogout();
    }, [accessToken]);

    return (
        <>
            <section id="login-page" className="auth">
                <form id="login" >
                    <div className="container">
                        <h2 style={{ color: 'white' }}>Logging out...</h2>
                    </div>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </section>
        </>
    );
}