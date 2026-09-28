import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";

export default function TransportTips({ data, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();
    const { t } = useTranslation();

    const d = data

    return (
        <section className="rounded-xl border border-slate-200 bg-white">

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left rounded-xl hover:bg-slate-50 cursor-pointer"
                aria-expanded={open}
                aria-controls={contentId}
            >
                <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                        {t("transportTips.transportTips")}
                    </h3>
                    <p className="text-xs text-slate-500">{t("transportTips.description")}</p>
                </div>


                <span
                    className={`shrink-0 grid place-items-center h-10 w-10 rounded-full border text-xl font-semibold transition
            ${
                        open
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
                    }`}
                    aria-hidden="true"
                >
          {open ? "−" : "+"}
        </span>
            </button>


            <div
                id={contentId}
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden border-t border-slate-200">
                    <div className="p-4">

                        {d.arrival?.length ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("transportTips.arrival")}
                                </div>

                                <div className="mt-2 space-y-2">
                                    {d.arrival.map((x) => (
                                        <div
                                            key={x.title}
                                            className="rounded-lg border border-slate-200 bg-white p-3"
                                        >
                                            <div className="text-xs font-semibold text-slate-900">
                                                {x.title}
                                            </div>
                                            <div className="mt-1 text-xs leading-relaxed text-slate-600">
                                                {x.note}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}


                        {d.gettingAround?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("transportTips.gettingAround")}
                                </div>

                                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                                    {d.gettingAround.map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}


                        {d.dayTrips?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("transportTips.easyDayTrips")}
                                </div>

                                <div className="mt-2 space-y-2">
                                    {d.dayTrips.map((x) => (
                                        <div
                                            key={x.title}
                                            className="rounded-lg border border-slate-200 bg-white p-3"
                                        >
                                            <div className="text-xs font-semibold text-slate-900">
                                                {x.title}
                                            </div>
                                            <div className="mt-1 text-xs leading-relaxed text-slate-600">
                                                {x.note}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}


                        {d.dayMoves?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("transportTips.dayMoves")}
                                </div>

                                <div className="mt-2 space-y-2">
                                    {d.dayMoves.map((x) => (
                                        <div
                                            key={x.title}
                                            className="rounded-lg border border-slate-200 bg-white p-3"
                                        >
                                            <div className="text-xs font-semibold text-slate-900">
                                                {x.title}
                                            </div>
                                            <div className="mt-1 text-xs leading-relaxed text-slate-600">
                                                {x.note}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}


                        {d.practical?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("transportTips.practicalTips")}
                                </div>

                                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                                    {d.practical.map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}


                        {d.quickLinks?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    Quick links (optional)
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    {d.quickLinks.map((l) => (
                                        <a
                                            key={l.label}
                                            href={l.href || "#"}
                                            onClick={(e) => {
                                                if (!l.href) e.preventDefault();
                                            }}
                                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            {l.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
