import { useParams } from "react-router-dom";
import React, {useState, useMemo, useEffect, useContext, useRef} from "react";
import {getItineraryBySlug, getFavoritesCount, getFavoritesMe, postFavorite, deleteFavorite, getMe} from "../api.js";
import Lottie from "lottie-react";
import LoadingAnimation from "../assets/loading-animation.json";
import {showToast} from "../utils/toast.js";
import {isExpired} from "../utils/jwtParser.js";
import getCurrencyCode from "../utils/countryToCurrency.js";
import axios from "axios";
import ItineraryStoryPage from "../components/itinerary/ItineraryStoryPage.jsx";
import { useTranslation } from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {getItineraryPageMetadata} from "../utils/pageMetadata.js";

import {PrerenderDataContext} from "../context/PrerenderDataContext.jsx";
import {getOfficialBootstrap, getItineraryPlanning, getItineraryTransport} from "../utils/officialItineraries.js";

import {initializeHotelBooking, resolveHotelBooking, changeHotelBooking, validateHotelSearch, buildTripComHotelUrl} from "../utils/hotelBooking.js";

const defaultPreparation = {hotel: false, flights: false, insurance: false, airport: false, localTransport: false, car: false, docs: false};

export default function ItineraryPage() {
    const { slug } = useParams();
    const { i18n, t } = useTranslation();
    const lang = i18n.resolvedLanguage ?? "en";
    const prerenderData = useContext(PrerenderDataContext);
    const bootstrapRef = useRef(getOfficialBootstrap(prerenderData, slug, lang));
    const [data,setData] = useState(() => bootstrapRef.current?.detail || {});
    const [loading, setLoading] = useState(() => !bootstrapRef.current);
    const [loadError, setLoadError] = useState("");
    const [retry, setRetry] = useState(0);
    const [hotelState, setHotelState] = useState(null);
    useEffect(() => { setHotelState(null); }, [slug]);
    const hotelValues = hotelState?.slug === slug ? resolveHotelBooking(hotelState, data.days) : {};
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
    const [prepDone, setPrepDone] = useState(defaultPreparation);
    const [prepRestored, setPrepRestored] = useState(false);
    const planning = useMemo(() => getItineraryPlanning(data), [data]);
    const transport = useMemo(() => getItineraryTransport(data), [data]);

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
        if (getOfficialBootstrap(bootstrapRef.current, slug, lang)) {
            prerenderData?.clear();
            return;
        }
        bootstrapRef.current = null;
        let ignore = false;
        setLoading(true);
        setLoadError("");
        setData({});
        getItineraryBySlug(slug, lang).then(detail => {
            if (ignore) return;
            if (!detail) throw new Error("Empty itinerary response");
            setData(detail);
        }).catch(error => {
            if (!ignore) setLoadError(error?.response?.status === 404 ? "notFound" : "failed");
        }).finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [slug, lang, retry]);

    // Live currency/profile enrichment is independent of detail bootstrap.
    useEffect(() => {
        if (!data?.id) return;
        let ignore = false;
        async function enrichCurrency() {
            const res = await axios.get(`https://v6.exchangerate-api.com/v6/${import.meta.env.VITE_EXCHANGERATE_API_KEY}/latest/${getCurrencyCode(unslug(data.region), data.country)["Base Code"]}`);
            const profile = localStorage.getItem("authToken") ? await getMe() : null;
            if (ignore) return;
            const currency = profile?.currency || "USD";
            setUserCurrency(currency);
            setConvertRate(res.data.conversion_rates[currency]);
        }
        enrichCurrency().catch(error => { if (!ignore) console.error("Unable to load currency rates", error); });
        return () => { ignore = true; };
    }, [data]);

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
        try {
            const saved = JSON.parse(localStorage.getItem("tripPrepStatus") || "null");
            if (saved && typeof saved === "object") {
                setPrepDone(Object.fromEntries(Object.keys(defaultPreparation)
                    .map(key => [key, saved[key] === true])));
            }
        } catch (error) {
            console.error("Unable to restore trip preparation", error);
        }
        setPrepRestored(true);
    }, []);

    useEffect(() => {
        if (!prepRestored) return;
        localStorage.setItem(
            "tripPrepStatus",
            JSON.stringify(prepDone)
        );
    }, [prepDone, prepRestored]);


    const city = data.city;

    const tripPrepItems = React.useMemo(() => {
        return [
            {
                id: "hotel",
                title: t("itineraryPage.findHotels"),
                hint: t("itineraryPage.hotelHint"),
                ctaLabel: t("itineraryPage.findHotels"),
                done: prepDone.hotel,
                onSearch: filters => {
                    const now = new Date();
                    const error = validateHotelSearch(data.hotelDestination, filters, now);
                    if (error) return error;
                    const url = buildTripComHotelUrl(data.hotelDestination, filters, {now});
                    window.open(url, "_blank", "noopener,noreferrer");
                },
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
    }, [prepDone, city, checkIn, checkOut, data?.country, data.hotelDestination,lang]);


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


    if (loadError) {
        return (
            <div className="max-w-screen-lg mx-auto px-4 py-16">
                <PageCanonical segments={["itinerary", slug]} />
                <PageMetadata canonicalSegments={["itinerary", slug]} {...pageMetadata} />
                <h1 role="alert" className="text-2xl font-bold mb-4">{t(`itineraryLoad.${loadError}`)}</h1>
                <button type="button" onClick={() => setRetry(value => value + 1)} className="text-yellow-700 underline">
                    {t("itineraryLoad.retry")}
                </button>
            </div>
        );
    }


    return (
        <>
            <PageCanonical segments={["itinerary", data?.slug || slug]} />
            <PageMetadata canonicalSegments={["itinerary", data?.slug || slug]} {...pageMetadata} />

            <ItineraryStoryPage
                data={data}
                planning={planning}
                transport={transport}
                city={city}
                likes={likes}
                onToggleLike={toggleLike}
                fromAmount={fromAmount}
                userCurrency={userCurrency}
                userCurrencyValue={userCurrencyValue}
                convertRate={convertRate}
                hotelBooking={hotelValues}
                onHotelOpen={() => setHotelState(previous => initializeHotelBooking(previous,
                    {slug, city, days: data.days, hotelDestination: data.hotelDestination}))}
                onHotelChange={(field, value) => setHotelState(previous => changeHotelBooking(previous, field, value, data.days))}
                onHotelReset={() => setHotelState(initializeHotelBooking(null,
                    {slug, city, days: data.days, hotelDestination: data.hotelDestination}))}
                tripPrepItems={tripPrepItems}
                onMarkDone={markPrepDone}
                onReset={resetPrep}
                onMarkAllDone={markAllPrepDone}
                showSmartSuggestions={showSmartSuggestions}
                onToggleSmartSuggestions={setShowSmartSuggestions}
            />
        </>
    );
}
