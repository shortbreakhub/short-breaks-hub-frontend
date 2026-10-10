import {useLayoutEffect} from "react";

// Region entry owns its scroll; no guessed timers or global history overrides.
export default function useRegionScroll(anchor, locationKey, ready) {
    useLayoutEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            const target = anchor.current;
            if (!target) return;
            const header = document.querySelector(".journey-navbar");
            const position = header && window.getComputedStyle(header).position;
            const offset = position === "sticky" || position === "fixed"
                ? header.getBoundingClientRect().height : 0;
            // Existing native/hash/footer anchor scrolling uses the same live offset.
            target.style.scrollMarginTop = offset + "px";
            window.scrollTo({
                top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset),
                behavior: "instant",
            });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [anchor, locationKey, ready]);
}
