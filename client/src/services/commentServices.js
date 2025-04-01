// Get the base URL from the environment variables
const baseURL = `${import.meta.env.VITE_APP_API_URL_JSONSTORE}/comment`;
// const baseURL = "http://localhost:3030/data/comment";

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        console.log('result is : ' + result);
        return result;

    },
    async create(data, projectId) {

        const commentData = {
            projectId: projectId,
            data,
            createdAt: new Date().toISOString()
        };

        const response = await fetch(baseURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData)
            }
        );

        const result = await response.json();

        return result;

        // return request('POST', URL, gameData);

    },
    async getCommentForGameId(projectId) {
        const response = await fetch(`${baseURL}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
    
        const data = await response.json(); // Parse the response body as JSON
        const result = Object.values(data).filter(comment => comment.projectId === projectId); // Filter comments by gameId
    
        console.log('Filtered comments:', result);
        return result;
    }
}