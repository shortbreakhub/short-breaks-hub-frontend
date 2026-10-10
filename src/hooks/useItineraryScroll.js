import {useLayoutEffect} from "react";
import {useLocation} from "react-router-dom";

// Itinerary entries (including Back/Forward) start at the top. Explicit hashes
// take precedence once content exists; loading must not anchor to the footer.
export default function useItineraryScroll(ready) {
    const {key, hash} = useLocation();
    useLayoutEffect(() => {
        const page = document.documentElement;
        const previous = page.style.overflowAnchor;
        page.style.overflowAnchor = "none";
        if (!hash) window.scrollTo({top: 0, left: 0, behavior: "instant"});
        let frame;
        if (ready) {
            frame = window.requestAnimationFrame(() => {
                if (hash) {
                    let id;
                    try { id = decodeURIComponent(hash.slice(1)); } catch { id = hash.slice(1); }
                    document.getElementById(id)?.scrollIntoView({block: "start", behavior: "instant"});
                } else {
                    window.scrollTo({top: 0, left: 0, behavior: "instant"});
                }
                page.style.overflowAnchor = previous;
            });
        }
        return () => {
            if (frame !== undefined) window.cancelAnimationFrame(frame);
            page.style.overflowAnchor = previous;
        };
    }, [key, hash, ready]);
}
