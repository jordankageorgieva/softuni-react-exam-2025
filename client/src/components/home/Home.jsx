import { Link } from "react-router-dom"; // Correct import for Link
import { useEffect, useState } from "react";
import gameServices from "../../services/gameServices";

export default function Home() {
    const [games, setGames] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Track loading state

    useEffect(() => {
        const controller = new AbortController(); // AbortController to prevent memory leaks
        const fetchGames = async () => {
            try {
                const result = await gameServices.getAll({ signal: controller.signal });
                setGames(result);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError("Failed to load games. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGames();

        return () => controller.abort(); // Cleanup function to prevent memory leaks
    }, []);

    return (
        <>
            <section id="welcome-world">
                <div className="welcome-message">
                    <h2>ALL new games are</h2>
                    <h3>Only in GamesPlay</h3>
                </div>
                <img src="./images/four_slider_img01.png" alt="Gaming banner" />

                <div id="home-page">
                    <h1>Latest Games</h1>

                    {loading ? (
                        <p>Loading games...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : games.length > 0 ? (
                        games.map(game => (
                            <div className="game" key={game._id}>
                                <div className="image-wrap">
                                    <img src={game.imageUrl} alt={game.title} loading="lazy" />
                                </div>
                                <h3>{game.title}</h3>
                                <div className="rating">
                                    {"★★★★★".split("").map((star, index) => (
                                        <span key={index}>{star}</span>
                                    ))}
                                </div>
                                <div className="data-buttons">
                                    <Link to={`/games/${game._id}/game-details`} className="btn details-btn">
                                        Details
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-articles">No games yet</p>
                    )}
                </div>
            </section>
        </>
    );
}
