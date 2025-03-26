// const baseURL = "http://localhost:3030/jsonstore/comment";
const baseURL = "http://localhost:3030/data/comment";

export default {
    async getAll() {
        // return all games
        const response = await fetch(baseURL);
        const data = await response.json(); // parse the response body as JSON
        const result = Object.values(data);
        console.log('result is : ' + result);
        return result;

    },
    async create(gameId, email, comment, accessToken) {

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
                    'Content-Type': 'application/json',
                    'X-Authorization': accessToken,
                },
                body: JSON.stringify(commentData)
            }
        );

        const result = await response.json();

        return result;

        // return request('POST', URL, gameData);

    },
    async getCommentForGameId(gameId, accessToken) {

        console.log('accessToken is : ' + accessToken);

        const response = await fetch(`${baseURL}?gameId=${gameId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorization': accessToken,
                },
            });
        if (!response.ok) {
            if (response.status === 403) {
                return;
            } else {
                throw new Error(`Error: ${response.statusText}`);
            }
           
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