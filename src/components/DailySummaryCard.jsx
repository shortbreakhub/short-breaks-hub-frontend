import celsiusToFahrenheit from "../utils/celsiusToFahrenheit.js";
import {useTranslation} from "react-i18next";

export default function DailySummaryCard({dayWeatherSummary,isCelsius,displayWeatherDetails}) {
    const {day,emoji,temperatureMax,temperatureMin,precipitationProbabilityMax} = dayWeatherSummary
    const { t } = useTranslation();

    return (
        <>
            <li className="grid grid-cols-5 items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                onClick={()=>displayWeatherDetails(dayWeatherSummary)}>
                <span className="text-slate-700">{t(`dailySummaryCard.${day}`)}</span>
                <span className="text-xl" aria-hidden="true">{emoji}</span>
                <span className="text-slate-500">
                              <span className="font-semibold text-slate-800">{ isCelsius ? temperatureMax : celsiusToFahrenheit(temperatureMax)}°</span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span>{ isCelsius ? temperatureMin : celsiusToFahrenheit(temperatureMin)}°</span>
                            </span>
                <span className="text-slate-500 col-span-2">{t("weatherDetailsCard.precipitation")} {precipitationProbabilityMax}%</span>
            </li>
        </>
    )
}