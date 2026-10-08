import {useRef, useState} from "react";
import {postContact} from "../api.js";
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {STATIC_PAGE_METADATA} from "../utils/pageMetadata.js";
import "../styles/contact.css";

const emptyForm = {name: "", email: "", message: ""};
export default function ContactPage() {
    const [form, setForm] = useState(emptyForm);
    const [status, setStatus] = useState("idle");
    const submitting = useRef(false);
    const {t, i18n} = useTranslation();
    // Keep the existing Contact field validation and API payload.
    const name = form.name.trim();
    const allOk = name.length >= 2 && name.length <= 30 && /^[A-Za-z]{2,}(?: [A-Za-z]+)*$/.test(name)
        && /^([a-z0-9.-_]+)@([a-z0-9_-]){2,}\.[a-z]{2,10}(.[a-z]{2,8})?$/i.test(form.email)
        && form.message.length > 50 && form.message.length <= 2000;
    function onChange(e) {
        const {name, value} = e.target;
        setForm(f => ({...f, [name]: value}));
        setStatus("idle");
    }
    async function onSubmit(e) {
        e.preventDefault();
        if (!allOk || submitting.current) return;
        submitting.current = true;
        setStatus("pending");
        try {
            await postContact(form);
            setForm(emptyForm);
            setStatus("success");
        } catch {
            setStatus("error");
        } finally {
            submitting.current = false;
        }
    }
    return <main className="contact-journal" lang={i18n.resolvedLanguage}>
        <PageCanonical segments={["contact"]}/>
        <PageMetadata canonicalSegments={["contact"]} {...STATIC_PAGE_METADATA.contact}/>
        <div className="contact-composition">
            <header className="contact-introduction">
                <h1>{t("contactPage.heading")}</h1>
                <p className="contact-lede">{t("contactPage.story")}</p>
                <p>{t("contactPage.description")}</p>
            </header>
            <section className="contact-postcard">
                <div className="contact-postmarks" aria-hidden="true"/>
                <h2 id="contact-form-title" className="contact-kicker">{t("contactPage.send")}</h2>
                <form onSubmit={onSubmit} aria-labelledby="contact-form-title" aria-busy={status === "pending"}>
                    <fieldset disabled={status === "pending"}>
                        <div className="contact-address">
                            {["name", "email"].map(field => <div key={field}>
                                <label htmlFor={"contact-" + field}>{t("contactPage." + field)}</label>
                                <input id={"contact-" + field} name={field} type={field === "email" ? "email" : "text"}
                                    autoComplete={field} required value={form[field]} onChange={onChange}
                                    placeholder={t("contactPage." + field + "Placeholder")}
                                    aria-describedby={field === "name" ? "contact-name-hint" : undefined}/>
                                {field === "name" && <p className="contact-hint" id="contact-name-hint">{t("contactPage.nameHint")}</p>}
                            </div>)}
                        </div>
                        <label htmlFor="contact-message">{t("contactPage.message")}</label>
                        <textarea id="contact-message" name="message" rows={5} required value={form.message}
                            onChange={onChange} placeholder={t("contactPage.messagePlaceholder")} aria-describedby="contact-message-hint"/>
                        <p className="contact-hint" id="contact-message-hint">{t("contactPage.messageHint")}</p>
                        <button type="submit" disabled={!allOk || status === "pending"}>{t(status === "pending" ? "contactPage.sending" : "contactPage.send")}</button>
                    </fieldset>
                    <div className="contact-feedback" role={status === "error" ? "alert" : "status"} aria-atomic="true">
                        {status === "error" && t("contactPage.error")}
                        {status === "success" && t("contactPage.messageSent")}
                    </div>
                </form>
            </section>
        </div>
    </main>;
}
