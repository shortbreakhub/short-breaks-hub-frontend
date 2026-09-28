import React, {useRef} from "react";
import heroBg from "../assets/hero-bg.jpg";
import {Typewriter} from "react-simple-typewriter";
import {FaChevronDown} from "react-icons/fa";
import RegionCard from "../components/RegionCard.jsx";
import southeastImg from "../assets/southeast.jpg";
import eastAsiaImg from "../assets/eastasia.jpg";
import europeImg from "../assets/europe.jpg";
import americasImg from "../assets/americas.jpg";
import anzImg from "../assets/anz.jpg";
import northAfricaImg from "../assets/northAfrica.jpg"
import {useNavigate} from "react-router-dom";
import ItinerarySearchBar from "../components/ItinerarySearchBar.jsx";
import { useTranslation } from "react-i18next";


function HomePage() {

    const exploreRef = useRef(null);
    const scrollToExplore = () => {
        exploreRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const navigate = useNavigate();
    const { t } = useTranslation();
    const words = t("homepage.typewriter", {
        returnObjects: true,
    });

    const regions = [
        {
            key: "southeastAsia",
            title: "Southeast Asia",
            description: "Tropical beaches, vibrant cities, and legendary street food.",
            image: southeastImg,
            onClick: "southeast-asia",
            bannerName: "southeast-asia-banner",
        },
        {
            key: "eastAsia",
            title: "East Asia",
            description: "Ancient temples, neon skylines, and rich traditions.",
            image: eastAsiaImg,
            onClick: "east-asia",
            bannerName: "east-asia-banner",
        },
        {
            key: "europe",
            title: "Europe",
            description: "Iconic landmarks, café culture, and timeless elegance.",
            image: europeImg,
            onClick: "europe",
            bannerName: "europe-banner",
        },
        {
            key: "americas",
            title: "Americas",
            description: "From NYC weekends to Andean escapes—urban buzz & wild nature.",
            image: americasImg,
            onClick: "americas",
            bannerName: "americas-banner",
        },
        {
            key: "oceania",
            title: "Oceania",
            description: "Coastal road trips, wine regions, and epic alpine scenery.",
            image: anzImg,
            onClick: "Oceania",
            bannerName: "anzalia-nz-banner",
        },
        {
            key: "africa",
            title: "Africa",
            description: "Souks, desert dunes, and Mediterranean old towns.",
            image: northAfricaImg,
            onClick: "africa",
            bannerName: "africa-banner"
        },
    ];

    return (
        <>
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
                                title={t(`homepage.regions.${item.key}.title`)}
                                description={t(`homepage.regions.${item.key}.description`)}
                                onClick={() => navigate(item.onClick)}
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