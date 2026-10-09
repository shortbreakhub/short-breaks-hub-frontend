import {useTranslation} from "react-i18next";
import SearchBar from "./SearchBar.jsx";
import DatePicker from "./DatePicker.jsx";

export default function WeatherSearchPanel(props) {
    const {t} = useTranslation();
    return (
        <section className="weather-postcard" aria-labelledby="weather-journal-heading">
            <div className="weather-postcard-intro">
                <h1 id="weather-journal-heading">{t("weatherPage.journalHeading")}</h1>
                <p>{t("weatherPage.journalIntro")}</p>
                <svg aria-hidden="true" viewBox="0 0 150 24"><path d="M2 14C40 40 106-12 147 8" fill="none" stroke="currentColor"/></svg>
            </div>
            <div className="weather-postcard-controls">
                <SearchBar {...props}/>
                <DatePicker {...props}/>
                <div className="weather-units" role="group" aria-label={t("weatherHeader.switcher")}>
                    <button type="button" aria-pressed={props.isCelsius} onClick={() => props.setIsCelsius(true)}>°C</button>
                    <button type="button" aria-pressed={!props.isCelsius} onClick={() => props.setIsCelsius(false)}>°F</button>
                </div>
            </div>
            <div className="weather-postal-decoration" aria-hidden="true">
                <svg viewBox="0 0 190 100" fill="none" stroke="currentColor">
                    <circle cx="45" cy="46" r="33"/><circle cx="45" cy="46" r="28" strokeDasharray="2 5"/>
                    <path d="m30 49 12-4 14-17 5 1-9 19 12 10-3 3-16-8-6 10-3-1 1-13-7 2Z"/>
                    <path d="M84 26q20-9 41 0t39 0M84 37q20-9 41 0t39 0M84 48q20-9 41 0t39 0M84 59q20-9 41 0t39 0"/>
                    <path d="M151 5h32v39h-32z" strokeDasharray="3 2"/>
                </svg>
                <p>{t("weatherPage.journalNote")}</p>
            </div>
        </section>
    );
}
