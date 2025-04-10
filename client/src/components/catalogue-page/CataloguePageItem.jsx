import {Link} from "react-router";
import './CataloguePageItem.css';

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
                    <Link to={`/projects/${_id}/project-details`} className="details-button">Details</Link>
                </div>

            </div>
        </>
    );
}