import React, {useCallback, useEffect, useRef, useState} from "react";
import {Navigate, useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Auth} from "../auth.js";
import {isExpired, parseJWT} from "../utils/jwtParser.js";
import {getMe, getMeFavorites, getMeCommunityFavorites, getMeItineraries, getMeSavedDraft, deleteDraft} from "../api.js";
import TravelJournalLayout, {sections} from "../components/user-center/TravelJournalLayout.jsx";
import useJournalResource, {readPage, ownedRecords} from "../components/user-center/useJournalResource.js";
import JournalOverview from "../components/user-center/JournalOverview.jsx";
import JournalCollection, {ResourceState} from "../components/user-center/JournalCollection.jsx";
import JournalSettings from "../components/user-center/JournalSettings.jsx";

export default function ProfilePage() {
    const [,setToken] = useState(()=>Auth.token());
    // Read the current token on every render: App can renew it in this tab.
    const token = Auth.token();
    const [reason,setReason] = useState("");
    const invalidate = useCallback((cause="unauthorized")=>{Auth.clear();setReason(cause);setToken(null);},[]);
    useEffect(()=>{
        const check=()=>setToken(Auth.token());
        window.addEventListener("storage",check);window.addEventListener("focus",check);
        const expires=parseJWT(token)?.exp;
        let timer;
        const expire=()=>{
            const remaining=expires*1000-Date.now();
            if(remaining<=0)invalidate("expired");
            else timer=setTimeout(expire,Math.min(2147483647,remaining));
        };
        if(token && (!Number.isFinite(expires) || isExpired(token)))invalidate("expired");
        else if(expires)expire();
        return ()=>{window.removeEventListener("storage",check);window.removeEventListener("focus",check);clearTimeout(timer);};
    },[token,invalidate]);
    if(!token || !Number.isFinite(parseJWT(token)?.exp) || isExpired(token))return <Navigate to={token ? "/login?reason=expired" : reason ? `/login?reason=${reason}` : "/login"} replace/>;
    return <AuthenticatedJournal key={token} onUnauthorized={invalidate}/>;
}

function AuthenticatedJournal({onUnauthorized}) {
    const {t} = useTranslation();
    const [params] = useSearchParams();
    const section=sections.includes(params.get("tab")) ? params.get("tab") : "overview";
    const [me,setMe] = useState(null);
    const loadMe=useCallback(async()=>{
        const data=await getMe();
        if(!data || !(data.userId ?? data.id))throw new Error("Invalid account response");
        return {...data,userId:data.userId ?? data.id};
    },[]);
    const profile=useJournalResource(loadMe,true,0,onUnauthorized);
    useEffect(()=>{if(profile.status === "ready")setMe(profile.data);},[profile.status,profile.data]);
    const userId=me?.userId;
    const [officialPage,setOfficialPage]=useState(0),[communityPage,setCommunityPage]=useState(0),[publishedPage,setPublishedPage]=useState(0);
    const [favoriteKind,setFavoriteKind]=useState("official");
    useEffect(()=>{if(section === "overview")setPublishedPage(0);},[section]);
    const loadOfficial=useCallback(async page=>readPage(await getMeFavorites({page,size:12})),[]);
    const loadCommunity=useCallback(async page=>readPage(await getMeCommunityFavorites({page,size:12})),[]);
    const loadPublished=useCallback(async page=>{
        const data=readPage(await getMeItineraries({page,size:12}));ownedRecords(data.content,userId);return data;
    },[userId]);
    const loadDrafts=useCallback(async()=>ownedRecords(await getMeSavedDraft(),userId),[userId]);
    const enabled=profile.status === "ready" && !!userId;
    const official=useJournalResource(loadOfficial,enabled,officialPage,onUnauthorized);
    const community=useJournalResource(loadCommunity,enabled,communityPage,onUnauthorized);
    const published=useJournalResource(loadPublished,enabled,publishedPage,onUnauthorized);
    const drafts=useJournalResource(loadDrafts,enabled,0,onUnauthorized);
    const [discard,setDiscard]=useState(null),[deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState(false);
    const busy=useRef(false),cancel=useRef(null),discardTrigger=useRef(null);
    function closeDiscard(){setDiscard(null);discardTrigger.current?.focus();}
    useEffect(()=>{if(discard)cancel.current?.focus();},[discard]);
    useEffect(()=>{setDiscard(null);setDeleteError(false);},[section]);
    async function confirmDelete(){
        if(busy.current || !discard || String(discard.userId)!==String(userId))return;
        busy.current=true;setDeleting(true);setDeleteError(false);
        try {await deleteDraft(discard.id);setDiscard(null);drafts.retry();document.querySelector(".journal-navigation [aria-current=page]")?.focus();}
        catch(error){if([401,403].includes(error?.response?.status))onUnauthorized();else setDeleteError(true);}
        finally {busy.current=false;setDeleting(false);}
    }
    return <TravelJournalLayout section={section}>
        <ResourceState resource={profile}>
            {enabled && <>
                {section !== "overview" && <h2>{t(`travelJournal.sections.${section}`)}</h2>}
                {section === "overview" && <JournalOverview me={me} official={official} community={community} published={published} drafts={drafts}/>}
                {section === "favorites" && <>
                    <div className="journal-favorite-switch" role="group" aria-label={t("travelJournal.favoriteType")}>{["official","community"].map(kind=><button key={kind} aria-pressed={favoriteKind===kind} onClick={()=>setFavoriteKind(kind)}>{t(`travelJournal.${kind}`)}</button>)}</div>
                    <JournalCollection resource={favoriteKind==="official"?official:community} kind={favoriteKind} page={favoriteKind==="official"?officialPage:communityPage} setPage={favoriteKind==="official"?setOfficialPage:setCommunityPage}/>
                </>}
                {section === "published-itineraries" && <JournalCollection resource={published} kind="published" page={publishedPage} setPage={setPublishedPage}/>}
                {section === "draft-itineraries" && <>
                    <JournalCollection resource={drafts} kind="drafts" onDiscard={item=>{discardTrigger.current=document.activeElement;setDeleteError(false);setDiscard(item);}}/>
                    {discard && <section className="journal-confirmation" role="alertdialog" aria-modal="false" aria-labelledby="journal-delete-title" aria-describedby="journal-delete-description" onKeyDown={event=>{if(event.key === "Escape" && !deleting)closeDiscard();}}>
                        <h3 id="journal-delete-title">{t("travelJournal.deleteTitle")}</h3><p id="journal-delete-description">{t("travelJournal.deleteDescription",{title:discard.title || t("travelJournal.untitled"),interpolation:{escapeValue:false}})}</p>
                        {deleteError && <p role="alert">{t("travelJournal.deleteFailed")}</p>}
                        <button ref={cancel} disabled={deleting} onClick={closeDiscard}>{t("travelJournal.cancel")}</button><button className="journal-action" disabled={deleting} onClick={confirmDelete}>{t(deleting?"travelJournal.deleting":"travelJournal.confirmDelete")}</button>
                    </section>}
                </>}
                {section === "settings" && <JournalSettings me={me} onUpdated={data=>setMe(current=>({...current,...data}))} onUnauthorized={onUnauthorized}/>}
            </>}
        </ResourceState>
    </TravelJournalLayout>;
}
