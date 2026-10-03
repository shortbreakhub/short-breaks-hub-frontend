import {Link, useNavigate} from "react-router-dom";
import {getFavoritesCount} from "../api.js";
import {useEffect, useState} from "react";
import {loadSubFolderImages} from "../utils/loadItineraryImage.js";
import {useTranslation} from "react-i18next";
import {getOfficialItineraryPath} from "../utils/publicNavigation.js";

export default function ItineraryCard({it="",showLikes=false,itineraryType="build in"}) {
    const [favoritesCount, setFavoritesCount] = useState(0);
    const itineraryId = it?.id;
    const navigateTo = it
        ? itineraryType === "build in"
            ? getOfficialItineraryPath(it.slug)
            : `/user-itinerary/${it.slug}`
        : "";

    const { t } = useTranslation();

    useEffect(() => {
        if(itineraryId && itineraryType === "build in") {
            getFavoritesCount(itineraryId).then(data => {
                setFavoritesCount(data.count);
            });
        }
    }, [itineraryId, itineraryType]);
    return (
        <>
            <li key={it.id} className="bg-white rounded-xl shadow-md border border-gray-400 hover:shadow-lg transition hover:scale-105">
                <Link to={navigateTo} className="block">
                    <img
                        src={ itineraryType === "build in" ?
                            loadSubFolderImages(it.hero.split("/")[3] + "/"+it.hero.split("/")[4],it.hero.split("/")[5].split(".")[0]) :
                            it.coverPhoto
                    }
                        alt={it.title}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover rounded-t-xl"
                    />
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{it.title}</h3>
                            {showLikes && (
                                <div className="text-sm text-red-500 flex items-center">
                                    ❤️ {favoritesCount ?? 0}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {t(`itinerarySearchBar.countries.${unslug(it.country)}`)} • {it.days} {t("itineraryCard.daysFrom")} ${it.priceFrom}
                        </p>
                        {it.summary && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {it.summary}
                            </p>
                        )}

                    </div>
                </Link>
            </li>
        </>
    )
}

function unslug(s) {
    return s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
