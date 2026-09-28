import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getCommunityCountriesByRegion, getCommunityItinerariesByRegion} from "../api.js";
import {loadImages} from "../utils/loadImage.js";
import CountryCard from "../components/CountryCard.jsx";

export default function CommunityRegionPage() {
    const {region} = useParams();
    const [countries, setCountries] = useState([]);

    const bannerImage = loadImages(region.toLowerCase()+"-banner")

    useEffect(() => {
        getCommunityCountriesByRegion(region).then(
            (country_list) => {
                const base = country_list.map((item) => ({
                        "name": item,
                        "image": loadImages(item),
                        "itineraries": [],
                    })

                );

                getCommunityItinerariesByRegion(region).then(
                    (itineraries) => {
                        const merged = base.map((country) => {
                            const slugs = []
                            for (const eachItinerary of itineraries){
                                if (eachItinerary.country.toLowerCase() === country.name.toLowerCase()) {
                                    slugs.push(eachItinerary.slug);
                                }
                            }
                            console.log(slugs);
                            return {...country, itineraries: slugs}
                        })
                        setCountries(merged);
                    }
                )
            }
        );
    },[region]);


    return (
        <div className="bg-gray-50 min-h-screen w-full overflow-x-hidden">
            <div className="relative h-[300px] md:h-[400px] bg-cover bg-center shadow-lg"
                 style={{ backgroundImage: `url('${bannerImage}')` }}>
                <div className="absolute inset-0 bg-opacity-40 flex items-center justify-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                        Discover {region[0]+region.slice(1).toLowerCase()}
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
                            itineraryType={"user-itinerary"}
                        />
                    ))}
                </div>

            </div>
        </div>

    );
}
