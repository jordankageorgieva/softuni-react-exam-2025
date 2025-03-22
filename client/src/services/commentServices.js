const baseURL = "http://localhost:3030/jsonstore/comment";

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        console.log('result is : ' + result);
        return result;

    },
    async create(gameId, email, comment) {

        const commentData = {
            gameId,
            email,
            comment,
            createdAt: new Date().toISOString()
        };

        const response = await fetch(baseURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            }
        );

        const result = await response.json();

        return result;

        // return request('POST', URL, gameData);

    },
    async getCommentForGameId(gameId){
        const response = await fetch(`${baseURL}?gameId=${gameId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const text = await response.text();
        if (!text) {
            return [];
        }

        const data = await response.json();
        const result = Object.values(data).filter(comment => comment.gameId === gameId);
        return result;
    }
}