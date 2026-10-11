import {useLayoutEffect, useRef} from "react";
import {useLocation, useNavigationType} from "react-router-dom";

// Leave POP restoration and explicit anchors to the browser/page scroll hooks.
export default function useRouteScroll() {
    const {pathname, hash, key} = useLocation();
    const navigationType = useNavigationType();
    const previousPath = useRef(pathname);

    useLayoutEffect(() => {
        const changedPage = previousPath.current !== pathname;
        previousPath.current = pathname;
        if (changedPage && navigationType !== "POP" && !hash) {
            window.scrollTo({top: 0, left: 0, behavior: "instant"});
        }
    }, [pathname, hash, key, navigationType]);
}
