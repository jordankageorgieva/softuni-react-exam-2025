import { useEffect, useState } from "react";
import commentServices from "../../services/commentServices";
import CommentListItem from "./CommentListItem";

export default function CommentsList({
    gameId,
    newComment
}) {
    const [comment, setComment] = useState([]);

    useEffect(() => {
        commentServices.getCommentForGameId(gameId)
            .then(res => {
                setComment(res);
                console.log("comment is " + comment);
            })
    }, [gameId]);

    useEffect(() => {
        commentServices.getCommentForGameId(gameId)
            .then(res => {
                setComment(res);
                console.log("comment is " + comment);
            })
    }, [newComment]);

    return (
        <>
            {/* <!-- Bonus ( for Guests and Users ) --> */}
            <div className="details-comments">
                <h2>Comments:</h2>
                {
                    comment.length > 0 ?
                        <>
                            <ul>
                                {comment.map(comment =>
                                    <CommentListItem
                                        key={comment._id}
                                        {...comment}
                                    />
                                )}
                            </ul>
                        </>
                        :
                        // {/* <!-- Display paragraph: If there are no games in the database --> */ }
                        < p className="no-comment">No comments.</p>
                }
            </div >
        </>
    );
}