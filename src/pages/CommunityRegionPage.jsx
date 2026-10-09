import {Link, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {getCommunityCountriesByRegion, getCommunityItinerariesByRegion} from "../api.js";
import "../styles/community-journal.css";

const regionKeys = {
    "southeast-asia": "southeastAsia", "east-asia-community": "eastAsia", "east-asia": "eastAsia",
    europe: "europe", "americas-community": "americas", americas: "americas",
    "anz-community": "oceania", oceania: "oceania", "africa-community": "africa", africa: "africa",
};

function JournalBook({className}) {
    return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M16 7c-4-3-8-3-12-2v20c4-1 8-1 12 2 4-3 8-3 12-2V5c-4-1-8-1-12 2ZM16 7v20M9 4v20M23 4v20"/>
    </svg>;
}

export default function CommunityRegionPage() {
    const {region} = useParams();
    const {t} = useTranslation();
    const [result, setResult] = useState({region: null, status: "loading", countries: [], itineraries: []});
    const [retry, setRetry] = useState(0);
    const current = result.region === region ? result : {status: "loading"};
    const regionKey = regionKeys[region.toLowerCase()];
    const regionName = regionKey ? t(`communityTripsPage.${regionKey}.title`) : region;

    useEffect(() => {
        let active = true;
        setResult({region, status: "loading", countries: [], itineraries: []});
        Promise.all([getCommunityCountriesByRegion(region), getCommunityItinerariesByRegion(region)])
            .then(([countries, itineraries]) => {
                if (!Array.isArray(countries) || !Array.isArray(itineraries)) throw new Error("Invalid community response");
                if (active) setResult({region, status: "ready", countries, itineraries});
            })
            .catch(() => {
                if (active) setResult({region, status: "error", countries: [], itineraries: []});
            });
        return () => { active = false; };
    }, [region, retry]);

    const countryNames = current.status === "ready"
        ? [...new Set([...current.countries, ...current.itineraries.map(item => item.country).filter(Boolean)])]
        : [];

    return <main className="community-journal" aria-labelledby="community-journal-title">
        <section className="community-journal-paper" aria-busy={current.status === "loading"}>
            <div className="community-journal-mastline"><span>{t("communityJournal.identity")}</span><JournalBook/></div>
            <header className="community-journal-heading">
                <h1 id="community-journal-title">{t("communityJournal.heading")}</h1>
                <p>{t("communityJournal.introduction", {region: regionName, interpolation: {escapeValue: false}})}</p>
            </header>
            {current.status === "loading" && <div className="community-journal-state" role="status">{t("routeLoad.loading")}</div>}
            {current.status === "error" && <div className="community-journal-state">
                <p role="alert">{t("communityJournal.failed")}</p>
                <button type="button" className="community-journal-action" onClick={() => setRetry(value => value + 1)}>{t("itineraryLoad.retry")}</button>
            </div>}
            {current.status === "ready" && (current.itineraries.length === 0
                ? <div className="community-journal-state community-journal-empty">
                    <JournalBook className="community-journal-book"/>
                    <h2>{t("communityJournal.emptyHeading")}</h2>
                    <p>{t("communityJournal.emptyDescription")}</p>
                    <Link className="community-journal-action" to="/create-itinerary">{t("communityJournal.share")} <span aria-hidden="true">→</span></Link>
                </div>
                : <div className="community-journal-entries">
                    {countryNames.map(country => {
                        const entries = current.itineraries.filter(item => item.country?.toLowerCase() === country.toLowerCase());
                        if (!entries.length) return null;
                        return <section className="community-journal-country" key={country}>
                            <h2>{t(`itinerarySearchBar.countries.${country}`, {defaultValue: country})}</h2>
                            <ul>{entries.map(item => <li key={item.slug}>
                                <Link to={`/user-itinerary/${item.slug}`}>{item.title || t("communityJournal.read")}</Link>
                                {item.summary && <p>{item.summary}</p>}
                            </li>)}</ul>
                        </section>;
                    })}
                    {current.itineraries.filter(item => !item.country).map(item => <p key={item.slug}><Link to={`/user-itinerary/${item.slug}`}>{item.title || t("communityJournal.read")}</Link></p>)}
                </div>)}
            <p className="community-journal-closing">{t("communityJournal.closing")}</p>
        </section>
    </main>;
}
