import celsiusToFahrenheit from "../utils/celsiusToFahrenheit.js";
import {useTranslation} from "react-i18next";

export function PrecipitationIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/></svg>;
}

export default function DailySummaryCard({dayWeatherSummary, isCelsius, displayWeatherDetails}) {
    const {day, emoji, temperatureMax, temperatureMin, precipitationProbabilityMax} = dayWeatherSummary;
    const {t} = useTranslation();
    return (
        <li>
            <button type="button" className="weather-day-row" onClick={() => displayWeatherDetails(dayWeatherSummary)}>
                <span>{t(`dailySummaryCard.${day}`)}</span>
                <span className="weather-forecast-icon" aria-hidden="true">{emoji}</span>
                <span className="weather-day-temperature">
                    <strong>{isCelsius ? temperatureMax : celsiusToFahrenheit(temperatureMax)}°</strong>
                    <span className="weather-day-slash"> / </span>
                    <span>{isCelsius ? temperatureMin : celsiusToFahrenheit(temperatureMin)}°</span>
                </span>
                <span className="weather-day-rain"><PrecipitationIcon/><span><span className="sr-only">{t("weatherDetailsCard.precipitation")} </span>{precipitationProbabilityMax}%</span></span>
            </button>
        </li>
    );
}
