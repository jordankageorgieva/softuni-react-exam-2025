import { useState } from "react";
import commentServices from "../../services/commentServices";
import './CommentAdd.css';

export default function CommentAdd({ gameId, addComment }) {
    const [comment, setComment] = useState("");

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const addCommentFunction = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        try {
            const result = await commentServices.create(data, gameId);
            console.log(result);
            addComment(data); // Call the addComment function passed as a prop
            setComment(""); // Clear the comment input after successful submission
            event.target.reset(); // Reset the entire form
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    return (
        <>
            {/* <!-- Bonus --> */}
            {/* <!-- Add Comment ( Only for logged-in users, which is not creators of the current game ) --> */}
            <article className="create-comment">
                <label>Add new comment:</label>
                <form className="form" onSubmit={addCommentFunction}>
                    <input name="username" type="text" placeholder="Name..." autoComplete="username" />
                    <input name="email" type="email" placeholder="Email..." autoComplete="email" />
                    <textarea
                        name="comment"
                        placeholder="Comment......"
                        value={comment}
                        onChange={handleCommentChange}
                    ></textarea>
                    <input className="btn submit" type="submit" value="Add Comment" />
                </form>
            </article>
        </>
    );
}