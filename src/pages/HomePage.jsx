import {optimizedImages} from "../utils/optimizedImages.js";

import {REGIONS} from "../config/regions.js";
import React, {useRef} from "react";
import {Typewriter} from "react-simple-typewriter";
import {FaChevronDown} from "react-icons/fa";
import RegionCard from "../components/RegionCard.jsx";
import ItinerarySearchBar from "../components/ItinerarySearchBar.jsx";
import { useTranslation } from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {HOME_PAGE_METADATA} from "../utils/pageMetadata.js";
import {getRegionPath} from "../utils/publicNavigation.js";

const heroBg = optimizedImages["hero-bg"].src;


function HomePage() {

    const exploreRef = useRef(null);
    const scrollToExplore = () => {
        exploreRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const { t } = useTranslation();
    const words = t("homepage.typewriter", {
        returnObjects: true,
    });

    const regionImages = {
        southeastAsia: optimizedImages["southeast"],
        eastAsia: optimizedImages["eastasia"],
        europe: optimizedImages["europe"],
        americas: optimizedImages["americas"],
        oceania: optimizedImages["anz"],
        africa: optimizedImages["northafrica"],
    };
    const regions = REGIONS.map((region) => ({...region, image: regionImages[region.key].src, imageMeta: regionImages[region.key]}));

    return (
        <>
            <PageCanonical segments={[]} />
            <PageMetadata canonicalSegments={[]} {...HOME_PAGE_METADATA} />
            <section id="home" className="scroll-mt-20">

                <div
                    className="relative min-h-[65vh] bg-cover bg-center"
                    style={{ backgroundImage: `url('${heroBg}')` }}
                >

                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 z-0"></div>


                    <div className="relative z-10 flex flex-col items-center justify-center text-white text-center px-4 h-screen">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                            Short Break Hub
                        </h1>
                        <h4 className="text-3xl mt-16 sm:text-4xl font-extrabold text-yellow-300 drop-shadow-lg text-center">
                            {t("homepage.explore")}&nbsp;
                            <span className="text-white">
                                <Typewriter
                                    words={words}
                                    loop={true}
                                    cursor
                                    cursorStyle="_"
                                    typeSpeed={70}
                                    deleteSpeed={40}
                                    delaySpeed={1800}
                                />
                          </span>
                        </h4>
                        <section className="mx-auto max-w-5xl px-4 mt-28">
                            <ItinerarySearchBar regions={regions} />
                        </section>

                        <div className="hidden lg:flex absolute right-3 lg:right-6 top-10 bottom-10 items-center">
                          <span
                              className="text-white/80 tracking-widest uppercase text-xs lg:text-sm
                                       pl-3 border-l-2 border-white/50"
                              style={{ writingMode: 'vertical-rl' }}
                          >
                            {t(`homepage.tagline`)}
                          </span>
                        </div>


                        <div className="block lg:hidden mt-16 text-center">
                          <span className="text-white/90 text-sm tracking-wide">
                            {t(`homepage.tagline`)}
                          </span>
                        </div>


                        <div onClick={scrollToExplore} className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10 cursor-pointer">
                            <FaChevronDown className="animate-bounce text-white text-4xl" />
                        </div>
                    </div>
                </div>
            </section>

            <section id="explore" className="scroll-mt-20">
                <div ref={exploreRef} className="py-16 px-6 bg-white">
                    <h2 className="text-3xl font-bold text-center mb-10">{t(`homepage.exploreByRegion`)}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        { regions.map((item, index) => (
                            <RegionCard
                                key={index}
                                image={item.image}
                                imageMeta={item.imageMeta}
                                loading="lazy"
                                title={t(`homepage.regions.${item.key}.title`)}
                                description={t(`homepage.regions.${item.key}.description`)}
                                to={getRegionPath(item.onClick)}
                            />
                        ))}
                    </div>
                </div>
            </section>
            <footer id="contact" className="scroll-mt-20">

            </footer>
        </>
    );
}

export default HomePage;
