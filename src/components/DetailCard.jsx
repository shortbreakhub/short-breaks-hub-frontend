import {useState} from "react";
import celsiusToFahrenheit from "../utils/celsiusToFahrenheit.js";
import getWeatherDescriptionAndEmoji, {getWeatherIllustrationCategory} from "../utils/weatherCodesTable.js";
import {useTranslation} from "react-i18next";
import village from "../assets/weather/weather-village-watercolor.png";

const illustrations = import.meta.glob("../assets/weather/weather-*-watercolor.png", {eager: true, query: "?url", import: "default"});
const iconPaths = {
    feels: <><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v8"/></>,
    wind: <><path d="M3 8h12a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h5"/></>,
    humidity: <path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/>,
    rain: <><path d="M7 14a4 4 0 1 1 0-8 6 6 0 0 1 11 2 3 3 0 0 1 0 6Z"/><path d="m8 17-1 3m6-3-1 3m6-3-1 3"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>,
    horizon: <><path d="M2 18h20M4 14h16M7 14a5 5 0 0 1 10 0M12 2v4M4 6l3 3m13-3-3 3"/></>,
};
function Metric({icon, label, value}) {
    if (value == null) return null;
    return <div className="weather-hero-metric"><dt><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{iconPaths[icon]}</svg><span>{label}</span></dt><dd>{value}</dd></div>;
}

export default function DetailsCard({currentWeatherData, displayWeatherData, isFutureDateSelected, isCelsius, handleBackToCurrentWeather, dailyHigh, dailyLow}) {
    const {t} = useTranslation();
    const data = displayWeatherData;
    const category = getWeatherIllustrationCategory(data?.weatherCode);
    const illustration = category && illustrations[`../assets/weather/weather-${category}-watercolor.png`];
    const [failedImages, setFailedImages] = useState({});
    const temp = value => value == null ? null : `${isCelsius ? value : celsiusToFahrenheit(value)}°${isCelsius ? "C" : "F"}`;
    const high = isFutureDateSelected ? data?.currentTemperature : dailyHigh == null ? null : Math.round(dailyHigh);
    const low = isFutureDateSelected ? data?.temperatureMin : dailyLow == null ? null : Math.round(dailyLow);
    const description = isFutureDateSelected && data?.weatherCode != null ? getWeatherDescriptionAndEmoji(data.weatherCode).description : data?.description;
    const withUnit = (value, unit) => value == null ? null : `${value}${unit}`;
    return (
        <section className="weather-hero" aria-labelledby="weather-city">
            <div className="weather-hero-story">
                <div className="weather-hero-location">
                    <p>{[currentWeatherData?.region, currentWeatherData?.country && t(`itinerarySearchBar.countries.${currentWeatherData.country}`, {defaultValue: currentWeatherData.country})].filter(Boolean).join(" · ")}</p>
                    {isFutureDateSelected && <button type="button" onClick={handleBackToCurrentWeather} title={t("weatherHeader.liveTitle")}>{t("weatherHeader.live")}</button>}
                </div>
                <h2 id="weather-city">{currentWeatherData?.city}</h2>
                <p className="weather-hero-date">{data?.currentTime}</p>
                <div className="weather-hero-condition">
                    {illustration && !failedImages[illustration] && <img src={illustration} alt="" aria-hidden="true" width="1774" height="887" decoding="async" onError={() => setFailedImages(previous => ({...previous, [illustration]: true}))}/>}
                    <div>
                        <p className="weather-hero-temperature">{temp(data?.currentTemperature) ?? "—"}</p>
                        <p className="weather-hero-description">{description}</p>
                        <p className="weather-hero-range">
                            {high != null && <span>{t("weatherDetailsCard.high")} {temp(high)}</span>}
                            {low != null && <span>{t("weatherDetailsCard.low")} {temp(low)}</span>}
                        </p>
                    </div>
                </div>
            </div>
            {!failedImages[village] && <img className="weather-hero-village" src={village} width="1774" height="887" alt="" aria-hidden="true" decoding="async" onError={() => setFailedImages(previous => ({...previous, [village]: true}))}/>}
            <dl className="weather-hero-metrics">
                {!isFutureDateSelected && <Metric icon="feels" label={t("weatherDetailsCard.feelsLike")} value={temp(data?.feelLike)}/>}
                {!isFutureDateSelected && <Metric icon="humidity" label={t("weatherDetailsCard.humidity")} value={withUnit(data?.relativeHumidity, "%")}/>}
                <Metric icon="wind" label={t("weatherDetailsCard.windSpeed")} value={withUnit(data?.windSpeed, " km/h")}/>
                <Metric icon="rain" label={t("weatherDetailsCard.precipitation")} value={withUnit(data?.precipitationProbability, "%")}/>
                <Metric icon="horizon" label={`${t("weatherDetailsCard.sunriseTime")} / ${t("weatherDetailsCard.sunsetTime")}`} value={[data?.sunrise, data?.sunset].filter(v => v != null).join(" / ") || null}/>
                <Metric icon="sun" label={t("weatherDetailsCard.UVIndex")} value={data?.uxIndex}/>
            </dl>
        </section>
    );
}
