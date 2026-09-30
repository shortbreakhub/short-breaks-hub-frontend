import { useParams,useNavigate } from "react-router-dom";
import ItineraryDayAccordion from "../components/ItineraryDayAccordion";
import React, {useState, useMemo, useEffect} from "react";

import {
    deleteCommunityFavorite, getCommunityFavoritesCount,
    getCommunityFavoritesMe, getUserItineraryBySlug, postCommunityFavorite, getQuestionThreadSummary,
    postAQuestionOrAnswer,getQuestionThread
} from "../api.js";
import PageMetadata from "../components/PageMetadata.jsx";
import Lottie from "lottie-react";
import LoadingAnimation from "../assets/loading-animation.json";
import {showToast} from "../utils/toast.js";
import {isExpired,getUserId} from "../utils/jwtParser.js";
import ThreadConversation from "../components/ThreadConversation.jsx";



export default function CommunityItineraryPage() {

    const { slug } = useParams();
    const navigate = useNavigate();
    const [data,setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = React.useState({
        liked: false,
        count: 0,
        saving: false,
    });
    const [isCreator, setCreator] = React.useState(false);
    const [questionThreads, setQuestionThreads] = useState([]);
    const [qaLoading, setQaLoading] = useState(false);
    const [qaError, setQaError] = useState(null);
    const [showAskForm, setShowAskForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [askLoading, setAskLoading] = useState(false);
    const [askError, setAskError] = useState(null);
    const [openThreadId, setOpenThreadId] = useState(null);
    const [threadDetails, setThreadDetails] = useState({});
    const [threadLoading, setThreadLoading] = useState(false);
    const [threadError, setThreadError] = useState(null);




    function toLocalISO(d) {
        const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return t.toISOString().slice(0, 10);
    }

    function toggleLike() {
        if (likes.saving) return;

        setLikes(s => ({ ...s, saving: true }));

        const prev = likes;
        const optimistic = prev.liked
            ? { liked: false, count: Math.max(0, prev.count - 1) }
            : { liked: true,  count: prev.count + 1 };

        setLikes(s => ({ ...s, ...optimistic }));

        const req = optimistic.liked
            ? postCommunityFavorite(data.id)
            : deleteCommunityFavorite(data.id);

        req.then(() => {
            setLikes(s => ({ ...s, saving: false }));
        })
            .catch(err => {

                setLikes({ ...prev, saving: false });
                if (err?.response?.status === 401) {
                    showToast("Please log in to like itineraries", { variant: "error" });

                } else {
                    showToast("Failed to update like", { variant: "error" });
                }
            });


    }

    const handleSubmitQuestion = () => {
        const content = newQuestion.trim();
        if (!content) return;

        setAskLoading(true);
        setAskError(null);

        postAQuestionOrAnswer(data.id,content).then((res) => {
                const createdThread = res;

                // Prepend the new thread to the list
                setQuestionThreads((prev) => [createdThread, ...prev]);

                // Reset form UI
                setNewQuestion("");
                setShowAskForm(false);
            })
            .catch((err) => {
                console.error("Failed to create question thread", err);

                if (err.response?.status === 401) {
                    setAskError("Please log in to ask a question.");
                } else if (err.response?.data?.message) {
                    setAskError(err.response.data.message);
                } else {
                    setAskError("Failed to send your question. Please try again.");
                }
            })
            .finally(() => {
                setAskLoading(false);
            });
    };

    const handleOpenThread = (threadId) => {

        if (openThreadId === threadId) {
            setOpenThreadId(null);
            return;
        }

        setOpenThreadId(threadId);
        setThreadLoading(true);
        setThreadError(null);


        getQuestionThread(data.id,threadId).then((res) => {
                setThreadDetails((prev) => ({
                    ...prev,
                    [threadId]: res,
                }));
            })
            .catch((err) => {
                console.error("Failed to load thread", err);
                setThreadError("Failed to load this conversation.");
            })
            .finally(() => {
                setThreadLoading(false);
            });
    };




    const today = new Date();
    const defaultIn = new Date(today);
    defaultIn.setDate(today.getDate() + 14);

    const defaultOut = new Date(defaultIn);
    defaultOut.setDate(defaultIn.getDate() + 3);

    const [checkIn, setCheckIn]   = useState(toLocalISO(defaultIn));
    const [checkOut, setCheckOut] = useState(toLocalISO(defaultOut));

    const nights = useMemo(() => {
        const a = new Date(checkIn);
        const b = new Date(checkOut);
        const diff = (b - a) / 86400000;
        return diff > 0 ? Math.round(diff) : 0;
    }, [checkIn, checkOut]);


    const [fromAmount, setFromAmount] = useState("100");
    const rate = 1.17;

    const convertedAmount = useMemo(() => {
        const value = parseFloat(fromAmount);
        if (Number.isNaN(value)) return "0";
        return (value * rate).toFixed(0);
    }, [fromAmount, rate]);


    useEffect(() => {
        getUserItineraryBySlug(slug).then(
            (data) => {
                setData(data);
                setLoading(false);
                if(parseInt(data.userId) === parseInt(getUserId())){
                    setCreator(true);
                }
            }
        );
    }, [slug]);

    useEffect(() => {
        if (!data?.id) return
        getCommunityFavoritesCount(data.id).then(({count}) => {
            setLikes(s => ({ ...s, count: count || 0 }))
        }).catch(err => console.log(err));

        const token = localStorage.getItem("authToken");
        if (token || !isExpired(token)) {
            getCommunityFavoritesMe(data.id).then(
                ({liked}) => {
                    setLikes(s => ({ ...s, liked: !!liked }))
                }
            ).catch(err => console.log(err));
        }

        setQaLoading(true);
        setQaError(null);


        getQuestionThreadSummary(data.id).then((res) => {
                setQuestionThreads(res || []);
            })
            .catch((err) => {
                console.error("Failed to load question threads", err);
                setQaError("Failed to load questions. Please try again later.");
            })
            .finally(() => {
                setQaLoading(false);
            });

    }, [data?.id]);



    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white">
                <div className="w-[1000px] h-[1000px] mt-[250px] ml-[20px] xl:ml-[650px] md:ml-[250px] lg:ml-[400px]">
                    <Lottie animationData={LoadingAnimation} loop={true} />
                </div>
            </div>
        )
    }


    if (!data) {
        return (
            <div className="max-w-screen-lg mx-auto px-4 py-16">
                <h1 className="text-2xl font-bold mb-4">Itinerary not found</h1>
                <button onClick={() => navigate(-1)} className="text-yellow-700 underline">
                    Go back
                </button>
            </div>
        );
    }

    const city = data.city;

    return (
        <>
            <PageMetadata
                title={`${data.title} | ${data.country} | Short Breaks Hub`}
                description={data.summary || "Explore a curated short-break itinerary with highlights, day plan, and pricing."}
            />

            <main className="min-h-screen bg-gray-50">
                {/* Hero */}
                <section
                    className="relative h-[42vh] md:h-[55vh] bg-center bg-cover"
                    style={{ backgroundImage: `url(${data.coverPhoto})` }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 h-full flex items-center">
                        <div className="max-w-screen-xl mx-auto px-4 md:px-6 pb-8 mt-[12vh]">
                            <h1 className="text-white text-3xl md:text-5xl font-extrabold drop-shadow">
                                {data.title}
                            </h1>
                            <p className="text-white/90 mt-8">
                                {data.country} · {data.days} Days · From ${data.priceFrom}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="max-w-screen-xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-8">

                    <article className="md:col-span-2">

                        <div className="flex items-center gap-3 mt-4 mb-6">
                            <img
                                src={data.userAvatarUrl}
                                alt={data.userDisplayName}
                                className="h-11 w-11 rounded-full object-cover bg-slate-100"
                            />

                            <div>
                                <p className="font-medium text-slate-800">{data.userDisplayName}</p>
                                <p className="text-xs text-slate-500">
                                    Last updated on {new Date(data.lastUpdatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Highlights */}

                        <div className="mt-2 flex items-center gap-3">
                            <h2 className="text-xl font-bold mb-3">Trip Highlights</h2>
                            <button
                                type="button"
                                onClick={toggleLike}
                                disabled={likes.saving || isCreator}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-3 text-sm transition
                                          ${likes.liked ? "border-rose-300 text-rose-600" : "border-slate-300 text-slate-600"}
                                          ${likes.saving ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"}`}
                                aria-pressed={likes.liked}
                                aria-label={likes.liked ? "Unlike this itinerary" : "Like this itinerary"}
                                title={likes.liked ? "Unlike" : "Like"}
                            >
                                <span aria-hidden="true">{likes.liked ? "♥" : "♡"}</span>
                                <span>{likes.count}</span>
                            </button>
                        </div>



                        <ul className="list-disc pl-6 text-gray-700 space-y-1">
                             <li>{data.highlights}</li>
                        </ul>

                        {/* Overview */}
                        <h2 className="text-xl font-bold mt-8 mb-3">Overview</h2>
                        <p className="text-gray-700 leading-relaxed">
                            {data.summary}
                        </p>

                        {/* Day-by-Day */}
                        <h3 className="text-lg font-semibold mt-8 mb-3">Day by Day</h3>
                        <ItineraryDayAccordion schedule={data.schedule} />

                        {/* Questions & Answers */}
                        <section className="mt-10 border-t border-slate-200 pt-8">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Questions about this trip
                                </h3>

                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium
             border-slate-300 text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        setAskError(null);
                                        setShowAskForm((prev) => !prev);
                                    }}
                                >
                                    {showAskForm ? "Cancel" : "Ask a question"}
                                </button>

                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                                Have a doubt about this itinerary? Ask the creator and get a personal answer.
                            </p>
                            {showAskForm && (
                                <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-white">
                                    <label className="block text-sm font-medium text-slate-800">
                                        Your question
                                    </label>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Be specific and polite. The creator will see your username when replying.
                                    </p>

                                    <textarea
                                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                 min-h-[90px]"
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        maxLength={1000} // matches backend limit
                                        placeholder="Example: Is this itinerary suitable in December? Are restaurants open on Sundays?"
                                    />

                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            {newQuestion.length}/1000 characters
                                        </p>

                                        <button
                                            type="button"
                                            onClick={handleSubmitQuestion}
                                            disabled={askLoading || newQuestion.trim().length === 0}
                                            className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium
                   text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {askLoading ? "Sending..." : "Submit question"}
                                        </button>
                                    </div>

                                    {askError && (
                                        <p className="mt-2 text-xs text-red-600">
                                            {askError}
                                        </p>
                                    )}
                                </div>
                            )}


                            <div className="mt-4">
                                {qaLoading && (
                                    <p className="text-sm text-slate-500">Loading questions...</p>
                                )}

                                {qaError && (
                                    <p className="text-sm text-red-600">
                                        {qaError}
                                    </p>
                                )}

                                {!qaLoading && !qaError && questionThreads.length === 0 && (
                                    <p className="text-sm text-slate-500 italic">
                                        No questions yet. Be the first to ask.
                                    </p>
                                )}

                                {!qaLoading && !qaError && questionThreads.length > 0 && (
                                    <ul className="space-y-3">
                                        {questionThreads.map((thread) => (
                                            <li
                                                key={thread.id}
                                                className="border border-slate-400 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                                onClick={() => handleOpenThread(thread.id)}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Asker avatar */}
                                                        {thread.askerAvatarUrl && (
                                                            <img
                                                                src={thread.askerAvatarUrl}
                                                                alt={thread.askerUsername}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />
                                                        )}

                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {thread.askerUsername}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Asked on{" "}
                                                                {new Date(thread.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                                                            (thread.closed
                                                                ? "bg-slate-100 text-slate-700"
                                                                : "bg-emerald-50 text-emerald-700")
                                                        }
                                                    >
                                                    {thread.closed ? "Closed" : "Open"}
                                                  </span>
                                                </div>


                                                {thread.firstMessagePreview && (
                                                    <p className="mt-2 text-sm text-slate-700 line-clamp-1 italic">
                                                        “{thread.firstMessagePreview}”
                                                    </p>
                                                )}

                                                {/* Middle row: short info line */}
                                                <p className="mt-2 text-xs text-slate-600">
                                                    {thread.messageCount} message
                                                    {thread.messageCount === 1 ? "" : "s"}
                                                </p>

                                                <div
                                                    className={
                                                        "overflow-hidden transition-all duration-200 " +
                                                        (openThreadId === thread.id
                                                            ? "max-h-[600px] opacity-100 mt-3"
                                                            : "max-h-0 opacity-0 mt-0")
                                                    }
                                                >
                                                    <ThreadConversation
                                                        creatorId={data.userId}
                                                        threadDetails={threadDetails[thread.id]}
                                                        loading={threadLoading && openThreadId === thread.id}
                                                        error={threadError}
                                                        itineraryId={data.id}
                                                        onThreadUpdated={(updated) => {
                                                            setThreadDetails((prev) => ({ ...prev, [updated.id]: updated }));
                                                            setQuestionThreads((prev) =>
                                                                prev.map((t) =>
                                                                    t.id === updated.id
                                                                        ? {
                                                                            ...t,
                                                                            messageCount: updated.messages.length,
                                                                            closed: updated.closed,
                                                                        }
                                                                        : t
                                                                )
                                                            );
                                                        }}
                                                    />
                                                </div>

                                            </li>


                                        ))}
                                    </ul>
                                )}
                            </div>

                        </section>


                    </article>


                    <aside>
                        <div className="bg-white rounded-xl shadow p-5 sticky top-20">
                            <h3 className="text-lg font-bold mb-3">Choose your dates</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm text-gray-600">
                                    Check‑in
                                    <input
                                        type="date"
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="mt-1 w-full border rounded px-2 py-1"
                                    />
                                </label>

                                <label className="text-sm text-gray-600">
                                    Check‑out
                                    <input
                                        type="date"
                                        value={checkOut}
                                        min={checkIn}                  // can't pick before check‑in
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="mt-1 w-full border rounded px-2 py-1"
                                    />
                                </label>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                {nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "Select valid dates"}
                            </p>

                            <hr className="my-4" />
                            <section>
                                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                                    Trip budget helper
                                </h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Quickly convert your budget from GBP to EUR.
                                </p>

                                <div className="space-y-3">
                                    {/* From amount (GBP) */}
                                    <label className="block text-xs text-gray-500">
                                        From (GBP)
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-sm text-gray-500">£</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={fromAmount}
                                                onChange={(e) => setFromAmount(e.target.value)}
                                                className="w-full border rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                    </label>


                                    <label className="block text-xs text-gray-500">
                                        To (EUR)
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-sm text-gray-500">€</span>
                                            <input
                                                type="text"
                                                value={convertedAmount}
                                                readOnly
                                                className="w-full border rounded px-2 py-1 text-sm bg-gray-50"
                                            />
                                        </div>
                                    </label>

                                    <p className="text-[11px] text-gray-400">
                                        Using rate: 1 GBP ≈ {rate.toFixed(2)} EUR
                                    </p>

                                    <button
                                        type="button"
                                        className="mt-2 w-full text-xs font-medium border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition"
                                    >
                                        Open full converter
                                    </button>
                                </div>
                            </section>
                            <div className="mt-4">
                            </div>
                        </div>

                    </aside>

                </section>
            </main>
        </>
    );
}