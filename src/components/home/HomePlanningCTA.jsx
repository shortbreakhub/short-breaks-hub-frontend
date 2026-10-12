import React, {useLayoutEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Action} from "../ui/EditorialUI.jsx";
import {getOfficialItineraryPath} from "../../utils/publicNavigation.js";
import {getPagePlanningDestination} from "../../utils/homePlanning.js";

export default function HomePlanningCTA({fallback}) {
    const {t} = useTranslation();
    const [selected, setSelected] = useState(null);
    useLayoutEffect(() => {
        setSelected(getPagePlanningDestination(document, fallback));
    }, [fallback]);
    const destination = selected || fallback;
    // Identical server/client initial markup; reserve the CTA until its final
    // label is selected before paint, rather than flashing a different city.
    return <Action to={getOfficialItineraryPath(destination.slug)} style={selected ? undefined : {visibility: "hidden"}}>
        {t("homeMagazine.planning.action", {destination: destination.city})} <span aria-hidden="true">→</span>
    </Action>;
}
