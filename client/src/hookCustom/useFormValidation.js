import { useState } from "react";

export default function useFormValidation() {
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = (state) => {
        const errors = {};

        if (!state.email) {
            errors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(state.email)) {
            errors.email = "Invalid email format.";
        }

        if (!state.password) {
            errors.password = "Password is required.";
        } else if (state.password.length < 6) {
            errors.password = "Password must be at least 6 characters long.";
        }

        setValidationErrors(errors);
        return errors;
    };

    return { validationErrors, validateForm };
}