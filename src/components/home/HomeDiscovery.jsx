import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getCountriesByRegion} from "../../api.js";
import {getCountryBrowsePath} from "../../utils/publicNavigation.js";
import {REGIONS} from "../../config/regions.js";
import {Action, Field} from "../ui/EditorialUI.jsx";

// The existing Region → Country API and canonical country navigation, with a new presentation.
export default function HomeDiscovery() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [region, setRegion] = useState("");
    const [country, setCountry] = useState("");
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let ignore = false;
        setCountries([]); setFailed(false);
        if (!region) {setLoading(false); return;}
        setLoading(true);
        getCountriesByRegion(region).then(data => {if (!ignore) setCountries(data);})
            .catch(() => {if (!ignore) setFailed(true);})
            .finally(() => {if (!ignore) setLoading(false);});
        return () => {ignore = true;};
    }, [region, attempt]);
    return <form className="home-discovery" aria-label={t("homeMagazine.discovery.title")} onSubmit={event => {
        event.preventDefault(); if (country && countries.includes(country)) navigate(getCountryBrowsePath(country));
    }}>
        <div className="discovery-intro"><span className="sbh-kicker">{t("homeMagazine.discovery.kicker")}</span><p>{t("homeMagazine.discovery.title")}</p></div>
        <Field id="home-region" as="select" label={t("itinerarySearchBar.region")} value={region} onChange={event => {setCountry(""); setRegion(event.target.value);}}>
            <option value="">{t("itinerarySearchBar.selectARegion")}</option>
            {REGIONS.map(item => <option key={item.key} value={item.onClick}>{t(`homepage.regions.${item.key}.title`)}</option>)}
        </Field>
        <Field id="home-country" as="select" label={t("itinerarySearchBar.country")} value={country} disabled={!region || loading || failed} onChange={event => setCountry(event.target.value)}>
            <option value="">{t(loading ? "homeMagazine.discovery.loading" : "homeMagazine.discovery.chooseCountry")}</option>
            {countries.map(name => <option key={name} value={name}>{t(`itinerarySearchBar.countries.${name}`, {defaultValue: name})}</option>)}
        </Field>
        <Action type="submit" disabled={!country || loading || failed}>{t("homeMagazine.discovery.action")} <span aria-hidden="true">→</span></Action>
        {loading && <span className="discovery-feedback sbh-meta" role="status">{t("homeMagazine.discovery.loading")}</span>}
        {failed && <div className="discovery-feedback"><p role="alert">{t("homeMagazine.discovery.failed")}</p><Action variant="quiet" onClick={() => setAttempt(value => value + 1)}>{t("itineraryLoad.retry")}</Action></div>}
    </form>;
}
