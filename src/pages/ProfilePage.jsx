import React, { useEffect, useState } from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {getMe, updateUser, postUserPhoto, updateUserPhoto,getMeFavorites,getMeItineraries,getMeSavedDraft} from '../api.js';
import {Auth} from '../auth.js';
import {showToast} from "../utils/toast.js";
import ItineraryCard from "../components/ItineraryCard.jsx";
import {useTranslation} from "react-i18next";

export default function ProfilePage() {
    const [out, setOut] = useState({loading: true, data: null, error: null});
    const [userItineraries, setUserItineraries] = useState([]);
    const [draftItineraries, setDraftItineraries] = useState([]);
    const navigate = useNavigate();
    const [tab, setTab] = useState("overview");
    const [favoriteTab, setFavoriteTab] = useState("built-in");
    const [settings, setSettings] = useState({
        userId: undefined,
        displayName: "",
        location: "",
        bio: "",
        adults: 1,
        children: 0,
        avatarUrl: "",
        currency:""
    });
    const [saving, setSaving] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [showWarningModal, setShowWarningModal] = useState(null);
    const [searchParams] = useSearchParams()
    const { t } = useTranslation();



    useEffect(() => {
        if (!out?.data) return;
        const m = out.data;
        setSettings({
            userId: m.id || undefined,
            displayName: m.displayName || m.username || "",
            location: m.location || "",
            bio: m.bio || "",
            adults: m.adults || 1,
            children: m.children || 0,
            avatarUrl: m.avatarUrl || "",
            currency: m.currency || "",
        });
    }, [out?.data]);


    const tabClass = (name) =>
        `pb-3 text-sm font-medium border-b-2 transition
   ${tab === name ? "border-sky-600 text-sky-700"
            : "border-transparent text-slate-600 hover:text-slate-900"}`;

    const favoriteTabClass = (active) =>
        `inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium
   ${active
            ? "bg-sky-100 text-sky-700 border-sky-300"
            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
        }`;



    useEffect(() => {
        if (!Auth.isLoggedIn()) {
            return;
        }
        getMe()
            .then(data => {

                setOut({loading: false, data, error: null});

                getMeFavorites().then(data => {
                    setFavorites(data.content)
                }).catch(err => {
                    showToast(t("profilePage.noFavorite"),
                        {variant:"error",duration:4000})
                })

                getMeItineraries().then(data => {
                    setUserItineraries(data.content)
                    const tab = searchParams.get("tab");
                    if (tab && tab === "published-itineraries") {
                        setTab("Published Itineraries")
                    }
                })

                getMeSavedDraft().then(data => {
                    setDraftItineraries(data);
                })
            })
            .catch(err => {
                setOut({loading: false, data: null, error: String(err)});
            });
    }, [navigate]);

    function onAvatarChange(e) {
        const file = e.target.files?.[0]
        if (!file) return;
        if (!file.type.startsWith("image/")) return showToast(t("profilePage.chooseImage"),
            { variant: 'error', duration: 3500 });
        if (file.size > 3 * 1024 * 1024) return showToast(t("profilePage.maxFileSize"),
            { variant: 'error', duration: 3500 });
        postUserPhoto(file).then(data => {
            updateUserPhoto({avatarUrl: data}).then(data => {
                setOut({ ...out, data: { ...(out?.data || {}), ...data} });
                showToast(t("profilePage.photoUpdated"));
            });
        })

    }

    function handleContinueDraft(draftId){
        navigate("/create-itinerary?draftId=" + draftId);
    }

    function handleDiscardDraft(draftId){
        setShowWarningModal({"msgTitle": t("profilePage.draftDeleteConfirmationTitle"),
            "msg":t("profilePage.draftDeleteConfirmationMessage")});
    }

    function handleUpdateProfile() {
        setSaving(true);
        const payload = {
            displayName: settings.displayName,
            location: settings.location,
            bio: settings.bio,
            adults: settings.adults,
            children: settings.children,
            currency: settings.currency,
        };
        updateUser(payload).then((data) => {
                setOut({ ...out, data: { ...(out?.data || {}), ...data} });
                showToast(t("profilePage.profileUpdatedSuccessfully"));
            }
        ).catch((err) => {
            showToast(t("profilePage.updateFailed"), { variant: 'error', duration: 3500 });
        })
            .finally(() => setSaving(false));
    }



    if (out.loading) return <div className="p-4">{t("profilePage.loading")}</div>;

    if (out.error) {
        return (
            <div className="p-4 text-red-600">
                {t("profilePage.failedToLoadProfile")} {out.error}
            </div>
        );
    }

    const me = out.data || {};

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">

            <section className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm">

                <div className="h-16 w-16 rounded-full border bg-slate-100 overflow-hidden">
                    <img src={me.avatarUrl} alt="Avatar Picture" className="h-full w-full object-cover" />
                </div>

                <div>
                    <p className="text-xl font-semibold">
                        {me.displayName || me.username || "User"}
                    </p>
                    <p className="text-slate-600 text-sm">
                        {me.email || ""}
                    </p>
                </div>
            </section>

            <nav className="mt-6 border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3 md:gap-6 overflow-x-auto whitespace-nowrap pb-1 -mb-2.5">
                        <button className={tabClass("overview")}  onClick={() => setTab("overview")}>{t("profilePage.overview")}</button>
                        <button className={tabClass("favorites")} onClick={() => setTab("favorites")}>{t("profilePage.favorites")}</button>
                        <button className={tabClass("Published Itineraries")} onClick={() => setTab("Published Itineraries")}>{t("profilePage.publishedItineraries")}</button>
                        <button className={tabClass("Draft Itineraries")} onClick={() => setTab("Draft Itineraries")}>{t("profilePage.draftItineraries")}</button>
                        <button className={tabClass("settings")}  onClick={() => setTab("settings")}>{t("profilePage.settings")}</button>
                    </div>
                    <button
                        onClick={() => navigate("/create-itinerary")}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-sm bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                        {t("profilePage.createItineraryButton")}
                    </button>
                </div>
            </nav>

            <section className="mt-6">
                {tab === "overview" && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold">{t("profilePage.overview")}</h2>

                        <div className="mt-3 space-y-3 text-slate-700">
                            <div>
                                <span className="font-medium">{t("profilePage.displayName")}</span> {me.displayName || me.username}
                            </div>
                            <div>
                                <span className="font-medium">{t("profilePage.email")}</span> {me.email}
                            </div>
                            <div>
                                <span className="font-medium">{t("profilePage.travelGroup")}</span>{" "}
                                {(me.adults ?? 1)} {t("profilePage.adults")} · {(me.children ?? 0)} {t("profilePage.children")}
                            </div>


                            <div>
                                <span className="font-medium">{t("profilePage.location")}</span> {me.location || "—"}
                            </div>
                            <div>
                                <span className="font-medium">{t("profilePage.bio")}</span> {me.bio || "No bio yet"}
                            </div>
                            <div>
                                <span className="font-medium">{t("profilePage.currency")}</span> {me.currency}
                            </div>
                        </div>
                    </div>
                )}


                {tab === "favorites" && (
                    <div className="rounded-lg border bg-white p-6 text-slate-700 shadow-sm">

                        <div className="mb-4 flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">{t("profilePage.show")}</span>

                            <button
                                type="button"
                                className={favoriteTabClass(favoriteTab === "built-in")}
                                onClick={() => setFavoriteTab("built-in")}
                            >
                                {t("profilePage.builtInTrips")}
                            </button>

                            <button
                                type="button"
                                className={favoriteTabClass(favoriteTab === "community")}
                                onClick={() => setFavoriteTab("community")}
                            >
                                {t("profilePage.communityTrips")}
                            </button>
                        </div>

                        {favoriteTab === "built-in" && (
                            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {favorites.map((it) => (
                                    <ItineraryCard key={it.slug} it={it} showLikes={true} />
                                ))}
                            </ul>
                        )}

                        {favoriteTab === "community" && (
                            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {favorites.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        {t("profilePage.noLiked")}
                                    </p>
                                ) : (
                                    favorites.map((it) => (
                                        <ItineraryCard key={it.slug} it={it} showLikes={true} />
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                )}


                {tab === "Published Itineraries" && (
                    <div className="rounded-lg border bg-white p-6 text-slate-700 shadow-sm">

                            { userItineraries.length > 0 ?
                                    userItineraries.map((it,index) => (
                                        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <ItineraryCard key={index} it={it} itineraryType="user" />
                                        </ul>
                                    )):(<div className="flex flex-col items-center justify-center py-10 text-center">
                                    <p className="mb-2 text-sm font-semibold text-slate-600">
                                        {t("profilePage.noPublished")}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t("profilePage.createItineraryHint")}
                                    </p>
                                </div>)
                            }

                    </div>
                )}


                {tab === "Draft Itineraries" && (
                    <div className="rounded-lg border bg-white p-6 text-slate-700 shadow-sm">
                        {draftItineraries.length > 0 ? (
                            <>
                                <p className="mb-4 text-sm text-slate-500">
                                    {t("profilePage.draftEditHint")}
                                </p>

                                <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {draftItineraries.map((draft) => (
                                        <li
                                            key={draft.id}
                                            className="flex flex-col rounded-md border border-slate-200 p-4"
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <h3 className="text-base font-semibold text-slate-800 line-clamp-2">
                                                    {draft.title || "Untitled itinerary"}
                                                </h3>
                                                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {t("profilePage.draft")}
                </span>
                                            </div>

                                            {draft.destination && (
                                                <p className="mb-1 text-sm text-slate-500">
                                                    {draft.destination}
                                                </p>
                                            )}

                                            {draft.lastUpdatedAt && (
                                                <p className="mb-3 text-xs text-slate-400">
                                                    {t("profilePage.lastUpdated")} {new Date(draft.lastUpdatedAt).toLocaleDateString()}
                                                </p>
                                            )}

                                            <div className="mt-auto flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleContinueDraft(draft.id)}
                                                    className="flex-1 rounded-md bg-sky-600 text-white px-4 py-2 text-sm font-medium hover:bg-sky-700"
                                                >
                                                    {t("profilePage.continueEditing")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDiscardDraft(draft.id)}
                                                    className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                                >
                                                    {t("profilePage.discard")}
                                                </button>

                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <p className="mb-2 text-sm font-semibold text-slate-600">
                                    {t("profilePage.noDraft")}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {t("profilePage.displayDraftHint")}
                                </p>
                            </div>
                        )}
                    </div>
                )}



                {tab === "settings" && (
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold">{t("profilePage.settings")}</h2>
                        <div className="mt-4 grid max-w-md gap-4 text-slate-700">

                            <div className="mt-2 flex items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        id="avatar-file"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onAvatarChange}
                                    />
                                    <label
                                        htmlFor="avatar-file"
                                        className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                                    >
                                        {t("profilePage.uploadProfilePicture")}
                                    </label>
                                    <p className="mt-1 text-xs text-slate-500"> {t("profilePage.imageFormatHint")}</p>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-sm text-slate-700">{t("profilePage.displayName")}</span>
                                <input
                                    className="mt-1 w-full rounded border px-3 py-2"
                                    value={settings.displayName}
                                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                    placeholder={t("profilePage.displayNamePlaceholder")}
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm text-slate-700">{t("profilePage.location")}</span>
                                <input
                                    className="mt-1 w-full rounded border px-3 py-2"
                                    value={settings.location}
                                    onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                                    placeholder={t("profilePage.locationPlaceholder")}
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm text-slate-700">{t("profilePage.preferredCurrency")}</span>
                                <select
                                    className="mt-1 w-full rounded border px-3 py-2 bg-white"
                                    value={settings.currency || "USD"}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            currency: e.target.value,
                                        })
                                    }
                                >
                                    <option value="USD">{t("profilePage.USDollar")}</option>
                                    <option value="GBP">{t("profilePage.BritishPound")}</option>
                                    <option value="EUR">{t("profilePage.Euro")}</option>
                                    <option value="AUD">{t("profilePage.AustralianDollar")}</option>
                                    <option value="CAD">{t("profilePage.CanadianDollar")}</option>
                                    <option value="JPY">{t("profilePage.JapaneseYen")}</option>
                                    <option value="SGD">{t("profilePage.SingaporeDollar")}</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm text-slate-700">{t("profilePage.bio")}</span>
                                <textarea
                                    rows={3}
                                    className="mt-1 w-full rounded border px-3 py-2"
                                    value={settings.bio}
                                    onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                                    placeholder={t("profilePage.bioPlaceholder")}
                                />
                            </label>

                            <div className="block">
                                <span className="text-sm text-slate-700">{t("profilePage.travelGroup")}</span>
                                <div className="mt-2 flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <span>{t("profilePage.adults")}</span>
                                        <button
                                            className="w-7 h-7 rounded border bg-slate-100 hover:bg-slate-200"
                                            onClick={() =>
                                                setSettings((s) => ({ ...s, adults: Math.max(1, s.adults - 1) }))
                                            }
                                        >−</button>
                                        <span className="w-6 text-center">{settings.adults}</span>
                                        <button
                                            className="w-7 h-7 rounded border bg-slate-100 hover:bg-slate-200"
                                            onClick={() =>
                                                setSettings((s) => ({ ...s, adults: s.adults + 1 }))
                                            }
                                        >+</button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span>{t("profilePage.children")}</span>
                                        <button
                                            className="w-7 h-7 rounded border bg-slate-100 hover:bg-slate-200"
                                            onClick={() =>
                                                setSettings((s) => ({ ...s, children: Math.max(0, s.children - 1) }))
                                            }
                                        >−</button>
                                        <span className="w-6 text-center">{settings.children}</span>
                                        <button
                                            className="w-7 h-7 rounded border bg-slate-100 hover:bg-slate-200"
                                            onClick={() =>
                                                setSettings((s) => ({ ...s, children: s.children + 1 }))
                                            }
                                        >+</button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    disabled={saving}
                                    className={`rounded cursor-pointer px-3 py-2 text-white ${saving ? "bg-slate-400" : "bg-sky-600 hover:bg-sky-700"}`}
                                    onClick={handleUpdateProfile}
                                >
                                    {saving ? t("profilePage.saving") : t("profilePage.saveChanges")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </section>

            {
                showWarningModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                ⚠️ {showWarningModal.msgTitle}
                            </h2>
                            <p className="text-slate-600 mb-6" dangerouslySetInnerHTML={{__html:showWarningModal.msg}}>

                            </p>

                            <button
                                type="button"
                                onClick={() => setShowWarningModal(null)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                            >
                                {t("profilePage.yes")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowWarningModal(null)}
                                className="inline-flex ml-11 items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                            >
                                {t("profilePage.no")}
                            </button>
                        </div>
                    </div>
                )
            }

        </main>
    );
}

