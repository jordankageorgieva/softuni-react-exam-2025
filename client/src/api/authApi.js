import { useEffect, useRef } from "react";

const baseURL = "http://localhost:3030/users/";


export const useLogin = () => {
    const loginURL = `${baseURL}login`;

    // Initialize the AbortController
    const abortRef = useRef(new AbortController);

    const login = async (email, password) => {

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

        const resData = await response.json();
        console.log("resData " + JSON.stringify(resData));

        return resData;
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
    }

    return {
        register
    };

}