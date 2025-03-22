export const request = async (method, URL, data = {}) => {
    let option = {};
    let response = {};
    if (method !== "GET") {
        option = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

        response = await fetch(URL, option);
    } else {
        response = await fetch(URL);
    }
    const result = await response.json();

    return result;
};