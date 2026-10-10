import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {updateUser, postUserPhoto, updateUserPhoto} from "../../api.js";
import avatar from "../../assets/user-center/default-avatar.png";

export default function JournalSettings({me, onUpdated, onUnauthorized}) {
    const {t} = useTranslation();
    const [values,setValues] = useState(me);
    const [pending,setPending] = useState(false);
    const busy = useRef(false);
    const [feedback,setFeedback] = useState(null);
    useEffect(()=>setValues(me),[me]);
    const update = event => setValues(current=>({...current,[event.target.name]:event.target.type === "number" ? Number(event.target.value) : event.target.value}));
    async function run(operation, message) {
        if (busy.current) return;
        busy.current=true;setPending(true);setFeedback(null);
        try { const data=await operation();onUpdated(data);setFeedback({ok:true,key:message}); }
        catch(error) {if([401,403].includes(error?.response?.status))onUnauthorized();else setFeedback({ok:false,key:"travelJournal.saveFailed"});}
        finally {busy.current=false;setPending(false);}
    }
    function save(event) {
        event.preventDefault();
        if(!event.currentTarget.checkValidity())return;
        if(Number(values.adults)+Number(values.children)>16){setFeedback({ok:false,key:"travelJournal.groupLimit"});return;}
        const {displayName,location,bio,adults,children,currency}=values;
        run(()=>updateUser({displayName,location,bio,adults,children,currency}),"travelJournal.saved");
    }
    function upload(event) {
        const file=event.target.files?.[0];
        if(!file)return;
        if(!file.type.startsWith("image/") || file.size>3*1024*1024){setFeedback({ok:false,key:"travelJournal.imageLimit"});return;}
        run(async()=>{const url=await postUserPhoto(file);return updateUserPhoto({avatarUrl:url});},"travelJournal.photoSaved");
    }
    return <form className="journal-settings" onSubmit={save} aria-busy={pending}>
        <fieldset disabled={pending}><legend className="sr-only">{t("travelJournal.sections.settings")}</legend>
            <div className="journal-avatar-setting"><img src={me.avatarUrl || avatar} alt={t("travelJournal.avatar")} width="1254" height="1254" loading="lazy"/><div><label htmlFor="journal-avatar">{t("profilePage.uploadProfilePicture")}</label><input id="journal-avatar" type="file" accept="image/*" onChange={upload}/><p>{t("profilePage.imageFormatHint")}</p></div></div>
            <label>{t("profilePage.displayName")}<input name="displayName" value={values.displayName || ""} onChange={update} required minLength={2} maxLength={50} autoComplete="nickname"/></label>
            <label>{t("profilePage.location")}<input name="location" value={values.location || ""} onChange={update} autoComplete="address-level2"/></label>
            <label>{t("profilePage.bio")}<textarea name="bio" rows={3} maxLength={500} value={values.bio || ""} onChange={update}/></label>
            <label>{t("profilePage.preferredCurrency")}<select name="currency" value={values.currency || "USD"} onChange={update}>{["USD","GBP","EUR","AUD","CAD","JPY","SGD"].map(currency=><option key={currency} value={currency}>{currency}</option>)}</select></label>
            <div className="journal-group"><label>{t("profilePage.adults")}<input name="adults" type="number" min={1} max={12} required value={values.adults ?? 1} onChange={update}/></label><label>{t("profilePage.children")}<input name="children" type="number" min={0} max={12} required value={values.children ?? 0} onChange={update}/></label></div>
            <button className="journal-action" type="submit">{t(pending?"profilePage.saving":"profilePage.saveChanges")}</button>
        </fieldset>
        {feedback && <p role={feedback.ok?"status":"alert"}>{t(feedback.key)}</p>}
    </form>;
}
