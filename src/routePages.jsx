import React, {lazy, Component} from "react";
import {matchRoutes} from "react-router-dom";

const account = () => import("./pages/accountPages.js");
const community = () => import("./pages/communityPages.js");
const loaders = {
    RegionPage: () => import("./pages/RegionPage.jsx"),
    BrowsePage: () => import("./pages/BrowsePage.jsx"),
    ItineraryPage: () => import("./pages/ItineraryPage.jsx"),
    WeatherPage: () => import("./pages/WeatherPage.jsx"),
    GoogleMap: () => import("./components/GoogleMap.jsx"),
};
for (const name of ["LoginPage", "RegisterPage", "VerifyEmailPage", "ForgotPasswordPage", "ResetPasswordPage"])
    loaders[name] = () => account().then(module => ({default: module[name]}));
for (const name of ["CommunityTripsPage", "CommunityRegionPage", "CommunityItineraryPage", "ProfilePage", "CreateItineraryPage"])
    loaders[name] = () => community().then(module => ({default: module[name]}));

// Preloading renders the actual component synchronously during initial hydration.
const loaded = {};
export const lazyPages = Object.fromEntries(Object.entries(loaders).map(([name, load]) => {
    const Lazy = lazy(async () => {
        const module = await load();
        loaded[name] = module.default;
        return module;
    });
    return [name, function RoutePage(props) {
        const Page = loaded[name] || Lazy;
        return <Page {...props} />;
    }];
}));

const routes = [
    {path: "/"}, {path: "/contact"}, {path: "/privacy"}, {path: "/terms"},
    {path: "/:region", page: "RegionPage"},
    {path: "/itinerary/:slug", page: "ItineraryPage"},
    {path: "/browse/:country", page: "BrowsePage"},
    {path: "/user-itinerary/:slug", page: "CommunityItineraryPage"},
    {path: "/community-itineraries/region", page: "CommunityTripsPage"},
    {path: "/community-itineraries/region/:region", page: "CommunityRegionPage"},
    {path: "/login", page: "LoginPage"}, {path: "/register", page: "RegisterPage"},
    {path: "/profile", page: "ProfilePage"}, {path: "/create-itinerary", page: "CreateItineraryPage"},
    {path: "/verify-email", page: "VerifyEmailPage"}, {path: "/api/auth/verify-email", page: "VerifyEmailPage"},
    {path: "/forgot-password", page: "ForgotPasswordPage"}, {path: "/reset-password", page: "ResetPasswordPage"},
    {path: "/live-weather", page: "WeatherPage"}, {path: "/map", page: "GoogleMap"}, {path: "*"},
];

export async function preloadRoute(pathname) {
    const name = matchRoutes(routes, pathname)?.[0]?.route.page;
    if (name) loaded[name] = (await loaders[name]()).default;
}

// A failed chunk request must offer recovery instead of a permanently blank route.
export class RouteLoadBoundary extends Component {
    state = {failed: false};
    static getDerivedStateFromError() {return {failed: true};}
    componentDidUpdate(previous) {
        if (previous.pathname !== this.props.pathname && this.state.failed) this.setState({failed: false});
    }
    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}
