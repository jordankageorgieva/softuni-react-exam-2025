
// Get the base URL from the environment variables
const baseURL = `${import.meta.env.VITE_APP_API_URL_DATA}/projects`;
// const baseURL = "http://localhost:3030/data/projects";

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        console.log('result is : ' + result);
        return result;

    },
    async create(gameData, accessToken) {

        const response = await fetch(baseURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorization': accessToken,
                },
                body: JSON.stringify(gameData)
            }
        );

        const result = await response.json();

        return result;

        // return request('POST', URL, gameData);

    },
    async getGame(gameId) {
        const response = await fetch(`${baseURL}/${gameId}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json(); // parse the response body as JSON

        return data;
    },
    async deleteGame(gameId, accessToken) {

        let isUserDelete = false;
        const response = await fetch(
            `${baseURL}/${gameId}`, 
            {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': accessToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        } else {
            isUserDelete = true;
        }

        
        return isUserDelete;
    },
    async updateGame (projectId, formData, accessToken){

        formData._id = projectId;

        const response = await fetch(
            `${baseURL}/${projectId}`, 
            {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': accessToken,
            },
            body: JSON.stringify(formData),
        });

        const resData = await response.json();
        console.log(resData);
        
        return resData;

    }
}