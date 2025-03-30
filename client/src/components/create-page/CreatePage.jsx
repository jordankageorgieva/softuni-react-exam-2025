import { useContext } from 'react';
import { UserContext } from '../../hookContext/userContext';
import gameServices from '../../services/gameServices';
import './CreatePage.css';

import {useNavigate} from 'react-router';

export default function CreatePage() {
    // display game after it is create
    const navigate = useNavigate();

    const {accessToken} = useContext(UserContext);

    const submitAction = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        try {
            const result = await gameServices.create(data, accessToken);
            console.log(result);
            navigate('/games');
        } catch (error) {
            console.error('Error creating game:', error);
        }
      
    } 

    return (
        <>

            {/* <!-- Create Page ( Only for logged-in users ) --> */}
            <section id="create-page" className ="auth">
                <form id="create" onSubmit={submitAction}>
                    <div className ="container">

                        <h1>Insert Project</h1>
                        <label htmlFor="leg-title">Client:</label>
                        <input type="text" id="title" name="title" placeholder="Enter project title..." />

                        <label htmlFor="category">Category:</label>
                        <input type="text" id="category" name="category" placeholder="Enter project category..." />

                        <label htmlFor="levels">ComplexityLevel:</label>
                        <input type="number" id="complexityLevel" name="complexityLevel" min="1" placeholder="1" />

                        <label htmlFor="game-img">Image:</label>
                        <input type="text" id="imageUrl" name="imageUrl" placeholder="Upload a photo..." />

                        <label htmlFor="summary">Summary:</label>
                        <textarea name="summary" id="summary"></textarea>
                        

                        <label htmlFor="environment">Technical environment:</label>
                        <textarea name="environment" id="environment"></textarea>
                        <input className ="btn submit" type="submit" value="Create Project" />
                    </div>
                </form>
            </section>
        </>
    );
}