import { useNavigate, useParams } from "react-router";
import useScrollToTop from "../../hookCustom/useScrollToTop";
import { useContext, useEffect, useState } from "react";
import gameServices from "../../services/projectServices";
import './EditProject.css';
import { UserContext } from "../../hookContext/userContext";
import CreateUpdatePage from "../create-update-page/CreateUpdatePage";

export default function GameEdit() {
    const { projectId } = useParams();
    const [project, setProject] = useState([]);

    const { accessToken } = useContext(UserContext);

    const navigate = useNavigate();

    useScrollToTop.useScrollToTop();
    console.log(projectId + " projectId");
    useEffect(() => {
            gameServices.getGame(projectId)
                .then(res => {
                    setProject(res);
                })
    }, [projectId]);
    
    const saveGame = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            gameServices.updateGame(projectId, data, accessToken);
            navigate(`/projects/${projectId}/project-details`);
        } catch (error) {
            console.error('Error updating project:', error);
        }
    }
    
    return (
        <>
            {/* <!-- Edit Page ( Only for the creator )--> */}
            <section id="form-page" className="auth">
                <form id="edit" onSubmit={saveGame}>
                    <div className="container">

                        <h1>Edit Current Project</h1>
                        <CreateUpdatePage  project={project}/>
                        <input className="btn submit" type="submit" value="Edit Current Project" />

                    </div>
                </form>
            </section>
        </>
    );
}