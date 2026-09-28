import { useEffect, useRef } from "react";
import {useTranslation} from "react-i18next";

export default function BlockingSessionModal({
                                                 secondsLeft,
                                                 onStay,
                                                 onLogout,
                                             }) {
    const stayBtnRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        stayBtnRef.current?.focus();
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);


    useEffect(() => {
        const stopEsc = (e) => {
            if (e.key === "Escape") e.preventDefault();
        };
        window.addEventListener("keydown", stopEsc);
        return () => window.removeEventListener("keydown", stopEsc);
    }, []);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-labelledby="session-title"
            aria-describedby="session-desc"
        >

            <div className="absolute inset-0 bg-black/60" />


            <div className="relative w-[92vw] max-w-md rounded-lg bg-white shadow-xl ring-1 ring-black/10">
                <div className="px-6 pt-6 pb-4">
                    <h2 id="session-title" className="text-lg font-semibold">
                        {t("blockingSessionModal.sessionAboutToExpire")}
                    </h2>
                    <p id="session-desc" className="mt-2 text-sm text-gray-600">
                        {t("blockingSessionModal.logOutAlert")}
                        {t("blockingSessionModal.timeRemaining")}{" "}
                        <span className="font-mono font-semibold text-red-600">
              {Math.max(0, secondsLeft)}s
            </span>
                    </p>

                    <div className="mt-4 h-2 w-full rounded bg-gray-200">
                        <div
                            className="h-2 rounded bg-red-500 transition-all"
                            style={{
                                width: `${Math.min(100, (secondsLeft / 120) * 100)}%`,
                            }}
                        />
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        >
                            {t("blockingSessionModal.logOut")}
                        </button>
                        <button
                            type="button"
                            ref={stayBtnRef}
                            onClick={onStay}
                            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {t("blockingSessionModal.staySignedIn")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
