import React, {useContext, useEffect, useRef, useState} from 'react';
import CountryCard from '../components/CountryCard';
import {getCountriesByRegion, getItinerariesByRegion} from "../api.js";
import {useLocation, useParams} from "react-router-dom";
import {loadImages} from "../utils/loadImage.js";
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {formatSlug} from "../utils/formatSlug.js";
import {getRegionPageMetadata} from "../utils/pageMetadata.js";
import {PrerenderDataContext} from "../context/PrerenderDataContext.jsx";
import useRegionScroll from "../hooks/useRegionScroll.js";

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
    const location = useLocation();
    const anchor = useRef(null);
    const prerenderData = useContext(PrerenderDataContext);
    const matchingPrerenderData = prerenderData?.region === region ? prerenderData : null;
    const prerenderDataRef = useRef(matchingPrerenderData);
    const [result, setResult] = useState(() => ({
        region,
        countries: matchingPrerenderData
            ? makeRegionCountries(matchingPrerenderData.countries, matchingPrerenderData.itineraries) : [],
        ready: !!matchingPrerenderData,
    }));
    const [retry, setRetry] = useState(0);
    const current = result.region === region ? result : {countries: [], ready: false};
    useRegionScroll(anchor, location.key, current.ready);
    const {t} = useTranslation();
    const pageMetadata = getRegionPageMetadata(formatSlug(region || ""));
    const regionLabel = region.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const labelKey = region.includes("-") ? regionLabel : regionLabel.toLowerCase();

    useEffect(() => {
        if (prerenderDataRef.current?.region === region) {
            prerenderData.clear();
            prerenderDataRef.current = null;
            return;
        }
        let active = true;
        setResult({region, countries: [], ready: false});
        Promise.all([getCountriesByRegion(region), getItinerariesByRegion(region)])
            .then(([names, itineraries]) => {
                if (active) setResult({region, countries: makeRegionCountries(names, itineraries), ready: true});
            })
            .catch(() => {
                if (active) setResult({region, countries: [], ready: true, failed: true});
            });
        return () => {active = false;};
    }, [region, retry]);

    return <main ref={anchor} id="region-countries" aria-labelledby="region-title" className="bg-gray-50 min-h-screen w-full overflow-x-hidden">
        <PageCanonical segments={[region]}/>
        <PageMetadata canonicalSegments={[region]} {...pageMetadata}/>
        <h1 id="region-title" className="sr-only">{t("RegionPage." + labelKey)}</h1>
        <div className="max-w-screen-xl mx-auto py-4">
            {!current.ready && <p className="p-4" role="status">{t("routeLoad.loading")}</p>}
            {current.failed && <div className="p-4" role="alert">
                <p>{t("routeLoad.failed")}</p>
                <button type="button" className="sbh-link min-h-11" onClick={() => setRetry(value => value + 1)}>{t("itineraryLoad.retry")}</button>
            </div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-cols-fr">
                {current.countries.map((country, index) => <CountryCard
                    key={country.name}
                    name={country.name}
                    itineraries={country.itineraries}
                    image={country.image}
                    loading={index < 3 ? "eager" : "lazy"}
                    itineraryType="itinerary"
                />)}
            </div>
        </div>
    </main>;
}

export default RegionPage;
