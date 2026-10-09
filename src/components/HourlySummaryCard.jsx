import celsiusToFahrenheit from "../utils/celsiusToFahrenheit.js";

export default function HourlySummaryCard({time, emoji, temperature, isCelsius}) {
    return (
        <li className="weather-hour-tile">
            <p className="weather-hour-time">{time}</p>
            <div className="weather-forecast-icon" aria-hidden="true">{emoji}</div>
            <p className="weather-hour-temperature">{isCelsius ? temperature : celsiusToFahrenheit(temperature)}°</p>
        </li>
    );
}
