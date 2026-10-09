import {useId} from "react";
import {useTranslation} from "react-i18next";

export default function WeatherSearchBar ({locationQuery, setLocationQuery,noLocationQueryResults,handleLocationSearch,isDataFetching}) {
    const { t } = useTranslation();
    const inputId = useId();
    return (
        <div className="px-4 pb-4 mt-5">
            <label htmlFor={inputId} className="text-xs font-medium text-slate-500 mb-1 block">{t("weatherSearchBar.placeSearch")}</label>
            <div className="flex gap-2">
                <input id={inputId}
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder={t("weatherSearchBar.searchPlaceholder")}
                    className="w-full rounded-lg border
                            border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <button className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-semibold text-white"
                        disabled={isDataFetching}
                        title={t("weatherSearchBar.searchTitle")}
                        onClick={handleLocationSearch}>{ isDataFetching ? t("weatherSearchBar.loading")
                    : t("weatherSearchBar.search")}</button>
            </div>
            {
                noLocationQueryResults && (
                    <p className="text-red-600 text-[12px] mt-2">⚠️ {t("weatherSearchBar.noWeatherData")}</p>
                )
            }
        </div>
    )
}