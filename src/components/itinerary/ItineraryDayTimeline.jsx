import React from "react";
import {useTranslation} from "react-i18next";

/** Official-itinerary disclosure timeline. Community itineraries keep their existing accordion. */
export default function ItineraryDayTimeline({schedule = []}) {
    const {t} = useTranslation();

    if (!Array.isArray(schedule) || schedule.length === 0) {
        return <p className="itinerary-story__empty-days">{t("itineraryDayAccordion.emptySchedule")}</p>;
    }

    return (
        <ol className="itinerary-day-timeline" aria-label={t("itineraryPage.dayByDay")}>
            {schedule.map((day, index) => (
                <li className="itinerary-day-timeline__item" key={`${day.day}-${day.title}`}>
                    <details className="itinerary-day-timeline__disclosure" open={index === 0}>
                        <summary className="itinerary-day-timeline__summary">
                            <span className="itinerary-day-timeline__number" aria-hidden="true">{day.day}</span>
                            <span className="itinerary-day-timeline__copy">
                                <span className="itinerary-day-timeline__eyebrow">
                                    {t("itineraryDayAccordion.day")} {day.day}
                                </span>
                                <span className="itinerary-day-timeline__title" role="heading" aria-level="3">{day.title}</span>
                                {day.summary && <span className="itinerary-day-timeline__preview">{day.summary}</span>}
                            </span>
                            <span className="itinerary-day-timeline__toggle" aria-hidden="true" />
                        </summary>
                        <div className="itinerary-day-timeline__details">
                            <p>{day.details}</p>
                        </div>
                    </details>
                </li>
            ))}
        </ol>
    );
}
