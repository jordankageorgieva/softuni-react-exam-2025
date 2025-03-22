import {Link} from "react-router";

export default function CataloguePageItem({
    _id,
    imageUrl,
    title,
    category,
    action,
    link,
}) {

    return (
        <>
            <div className="allGames">
                <div className="allGames-info">
                    <img src={imageUrl}/>
                    <h6>{category}</h6>
                    <h2>{title}</h2>
                    <Link to={`/games/${_id}/game-details`} className="details-button">Details</Link>
                </div>

            </div>
        </>
    );
}