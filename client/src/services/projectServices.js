import { openDB } from "idb";

const DB_NAME = "imageDB";
const baseURL = `${import.meta.env.VITE_APP_API_URL_DATA}/projects`;

async function getImageFromIndexedDB(project) {
    const STORE_NAME = `image${project._id}`;

    try {
        const db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });

        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const storedImage = await store.get("uploadedImage");

        if (storedImage) {
            project.imageUrl = storedImage;
        } else {
            console.warn(`No image in IndexedDB for project ID: ${project._id}`);
        }
    } catch (error) {
        console.error(`IndexedDB error for project ID: ${project._id}`, error);
    }
}

async function fetchWithAuth(url, method, data, token) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'X-Authorization': token }),
        },
        ...(data && { body: JSON.stringify(data) }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.statusText}`);
    }

    return await response.json();
}

const projectServices ={
    async getAll() {
        const response = await fetch(baseURL);
        const data = await response.json();
        const result = Object.values(data);

        // Load images from IndexedDB (optional)
        // for (const project of result) {
        //     await getImageFromIndexedDB(project);
        // }

        console.log('Projects:', result);
        return result;
    },

    async create(projectData, accessToken) {
        return await fetchWithAuth(baseURL, 'POST', projectData, accessToken);
    },

    async getProject(projectId) {
        const response = await fetch(`${baseURL}/${projectId}`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    },

    async deleteProject(projectId, accessToken) {
        await fetchWithAuth(`${baseURL}/${projectId}`, 'DELETE', null, accessToken);
        return true;
    },

    async updateProject(projectId, formData, accessToken) {
        return await fetchWithAuth(`${baseURL}/${projectId}`, 'PUT', { ...formData, _id: projectId }, accessToken);
    },
};

export default projectServices;
