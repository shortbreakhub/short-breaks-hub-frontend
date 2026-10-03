import React, {useContext, useEffect, useRef, useState} from 'react';
import CountryCard from '../components/CountryCard';
import {getCountriesByRegion, getItinerariesByRegion} from "../api.js";
import {useParams} from "react-router-dom";
import {loadImages} from "../utils/loadImage.js";
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {formatSlug} from "../utils/formatSlug.js";
import {getRegionPageMetadata} from "../utils/pageMetadata.js";
import {PrerenderDataContext} from "../context/PrerenderDataContext.jsx";

function makeRegionCountries(countryList, itineraries) {
    return countryList.map((name) => ({
        name,
        image: loadImages(name),
        itineraries: itineraries
            .filter((itinerary) => itinerary.country?.toLowerCase() === name.toLowerCase())
            .map(({slug, title}) => ({slug, title})),
    }));
}



function RegionPage() {
    const {region} = useParams();
    const prerenderData = useContext(PrerenderDataContext);
    const matchingPrerenderData = prerenderData?.region === region ? prerenderData : null;
    const prerenderDataRef = useRef(matchingPrerenderData);
    const [countries, setCountries] = useState(() => matchingPrerenderData
        ? makeRegionCountries(matchingPrerenderData.countries, matchingPrerenderData.itineraries)
        : []);
    const [bannerImage, setBannerImage] = useState(() => matchingPrerenderData
        ? loadImages(`${region}-banner`)
        : null);
    const { t } = useTranslation();
    const pageMetadata = getRegionPageMetadata(formatSlug(region || ""));

    function titleCase(str) {
        const splitStr = str.replace("-"," ").split(' ')
        if (splitStr.length > 1) {
            return splitStr[0]+splitStr[1][0].toUpperCase() + splitStr[1].slice(1);
        }
        return splitStr[0].toLowerCase();
    }


    useEffect(() => {
        if (prerenderDataRef.current?.region === region) {
            prerenderData.clear();
            prerenderDataRef.current = null;
            return;
        }

        setBannerImage(loadImages(`${region}-banner`));
        getCountriesByRegion(region).then(
            (country_list) => {
                getItinerariesByRegion(region).then(
                    (itineraries) => {
                        setCountries(makeRegionCountries(country_list, itineraries));
                    }
                )
            }
        );
    },[region]);



    return (
        <div id="region-countries" className="bg-gray-50 min-h-screen w-full overflow-x-hidden">
            <PageCanonical segments={[region]} />
            <PageMetadata canonicalSegments={[region]} {...pageMetadata} />
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
                    {countries.map((country, index) => (
                        <CountryCard
                            key={country.name}
                            name={country.name}
                            itineraries={country.itineraries}
                            image={country.image}
                            loading={index < 3 ? "eager" : "lazy"}
                            itineraryType={"itinerary"}
                        />
                    ))}
                </div>
            </div>
        </div>

    );
}

export default RegionPage;
