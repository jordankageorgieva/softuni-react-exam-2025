export default function CommentListItem({
    email,
    comment
}) {
    return (
        <>
            {/* <!-- list all comments for current game (If any) --> */}
            <li className="comment">
                <p>{email} : {comment}</p>
            </li>
        </>
    );

}