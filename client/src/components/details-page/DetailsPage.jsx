import { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import gameServices from "../../services/gameServices";
import useScrollToTop from "../../hookCustom/useScrollToTop";
import CommentsList from "./CommentsList";
import CommentAdd from "./CommentAdd";
import { UserContext } from "../../hookContext/userContext";
import './ProjectDetails.css';

export default function DetailsPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState([]);
    const [newComment, setNewComment] = useState();

    const { email, accessToken } = useContext(UserContext);
    console.log(email + " email");

    const navigate = useNavigate();

    useScrollToTop.useScrollToTop();

    useEffect(() => {
        gameServices.getGame(projectId)
            .then(res => {
                setProject(res);
            })
    }, [projectId]);

    const deleteGameHandler = () => {
        const hasConfirm = confirm(`Are you sure you want to delete ${game.title} project?`);
        if (hasConfirm) {
            try {
                gameServices.deleteGame(projectId, accessToken);
                navigate('/projects');
            } catch (error) {
                console.error('Error deleting game:', error);
            }
        }

    }

    const addCommentHandler = (comment) => {

        console.log(comment);
        setNewComment(comment);
    }

    return (
        <>
            {/* <!--Details Page--> */}
            <section id="game-details">
                <h1>Project Short Overview</h1>
                <div className="info-section">

                    <div className="game-header">
                        <img className="game-img" src={project.imageUrl} />
                        <h1>{project.title}</h1>
                        <p className="type">{project.category}</p>
                        <p className="type">{project.environment}</p>
                    </div>

                    <p className="text">
                        {project.summary}
                    </p>
                    {/* <!-- Edit/Delete buttons ( Only for creator of this game )  --> */}
                    {accessToken &&
                        (<div className="buttons">
                            <Link to={`/projects/${project._id}/project-edit`} className="button">Edit</Link>
                            <button onClick={deleteGameHandler}
                                className="button">Delete</button>
                        </div>)
                    }

                    <CommentsList gameId={project._id} newComment={newComment} />

                </div>

                <CommentAdd
                    gameId={project._id}
                    addComment={addCommentHandler}
                />

            </section>

        </>
    );
}