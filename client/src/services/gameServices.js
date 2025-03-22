import { request } from "../utils/register";

const baseURL = "http://localhost:3030/jsonstore/games";

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        console.log('result is : ' + result);
        return result;

    },
    async create(gameData) {
        const response = await fetch(baseURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
    async deleteGame(gameId) {

        let isUserDelete = false;
        const response = await fetch(
            `${baseURL}/${gameId}`, 
            {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        } else {
            isUserDelete = true;
        }

        
        return isUserDelete;
    },
    async updateGame (gameId, formData){

        formData._id = gameId;

        const response = await fetch(
            `${baseURL}/${gameId}`, 
            {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });

        const resData = await response.json();
        console.log(resData);
        
        return resData;

    }
}