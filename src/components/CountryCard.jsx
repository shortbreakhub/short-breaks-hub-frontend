import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getItineraryBySlug} from "../api.js";



export default function CountryCard({ name, itineraries, image, itineraryType }) {
    const navigate = useNavigate();

    const [previewList,setPreviewList] = useState(itineraries.slice(0, 4));
    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage ?? "en";
    const { t } = useTranslation();

    useEffect(() => {
        Promise.all(
            previewList.map(item =>
                getItineraryBySlug(item.slug, lang)
                    .then(data => ({
                        slug: data.slug,
                        title: data.title,
                    }))
            )
        ).then(result => {
            setPreviewList(result);
        });
    }, [lang]);


    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">

            <div className="h-40 md:h-48 w-full overflow-hidden">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
            </div>


            <div className="p-5 flex-1 flex flex-col">

                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900">{t(`itinerarySearchBar.countries.${name}`)}</h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
            {itineraries.length} {t("countryCard.itineraries")}
          </span>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {previewList.map(({slug,title}) => (
                        <button
                            key={slug}
                            onClick={() => navigate(`/${itineraryType}/${slug}`)}
                            className="text-left text-sm border border-gray-200 rounded-lg px-3 py-2
                         bg-gray-50 hover:bg-blue-100 hover:border-blue-500
                         shadow-sm hover:shadow-md transition
                         focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        >
                            {title}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => navigate(`/browse/${name}`)}
                    className="text-sm text-blue-600 underline mt-5 cursor-pointer"
                >
                    {t("countryCard.viewAllItineraries")}
                </button>

            </div>
        </div>
    );
}


