import {useEffect, useRef, useState} from "react";
import DayPlanTextArea from "./DayPlanTextArea.jsx";
import {
    postUserItineraryPhoto, postUserItinerary, getUserDraftCount, postUserDraftItinerary, postDraftPhoto,
    postUpdateDraftCoverPhoto, getDraftByDraftId, updateDraft, deleteDraft,getResendVerificationEmail
} from "../api.js";
import axios from "axios";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Auth} from "../auth.js";
import "../styles/journal-editor.css";

export default function CreateItineraryForm() {

    const [dayPlan , setDayPlan ] = useState([{title:"",details:""}]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [file, setFile] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [countries, setCountries] = useState([]);
    const [countriesSuggestionsOpen, setCountriesSuggestionsOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showModal, setShowModal] = useState(null);
    const [showSuccessDraftSaveModal, setShowSuccessDraftSaveModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [draftId, setDraftId] = useState(null);
    const navigate = useNavigate();
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [searchParams] = useSearchParams()
    const [isPublishing, setIsPublishing] = useState(false);
    const [draftUnavailable, setDraftUnavailable] = useState(false);
    const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(searchParams.get("draftId")));
    const uploadedCover = useRef(null);
    const persistedCover = useRef("");
    const operationPending = useRef(false);
    const requestOptions = {preserveFormOnUnauthorized: true};
    const busy = isSavingDraft || isPublishing || isLoadingDraft || draftUnavailable;
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [itineraryContent, setItineraryContent] = useState({
        title: "",
        country: "",
        region: "",
        days: 3,
        estimatedCost: 0,
        summary: "",
        coverPhoto: "",
        highlights: "",
        visibility: "PUBLIC",
    });


    function handleAddDay(){
        setDayPlan((days)=>[...days,{title:"",details:""}]);
    }

    function handleRemoveDay(){
        if(dayPlan.length > 1){
            setDayPlan((days)=>days.filter((day,index) => index !== dayPlan.length-1));
        }
    }

    function handleDeleteDay(id){
        if(dayPlan.length > 1){
            setDayPlan((days)=>days.filter((day,index) => index !== id-1));
        }
    }

    function handleUpdateDayPlanTitle(id,title){
        setDayPlan(days=> days.map((day,index)=>{
            if(index === id - 1){
                return {...day, title:title };
            }
            return day
        }));
    }

    function handleUpdateDayPlanContent(id,content){
        setDayPlan(days=> days.map((day,index)=>{
            if(index === id - 1){
                return {...day, details:content };
            }
            return day
        }));
    }

    function showWorkflowError(error, action) {
        const status = error?.response?.status;
        const msg = status === 401 || status === 403 || axios.isCancel(error)
            ? "Your session is unavailable. Sign in again before retrying. Your form has not been cleared."
            : status === 404
                ? "The draft or cover image is unavailable. Check your draft access and select a fresh cover image before retrying. Your form has not been cleared."
                : !error?.response
                    ? "The request could not be completed. Check your connection and retry. Your form has not been cleared."
                    : "The request failed. Please retry. Your form has not been cleared.";
        setShowModal({msgTitle: action + " failed", msg});
    }

    function validPhoto(photo) {
        return photo && photo.size > 0 && ["image/jpeg", "image/png"].includes(photo.type);
    }

    function handlePhotoPreview(e) {
        const selectedPhoto = e.target.files?.[0];
        if (!selectedPhoto) return;
        if (!validPhoto(selectedPhoto)) {
            e.target.value = "";
            setShowModal({msgTitle: "Cover image required", msg: "Select a non-empty JPG or PNG image. Your existing cover has not been changed."});
            return;
        }
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        uploadedCover.current = null;
        setFile(selectedPhoto);
        setPreviewUrl(URL.createObjectURL(selectedPhoto));
    }

    async function uploadCover(publishing) {
        if (uploadedCover.current?.file === file) return uploadedCover.current.url;
        if (!validPhoto(file)) throw new Error("Select a valid cover image");
        const url = publishing
            ? await postUserItineraryPhoto(file, requestOptions)
            : draftId && persistedCover.current
                ? await postUpdateDraftCoverPhoto(file, persistedCover.current, requestOptions)
                : await postDraftPhoto(file, requestOptions);
        if (typeof url !== "string" || !url.trim()) throw new Error("Missing upload URL");
        uploadedCover.current = {file, url};
        setItineraryContent(current => ({...current, coverPhoto: url}));
        return url;
    }

    function handleEmailVerificationRequest(){
        getResendVerificationEmail().then(() => {
            setShowEmailVerificationModal(false);
            setShowModal({
                "msgTitle": "Email Verification Request",
                "msg":"Verification email has been sent.please check your mail\n It may take couple of minutes.",
                "icon": "success",
            });
        }).catch((err) => {
            setShowEmailVerificationModal(false);

            const status = err?.response?.status;

            if (status === 429) {
                setShowModal({
                    msgTitle: "Please wait",
                    msg: "You’ve recently requested a verification email. Try again in 1 minute.",
                    icon: "warning",
                });
                return;
            }

            setShowModal({
                msgTitle: "Email Verification Failed",
                msg: err?.response?.data?.message || "Something went wrong. Please try again later.",
                icon: "error",
            });
        });

    }

    async function handleSaveDraft() {
        if (busy || operationPending.current) return;
        if (!itineraryContent.title.trim()) {
            setShowModal({msgTitle: "Itinerary Title Missing", msg: "Please enter a Title before saving your draft."});
            return;
        }
        operationPending.current = true;
        setIsSavingDraft(true);
        try {
            if (!draftId) {
                const {count} = await getUserDraftCount(requestOptions);
                if (count >= 3) {
                    setShowModal({msgTitle: "Draft Limit Reached", msg: "You can only have up to 3 itinerary drafts. Please delete an existing draft before creating a new one."});
                    return;
                }
            }
            const coverPhoto = file ? await uploadCover(false) : itineraryContent.coverPhoto;
            const payload = {...itineraryContent, coverPhoto, region: itineraryContent.region.toUpperCase(),
                userDayPlan: dayPlan.map((day, index) => ({...day, day: index + 1})), draftId};
            if (draftId) {
                await updateDraft(draftId, payload, requestOptions);
                setShowModal({msgTitle: "Draft Update", msg: "Draft Updated Successfully.", icon: "success"});
            } else {
                const saved = await postUserDraftItinerary(payload, requestOptions);
                setDraftId(saved.draftId);
                setShowSuccessDraftSaveModal(true);
            }
            persistedCover.current = coverPhoto;
        } catch (error) {
            showWorkflowError(error, "Save");
        } finally {
            operationPending.current = false;
            setIsSavingDraft(false);
        }
    }

    async function handleSubmitItinerary() {
        if (busy || operationPending.current) return;
        if(!Auth.isEmailVerified()){
            setShowEmailVerificationModal(true);
            return;
        }


        setSubmitted(true);

        const { title, country, days, summary } = itineraryContent;

        const normalizedCountry = country.trim();
        const isCountryValid = country.trim().length > 0 &&
            countries.includes(
                normalizedCountry[0].toUpperCase() + normalizedCountry.substring(1)
            );

        const isValid =
            title.trim().length >= 10 && title.trim().length <= 100 &&
            isCountryValid &&
            days >= 1 && days <= 7 &&
            summary.trim().length >= 50 &&
            days === dayPlan.length &&
            dayPlan.filter(
                (eachDayPlan) =>
                    eachDayPlan.details.trim().length > 30 && eachDayPlan.details.trim().length <= 1990).length === days;

        if (!isValid)  return;


        if (!validPhoto(file) && !uploadedCover.current) {
            setShowModal({msgTitle: "Fresh cover image required", msg: draftId
                ? "Please upload a cover image before publishing this older draft. Your existing draft and image will remain available."
                : "Select a non-empty JPG or PNG cover image before publishing."});
            return;
        }
        operationPending.current = true;
        setIsPublishing(true);
        try {
            const coverPhoto = await uploadCover(true);
            const payload = {...itineraryContent, coverPhoto, region: itineraryContent.region.toUpperCase(),
                userDayPlan: dayPlan.map((day, index) => ({...day, day: index + 1}))};
            await postUserItinerary(payload, requestOptions);
            setCountdown(5);
            setShowSuccessModal(true);
        } catch (error) {
            showWorkflowError(error, "Publish");
        } finally {
            operationPending.current = false;
            setIsPublishing(false);
        }
    }

    function handleDeleteDraft() {
        setShowConfirmationModal(false);
        deleteDraft(draftId, requestOptions).then(() => {
            setShowModal({"msgTitle": "Draft Delete", "msg":"Draft Delete Successfully."});

            navigate("/create-itinerary");
            window.location.reload();
        }).catch(error => showWorkflowError(error, "Delete"));
    }



    useEffect(() => {
        if (!showSuccessModal) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showSuccessModal]);

    useEffect(() => {
        if (!showSuccessModal) return;

        const id = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(id);
                    navigate("/profile?tab=published-itineraries");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [showSuccessModal, navigate]);


    useEffect(() => {
        axios.get("https://countriesnow.space/api/v0.1/countries")
            .then((res) => {
                setCountries(res.data.data.map( country => country.country));
            })
            .catch((err) => {console.log(err)});
        if(searchParams){
            const parameterDraftId = searchParams.get("draftId");
            if(parameterDraftId){
                getDraftByDraftId(parameterDraftId, requestOptions).then(data => {
                    setItineraryContent(current => ({...current,...data}))
                    setDraftId(parameterDraftId)
                    setPreviewUrl(data.coverPhoto);
                    persistedCover.current = data.coverPhoto || "";
                    if (Array.isArray(data.schedule)) setDayPlan(data.schedule.map(day => ({title: day.title || "", details: day.details || ""})));
                }).catch(error => {
                    setDraftUnavailable(true);
                    showWorkflowError(error, "Load draft");
                }).finally(() => setIsLoadingDraft(false));
            }
        }
    },[])

    useEffect(() => {
        const normalizedCountry = itineraryContent.country.trim();
        if(itineraryContent.country.trim().length > 0 &&
            countries.includes(
                normalizedCountry[0].toUpperCase() + normalizedCountry.substring(1)
            )){
            axios.get(`https://restcountries.com/v3.1/name/${itineraryContent.country}`)
                .then((res) => {
                    setItineraryContent(current => ({...current, region: res.data[0].region}))
                })
                .catch((err) => {console.log(err)});
        }
        }, [itineraryContent.country])



    const suggestions = itineraryContent.country ?
        itineraryContent.country.length >= 2 ? countries
            .filter( country =>  country.toLowerCase().startsWith(itineraryContent.country.toLowerCase()))
            .slice(0, 10): null : null;

    return (
        <>
            <div className="sbh-editorial journal-editor">
                {/* Header */}
                <div className="journal-editor__intro">
                    <h1 className="journal-editor__title">Create Itinerary</h1>
                    <p className="journal-editor__lede">Share your short break with the community.</p>
                </div>

                {/* Card */}
                <fieldset disabled={busy} className="journal-editor__form">
                    {/* Landscape workspace: Basic info beside the Day-by-Day plan. */}
                    <div className="journal-editor__workspace">
                    {/* Basic info */}
                    <section className="journal-panel journal-panel--basic">
                        <h2 className="journal-panel__title">Basic info</h2>



                        <div className="journal-fields">
                            <div className="journal-fields__wide">
                                <label htmlFor="title" className="journal-label">Title</label>
                                <input id="title" type="text" placeholder="3 Days in Singapore: Food & Culture"
                                       onChange={(e)=> {
                                           setItineraryContent(current => ({...current, title: e.target.value}));
                                       }}
                                       value={itineraryContent.title}
                                       className={`journal-input
                                       ${submitted ? (itineraryContent.title && itineraryContent.title.length >=10) ? 
                                           "border-slate-300" : "border-red-700":"border-slate-300" }  
                                          `}
                                       data-field="title" minLength={5}/>
                                {
                                    submitted ? (itineraryContent.title && itineraryContent.title.length >=10) ? null :
                                        (<p className="journal-error text-red-700">Please give your itinerary a title (Minimum 10 characters)</p>) : null
                                }

                            </div>

                            <div className="journal-field--country">
                                <label htmlFor="country" className="journal-label">Country</label>
                                <input id="country" type="text" placeholder="Singapore" value={itineraryContent.country}
                                       onChange={(e)=> {
                                           setItineraryContent(current => ({...current, country: e.target.value}))
                                           setCountriesSuggestionsOpen(true)
                                       }
                                }
                                       className={`journal-input
                                       ${submitted ? (itineraryContent.country && 
                                           countries.includes(itineraryContent.country[0].toUpperCase()+itineraryContent.country.substring(1))) ? 
                                           "border-slate-300" : "border-red-700":"border-slate-300"}`}
                                       data-field="country" />
                                { (countriesSuggestionsOpen && suggestions?.length > 0) && (
                                    <ul className="journal-suggestions">
                                        {suggestions.map((country) => (
                                            <li
                                                key={country}
                                                onClick={() => {
                                                    setItineraryContent(current => ({...current, country: country}))
                                                    setCountriesSuggestionsOpen(false)
                                                    }
                                                }
                                                className="journal-suggestions__item"
                                            >
                                                {country}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label htmlFor="region" className="journal-label">Region</label>
                                <input id="region" type="text" value={itineraryContent.region} disabled
                                       className="journal-input border-slate-300"
                                       data-field="region" />
                            </div>

                            <div>
                                <label htmlFor="days" className="journal-label">Days</label>
                                <div className="journal-inline">
                                    <input id="days" type="number" min="1" max="7" placeholder="3"
                                           value={itineraryContent.days}
                                           className={`journal-input journal-input--short ${submitted ? (itineraryContent.days && (itineraryContent.days>=1 && itineraryContent.days<=7)) ?
                                               "border-slate-300" : "border-red-700":"border-slate-300"}`}
                                           data-field="days"
                                           onChange={(e)=> {
                                               setItineraryContent(current => ({...current, days: parseInt(e.target.value)}))
                                           }
                                           }
                                    />
                                    <span className="journal-unit">days</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="priceFrom" className="journal-label">Estimated from (optional)</label>
                                <div className="journal-inline">
                                    <span className="journal-unit">£</span>
                                    <input id="priceFrom" type="number" min="0" placeholder="250"
                                           value={itineraryContent.estimatedCost}
                                           className="journal-input journal-input--short border-slate-300"
                                           onChange={(e)=> setItineraryContent(current => ({...current, estimatedCost: e.target.value}))}
                                           data-field="priceFrom" />
                                </div>
                            </div>
                        </div>

                        <div className="journal-fields__wide journal-field--summary">
                            <label htmlFor="summary" className="journal-label">Summary</label>
                            <textarea id="summary" rows={3} placeholder="Perfect for food lovers and first-time visitors…"
                                      value={itineraryContent.summary}
                                      onChange={(e)=> {
                                          setItineraryContent(current => ({...current, summary: e.target.value}))
                                      }
                                      }
                                      className={`journal-input ${submitted ? (itineraryContent.summary && itineraryContent.summary.length>=50) ?
                                          "border-slate-300" : "border-red-700":"border-slate-300"}`}
                                      data-field="summary" minLength={50} maxLength={600}/>
                            <p className="journal-help">Min 50 characters and keep it under 500 characters if possible.</p>
                        </div>
                    </section>

                    {/* Day-by-Day plan */}
                    <section className="journal-panel journal-panel--days">
                        <div className="journal-panel__header">
                            <h2 className="journal-panel__title">Day-by-Day plan</h2>
                            <div className="journal-day-controls">
                                <button type="button" disabled={dayPlan.length >= 7}
                                        className="journal-button journal-button--small"
                                        data-action="add-day" onClick={()=>handleAddDay()}>+ Add Day</button>
                                <button type="button" disabled={dayPlan.length === 1}
                                        className="journal-button journal-button--small"
                                        data-action="remove-day" onClick={()=>handleRemoveDay()}>− Remove Day</button>
                            </div>
                        </div>

                        {/* Day item */}
                        <div className="journal-days" data-list="days">
                            {dayPlan.map((day, index) => (
                                <DayPlanTextArea
                                    key={index}
                                    day={index+1}
                                    plan={day.details}
                                    title={day.title}
                                    submitted={submitted}
                                    handleUpdateDayPlanContent={handleUpdateDayPlanContent}
                                    handleUpdateDayPlanTitle={handleUpdateDayPlanTitle}
                                    handleDeleteDay={handleDeleteDay}
                                />
                            ))}
                        </div>
                        <p className="journal-help">You can add more days later.</p>
                        {
                            submitted ? (itineraryContent.days === dayPlan.length) ? null :
                                (<p className="journal-error text-red-700">Please make sure the days of your itinerary match the day plan.</p>) : null
                        }
                    </section>

                    </div>

                    {/* Extras below the workspace: cover photo, highlights and visibility. */}
                    <div className="journal-editor__extras">
                    {/* Hero image */}
                    <section className="journal-panel journal-panel--cover">
                        <h2 className="journal-panel__title">Cover photo</h2>
                        <div className="journal-cover">
                            {
                                typeof(previewUrl) === "string" ? (
                                    <div className="journal-cover__preview"
                                         data-preview="hero">
                                        <img src={previewUrl} alt="itinerary photo preview" className="journal-cover__image" />
                                    </div>
                                ):(
                                    <div className="journal-cover__preview"
                                         data-preview="hero">
                                        <span className="journal-cover__empty">Preview</span>
                                    </div>
                                )

                            }
                            <div className="journal-cover__upload">
                                <label htmlFor="hero" className="journal-label">Upload</label>
                                <input id="hero" type="file" accept="image/*"
                                       className="journal-file"
                                       data-field="heroFile" onChange={handlePhotoPreview} />
                                <p className="journal-help">Use a wide image (e.g., 1200×600). JPG/PNG only.</p>
                            </div>
                        </div>
                        {
                            submitted ? (previewUrl) ? null :
                                (<p className="journal-error text-red-700">Please upload a cover photo for your itinerary.</p>) : null
                        }
                    </section>

                    {/* Tags / visibility */}
                    <section className="journal-panel journal-panel--extras">
                        <h2 className="journal-panel__title">Extras</h2>

                        <div className="journal-fields">
                            <div>
                                <label htmlFor="tags" className="journal-label">Highlights (optional)</label>
                                <input id="tags" type="text" placeholder="family, food, beach"
                                       className="journal-input border-slate-300"
                                       onChange={(e)=>
                                           setItineraryContent(current => ({...current, highlights: e.target.value}))}
                                       data-field="tags" value={itineraryContent.highlights} />
                                <p className="journal-help">Comma-separated. E.g. “family, foodie, budget”.</p>
                            </div>

                            <div>
                                <label htmlFor="visibility" className="journal-label">Visibility</label>
                                <select id="visibility"
                                        value={itineraryContent.visibility}
                                        className="journal-input border-slate-300"
                                        onChange={(e)=>
                                        {
                                            setItineraryContent(current=> ({...current, visibility: e.target.value}))}
                                        }
                                        data-field="visibility">
                                    <option value="PUBLIC">Public</option>
                                    <option value="PRIVATE">Private (only me)</option>
                                </select>
                            </div>
                        </div>
                    </section>
                    </div>
                </fieldset>

                {/* WeatherFooter actions */}
                <div className="journal-actions">
                    <button type="button" className="journal-button journal-button--discard"
                            data-action="discard" disabled={busy || !draftId} onClick={()=> setShowConfirmationModal(true)}>Discard</button>
                    <button type="button" className="journal-button journal-button--draft"
                            data-action="save-draft" disabled={busy} onClick={handleSaveDraft}>
                        { isSavingDraft ? 'Saving' : 'Save Draft' }
                    </button>
                    <button type="button" className="journal-button journal-button--publish"
                            data-action="publish" disabled={busy} onClick={handleSubmitItinerary}>{isPublishing ? "Publishing" : "Publish"}</button>
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            🟢 Itinerary published
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Your itinerary has been created successfully.
                            <br />
                            Redirecting in{" "}
                            <span className="font-semibold">{countdown}</span> seconds…
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/profile?tab=published-itineraries")}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            Go now
                        </button>
                    </div>
                </div>
            )}
            {
                showSuccessDraftSaveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                🟢 Itinerary Draft Saved
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Your itinerary draft has been saved successfully.
                                <br />
                                You can continue editing or come back later.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowSuccessDraftSaveModal(!showSuccessDraftSaveModal)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                            >
                                Ok
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
                                Ok
                            </button>
                        </div>
                    </div>
                )
            }
            {
                showConfirmationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                ⚠️ Delete Draft Confirmation
                            </h2>
                            <p className="text-slate-600 mb-6">
                                    Please confirm to delete the draft
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmationModal(false);
                                    handleDeleteDraft();
                                }}
                                className="inline-flex items-center justify-center px-7 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800"
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirmationModal(false)}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800 ml-5"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
            {
                showEmailVerificationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                ⚠️ Email Verification Required
                            </h2>
                            <p className="text-slate-600 mb-2">
                                Please verify your email first.
                            </p>
                            <p className="text-slate-600 mb-6">
                                You can request a new link if previous one is expired.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailVerificationModal(false);
                                }}
                                className="inline-flex items-center justify-center px-7 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800"
                            >
                                Ok
                            </button>
                            <button
                                type="button"
                                onClick={()=> handleEmailVerificationRequest()}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900
                                text-white text-sm font-medium hover:bg-slate-800 ml-5"
                            >
                                Request New Email Verification Link
                            </button>
                        </div>
                    </div>
                )
            }
        </>
    );
}
