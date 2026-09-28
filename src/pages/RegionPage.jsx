import React, {useEffect, useState} from 'react';
import CountryCard from '../components/CountryCard';
import {getCountriesByRegion, getItinerariesByRegion} from "../api.js";
import {useParams} from "react-router-dom";
import {loadImages} from "../utils/loadImage.js";
import {useTranslation} from "react-i18next";



function RegionPage() {
    const {region} = useParams();
    const [countries, setCountries] = useState([]);
    const [bannerImage, setBannerImage] = useState(null);
    const { t } = useTranslation();

    function titleCase(str) {
        const splitStr = str.replace("-"," ").split(' ')
        if (splitStr.length > 1) {
            return splitStr[0]+splitStr[1][0].toUpperCase() + splitStr[1].slice(1);
        }
        return splitStr[0].toLowerCase();
    }


    useEffect(() => {
        setBannerImage(loadImages(`${region}-banner`));
        getCountriesByRegion(region).then(
            (country_list) => {

                const base = country_list.map((item) => ({
                        "name": item,
                        "image": loadImages(item),
                        "itineraries": [],
                    })
                );
                getItinerariesByRegion(region).then(
                    (itineraries) => {
                        const merged = base.map((country) => {
                            const slugsAndTitles = []
                            for (const eachItinerary of itineraries){
                                if (eachItinerary.country.toLowerCase() === country.name.toLowerCase()) {
                                    slugsAndTitles.push(
                                        {
                                            slug:eachItinerary.slug,
                                            title: eachItinerary.title,
                                        });
                                }
                            }
                            return {...country, itineraries: slugsAndTitles};
                        })
                        setCountries(merged);
                    }
                )
            }
        );
    },[region]);



    return (
        <div id="region-countries" className="bg-gray-50 min-h-screen w-full overflow-x-hidden">
            <div className="relative h-[300px] md:h-[400px] bg-cover bg-center shadow-lg"
                 style={{ backgroundImage: `url('${bannerImage}')` }}>
                <div className="absolute inset-0 bg-opacity-40 flex items-center justify-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                        {t("RegionPage.discover")} {t(`RegionPage.${titleCase(region)}`)}
                    </h1>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto my-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-cols-fr">
                    {countries.map((country) => (
                        <CountryCard
                            key={country.name}
                            name={country.name}
                            itineraries={country.itineraries}
                            image={country.image}
                            itineraryType={"itinerary"}
                        />
                    ))}
                </div>

            </div>
        </div>

    );
}

export default RegionPage;
