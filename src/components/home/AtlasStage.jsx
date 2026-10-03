import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import AtlasVisual, {LandmarkSketch} from "./AtlasVisual.jsx";
import {getOfficialItineraryPath} from "../../utils/publicNavigation.js";

// Presentation positions belong to the replaceable stage, never destination mappings.
const spots = {newYork: [22, 47], paris: [48, 29], marrakech: [45, 72], shanghai: [72, 61], tokyo: [88, 30], sydney: [87, 89]};

export default function AtlasStage({destinations, visualLayer = <AtlasVisual />, renderLandmark = kind => <LandmarkSketch kind={kind} />}) {
    const {t} = useTranslation();
    return <figure className="atlas-stage" aria-labelledby="atlas-caption" data-atlas-stage="illustrated-world">
        <div className="atlas-paper">
            {visualLayer}
            <ul className="atlas-destinations" aria-label={t("homeMagazine.atlas.destinations")}>
                {destinations.map(item => <li key={item.key} className={`atlas-destination ${["marrakech", "shanghai"].includes(item.key) ? "atlas-secondary" : ""}`}
                    style={{left: `${spots[item.key][0]}%`, top: `${spots[item.key][1]}%`}}>
                    <Link to={getOfficialItineraryPath(item.slug)}>
                        {renderLandmark(item.key)}
                        <span className="atlas-pin" aria-hidden="true" />
                        <span className="atlas-label">{item.city}</span>
                    </Link>
                </li>)}
            </ul>
        </div>
        <figcaption id="atlas-caption"><span>{t("homeMagazine.atlas.caption")}</span><span>{t("homeMagazine.atlas.hint")}</span></figcaption>
    </figure>;
}
