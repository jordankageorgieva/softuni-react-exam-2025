import gameServices from '../../services/gameServices';

import {useNavigate} from 'react-router';

export default function CreatePage() {
    // display game after it is create
    const navigate = useNavigate();

    const submitAction = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        try {
            const result = await gameServices.create(data);
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

                        <h1>Create Game</h1>
                        <label htmlFor="leg-title">Legendary title:</label>
                        <input type="text" id="title" name="title" placeholder="Enter game title..." />

                        <label htmlFor="category">Category:</label>
                        <input type="text" id="category" name="category" placeholder="Enter game category..." />

                        <label htmlFor="levels">MaxLevel:</label>
                        <input type="number" id="maxLevel" name="maxLevel" min="1" placeholder="1" />

                        <label htmlFor="game-img">Image:</label>
                        <input type="text" id="imageUrl" name="imageUrl" placeholder="Upload a photo..." />

                        <label htmlFor="summary">Summary:</label>
                        <textarea name="summary" id="summary"></textarea>
                        <input className ="btn submit" type="submit" value="Create Game" />
                    </div>
                </form>
            </section>
        </>
    );
}