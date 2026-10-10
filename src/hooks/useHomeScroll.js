import {useLayoutEffect} from "react";
import {useLocation} from "react-router-dom";

// Home starts above its hero, rather than aligning the hero beneath a stale anchor offset.
export default function useHomeScroll() {
    const {key, hash} = useLocation();
    useLayoutEffect(() => {
        if (hash) return; // Preserve explicit deep links to homepage sections.
        const frame = window.requestAnimationFrame(() => {
            window.scrollTo({top: 0, left: 0, behavior: "instant"});
        });
        return () => window.cancelAnimationFrame(frame);
    }, [key, hash]);
}
