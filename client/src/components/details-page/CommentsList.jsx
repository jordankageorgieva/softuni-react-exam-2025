import { useContext, useEffect, useState } from "react";
import commentServices from "../../services/commentServices";
import CommentListItem from "./CommentListItem";
import { UserContext } from "../../hookContext/userContext";

export default function CommentsList({
    gameId,
    newComment
}) {
    const [comment, setComment] = useState([]);
    const { accessToken } = useContext(UserContext);

    useEffect(() => {
        if ( gameId === undefined) {
            return;
        }

        commentServices.getCommentForGameId(gameId, accessToken)
            .then(res => {
                setComment(res);
                console.log("comment is " + comment);
            })
    }, [gameId, accessToken]);

    useEffect(() => {
        if ( gameId === undefined || newComment === undefined) {
            return;
        }

        commentServices.getCommentForGameId(gameId, accessToken)
            .then(res => {
                setComment(res);
                console.log("comment is " + comment);
            })
    }, [newComment, gameId, accessToken]);

    return (
        <>
            {/* <!-- Bonus ( for Guests and Users ) --> */}
            <div className="details-comments">
                <h2>Comments:</h2>
                {
                    (comment && comment.length > 0 ) ?
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