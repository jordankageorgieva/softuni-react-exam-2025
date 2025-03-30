import './CommentListItem.css';

export default function CommentListItem({
    username,
    comment
}) {
    return (
        <>
            {/* <!-- list all comments for current game (If any) --> */}
            <li className="comment">
                <p>{username} : <span>{comment}</span></p>
            </li>
        </>
    );

}