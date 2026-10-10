import axios from "axios";
import {REGIONS} from "./config/regions.js";
import {isExpired} from "./utils/jwtParser.js";

export const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: 5000,
});

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE,
    timeout: 5000,
});

export const getItineraryBySlug = (slug,lang) =>
    publicApi.get(`/itineraries/slug/${slug}`,{
        params: {
            lang,
        },
    }).then((res) => res.data);

export const getCountriesByRegion = (region) =>
    publicApi.get(`/itineraries/region/${region}`).then((res) => res.data);

// Cached public Region discovery for SPA visits without Country bootstrap data.
let countryNamesPromise;
export function getPublicCountryNames() {
    if (!countryNamesPromise) {
        countryNamesPromise = Promise.all(REGIONS.map(({onClick}) => getCountriesByRegion(onClick)))
            .then(lists => [...new Set(lists.flat())])
            .catch(error => { countryNamesPromise = null; throw error; });
    }
    return countryNamesPromise;
}

export const getItinerariesByCountry = (country) =>
    publicApi.get(`/itineraries/browse/${country}`).then((res) => res.data);

export const getItinerariesByRegion = (region) =>
    publicApi.get(`/itineraries/${region}`).then((res) => res.data);

export const getMe = () =>
    api.get('/auth/me').then(res => res.data)

export const getFavoritesCount = (itineraryId) =>
    publicApi.get(`/itineraries/${itineraryId}/favorites/count`).then((res) => res.data);

export const getCommunityFavoritesCount = (itineraryId) =>
    publicApi.get(`/community-itineraries/${itineraryId}/favorites/count`).then((res) => res.data);

export const getFavoritesMe = (itineraryId) =>
    api.get(`/itineraries/${itineraryId}/favorites/me`).then((res) => res.data);

export const getCommunityFavoritesMe = (itineraryId) =>
    api.get(`/community-itineraries/${itineraryId}/favorites/me`).then((res) => res.data);

export const getMeFavorites = (params) =>
    api.get(`/itineraries/me/favorites`, {params}).then((res) => res.data);

export const getMeCommunityFavorites = (params) =>
    api.get(`/community-itineraries/me/favorites`, {params}).then(res => res.data);

export const getAllItinerariesByCustomSearch = (customSearch) =>
    publicApi.get(`/itineraries/search?${customSearch}`).then((res) => res.data);

export const getCommentList = (itineraryId) =>
    publicApi.get(`/itineraries/${itineraryId}/comments`).then((res) => res.data);

export const getCommentMe = (itineraryId) =>
    api.get(`/itineraries/${itineraryId}/comments/me`).then((res) => res.data);

export const getMeItineraries = (params) =>
    api.get(`/community-itineraries/me`, {params}).then((res) => res.data);

export const getUserItineraryBySlug = (slug) =>
    publicApi.get(`/community-itineraries/slug/${slug}`).then((res) => res.data);

export const getCommunityCountriesByRegion = (region) =>
    publicApi.get(`/community-itineraries/region/${region}`).then((res) => res.data);

export const getCommunityItinerariesByRegion = (region) =>
    publicApi.get(`/community-itineraries/${region}`).then((res) => res.data);

export const getQuestionThreadSummary = (itineraryId) =>
    publicApi.get(`/community-itineraries/${itineraryId}/question-threads`).then((res) => res.data);

export const getQuestionThread = (itineraryId,threadId) =>
    publicApi.get(`/community-itineraries/${itineraryId}/question-threads/${threadId}`).then((res) => res.data);

export const getUserDraftCount = () =>
    api.get(`/community-itineraries/draft/count`).then((res) => res.data);

export const getMeSavedDraft = () =>
    api.get(`/community-itineraries/draft/me`).then(res => res.data);

export const getDraftByDraftId = (draftId) =>
    api.get(`/community-itineraries/draft/${draftId}`).then(res => res.data);

export const getResendVerificationEmail = () =>
    api.get('/auth/verify-email-request').then(res => res.data);



export const postUserRegister = (email, password, displayName) =>
    publicApi.post("/auth/register", { email:email, password:password, displayName:displayName })
        .then((res) => {
            res.data;
        })

export const postUserLogin = (email, password) =>
    publicApi.post("/auth/login", { email:email,password: password })
        .then((res) => res.data
        )

export const postUserRenewToken = () =>
    api.post("/auth/me/renew-token").then((res) => res.data);

export const postUserPhoto = (file) =>{
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/auth/me/photo", formData)
        .then((res) => res.data
        )
}

export const postComment = (itineraryId,comment) =>
    api.post(`/itineraries/${itineraryId}/comments`, {body:comment.body,rating:comment.rating}).then((res) => res.data)


export const postFavorite = (itineraryId) =>
    api.post(`/itineraries/${itineraryId}/favorite`).then((res) => res.data);

export const postCommunityFavorite = (itineraryId) =>
    api.post(`/community-itineraries/${itineraryId}/favorite`).then((res) => res.data);

export const postUserItineraryPhoto = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/community-itineraries/upload-itinerary-cover-photo", formData,{headers: { 'Content-Type': 'multipart/form-data' }})
        .then((res) => res.data
        )
}

export const postUserItinerary = (userItinerary) => {
    return api.post("/community-itineraries/publish-itinerary",userItinerary).then((res) => res.data);
}

export const postUserDraftItinerary = (userDraftItinerary) => {
    return api.post("/community-itineraries/draft/save-draft",userDraftItinerary).then((res) => res.data);
}

export const postAQuestionOrAnswer = (itineraryId,content) =>{
    return api.post(`/community-itineraries/${itineraryId}/question-threads`, { content }).then((res) => res.data);
}

export const postQuestionThread = (itineraryId,threadId,content) =>{
    return api.post(
            `/community-itineraries/${itineraryId}/question-threads/${threadId}/messages`,
            { content }
        )
}

export const postDraftPhoto = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("community-itineraries/draft/upload-draft-cover-photo", formData,{headers: { 'Content-Type': 'multipart/form-data' }})
        .then((res) => res.data
        )
}

export const postUpdateDraftCoverPhoto = (file,existingCoverUrl) =>{
    const formData = new FormData();
    formData.append("file", file);
    formData.append("existingCoverUrl", existingCoverUrl);

    return api.post("community-itineraries/draft/update-draft-cover-photo", formData,{headers: { 'Content-Type': 'multipart/form-data' }})
        .then((res) => res.data
        )
}

export const postContact = (details) =>
    publicApi.post(`/contact`, details).then((res) => res.data);

export const postRestPasswordEmail = (email) =>
    publicApi.post(`/auth/request-password-reset`, {email:email}).then((res) => res.data);

export const postRestPassword = (token,newPassword) =>
    publicApi.post(`/auth/reset-password`, {token:token,newPassword:newPassword}).then((res) => res.data);


export const updateUser = (payload) =>
    api.put("/auth/me",payload )
    .then((res) =>  res.data || payload
    )

export const updateUserPhoto = (payload) =>
    api.put("/auth/me/photo",payload )
        .then((res) =>  res.data || payload
        )

export const updateDraft = (draftId,payload) =>
    api.put(`community-itineraries/draft/${draftId}`,payload ).then((res) =>  res.data)

export const deleteFavorite = (itineraryId) =>
    api.delete(`/itineraries/${itineraryId}/favorite`).then((res) => res.data);

export const deleteCommunityFavorite = (itineraryId) =>
    api.delete(`/community-itineraries/${itineraryId}/favorite`).then((res) => res.data);

export const deleteComment = (itineraryId) =>
    api.delete(`/itineraries/${itineraryId}/comments`).then((res) => res.data);

export const deleteDraft = (draftId) =>
    api.delete(`community-itineraries/draft/${draftId}`).then((res) =>  res.data)

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (!token || isExpired(token)) {
        localStorage.removeItem("authToken");
        localStorage.setItem("auth:logout", String(Date.now()));
        window.location.replace("/login?reason=expired");
        localStorage.setItem("auth:toast", "This operation is for user only,please log in first.");
        throw new axios.Cancel("token expired");
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem("authToken");
            localStorage.setItem("auth:logout", String(Date.now()));
            if (location.pathname !== "/login") {
                localStorage.setItem("auth:toast", "Unauthorized. Please log in first.");
                window.location.replace("/login?reason=unauthorized");

            }
        }
        return Promise.reject(err);
    }
);