import React, {useEffect, useState} from "react";
import {showToast} from "../utils/toast.js";
import {
    postComment as postCommentApi, getCommentList, getCommentMe, deleteComment as deleteCommentApi,
    getResendVerificationEmail
} from "../api.js"
import {Auth} from "../auth.js";
import {useTranslation} from "react-i18next";

export default function Comments({ itineraryId, headingLevel = 3 }) {

    const [showComposer, setShowComposer] = React.useState(false);
    const [body, setBody] = React.useState("");
    const [rating, setRating] = React.useState(0);
    const [saving, setSaving] = React.useState(false);
    const [hasUserCommented, setHasUserCommented] = React.useState(false);
    const [comments, setComments] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [commentCount, setCommentCount] = React.useState(0);
    const [commentDeleted, setCommentDeleted] = React.useState(false);
    const [showModal, setShowModal] = useState(null);
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const { t } = useTranslation();
    const CommentsHeading = headingLevel === 2 ? "h2" : "h3";

    function loadComments(p = 0) {
        getCommentList(itineraryId).then((res) => {
            setComments(res.content);
        })
        if(localStorage.getItem("authToken"))
        {
            getCommentMe(itineraryId).then((res) => {
                if(res.hasUserCommented){
                    setBody(res.comment)
                    res.rating === "No Rating" ? setRating(0) : setRating(res.rating);
                    setHasUserCommented(true);
                }
            })
        }
    }

    useEffect(() => {
        loadComments(0);
    }, [itineraryId,commentDeleted]);



    function postComment() {

        if(!localStorage.getItem("authToken"))
        {
            setShowModal({
                "msgTitle": t("comments.loginRequiredTitle"),
                "msg":t("comments.loginRequiredMessage"),
                "icon": "error",
            });
            return;
        }

        if(!Auth.isEmailVerified()){
            setShowEmailVerificationModal(true);
            return;
        }

        if (!body.trim()) return;
        setSaving(true);
        postCommentApi(itineraryId, { body, rating: rating || null })
            .then(res => {
                loadComments(0)
                setCommentDeleted(false);
                setCommentCount(c => c + 1);
                setBody(""); setRating(0); setShowComposer(false);
                showToast(t("comments.commentAdded"),{variant:"success",duration:4000});
            })
            .catch(err => {
                if (err?.response?.status === 401) {
                    showToast(t("comments.errorLoginRequired"), { variant: "error",duration:4000 });
                } else {
                    showToast(t("comments.postCommentFailed"), { variant: "error",duration:4000 });
                }
            })
            .finally(() => setSaving(false));
    }

    function deleteComment() {
        deleteCommentApi(itineraryId).then((res) => {
            showToast(`${t("comments.commentRemoved")} !`, { variant: "success",duration:4000 });
            setCommentDeleted(true);
            setShowComposer(false);
            setBody("");
            setRating(0);
            setHasUserCommented(false);
            setCommentCount(c => c - 1);
        }).catch(err => {
            loadComments(0)
            showToast(t("comments.commentRemovedFailed"), { variant: "error",duration:4000 });
        })
    }

    function handleEmailVerificationRequest(){
        getResendVerificationEmail().then(() => {
            setShowEmailVerificationModal(false);
            setShowModal({
                "msgTitle": t("comments.emailVerificationRequest"),
                "msg":t("comments.emailVerificationSent"),
                "icon": "success",
            });
        }).catch((err) => {
            setShowEmailVerificationModal(false);

            const status = err?.response?.status;

            if (status === 429) {
                setShowModal({
                    msgTitle: t("comments.requestCoolDownTitle"),
                    msg:  t("comments.requestCoolDownMessage"),
                    icon: "warning",
                });
                return;
            }

            setShowModal({
                msgTitle: t("comments.emailVerificationFailed"),
                msg: err?.response?.data?.message || t("comments.emailVerificationFailedMessage"),
                icon: "error",
            });
        });

    }

    return (
        <section id="comments" className="mt-10">
            <div className="flex items-center justify-between mb-3">
                <CommentsHeading className="text-lg font-semibold">
                    {t("comments.comments")} {commentCount > 0 && <span className="text-slate-500">({commentCount})</span>}
                </CommentsHeading>
                <button
                    className="px-3 py-2 rounded border hover:bg-slate-50 cursor-pointer"
                    onClick={() => setShowComposer(s => !s)}
                >
                    {showComposer ? t("comments.cancel") : hasUserCommented ? t("comments.modifyComment") : t("comments.writeComment")}
                </button>
            </div>

            {showComposer && (
                <div className="mb-4 rounded border p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <label className="text-sm text-slate-600">{t("comments.rating")}</label>
                        <select
                            value={rating}
                            onChange={e => setRating(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            <option value={0}>{t("comments.noRating")}</option>
                            <option value={1}>★☆☆☆☆</option>
                            <option value={2}>★★☆☆☆</option>
                            <option value={3}>★★★☆☆</option>
                            <option value={4}>★★★★☆</option>
                            <option value={5}>★★★★★</option>
                        </select>
                    </div>

                    <textarea
                        className="w-full border rounded p-2"
                        rows={3}
                        placeholder={t("comments.shareExperience")}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                        <button
                            disabled={saving || !body.trim()}
                            onClick={postComment}
                            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 cursor-pointer"
                        >
                            { !hasUserCommented ? (saving ? `${t("comments.posting")}…` : t("comments.post"))
                                : (saving ? `${t("comments.updating")}…` : t("comments.update"))}
                        </button>
                        { hasUserCommented && (<button className="px-4 py-2 rounded border cursor-pointer" onClick={deleteComment}>
                            {t("comments.delete")}
                        </button>)}

                    </div>
                </div>
            )}

            {comments.length === 0 ? (
                <p className="text-slate-500">{t("comments.firstComment")}</p>
            ) : (
                <ul className="space-y-4">
                    {comments.map(c => (
                        <li key={c.id} className="border rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                                {c.userAvatarUrl && (
                                    <img src={c.userAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                                )}
                                <div className="text-sm">
                                    <div className="font-medium">{c.userDisplayName || t("comments.user")}</div>
                                    <div className="text-slate-500">
                                        {c.rating ? "★".repeat(c.rating) + "☆".repeat(5 - c.rating) : t("comments.noRating")}
                                    </div>
                                </div>
                                <div className="ml-auto text-xs text-slate-500">
                                    {new Date(c.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <p className="text-sm leading-6">{c.body}</p>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-4 flex items-center gap-3">
                <button
                    disabled={page === 0}
                    onClick={() => loadComments(page - 1)}
                    className="border rounded px-3 py-1 disabled:opacity-50"
                >
                    {t("comments.prev")}
                </button>
                <span className="text-sm">{t("comments.page")} {page + 1} / {Math.max(1, totalPages)}</span>
                <button
                    disabled={page + 1 >= totalPages}
                    onClick={() => loadComments(page + 1)}
                    className="border rounded px-3 py-1 disabled:opacity-50"
                >
                    {t("comments.next")}
                </button>
            </div>
            {
                showEmailVerificationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                ⚠️ {t("comments.emailVerificationRequired")}
                            </h2>
                            <p className="text-slate-600 mb-2">
                                {t("comments.verifyEmail")}
                            </p>
                            <p className="text-slate-600 mb-6">
                                {t("comments.requestNewLink")}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailVerificationModal(false);
                                }}
                                className="inline-flex items-center justify-center px-7 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800"
                            >
                                {t("comments.ok")}
                            </button>
                            <button
                                type="button"
                                onClick={()=> handleEmailVerificationRequest()}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800 ml-5"
                            >
                                {t("comments.RequestNewEmailVerificationLink")}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                { showModal.icon === "success" ? `🟢 ${showModal.msgTitle}` : `⚠️ ${showModal.msgTitle}` }
                            </h2>
                            <p className="text-slate-600 mb-6" dangerouslySetInnerHTML={{__html:showModal.msg}}>

                            </p>

                            <button
                                type="button"
                                onClick={() => setShowModal(null)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                            >
                                {t("comments.ok")}
                            </button>
                        </div>
                    </div>
                )
            }
        </section>
    )
}
