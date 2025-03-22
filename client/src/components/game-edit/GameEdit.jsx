import { useNavigate, useParams } from "react-router";
import useScrollToTop from "../../hookCustom/useScrollToTop";
import { useEffect, useState } from "react";
import gameServices from "../../services/gameServices";

export default function GameEdit() {
    const { gameId } = useParams();
    const [game, setGame] = useState([]);

    const navigate = useNavigate();

    useScrollToTop.useScrollToTop();

    useEffect(() => {
            gameServices.getGame(gameId)
                .then(res => {
                    setGame(res);
                })
        }, [gameId]);
    
    const saveGame = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            gameServices.updateGame(gameId, data);
            navigate(`/games/${gameId}/game-details`);
        } catch (error) {
            console.error('Error updating game:', error);
        }
    }
    
    return (
        <>
            {/* <!-- Edit Page ( Only for the creator )--> */}
            <section id="edit-page" className="auth">
                <form id="edit" onSubmit={saveGame}>
                    <div className="container">

                        <h1>Edit Game</h1>
                        <label htmlFor="leg-title">Legendary title:</label>
                        <input type="text" id="title" name="title" defaultValue={game.title} />

                        <label htmlFor="category">Category:</label>
                        <input type="text" id="category" name="category" defaultValue={game.category} />

                        <label htmlFor="levels">MaxLevel:</label>
                        <input type="number" id="maxLevel" name="maxLevel" min="1" defaultValue={game.maxLevel} />

                        <label htmlFor="game-img">Image:</label>
                        <input type="text" id="imageUrl" name="imageUrl" defaultValue={game.imageUrl} />

                        <label htmlFor="summary">Summary:</label>
                        <textarea name="summary" id="summary" defaultValue={game.summary}></textarea>
                        <input className="btn submit" type="submit" value="Edit Game" />

                    </div>
                </form>
            </section>
        </>
    );
}