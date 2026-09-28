import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCountriesByRegion } from "../api";
import { useTranslation } from "react-i18next";

export default function ItinerarySearchBar({regions}) {
    const [countries, setCountries] = useState([]);
    const [region, setRegion] = useState("");
    const [country, setCountry] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();
    const { t } = useTranslation();

    function slugify(str) {
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')       // spaces → dashes
            .replace(/[^a-z0-9-]/g, ''); // remove other weird chars
    }

    useEffect(() => {
        setCountry("");
        if (!region) { setCountries([]); return; }
        setLoading(true);
        getCountriesByRegion(slugify(region))
            .then(setCountries)
            .finally(() => setLoading(false));
    }, [region]);

    const onSearch = (e) => {
        e.preventDefault();
        nav(`/browse/${slugify(country)}`);
    };

    return (
        <form onSubmit={onSearch} className="w-full rounded-2xl bg-white/20 backdrop-blur-lg p-4 ring-1 ring-white/30 shadow-xl flex flex-col sm:flex-row gap-3">
            {/* Region */}
            <label className="flex-1">
                <span className="block text-[12px] font-semibold text-white/80 mb-2">{t(`itinerarySearchBar.region`)}</span>
                <select
                    value={region}
                    onChange={(e)=>setRegion(e.target.value)}
                    className="w-full bg-white/85 text-slate-800 rounded-md border border-white/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                    <option value="">{t(`itinerarySearchBar.selectARegion`)}</option>
                    {regions.map(r => <option key={r.title} value={r.title}>{toLabel(t(`homepage.regions.${r.key}.title`))}</option>)}
                </select>
            </label>

            {/* Country (depends on region) */}
            <label className="flex-1">
                <span className="block text-[12px] font-semibold text-white/80 mb-2">{t(`itinerarySearchBar.country`)}</span>
                <select
                    value={country}
                    onChange={(e)=>setCountry(e.target.value)}
                    disabled={ loading || countries.length === 0}
                    title={(loading || countries.length === 0) ? "Select a country please" : "" }
                    className="w-full rounded-md border border-white/60 py-2 bg-white/85 text-slate-800 transition disabled:bg-white/60
                     disabled:cursor-not-allowed disabled:text-slate-500 focus:outline-none focus:ring focus:ring-emerald-400"
                >
                    <option value="">{loading ? "Loading…" : "Select a country…"}</option>
                    {countries.map(c => <option key={c} value={c}>{toLabel(t(`itinerarySearchBar.countries.${c}`))}</option>)}
                </select>
            </label>

            <button
                type="submit"
                disabled={!country}
                title={!country ? "Select a country first." : ""}
                className="h-10 sm:h-auto sm:self-end rounded-md bg-yellow-400 hover:bg-yellow-500
                text-slate-900 font-semibold px-5 py-2  disabled:opacity-50 transition ring-1 ring-white/60"
            >
                {t("homepage.explore")}
            </button>
        </form>
    );
}

function toLabel(s) {
    // turn "southeast-asia" -> "Southeast Asia"
    return s.replace(/[-_]/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}
