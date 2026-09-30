import {useEffect} from "react";
import {useLocation} from "react-router-dom";
import {trackPageView} from "../utils/analytics.js";

export default function RouteAnalytics() {
    const {pathname, search} = useLocation();

    useEffect(() => {
        // Allow route metadata to settle; cancel stale navigations and effect replays.
        const timeout = window.setTimeout(() => trackPageView(pathname, search), 0);
        return () => window.clearTimeout(timeout);
    }, [pathname, search]);

    return null;
}
