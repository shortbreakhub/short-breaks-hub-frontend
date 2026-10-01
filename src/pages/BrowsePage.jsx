import React, {useContext, useEffect, useRef, useState} from "react";
import {useParams,useLocation} from "react-router-dom";
import {getItinerariesByCountry, getAllItinerariesByCustomSearch, getItineraryBySlug, getPublicCountryNames} from "../api";
import Lottie from "lottie-react";
import LoadingAnimation from "../assets/loading-animation.json";
import ItineraryCard from "../components/ItineraryCard.jsx";
import {formatSlug} from "../utils/formatSlug.js"
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {getCountryPageMetadata} from "../utils/pageMetadata.js";

import {PrerenderDataContext} from "../context/PrerenderDataContext.jsx";
import {getCountrySlug, getCountryBootstrap, resolveCountryName, toCountryCard} from "../utils/countries.js";

function useQuery() {
    const { search } = useLocation();
    return new URLSearchParams(search);
}

export default function BrowsePage() {
    const {country} = useParams();
    const countrySlug = getCountrySlug(country);
    const {i18n, t} = useTranslation();
    const lang = i18n.resolvedLanguage ?? "en";
    const prerenderData = useContext(PrerenderDataContext);
    const bootstrap = getCountryBootstrap(prerenderData, countrySlug, lang)
        && resolveCountryName(country, prerenderData.countryNames) ? prerenderData : null;
    const bootstrapRef = useRef(bootstrap);
    const countryNamesRef = useRef(prerenderData?.type === "country" ? prerenderData.countryNames : null);
    const [countryName, setCountryName] = useState(() => bootstrap?.countryName || formatSlug(country));
    const [items, setItems] = useState(() => bootstrap?.items || []);
    const [loading, setLoading] = useState(() => !bootstrap);
    const [err, setErr] = useState("");
    const qs = useQuery();
    const initialQ = qs.get("q") || "";
    const [sort, setSort] = useState("days,asc");
    const [daysMin, setDaysMin] = useState(1);
    const [daysMax, setDaysMax] = useState(6);
    const [q, setQ] = React.useState(initialQ);
    const pageMetadata = getCountryPageMetadata(countryName);

    function applyFilters(page = 0) {
        const params = new URLSearchParams();
        if (q?.trim()) params.set("q", q.trim());
        if (daysMin != null) params.set("daysMin", String(daysMin));
        if (daysMax != null) params.set("daysMax", String(daysMax));
        params.set("page", String(page));
        params.set("size", "12");
        if (!countryNamesRef.current) return;
        const apiCountry = resolveCountryName(country, countryNamesRef.current);
        if (!apiCountry) return;
        params.set("country", apiCountry);
        if (sort) params.set("sort", sort);
        getAllItinerariesByCustomSearch(params.toString()).then((res) => {
            setItems(res.content);
        }).catch((err) => console.log(err));
    }

    function clearFilters() {
        window.location.reload();
    }

    function onSubmit(e){
        e.preventDefault();
        applyFilters();
    }


    useEffect(() => {
        // Keep the initial match through effect replays; discard it once route/language changes.
        if (getCountryBootstrap(bootstrapRef.current, countrySlug, lang)
            && resolveCountryName(country, bootstrapRef.current.countryNames)) {
            prerenderData?.clear();
            return;
        }
        bootstrapRef.current = null;
        let ignore = false;
        setLoading(true);
        setItems([]);
        setErr("");

        async function loadCountry() {
            const names = countryNamesRef.current || await getPublicCountryNames();
            if (ignore) return;
            countryNamesRef.current = names;
            const apiCountry = resolveCountryName(country, names);
            if (!apiCountry) throw new Error("Country not found");
            setCountryName(apiCountry);
            const data = await getItinerariesByCountry(apiCountry);
            if (ignore) return;
            const result = await Promise.all(data.map(item =>
                getItineraryBySlug(item.slug, lang).then(toCountryCard)));
            if (!ignore) setItems(result);
        }

        loadCountry()
            .catch(error => { if (!ignore) setErr(error?.message || "Failed to load"); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [country, countrySlug, lang]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white">
                <PageCanonical segments={["browse", countrySlug]} />
                <PageMetadata canonicalSegments={["browse", countrySlug]} {...pageMetadata} />
                <div className="w-[1000px] h-[1000px] mt-[250px] ml-[20px] xl:ml-[650px] md:ml-[250px] lg:ml-[400px]">
                    <Lottie animationData={LoadingAnimation} loop={true} />
                </div>
            </div>
        )
    }

    return (
        <>
            <PageCanonical segments={["browse", countrySlug]} />
            <PageMetadata canonicalSegments={["browse", countrySlug]} {...pageMetadata} />

            <main className="min-h-screen bg-gray-50">
                <section className="max-w-screen-xl mx-auto px-4 py-8">
                    <header className="mb-6">
                        <h1 className="text-2xl font-bold">
                            {t("browsePage.shortBreaksIn")} {countryName ? `— ${countryName}` : ""}
                        </h1>
                    </header>

                    <section className="mb-4 rounded-lg border bg-white p-4">
                        <form className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end" onSubmit={onSubmit}>

                            <label className="md:col-span-4 block">
                                <span className="block text-sm text-slate-600 mb-1">{t("browsePage.keyword")}</span>
                                <input
                                    type="search"
                                    className="w-full h-10 rounded border px-3"
                                    placeholder={t("browsePage.keywordPlaceholder")}
                                    value={q}
                                    onChange={e => setQ(e.target.value)}
                                />
                            </label>


                            <label className="md:col-span-2 block">
                                <span className="block text-sm text-slate-600 mb-1">{t("browsePage.minDays")}</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full h-10 rounded border pr-12 px-3"
                                        value={daysMin ?? ""}
                                        onChange={e => setDaysMin(e.target.value ? +e.target.value : null)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm whitespace-nowrap">{t("browsePage.days")}</span>
                                </div>
                            </label>


                            <label className="md:col-span-2 block">
                                <span className="block text-sm text-slate-600 mb-1">{t("browsePage.maxDays")}</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full h-10 rounded border pr-12 px-3"
                                        value={daysMax ?? ""}
                                        onChange={e => setDaysMax(e.target.value ? +e.target.value : null)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm whitespace-nowrap">{t("browsePage.days")}</span>
                                </div>
                            </label>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-10 px-4 rounded border text-slate-700 hover:bg-slate-50 md:col-span-2 cursor-pointer"
                            >
                                {t("browsePage.clear")}
                            </button>
                            <button
                                type="submit"
                                className="h-10 px-4 rounded bg-amber-500 text-white hover:bg-amber-600 md:col-span-2 cursor-pointer"
                            >
                                {t("browsePage.apply")}
                            </button>
                        </form>

                    </section>



                    {err && <p className="text-red-600">{err}</p>}

                    {!loading && !err && items.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-gray-600 bg-white">
                            <p className="font-semibold mb-1">{t("browsePage.noItinerariesFound")}</p>
                            <p className="text-sm">{t("browsePage.try")}</p>
                        </div>
                    )}

                    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((it) => (
                            <ItineraryCard key={it.slug} it={it} />
                        ))}
                    </ul>
                </section>
            </main>
        </>
    );
}
