import { useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from '../../hookContext/userContext';

export default function ProtectedRoute({ children }) {
    const { accessToken, putLoginActionData } = useContext(UserContext);

    console.log("ProtectedRoute isAuthenticated: " + accessToken);
    const navigate = useNavigate();
    if (accessToken === undefined) {
        console.log("ProtectedRoute isAuthenticated is undefined: " + accessToken);
    }
    // Check if the user is authenticated, if not redirect to login page
    // If the user is authenticated, render the children components
    // If the user is not authenticated, redirect to the login page
    
    useEffect(() => {
        if (!accessToken) {
            console.log("ProtectedRoute isAuthenticated is undefined: " + accessToken);
            navigate('/login', { replace: true });
        } 
    }, [accessToken, navigate]);

    return accessToken ? children : null;
};