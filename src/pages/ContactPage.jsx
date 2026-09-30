import {useMemo, useState} from "react";
import {postContact} from "../api.js";
import {useTranslation} from "react-i18next";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {STATIC_PAGE_METADATA} from "../utils/pageMetadata.js";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [showSuccessContactSaveModal, setShowSuccessContactSaveModal] = useState(false);
    const { t } = useTranslation();


    const isEmailValid = (email) => /^([a-z0-9.-_]+)@([a-z0-9_-]){2,}\.[a-z]{2,10}(.[a-z]{2,8})?$/i.test(email);
    const isValidName = (name) => {
        const trimmed = name.trim();
        const regex = /^[A-Za-z]{2,}(?: [A-Za-z]+)*$/;
        return trimmed.length >= 2 && trimmed.length <= 30 && regex.test(trimmed);
    };
    const isValidMessage = (message) => {
        return message && message.length > 50 && message.length <= 2000;
    }

    const checks = useMemo(() => ({
        email:isEmailValid(form.email),
        name: isValidName(form.name),
        message: isValidMessage(form.message),
    }), [form.email,form.name,form.message]);

    const allOk = checks.name && checks.email && checks.message;

    function onChange(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }

    function onSubmit(e) {
        e.preventDefault();
        if(allOk) {
            postContact(form).then(data => {
                setShowSuccessContactSaveModal(true);
            })
        }
        setForm({ name: "", email: "", message: "" });
    }

    return (
        <main className="min-h-[70vh] bg-gray-50">
            <PageCanonical segments={["contact"]} />
            <PageMetadata canonicalSegments={["contact"]} {...STATIC_PAGE_METADATA.contact} />
            <section className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("contactPage.contact")}</h1>
                <p className="text-gray-600 mb-8">
                    {t("contactPage.description")}
                </p>

                <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1" htmlFor="name">{t("contactPage.name")}</label>
                        <input
                            id="name" name="name" value={form.name} onChange={onChange}
                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder={t("contactPage.namePlaceholder")}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1" htmlFor="email">{t("contactPage.email")}</label>
                        <input
                            id="email" name="email" type="email" value={form.email} onChange={onChange}
                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder={t("contactPage.emailPlaceholder")}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1" htmlFor="message">{t("contactPage.message")}</label>
                        <textarea
                            id="message" name="message" rows={5} value={form.message} onChange={onChange}
                            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder={t("contactPage.messagePlaceholder")}
                        />
                        <p className="text-xs text-slate-500 mt-1">{t("contactPage.messageHint")}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            disabled={!allOk}
                            type="submit"
                            className="rounded-lg bg-yellow-500 hover:bg-yellow-600 cursor-pointer
                            text-black font-semibold px-8 py-2 shadow disabled:bg-slate-300"
                        >
                            {t("contactPage.send")}
                        </button>
                    </div>
                </form>
            </section>

            {
                showSuccessContactSaveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                🟢 {t("contactPage.messageSent")}
                            </h2>
                            <p className="text-slate-600 mb-6">
                                {t("contactPage.thanks")}
                                <br />
                                {t("contactPage.response")}
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowSuccessContactSaveModal(!showSuccessContactSaveModal)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                            >
                                {t("contactPage.ok")}
                            </button>
                        </div>
                    </div>
                )
            }
        </main>
    );
}
