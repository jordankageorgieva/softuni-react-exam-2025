import { useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../hookContext/userContext';

export default function AuthGuard({ children }) {
    const { accessToken, putLoginActionData } = useContext(UserContext);

    console.log("AuthGuard isAuthenticated: " + accessToken);
    console.log("AuthGuard putLoginActionData: " + putLoginActionData);
    const navigate = useNavigate();
    const location = useLocation();
    if (accessToken === undefined) {
        console.log("AuthGuard isAuthenticated is undefined: " + accessToken);
    }
    // Check if the user is authenticated, if not redirect to login page
    // If the user is authenticated, render the children components
    // If the user is not authenticated, redirect to the login page
    
    useEffect(() => {
        if (!accessToken) {
            console.log("AuthGuard isAuthenticated is undefined: " + accessToken);
            navigate("/login", { state: { from: location }, replace: true });
        } 
    }, [accessToken, navigate, location]);

    return accessToken ? children : null;
};