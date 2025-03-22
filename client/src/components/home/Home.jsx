import { Link, useNavigate } from "react-router"
import gameServices from "../../services/gameServices";
import { useEffect, useState } from "react";

export default function Home() {
    const navigation = useNavigate();

    const [games, setGames] = useState([]);


    useEffect(() => {
        gameServices.getAll()
            .then(result => {
                setGames(result);
                // console.log(result)
            })

    }, []);

    return (
        <>
            {/* <!--Home Page--> */}
            <section id="welcome-world">

                <div className="welcome-message">
                    <h2>ALL new games are</h2>
                    <h3>Only in GamesPlay</h3>
                </div>
                <img src="./images/four_slider_img01.png" alt="hero" />

                <div id="home-page">
                    <h1>Latest Games</h1>

                    {/* <!-- Display div: with information about every game (if any) --> */}
                    {/* <!-- Display div: with information about every game (if any) --> */}
                    {games.length > 0 ? (
                        games.map(game => (
                            <div className="game" key={game._id}>
                                <div className="image-wrap">
                                    <img src={game.imageUrl} alt={game.title} />
                                </div>
                                <h3>{game.title}</h3>
                                <div className="rating">
                                    <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                                </div>
                                <div className="data-buttons">
                                    <Link to={`/games/${game._id}/game-details`} className="btn details-btn">Details</Link>
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