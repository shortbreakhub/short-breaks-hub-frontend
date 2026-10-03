import {Routes, Route} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import NotFound from "./pages/NotFound.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useTokenCountdown from "./hooks/useTokenCountdown";
import BlockingSessionModal from "./components/BlockingSessionModal.jsx";
import {Suspense, useState} from "react";
import {useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {lazyPages, RouteLoadBoundary} from "./routePages.jsx";
import {postUserRenewToken} from "./api.js";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import RouteRobots from "./components/RouteRobots.jsx";

function App({pages = lazyPages}) {
    const {RegionPage, ItineraryPage, BrowsePage, RegisterPage, LoginPage, ProfilePage, CreateItineraryPage, WeatherPage, VerifyEmailPage, CommunityItineraryPage, CommunityTripsPage, CommunityRegionPage, ForgotPasswordPage, ResetPasswordPage, GoogleMap} = pages;
    const {pathname} = useLocation();
    const {t} = useTranslation();

    const [secondsLeft, setSecondsLeft] = useState(null);


    function handleAlmostExpired(secondsRemaining) {
        if (secondsRemaining <= 120) {
            setSecondsLeft(secondsRemaining);
        } else {
            setSecondsLeft(null);
        }
    }

    function handleExpired() {
        localStorage.removeItem("authToken");
        localStorage.setItem("auth:toast", "Session expired. Please log in again.");
        window.location.replace("/login?reason=expired");
    }

    useTokenCountdown(handleAlmostExpired, handleExpired);

    function handleStaySignedIn() {
        setSecondsLeft(null);
        postUserRenewToken().then((data) => {
            localStorage.setItem("authToken", data);
            window.location.reload();
        })
    }

    function handleLogout() {
        localStorage.removeItem("authToken");
        window.location.reload();
    }

    const shouldShowModal =
        typeof secondsLeft === "number" && secondsLeft <= 120;


    return (
        <>
            <Navbar />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
            />
            <RouteRobots />
            <RouteLoadBoundary pathname={pathname} fallback={
                <div className="max-w-screen-lg mx-auto px-4 py-16">
                    <p role="alert">{t("routeLoad.failed")}</p>
                    <button type="button" onClick={() => window.location.reload()} className="text-yellow-700 underline">{t("itineraryLoad.retry")}</button>
                </div>
            }>
            <Suspense fallback={<div className="min-h-screen" role="status" aria-label={t("routeLoad.loading")} />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/:region" element={<RegionPage />} />
                <Route path="/itinerary/:slug" element={<ItineraryPage />} />
                <Route path="/user-itinerary/:slug" element={<CommunityItineraryPage />} />
                <Route path="/browse/:country" element={<BrowsePage />} />
                <Route path="/community-itineraries/region" element={<CommunityTripsPage />} />
                <Route path="/community-itineraries/region/:region" element={<CommunityRegionPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/create-itinerary" element={<CreateItineraryPage />} />
                <Route path="/live-weather" element={<WeatherPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/api/auth/verify-email" element={<VerifyEmailPage />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/map" element={<GoogleMap />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
            </Routes>
            </Suspense>
            </RouteLoadBoundary>
            <Footer />
            {shouldShowModal && (
                <BlockingSessionModal
                    secondsLeft={secondsLeft}
                    onStay={handleStaySignedIn}
                    onLogout={handleLogout}
                />
            )}
        </>
    )
}

export default App;
