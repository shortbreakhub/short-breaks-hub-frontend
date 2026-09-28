import React, { useId, useState } from "react";
import getCurrencyCode from "../utils/countryToCurrency.js";
import { useTranslation } from "react-i18next";

export default function CurrencyConverter({ data, defaultOpen = false,fromAmount,userCurrency,userCurrencyValue,convertRate }) {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();
    const { t } = useTranslation();

    function unslug(s) {
        return s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    }


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
                        {t("currencyConverter.localRate")}
                    </h3>
                    <p className="text-xs text-slate-500">{t("currencyConverter.description")}</p>
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
                        <section>

                            <div className="space-y-3">
                                <label className="block text-xs text-gray-500">
                                    {t("currencyConverter.from")} ({getCurrencyCode(unslug(data.region), data.country)["Base Code"]})
                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            disabled
                                            value={fromAmount}
                                            onChange={(e) => setFromAmount(e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                </label>


                                <label className="block text-xs text-gray-500">
                                    {t("currencyConverter.to")} ({userCurrency})
                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={userCurrencyValue}
                                            readOnly
                                            className="w-full border rounded px-2 py-1 text-sm bg-gray-50"
                                            disabled
                                        />
                                    </div>
                                </label>

                                <p className="text-[11px] text-gray-400">
                                    {t("currencyConverter.usingRate")}: 1 {getCurrencyCode(unslug(data.region), data.country)["Base Code"]} ≈ {convertRate} {userCurrency}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </section>
    );
}
