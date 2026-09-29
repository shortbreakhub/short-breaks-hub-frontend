import {Routes, Route} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegionPage from "./pages/RegionPage.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ItineraryPage from "./pages/ItineraryPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage";
import CreateItineraryPage from "./pages/CreateItineraryPage.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WeatherPage from "./pages/WeatherPage.jsx";
import useTokenCountdown from "./hooks/useTokenCountdown";
import BlockingSessionModal from "./components/BlockingSessionModal.jsx";
import {useState} from "react";
import {postUserRenewToken} from "./api.js";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import CommunityItineraryPage from "./pages/CommunityItineraryPage.jsx";
import CommunityTripsPage from "./pages/CommunityTripsPage.jsx";
import CommunityRegionPage from "./pages/CommunityRegionPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import GoogleMap from "./components/GoogleMap.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import RouteRobots from "./components/RouteRobots.jsx";

function App() {

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
