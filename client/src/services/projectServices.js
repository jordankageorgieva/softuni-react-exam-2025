
// Get the base URL from the environment variables
const baseURL = `${import.meta.env.VITE_APP_API_URL_DATA}/projects`;
// const baseURL = "http://localhost:3030/data/projects";

import { openDB } from "idb"; // Import IndexedDB helper

const DB_NAME = "imageDB";

async function get_Image_IndexedDB(project) {
    const STORE_NAME = `image${project._id}`; // Use project ID as the store name

    let storedImage = null; // Initialize variable to store the retrieved image
    try {
        // Open the IndexedDB database
        const db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME); // Create object store if it doesn't exist
                    // Retrieve the stored image
                    storedImage = db.get(STORE_NAME, "uploadedImage");
                }
            },
        });

        

        if (storedImage) {
            project.imageUrl = storedImage; // Assign the stored image to the project
        } else {
            console.warn(`No image found in IndexedDB for project ID: ${project._id}`);
        }
    } catch (error) {
        console.error(`Error retrieving image from IndexedDB for project ID: ${project._id}`, error);
    }
}

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        // Retrieve images from IndexedDB for each project
        for (let i = 0; i < result.length; i++) {
            const project = result[i];
            await get_Image_IndexedDB(project); // Load images from IndexedDB
        }

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