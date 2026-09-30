import { useParams,useNavigate } from "react-router-dom";
import ItineraryDayAccordion from "../components/ItineraryDayAccordion";
import React, {useState, useMemo, useEffect} from "react";
import {getItineraryBySlug, getFavoritesCount, getFavoritesMe, postFavorite, deleteFavorite, getMe} from "../api.js";
import Lottie from "lottie-react";
import LoadingAnimation from "../assets/loading-animation.json";
import {showToast} from "../utils/toast.js";
import CommentsSection from "../components/Comments";
import {loadSubFolderImages} from "../utils/loadImage.js";
import {isExpired} from "../utils/jwtParser.js";
import getCurrencyCode from "../utils/countryToCurrency.js";
import axios from "axios";
import TravelTips from "../components/TravelTips.jsx";
import FoodRecommendations from "../components/FoodRecommendations";
import TransportTips from "../components/TransportTips.jsx"
import CurrencyConverter from "../components/CurrencyConverter.jsx";
import TripPrepRail from "../components/TripPrepRail";
import { useTranslation } from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {getItineraryPageMetadata} from "../utils/pageMetadata.js";


export default function ItineraryPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [data,setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [userCurrency, setUserCurrency] = useState("USD");
    const [userCurrencyValue, setUserCurrencyValue] = useState(0);
    const [convertRate, setConvertRate] = useState(1);
    const [fromAmount, setFromAmount] = useState("100");
    const [likes, setLikes] = React.useState({
        liked: false,
        count: 0,
        saving: false,
    });
    const [showSmartSuggestions, setShowSmartSuggestions] = React.useState(true);
    const [prepDone, setPrepDone] = useState(() => {
        const saved = localStorage.getItem("tripPrepStatus");
        return saved
            ? JSON.parse(saved)
            : {
                hotel: false,
                flights: false,
                insurance: false,
                airport: false,
                localTransport: false,
                car: false,
                docs: false,
            };
    });


    const [planning, setPlanning] = useState(null)
    const [transport, setTransport] = useState(null)

    const { i18n } = useTranslation();
    const lang = i18n.resolvedLanguage ?? "en";
    const { t } = useTranslation();
    const pageMetadata = getItineraryPageMetadata(data, slug);

    function toLocalISO(d) {
        const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return t.toISOString().slice(0, 10);
    }

    function toggleLike() {
        if (likes.saving) return;

        setLikes(s => ({ ...s, saving: true }));

        const prev = likes;
        const optimistic = prev.liked
            ? { liked: false, count: Math.max(0, prev.count - 1) }
            : { liked: true,  count: prev.count + 1 };

        setLikes(s => ({ ...s, ...optimistic }));

        const req = optimistic.liked
            ? postFavorite(data.id)
            : deleteFavorite(data.id);

        req.then(() => {
            setLikes(s => ({ ...s, saving: false }));
        })
            .catch(err => {

                setLikes({ ...prev, saving: false });
                if (err?.response?.status === 401) {
                    showToast("Please log in to like itineraries", { variant: "error" });

                } else {
                    showToast("Failed to update like", { variant: "error" });
                }
            });


    }

    function unslug(s) {
        return s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    }

    function markPrepDone(id) {
        setPrepDone((prev) => ({ ...prev, [id]: true }));

    }

    function resetPrep() {
        setPrepDone({
            hotel: false,
            flights: false,
            insurance: false,
            airport: false,
            localTransport: false,
            docs: false,
        });
    }

    function markAllPrepDone() {
        setPrepDone({
            hotel: true,
            flights: true,
            insurance: true,
            airport: true,
            localTransport: true,
            docs: true,
        });
    }


    const today = new Date();
    const defaultIn = new Date(today);
    defaultIn.setDate(today.getDate() + 14);

    const defaultOut = new Date(defaultIn);
    defaultOut.setDate(defaultIn.getDate() + 3);

    const [checkIn, setCheckIn]   = useState(toLocalISO(defaultIn));
    const [checkOut, setCheckOut] = useState(toLocalISO(defaultOut));

    useEffect(() => {
        getItineraryBySlug(slug,lang).then(
            (data) => {
                setData(data);
                setPlanning({
                    city: data.planningCity,
                    bestTime: {
                        months: data.bestTimeMonths,
                        note: data.bestTimeNote
                    },
                    worstTime: {
                        months: data.worstTimeMonths,
                        note: data.worstTimeNote
                    },
                    tips: data.tips,
                    withKids: data.withKids
                })
                setTransport({
                    arrival: data.arrival,
                    gettingAround: data.gettingAround,
                    dayTrips: data.dayTrips,
                    dayMoves: data.dayMoves,
                    practical: data.practical
                })
                setLoading(false);
                axios.get(`https://v6.exchangerate-api.com/v6/${import.meta.env.VITE_EXCHANGERATE_API_KEY}/latest/${getCurrencyCode(unslug(data.region), data.country)["Base Code"]}`).then(
                    (res) => {
                        const token = localStorage.getItem("authToken");
                        if (token) {
                            getMe().then((data) => {
                                if (data.currency) {
                                    setUserCurrency(data.currency);
                                }
                                setConvertRate(res.data.conversion_rates[userCurrency]);
                            })
                        }
                        else {
                            setConvertRate(res.data.conversion_rates["USD"]);
                        }
                    }
                )
            }
        );

    }, [slug,lang]);

    useEffect(() => {
        if (!data?.id) return

        getFavoritesCount(data.id).then(({count}) => {
            setLikes(s => ({ ...s, count: count || 0 }))
        }).catch(err => console.log(err));

        const token = localStorage.getItem("authToken");
        if (!token || isExpired(token)) {
            return;
        }

        getFavoritesMe(data.id).then(
            ({liked}) => {
                console.log(liked);
                setLikes(s => ({ ...s, liked: !!liked }))
            }
        ).catch(err => console.log(err));

    }, [data?.id]);

    useEffect(() => {
        if(!convertRate) return;
        setUserCurrencyValue((convertRate * 100).toFixed(2));
    },[convertRate])

    useEffect(() => {
        localStorage.setItem(
            "tripPrepStatus",
            JSON.stringify(prepDone)
        );
    }, [prepDone]);


    const city = data.city;

    const tripPrepItems = React.useMemo(() => {
        return [
            {
                id: "hotel",
                title: t("itineraryPage.findHotels"),
                hint: t("itineraryPage.hotelHint"),
                ctaLabel: t("itineraryPage.findHotels"),
                done: prepDone.hotel,
                onFind: () => console.log("affiliate: hotels", { city, checkIn, checkOut }),
            },
            {
                id: "flights",
                title: t("itineraryPage.findFlights"),
                hint: t("itineraryPage.flightsHint"),
                ctaLabel:  t("itineraryPage.findFlights"),
                done: prepDone.flights,
                onFind: () => console.log("affiliate: flights", { city, checkIn, checkOut }),
            },
            {
                id: "insurance",
                title: t("itineraryPage.compareInsurance"),
                hint:  t("itineraryPage.insuranceHint"),
                ctaLabel:  t("itineraryPage.compareInsurance"),
                done: prepDone.insurance,
                onFind: () => console.log("affiliate: insurance", { city, checkIn, checkOut }),
            },
            {
                id: "airport",
                title: t("itineraryPage.findParking"),
                hint:  t("itineraryPage.airportHint"),
                ctaLabel:  t("itineraryPage.findParking"),
                done: prepDone.airport,
                onFind: () => console.log("affiliate: airport", { city, checkIn }),
            },

            {
                id: "car",
                title: t("itineraryPage.findCarRentals"),
                hint: t("itineraryPage.carHint"),
                ctaLabel:  t("itineraryPage.findCarRentals"),
                done: prepDone.car,
                onFind: () => console.log("affiliate: car rental", { city, checkIn, checkOut }),
            },

            {
                id: "localTransport",
                title:  t("itineraryPage.planTransport"),
                hint:  t("itineraryPage.localTransportHint"),
                ctaLabel:  t("itineraryPage.planTransport"),
                done: prepDone.localTransport,
                onFind: () => console.log("affiliate: local transport", { city }),
            },
            {
                id: "docs",
                title:  t("itineraryPage.checkRequirements"),
                hint:  t("itineraryPage.docsHint"),
                ctaLabel:  t("itineraryPage.checkRequirements"),
                done: prepDone.docs,
                onFind: () => console.log("affiliate: docs", { country: data?.country }),
            },
        ];
    }, [prepDone, city, checkIn, checkOut, data?.country,lang]);


    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white">
                <PageCanonical segments={["itinerary", data?.slug || slug]} />
                <PageMetadata canonicalSegments={["itinerary", data?.slug || slug]} {...pageMetadata} />
                <div className="w-[1000px] h-[1000px] mt-[250px] ml-[20px] xl:ml-[650px] md:ml-[250px] lg:ml-[400px]">
                    <Lottie animationData={LoadingAnimation} loop={true} />
                </div>
            </div>
        )
    }


    if (!data) {
        return (
            <div className="max-w-screen-lg mx-auto px-4 py-16">
                <h1 className="text-2xl font-bold mb-4">Itinerary not found</h1>
                <button onClick={() => navigate(-1)} className="text-yellow-700 underline">
                    Go back
                </button>
            </div>
        );
    }


    return (
        <>
            <PageCanonical segments={["itinerary", data?.slug || slug]} />
            <PageMetadata canonicalSegments={["itinerary", data?.slug || slug]} {...pageMetadata} />

            <main className="min-h-screen bg-gray-50">

                <section
                    className="relative h-[42vh] md:h-[55vh] bg-center bg-cover"
                    style={{ backgroundImage: `url(${loadSubFolderImages(data.hero.split("/")[3] + "/"+data.hero.split("/")[4],data.hero.split("/")[5].split(".")[0])})` }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 h-full flex items-center">
                        <div className="max-w-screen-xl mx-auto px-4 md:px-6 pb-8 mt-[12vh]">
                            <h1 className="text-white text-3xl md:text-5xl font-extrabold drop-shadow">
                                {data.title}
                            </h1>
                            <p className="text-white/90 mt-8">
                                {data.country} · {data.days} {t("itineraryPage.days")} · {t("itineraryPage.from")} ${data.priceFrom} {t("itineraryPage.perPerson")}
                            </p>

                            <p className="text-white/70 text-sm mt-2">
                                {t("itineraryPage.excludes")}
                            </p>

                        </div>
                    </div>
                </section>

                <section className="max-w-screen-xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-8">
                    <article className="md:col-span-2">

                        <div className="mt-2 flex items-center gap-3">
                            <h2 className="text-xl font-bold mb-3">{t("itineraryPage.highlights")}</h2>
                            <button
                                type="button"
                                onClick={toggleLike}
                                disabled={likes.saving}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-3 text-sm transition
                                          ${likes.liked ? "border-rose-300 text-rose-600" : "border-slate-300 text-slate-600"}
                                          ${likes.saving ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"}`}
                                aria-pressed={likes.liked}
                                aria-label={likes.liked ? "Unlike this itinerary" : "Like this itinerary"}
                                title={likes.liked ? "Unlike" : "Like"}
                            >
                                <span aria-hidden="true">{likes.liked ? "♥" : "♡"}</span>
                                <span>{likes.count}</span>
                            </button>

                            <span className="text-xs text-slate-500 mb-3">{t("itineraryPage.like")}</span>
                        </div>


                        <ul className="list-disc pl-6 text-gray-700 space-y-1">
                            {data.highlights?.map((h) => <li key={h}>{h}</li>)}
                        </ul>

                        {
                            planning && <div className="mt-3 pt-4 border-t border-slate-300">
                            <TravelTips data={planning} defaultOpen={false} />
                        </div>
                        }

                        <div className="mt-3">
                            <TransportTips data={transport} defaultOpen={false} />
                        </div>

                        <div className="mt-3">
                            <CurrencyConverter defaultOpen={false}
                                               data={data}
                                               fromAmount = {fromAmount}
                                               userCurrency = {userCurrency}
                                               userCurrencyValue = {userCurrencyValue}
                                               convertRate = {convertRate}
                            />
                        </div>

                        <div className="mt-3 pb-4 border-b border-slate-300">
                            <FoodRecommendations
                                defaultOpen={false}
                                mustTry={data.mustTry}
                                areas={data.areas}
                                places={data.places}
                            />
                        </div>


                        <h2 className="text-xl font-bold mt-8 mb-3">{t("itineraryPage.overview")}</h2>
                        <p className="text-gray-700 leading-relaxed">
                            {data.summary}
                        </p>

                        <h3 className="text-lg font-semibold mt-8 mb-3">{t("itineraryPage.dayByDay")}</h3>
                        <ItineraryDayAccordion schedule={data.schedule} />
                        <div className="space-y-8">
                            <CommentsSection itineraryId={data.id} />
                        </div>
                    </article>


                    <aside>
                        <TripPrepRail
                            items={tripPrepItems}
                            onMarkDone={markPrepDone}
                            onReset={resetPrep}
                            onMarkAllDone={markAllPrepDone}
                            showSmartSuggestions={showSmartSuggestions}
                            onToggleSmartSuggestions={setShowSmartSuggestions}
                        />
                    </aside>

                </section>
            </main>
        </>
    );
}
