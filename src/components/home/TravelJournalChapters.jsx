import React, {useEffect, useId, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Media, Metadata} from "../ui/EditorialUI.jsx";
import {homepageImages} from "../../utils/homepageImages.js";
import {getOfficialItineraryPath} from "../../utils/publicNavigation.js";
import photoMask from "../../assets/homepage/journal-photo-mask.svg?no-inline";
import paper from "../../assets/footer/footer-editorial-clean-master.png";

export default function TravelJournalChapters({items}) {
    const {t, i18n} = useTranslation();
    const id = useId();
    const [Marks, setMarks] = useState(null);
    // Only decorative sketches are deferred. All stories, links and photo frames prerender.
    useEffect(() => {
        const timer = setTimeout(() => import("./JournalMarks.jsx").then(module => {
            setMarks(() => module.default);
        }).catch(() => {}), 200);
        return () => {clearTimeout(timer);};
    }, []);
    return <section id="editors-picks" className="home-editorial home-picks" aria-labelledby="picks-title" style={{color: "#25474a", "--sbh-radius-card": 0, "--sbh-link": "#25474a", "--sbh-card-title": "clamp(1.5rem, 2.1vw, 1.875rem)", "--journal-paper": `url("${paper}")`}}>
        <div className="sbh-container">
            <header className="text-center mb-6 relative">
                <p className="sbh-kicker">{t("homeMagazine.picks.eyebrow")}</p>
                <h2 id="picks-title" className="sbh-section-title my-2">{t("homeMagazine.picks.title")}</h2>
                <p className="font-serif text-base max-w-2xl mx-auto">{t("homeMagazine.picks.description")}</p>
                {Marks && <Marks kind="stamp" label={`${t("homeMagazine.hero.lineOne")} ${t("homeMagazine.hero.lineTwo")}`}/>}
            </header>
            <ol className="list-none m-0 p-0">{items.map((item, index) => {
                const copy = item.copy[i18n.resolvedLanguage === "fr" ? "fr" : "en"], dimensions = item.variants.at(-1);
                const path = getOfficialItineraryPath(item.slug);
                return <li key={item.key}><hr className="m-0"/><article className="journal-chapter relative grid md:grid-cols-2 gap-8 items-center py-6" aria-labelledby={`${id}-${item.key}`}>
                    <figure className={`relative m-0 ${index === 1 ? "md:order-2" : ""}`}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"><path d="M4 28Q54 0 171 12L561 20 592 79 578 276 438 292 71 282 9 246Z" fill="#a9c7c7" opacity=".42"/></svg>
                        <Link to={path} tabIndex={-1} className="relative block" style={{maskImage: `url("${photoMask}")`, maskSize: "100% 100%"}}>
                            <Media {...homepageImages[item.key]} alt={t(`homeMagazine.photos.${item.key}`)} width={dimensions.width} height={dimensions.height}
                                ratio="2 / 1" position={item.key === "paris" ? "center top" : "center"} sizes="(min-width: 1280px) 610px, (min-width: 768px) 46vw, 92vw"/>
                        </Link>
                        {Marks && <Marks kind={item.key} note={t(`homeMagazine.picks.notes.${item.key}`)}/>}
                        {Marks && item.key === "tokyo" && <Marks kind="blossoms"/>}
                    </figure>
                    <div className="flex gap-4 min-w-0">
                        <span className="font-serif italic" style={{color: "#946a1e", fontSize: "3rem"}} aria-hidden="true">0{index + 1}<svg width="45" height="8" aria-hidden="true"><path d="M0 4H45" stroke="currentColor"/></svg></span>
                        <div className="min-w-0">
                            <p className="sbh-kicker mb-2">{item.city} / {t(`itinerarySearchBar.countries.${item.country}`)}</p>
                            <h3 id={`${id}-${item.key}`} className="sbh-card-title mb-2"><Link to={path} tabIndex={-1}>{copy.title}</Link></h3>
                            <p className="font-serif text-base leading-relaxed">{copy.summary.split(/(?<=\.)\s/)[0]}</p>
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                                <Metadata items={[t("homeMagazine.duration", {count: item.days}), t("homeMagazine.curated")]}/>
                                <Link to={path} className="chapter-action sbh-link inline-flex items-center min-h-11 font-serif" aria-describedby={`${id}-${item.key}`}>{t("homeMagazine.picks.storyLink")} <span aria-hidden="true">　→</span></Link>
                            </div>
                        </div>
                    </div>
                </article></li>;
            })}</ol>
        </div>
    </section>;
}
