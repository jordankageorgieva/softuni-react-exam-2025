import { Link } from "react-router-dom"; // Correct import for Link
import { useEffect, useState } from "react";
import gameServices from "../../services/gameServices";
import './Home.css';

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
                    setError("Failed to load projects. Please try again later.");
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
                    <h2>This SPA document provides an overview of the CSC/DXC OBS projects available during the period from 2007 to 2024. I have worked on projects across diverse industries, including finance, insurance, e-commerce, and sports applications.</h2>
                    <h3>The scope of work covers full-stack development, database management, data migration, DevOps, and security compliance. Technologies utilized include Java, Spring Boot, Hibernate, JavaScript, React, SQL, Oracle DB, MySQL, DB2, WebSphere, and AWS.
                        For a detailed breakdown of each project, including roles, technologies, and key contributions, please refer to the project descriptions.</h3>
                </div>
                {/* <img src="./images/four_slider_img01.png" alt="Gaming banner" /> */}

                <div id="home-page">
                    <h1>Latest Project-Sphere</h1>

                    {loading ? (
                        <p>Loading projects...</p>
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
                                    <Link to={`/projects/${game._id}/project-details`} className="btn details-btn">
                                        Details
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-articles">No projects yet</p>
                    )}
                </div>
            </section>
        </>
    );
}
