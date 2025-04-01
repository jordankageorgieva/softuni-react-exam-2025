import { useEffect, useRef } from "react";

// Get the base URL from the environment variables
const baseURL = `${import.meta.env.VITE_APP_SERVER_URL}/users/`;
// const baseURL = "http://localhost:3030/users/";

export const useLogin = () => {
    const loginURL = `${baseURL}login`;

    // Initialize the AbortController
    const abortRef = useRef(new AbortController);

    const login = async (email, password) => {
        let resData = null;
        try {
            const formData = { email: email, password: password };

            const response = await fetch(
                `${loginURL}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    signal: abortRef.current.signal,
                });

            if (response.status === 403) {
                throw new Error("Forbidden: Incorrect email or password.");
            }

            const resData = await response.json();
            console.log("resData " + JSON.stringify(resData));

            return resData;
        } catch (error) {
            console.log("Login error: ", error);
            throw error;
        }
    }

    useEffect(() => {
        const abortController = abortRef.current;

        // Cleanup function to abort fetch on unmount
        return () => abortController.abort;
    }, []);

    return {
        login
    };
}

export const useRegister = () => {
    const registerURL = `${baseURL}register`;


    const register = async (email, password) => {

        const formData = { email: email, password: password };
        let resData = null;
        const response = await fetch(
            `${registerURL}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                // signal: abortRef.current.signal,
            });

        if (response.status !== 200) {            
                throw Error( "Error: " + response.status);
            
        }

        resData = await response.json();
        console.log("resData " + JSON.stringify(resData));

        return resData;
    }

    return {
        register
    };
}

export const useLogout = () => {
    const logoutURL = `${baseURL}logout`;

    const logout = async (accessToken) => {

        const response = await fetch(
            `${logoutURL}`,
            {
                method: 'GET',
                headers: {
                    'X-Authorization': accessToken
                },
                // signal: abortRef.current.signal,
            });
    }

    return {
        logout
    };
}