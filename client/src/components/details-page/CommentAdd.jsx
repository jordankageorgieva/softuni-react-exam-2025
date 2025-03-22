import { useState } from "react";
import commentServices from "../../services/commentServices";

export default function CommentAdd({ gameId, email, addComment }) {
    const [comment, setComment] = useState("");

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const addCommentFunction = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const commentText = formData.get('comment');

        try {
            const result = await commentServices.create(gameId, email, commentText);
            console.log(result);
            addComment(commentText);
            setComment(""); // Clear the comment input after successful submission
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