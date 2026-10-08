import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {HOME_PAGE_METADATA} from "../utils/pageMetadata.js";
import {REGIONS} from "../config/regions.js";
import {getOfficialItineraryPath, getRegionPath} from "../utils/publicNavigation.js";
import stories from "../content/homepage.json";
import {homepageImages} from "../utils/homepageImages.js";
import {optimizedImages} from "../utils/optimizedImages.js";
import {Action, Container, EditorialSurface, Media, Metadata, SectionHeader} from "../components/ui/EditorialUI.jsx";
import AtlasStage from "../components/home/AtlasStage.jsx";
import TravelJournalChapters from "../components/home/TravelJournalChapters.jsx";
import HomeDiscovery from "../components/home/HomeDiscovery.jsx";
import "../styles/homepage.css";

function Story({item}) {
    const {t, i18n} = useTranslation();
    const copy = item.copy[i18n.resolvedLanguage === "fr" ? "fr" : "en"];
    const image = homepageImages[item.key];
    const dimensions = item.variants.at(-1);
    return <article className="home-story">
        <Link to={getOfficialItineraryPath(item.slug)} className="story-image-link" tabIndex={-1}>
            <Media {...image} alt={t(`homeMagazine.photos.${item.key}`)} width={dimensions.width} height={dimensions.height}
                ratio="16 / 10" sizes="(min-width: 1024px) 380px, (min-width: 768px) 40vw, 44vw" />
        </Link>
        <div className="home-story-copy">
            <p className="sbh-kicker">{item.city} <span aria-hidden="true">/</span> {t(`itinerarySearchBar.countries.${item.country}`)}</p>
            <h3><Link to={getOfficialItineraryPath(item.slug)}>{copy.title}</Link></h3>
            <Metadata items={[t("homeMagazine.duration", {count: item.days}), t("homeMagazine.curated")]} />
        </div>
    </article>;
}

export default function HomePage() {
    const {t, i18n} = useTranslation();
    return <EditorialSurface className="home-page" lang={i18n.resolvedLanguage === "fr" ? "fr" : "en"}>
        <PageCanonical segments={[]} />
        <PageMetadata canonicalSegments={[]} {...HOME_PAGE_METADATA} />
        <main>
            <section id="home" className="home-hero" aria-labelledby="home-title">
                <Container>
                    <div className="home-opening">
                        <div className="home-copy">
                            <p className="sbh-kicker">{t("homeMagazine.hero.eyebrow")}</p>
                            <h1 id="home-title"><span>{t("homeMagazine.hero.lineOne")}</span>{" "}<em>{t("homeMagazine.hero.lineTwo")}</em></h1>
                            <p className="home-intro">{t("homeMagazine.hero.description")}</p>
                            <a href="#editors-picks" className="home-story-jump">{t("homeMagazine.hero.stories")} <span aria-hidden="true">↘</span></a>
                        </div>
                        <AtlasStage />
                    </div>
                    <HomeDiscovery />
                </Container>
            </section>
            <div className="home-bridge"><Container><p>{t("homeMagazine.bridge")} <span aria-hidden="true">✦</span> {t("homeMagazine.bridgeEnd")}</p></Container></div>
            <TravelJournalChapters items={stories.slice(0, 3)} />
            <section className="home-editorial home-itineraries" aria-labelledby="itineraries-title">
                <Container>
                    <SectionHeader id="itineraries-title" eyebrow={t("homeMagazine.itineraries.eyebrow")} title={t("homeMagazine.itineraries.title")}
                        description={t("homeMagazine.itineraries.description")} />
                    <div className="home-itinerary-layout">{[stories[5], stories[3], stories[4]].map((item, index) => <div key={item.key}>
                        <span className="home-story-number" aria-hidden="true">0{index + 1}</span><Story item={item} />
                    </div>)}</div>
                </Container>
            </section>
            <section id="explore" className="home-editorial home-regions" aria-labelledby="regions-title">
                <Container><div className="home-region-layout">
                    <div className="home-region-intro"><p className="sbh-kicker">{t("homeMagazine.regions.eyebrow")}</p>
                        <h2 id="regions-title" className="sbh-section-title">{t("homeMagazine.regions.title")}</h2><p>{t("homeMagazine.regions.description")}</p>
                        <Media {...optimizedImages.southeast} alt={t("homeMagazine.photos.southeast")} width={960} height={640} ratio="4 / 3" sizes="(min-width: 768px) 390px, 92vw" />
                    </div>
                    <ul className="home-region-list">{REGIONS.map((region, index) => <li key={region.key}>
                        <Link to={getRegionPath(region.onClick)}><span className="region-number" aria-hidden="true">0{index + 1}</span><div>
                            <h3>{t(`homepage.regions.${region.key}.title`)}</h3><p>{t(`homepage.regions.${region.key}.description`)}</p>
                        </div><span aria-hidden="true">↗</span></Link>
                    </li>)}</ul>
                </div></Container>
            </section>
            <section className="home-planning" aria-labelledby="planning-title">
                <Container><div className="home-planning-layout"><div><p className="sbh-kicker">{t("homeMagazine.planning.eyebrow")}</p>
                    <h2 id="planning-title">{t("homeMagazine.planning.title")}</h2><p>{t("homeMagazine.planning.description")}</p>
                    <Action to={getOfficialItineraryPath(stories[0].slug)}>{t("homeMagazine.planning.action")} <span aria-hidden="true">→</span></Action>
                </div><ol>{["discover", "plan", "stay"].map((key, index) => <li key={key}><span aria-hidden="true">0{index + 1}</span><div><h3>{t(`homeMagazine.planning.${key}.title`)}</h3><p>{t(`homeMagazine.planning.${key}.description`)}</p></div></li>)}</ol></div></Container>
            </section>
        </main>
    </EditorialSurface>;
}
