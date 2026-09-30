const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
let initialized = false;
let lastPageLocation;

// Keep initialization separate so a future consent gate can call it after opt-in.
export function initializeAnalytics() {
    if (typeof window === "undefined" || !/^G-[A-Z0-9]+$/.test(measurementId ?? "")) {
        return false;
    }
    if (initialized) return true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {send_page_view: false});

    if (!document.getElementById("shortbreakhub-ga4")) {
        const script = document.createElement("script");
        script.id = "shortbreakhub-ga4";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
    }
    initialized = true;
    return true;
}

export function trackPageView(pathname, search) {
    if (!initializeAnalytics()) return;

    // Authentication links contain private tokens: never send them to GA4.
    const params = new URLSearchParams(search);
    for (const key of [...params.keys()]) {
        if (/token|email|password|code|secret/i.test(key)) params.delete(key);
    }
    const query = params.toString();
    const pagePath = pathname + (query ? `?${query}` : "");
    const pageLocation = window.location.origin + pagePath;
    if (lastPageLocation === pageLocation) return;

    window.gtag("event", "page_view", {
        send_to: measurementId,
        page_location: pageLocation,
        page_path: pagePath,
        page_title: document.title,
        page_referrer: lastPageLocation || document.referrer.split("?")[0].split("#")[0],
    });
    lastPageLocation = pageLocation;
}
