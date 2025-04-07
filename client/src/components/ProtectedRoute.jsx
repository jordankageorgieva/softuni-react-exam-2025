import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../hookContext/userContext';

export default function ProtectedRoute({ children }) {
    const { accessToken, putLoginActionData } = useContext(UserContext);

    console.log("ProtectedRoute isAuthenticated: " + accessToken);
   
    // Check if the user is authenticated, if not redirect to login page
    // If the user is authenticated, render the children components
    // and pass the authentication data to the children components
    return accessToken ? children :  <Navigate to="/login" replace />;
};