import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {loadSubFolderImages} from "../../utils/loadItineraryImage.js";
import {getOfficialItineraryPath} from "../../utils/publicNavigation.js";
import emptyFavorites from "../../assets/user-center/empty-favorites.png";
import emptyPublished from "../../assets/user-center/empty-published.png";
import emptyDrafts from "../../assets/user-center/empty-drafts.png";

export function ResourceState({resource, children}) {
    const {t} = useTranslation();
    if (resource.status === "loading") return <p role="status">{t("travelJournal.loading")}</p>;
    if (resource.status === "error") return <div role="alert"><p>{t("travelJournal.failed")}</p><button className="journal-link" onClick={resource.retry}>{t("travelJournal.retry")}</button></div>;
    return children;
}

export function JournalEmptyState({kind}) {
    const {t} = useTranslation();
    const images = {favorites: emptyFavorites, published: emptyPublished, drafts: emptyDrafts};
    return <div className="journal-empty">
        <img src={images[kind]} width="1536" height="1024" alt="" aria-hidden="true" loading="lazy"/>
        <h3>{t(`travelJournal.empty.${kind}.title`)}</h3><p>{t(`travelJournal.empty.${kind}.description`)}</p>
        <Link className="journal-link" to={kind === "favorites" ? "/#explore" : "/create-itinerary"}>{t(kind === "favorites" ? "travelJournal.explore" : "travelJournal.create")} →</Link>
    </div>;
}

export function JournalEntry({item, kind, onDiscard}) {
    const {t, i18n} = useTranslation();
    const draft = kind === "drafts";
    const path = kind === "official" ? getOfficialItineraryPath(item.slug) : !draft && item.visibility === "PUBLIC" ? `/user-itinerary/${item.slug}` : null;
    const parts = typeof item.hero === "string" ? item.hero.split("/") : [];
    const photo = kind === "official" ? loadSubFolderImages(parts.slice(3,-1).join("/"), (parts.at(-1) || "").replace(/\.[^.]+$/, "")) : item.coverPhoto;
    return <li className="journal-entry">
        {photo && <img src={photo} alt="" width="640" height="400" loading="lazy"/>}
        <div><h3>{path ? <Link to={path}>{item.title}</Link> : item.title || t("travelJournal.untitled")}</h3>
            <p className="journal-meta">{item.country}{item.days != null && <> · {t("travelJournal.days", {count:item.days})}</>}{item.visibility && <> · {t(`travelJournal.visibility.${item.visibility}`, {defaultValue:item.visibility})}</>}</p>
            {item.summary && <p>{item.summary}</p>}
            {item.lastUpdatedAt && <p className="journal-meta">{t("travelJournal.updated")} {new Date(item.lastUpdatedAt).toLocaleDateString(i18n.resolvedLanguage === "fr" ? "fr-FR" : "en-GB")}</p>}
            {!draft && !path && <p className="journal-meta">{t("travelJournal.privateDetail")}</p>}
            {draft && <div className="journal-entry-actions"><Link className="journal-action" to={`/create-itinerary?draftId=${encodeURIComponent(item.id)}`}>{t("travelJournal.continue")}</Link><button className="journal-link" onClick={() => onDiscard(item)}>{t("travelJournal.discard")}</button></div>}
        </div>
    </li>;
}

export default function JournalCollection({resource, kind, page, setPage, onDiscard}) {
    const {t} = useTranslation();
    const data = resource.data;
    const items = kind === "drafts" ? data : data?.content;
    return <ResourceState resource={resource}>
        {items?.length ? <ul className="journal-entries">{items.map(item => <JournalEntry key={item.id ?? item.slug} item={item} kind={kind} onDiscard={onDiscard}/>)}</ul> : <JournalEmptyState kind={kind === "official" || kind === "community" ? "favorites" : kind}/>}
        {data?.totalPages > 1 && <nav className="journal-pagination" aria-label={t("travelJournal.pagination")}>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>{t("travelJournal.previous")}</button>
            <span>{t("travelJournal.page", {current:page+1,total:data.totalPages})}</span>
            <button disabled={page+1 >= data.totalPages} onClick={() => setPage(page+1)}>{t("travelJournal.next")}</button>
        </nav>}
    </ResourceState>;
}
