import { Link } from "react-router";
import { UserContext } from "../../hookContext/userContext";
import { useContext } from "react";
import './Header.css';

export default function Header() {
    const { email } = useContext(UserContext);

    return (
        <>
            <header>
                {/* <!-- Navigation --> */}
                <h1><Link className="home" to="/">Home</Link></h1>
                <nav>
                    <Link to="/games">All projects</Link>
                    {/* <!-- Logged-in users --> */}
                    {email
                        ? (
                            <div id="user">
                                <Link to="/games/create">Add Project</Link>
                                <Link to="/logout">Logout</Link>
                                <Link>{email}</Link>
                            </div>
                        )
                        : (
                            <div id="guest">
                                <Link to="/login">Login</Link>
                                <Link to="/register">Register</Link>
                            </div>
                        )}
                </nav>
            </header>
        </>
    );
}