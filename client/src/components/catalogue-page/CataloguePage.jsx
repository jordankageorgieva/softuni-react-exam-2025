import { useEffect, useState } from "react";
import gameServices from "../../services/gameServices";
import CataloguePageItem from "./CataloguePageItem";

export default function CataloguePage() {
    const [games, setGames] = useState([]);
    // const [email, setEmail] = useState(inEmail);

    useEffect(() => {
        gameServices.getAll()
            .then(result => {
                setGames(result);
                // console.log(result)
            })

    }, []);


    return (
        <>
            {/* <!-- Catalogue --> */}
            <section id="catalog-page">
                <h1>All Games</h1>
                {/* <!-- Display div: with information about every game (if any) --> */}

                {games.length > 0 ?
                    games.map(game =>
                        <CataloguePageItem
                            key={game._id}
                            {...game}
                        />
                    )
                    :
                    //  <!-- Display paragraph: If there is no games  --> 
                    < h3 className="no-articles">No articles yet</h3>

                }
            </section >
        </>
    );
}