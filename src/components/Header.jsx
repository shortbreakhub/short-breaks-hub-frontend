import {useTranslation} from "react-i18next";

export default function Header({currentWeatherData,isCelsius,setIsCelsius,handleBackToCurrentWeather,isFutureDateSelected}) {
    const { t } = useTranslation();
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-800 truncate">
                    {currentWeatherData?.region && (
                        currentWeatherData.region
                    )} <span className="text-slate-400">•</span> {currentWeatherData?.country && (
                    t(`itinerarySearchBar.countries.${currentWeatherData.country}`)
                )}
                </h2>
            </div>

            {isFutureDateSelected && (
                <button
                    onClick={handleBackToCurrentWeather}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-semibold text-white cursor-pointer"
                    title={t("weatherHeader.liveTitle")}
                >
                    ⟳ {t("weatherHeader.live")}
                </button>
            )}

            <div className="inline-flex rounded-lg border border-slate-500 overflow-hidden">
                <button
                    type="button"
                    aria-pressed={isCelsius}
                    data-active={isCelsius}
                    onClick={()=>setIsCelsius(true)}
                    className="px-3 py-1 text-sm font-medium data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                    title={t("weatherHeader.switcher")}
                >
                    °C
                </button>
                <div className="w-px bg-slate-300" />
                <button
                    type="button"
                    aria-pressed={!isCelsius}
                    data-active={!isCelsius}
                    onClick={()=>setIsCelsius(false)}
                    className="px-3 py-1 text-sm font-medium data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                    title={t("weatherHeader.switcher")}
                >
                    °F
                </button>
            </div>
        </header>
    )
}