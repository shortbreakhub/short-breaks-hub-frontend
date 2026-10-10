import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import favoritesArt from "../../assets/user-center/stat-favorites.png";
import publishedArt from "../../assets/user-center/stat-published.png";
import draftsArt from "../../assets/user-center/stat-drafts.png";
import accountArt from "../../assets/user-center/stat-member.png";
import avatar from "../../assets/user-center/default-avatar.png";
import exploreArt from "../../assets/user-center/empty-activity.png";
import {JournalEntry, JournalEmptyState, ResourceState} from "./JournalCollection.jsx";

export default function JournalOverview({me, official, community, published, drafts}) {
    const {t} = useTranslation();
    const favoriteReady = official.status === "ready" && community.status === "ready";
    const stats = [
        {id:"favorites",art:favoritesArt,value:favoriteReady ? official.data.totalElements + community.data.totalElements : null,resources:[official,community]},
        {id:"published-itineraries",art:publishedArt,value:published.status === "ready" ? published.data.totalElements : null,resources:[published]},
        {id:"draft-itineraries",art:draftsArt,value:drafts.status === "ready" ? drafts.data.length : null,resources:[drafts]},
    ];
    return <>
        <div className="journal-welcome"><h2>{t("travelJournal.welcome",{name:me.displayName,interpolation:{escapeValue:false}})}</h2><p>{t("travelJournal.welcomeDescription")}</p></div>
        <div className="journal-stats">{stats.map(stat => <section key={stat.id} className="journal-stat" aria-label={t(`travelJournal.sections.${stat.id}`)}>
            <img src={stat.art} width="1536" height="1024" alt="" aria-hidden="true" loading="lazy"/>
            <div><Link to={`/profile?tab=${stat.id}`}>{t(`travelJournal.sections.${stat.id}`)}</Link>
                {stat.value != null ? <strong>{stat.value}</strong> : <span>{t(stat.resources.some(r=>r.status === "error") ? "travelJournal.unavailable" : "travelJournal.loading")}</span>}
                {stat.resources.filter(r=>r.status === "error").map((resource,index)=><button className="journal-link" key={index} onClick={resource.retry}>{t("travelJournal.retry")}</button>)}
            </div>
        </section>)}</div>
        <div className="journal-overview-grid">
            <section className="journal-panel"><div className="journal-panel-heading"><h3>{t("travelJournal.recentOwned")}</h3><Link to="/profile?tab=published-itineraries">{t("travelJournal.viewAll")} →</Link></div>
                <ResourceState resource={published}>{published.data?.content.length ? <ul className="journal-entries">{published.data.content.slice(0,2).map(item=><JournalEntry key={item.id} kind="published" item={item}/>)}</ul> : <JournalEmptyState kind="published"/>}</ResourceState>
            </section>
            <section className="journal-panel"><div className="journal-panel-heading"><h3>{t("travelJournal.continueDraft")}</h3><Link to="/profile?tab=draft-itineraries">{t("travelJournal.viewAll")} →</Link></div>
                <ResourceState resource={drafts}>{drafts.data?.length ? <div className="journal-draft-preview"><h4>{drafts.data[0].title || t("travelJournal.untitled")}</h4>{drafts.data[0].summary && <p>{drafts.data[0].summary}</p>}<Link className="journal-action" to={`/create-itinerary?draftId=${encodeURIComponent(drafts.data[0].id)}`}>{t("travelJournal.continue")}</Link></div> : <JournalEmptyState kind="drafts"/>}</ResourceState>
            </section>
            <section className="journal-panel journal-account"><h3>{t("travelJournal.account")}</h3><img src={me.avatarUrl || avatar} alt={t("travelJournal.avatar")} width="1254" height="1254" loading="lazy" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=avatar;}}/>
                <p>{me.displayName}</p><p>{me.email}</p><Link className="journal-link" to="/profile?tab=settings">{t("travelJournal.editProfile")}</Link>
            </section>
        </div>
        <div className="journal-shortcuts">
            <Link to="/#explore"><img src={exploreArt} width="1536" height="1024" alt="" aria-hidden="true" loading="lazy"/><span>{t("travelJournal.explore")} →</span></Link>
            <Link to="/profile?tab=settings"><img src={accountArt} width="1536" height="1024" alt="" aria-hidden="true" loading="lazy"/><span>{t("travelJournal.sections.settings")} →</span></Link>
        </div>
    </>;
}
