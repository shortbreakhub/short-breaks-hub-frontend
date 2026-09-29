import {Link, useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";
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

    return (
        <footer
            className="relative bg-cover bg-center text-white"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >

            <div className="absolute inset-0 bg-slate-950/80" />

            <div className="relative">
                <div className="max-w-7xl mx-auto px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">

                        {/* Brand */}
                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-bold tracking-tight">
                                Short Break Hub
                            </h2>

                            <p className="mt-4 text-sm leading-6 text-white/70 max-w-sm">
                                {t("footer.description")}
                            </p>

                            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-amber-300">
                                {t("footer.slogan")}
                            </p>
                        </div>

                        {/* Explore */}
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                                {t("footer.explore")}
                            </h3>

                            <ul className="mt-5 space-y-3 text-sm text-white/70">
                                <li>
                                    <button
                                        onClick={() => navigateAndScroll("/",'explore')}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.allDestinations")}
                                    </button>
                                </li>

                                <li>
                                    <Link
                                        to={getRegionPath("southeast-asia")}
                                        onClick={(event) => handleRegionLinkClick(event, "/southeast-asia")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.southeastAsia")}
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to={getRegionPath("europe")}
                                        onClick={(event) => handleRegionLinkClick(event, "/europe")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.europe")}
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to={getRegionPath("americas")}
                                        onClick={(event) => handleRegionLinkClick(event, "/americas")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.theAmericas")}
                                    </Link>
                                </li>
                            </ul>
                        </div>


                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                                {t("footer.planAndDiscover")}
                            </h3>

                            <ul className="mt-5 space-y-3 text-sm text-white/70">
                                <li>
                                    <button
                                        onClick={() => navigate("/community-itineraries/region")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.communityTrips")}
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => navigate("/live-weather")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.liveWeather")}
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => navigate("/login")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.yourFavourites")}
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={() => navigate("/contact")}
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        {t("footer.contact")}
                                    </button>
                                </li>
                            </ul>
                        </div>


                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                                {t("footer.stayInspired")}
                            </h3>

                            <p className="mt-5 text-sm leading-6 text-white/70">
                                {t("footer.newsletterDescription")}
                            </p>

                            <div className="mt-5 flex">
                                <input
                                    type="email"
                                    placeholder={t("footer.emailPlaceholder")}
                                    className="min-w-0 flex-1 rounded-l-md border border-white/20
                                       bg-white/10 px-3 py-2.5 text-sm text-white
                                       placeholder:text-white/45 outline-none
                                       focus:border-amber-300"
                                />

                                <button
                                    type="button"
                                    className="rounded-r-md bg-amber-400 px-4 py-2.5
                                       text-sm font-semibold text-slate-950
                                       hover:bg-amber-300 transition-colors"
                                >
                                    {t("footer.subscribe")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col
                            sm:flex-row items-center justify-between gap-4
                            text-xs text-white/55">

                        <p>
                            {t("footer.copyright")}
                        </p>

                        <div className="flex items-center gap-6">
                            <button className="hover:text-white transition-colors"
                                    onClick={() => navigate("/privacy")}>
                                {t("footer.privacy")}
                            </button>

                            <button className="hover:text-white transition-colors"
                                    onClick={() => navigate("/terms")}>
                                {t("footer.terms")}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
