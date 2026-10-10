import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import stamp from "../../assets/user-center/journal-stamp.png";
import "../../styles/travel-journal.css";

export const sections = ["overview", "favorites", "published-itineraries", "draft-itineraries", "settings"];
export function JournalIcon({index = 0}) {
    const paths = ["M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10", "M12 21S2 14 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 6-10 13-10 13Z", "M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v16", "M6 2h8l5 5v15H6ZM14 2v6h5M9 12h7M9 16h7", "M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"];
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={paths[index]}/></svg>;
}

export default function TravelJournalLayout({section, children}) {
    const {t} = useTranslation();
    return <main className="travel-journal" aria-labelledby="journal-title">
        <div className="journal-workspace">
        <header className="journal-header">
            <div><h1 id="journal-title">{t("travelJournal.title")}</h1><p>{t("travelJournal.subtitle")}</p></div>
            <Link className="journal-action" to="/create-itinerary">{t("travelJournal.create")}</Link>
        </header>
        <nav className="journal-navigation" aria-label={t("travelJournal.navigation")}>
            {sections.map((id, index) => <Link key={id} to={`/profile?tab=${id}`} aria-current={section === id ? "page" : undefined}>
                <JournalIcon index={index}/>{t(`travelJournal.sections.${id}`)}
            </Link>)}
        </nav>
        <div id="journal-section" className="journal-section">{children}</div>
        <footer className="travel-journal-closing"><span>{t("travelJournal.closing")}</span><img src={stamp} width="1536" height="1024" alt="" aria-hidden="true" loading="lazy"/></footer>
        </div>
    </main>;
}
