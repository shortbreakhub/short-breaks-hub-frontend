import {Link, useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";
import paper from "../assets/footer/footer-editorial-clean-master.png";
import "../styles/footer.css";
import {getRegionPath} from "../utils/publicNavigation.js";

export default function Footer() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const navigateAndScroll = (pathname,sectionId) => {

        if (location.pathname !== pathname) {
            navigate(pathname);
            setTimeout(()=>scrollToSection(sectionId), 50);
        } else {
            scrollToSection(sectionId);
        }

    };
    const scrollToSection = (sectionId) => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleRegionLinkClick = (event, pathname) => {
        if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
            return;
        }

        event.preventDefault();
        navigateAndScroll(pathname, 'region-countries');
    };

    const groups = [
        {title: "explore", links: [["southeastAsia", "southeast-asia"], ["europe", "europe"], ["theAmericas", "americas"]]},
        {title: "planAndDiscover", links: [["communityTrips", "/community-itineraries/region"], ["liveWeather", "/live-weather"], ["yourFavourites", "/login"], ["contact", "/contact"]]},
    ];

    return <footer className="journal-footer overflow-hidden" style={{"--journal-paper": `url("${paper}")`}}>
        <div className="journal-pages grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <div className="journal-identity">
                <h2 className="font-serif text-4xl md:text-5xl mb-5">Short Break Hub</h2>
                <p className="font-serif text-lg leading-relaxed">{t("footer.description")}</p>
                <small className="block mt-5 text-xs font-semibold tracking-widest uppercase">{t("footer.slogan")}</small>
            </div>
            {groups.map(group => <nav className="font-serif text-lg" key={group.title} aria-labelledby={`footer-${group.title}`}>
                <h3 className="mb-3 pb-3 text-xs font-semibold tracking-widest uppercase" id={`footer-${group.title}`}>{t(`footer.${group.title}`)}</h3>
                <ul className="list-none p-0 m-0">
                    {group.title === "explore" && <li><button type="button" className="inline-flex items-center min-h-11 hover:underline cursor-pointer" onClick={() => navigateAndScroll("/", "explore")}>{t("footer.allDestinations")}</button></li>}
                    {group.links.map(([label, route]) => <li key={label}><Link className="inline-flex items-center min-h-11 hover:underline"
                        to={group.title === "explore" ? getRegionPath(route) : route}
                        onClick={group.title === "explore" ? event => handleRegionLinkClick(event, getRegionPath(route)) : undefined}
                    >{t(`footer.${label}`)}</Link></li>)}
                </ul>
            </nav>)}
            <section aria-labelledby="footer-newsletter">
                <h3 className="mb-3 pb-3 text-xs font-semibold tracking-widest uppercase" id="footer-newsletter">{t("footer.stayInspired")}</h3>
                <p className="font-serif text-base leading-relaxed">{t("footer.newsletterDescription")}</p>
                <div className="journal-signup flex mt-5">
                    <input className="min-w-0 w-full bg-transparent py-3 text-sm" type="email" aria-label={t("footer.emailPlaceholder")} placeholder={t("footer.emailPlaceholder")}/>
                    <button type="button" className="inline-flex items-center min-h-11 px-2 text-sm font-semibold hover:underline cursor-pointer">{t("footer.subscribe")}</button>
                </div>
            </section>
        </div>
        <div className="journal-closing relative overflow-hidden text-center font-serif">
            <img className="journal-paper pointer-events-none" src={paper} width="1536" height="707" alt="" aria-hidden="true" loading="lazy" decoding="async"/>
            <p className="relative text-2xl leading-relaxed tracking-widest uppercase">{t("homeMagazine.hero.lineOne")} {t("homeMagazine.hero.lineTwo")}</p>
            <svg className="relative mx-auto max-w-full" width="320" height="22" viewBox="0 0 320 22" aria-hidden="true"><path d="M3 16 Q85 -3 161 12 T317 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
        </div>
        <div className="journal-colophon max-w-7xl mx-auto flex flex-col items-start sm:flex-row sm:items-center justify-between gap-5">
            <p className="text-xs">{t("footer.copyright")}</p>
            <nav className="flex flex-wrap gap-6 text-xs" aria-label={t("footer.legal")}><Link className="inline-flex items-center min-h-11 hover:underline" to="/privacy">{t("footer.privacy")}</Link><Link className="inline-flex items-center min-h-11 hover:underline" to="/terms">{t("footer.terms")}</Link></nav>
        </div>
    </footer>;
}
