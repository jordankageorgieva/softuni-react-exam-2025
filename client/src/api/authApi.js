import { useEffect, useRef } from "react";

// Get the base URL from the environment variables
const baseURL = `${import.meta.env.VITE_APP_SERVER_URL}/users/`;

export const useLogin = () => {
    const loginURL = `${baseURL}login`;

    // Initialize the AbortController
    const abortRef = useRef(new AbortController);

    const login = async (email, password) => {
        // Ако има предишна заявка – прекъсваме я
        abortRef.current?.abort();

        // Създаваме нов AbortController за тази заявка
        abortRef.current = new AbortController();

        try {
            const formData = { email, password };

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
            console.log("resData", JSON.stringify(resData));

            return resData;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    // Прекъсваме само ако компонентът се unmount-не
    useEffect(() => {
        const abortController = abortRef.current;

        // Cleanup function to abort fetch on unmount
        return () => abortController.abort();
    }, []);

    return {
        login
    };
};

export const useRegister = () => {
    const registerURL = `${baseURL}register`;

    const register = async (email, password) => {
        try {
            const formData = { email, password };

            const response = await fetch(
                registerURL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                });

            if (response.status !== 200) {
                throw new Error(`Error: ${response.status}`);
            }

            const resData = await response.json();
            console.log("resData", JSON.stringify(resData));

            return resData;
        } catch (error) {
            console.error("Register error:", error);
            throw error;
        }
    };

    return {
        register
    };
};

export const useLogout = () => {
    const logoutURL = `${baseURL}logout`;

    const logout = async (accessToken) => {

        // Създаваме нов AbortController за тази заявка
        const controller = new AbortController();

        try {
            const response = await fetch(
                logoutURL,
                {
                    method: 'POST',
                    headers: {
                        'X-Authorization': accessToken,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal
                });

            if (!response.ok) {
                throw new Error(`Logout failed with status: ${response.status}`);
            }

            console.log("Logout successful");
            // важно: изчистваме локално
            localStorage.removeItem("accessToken");

        } catch (error) {

            if (error.name === "AbortError") {
                console.log("Logout aborted");
            } else {
                console.error("Logout error:", error);
            }

            throw error;
        }
    };

    return {
        logout
    };
};