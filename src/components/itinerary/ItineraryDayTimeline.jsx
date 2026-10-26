import React, {useEffect, useState} from "react";
import {Media} from "../ui/EditorialUI.jsx";
import {useTranslation} from "react-i18next";

/** Official-itinerary disclosure timeline. Community itineraries keep their existing accordion. */
function TimelineDay({day, initialOpen, image, showThumbnail}) {
    const {t, i18n} = useTranslation();
    const [open, setOpen] = useState(initialOpen);
    const alt = image && (image.alt[i18n.resolvedLanguage?.split("-")[0]] || image.alt.en);
    return <li className="itinerary-day-timeline__item">
        <details className="itinerary-day-timeline__disclosure" open={open}
            onToggle={event => setOpen(event.currentTarget.open)}>
            <summary className="itinerary-day-timeline__summary">
                <span className="itinerary-day-timeline__number" aria-hidden="true">{day.day}</span>
                <span className="itinerary-day-timeline__copy">
                    <span className="itinerary-day-timeline__eyebrow">{t("itineraryDayAccordion.day")} {day.day}</span>
                    <span className="itinerary-day-timeline__title" role="heading" aria-level="3">{day.title}</span>
                    {day.summary && <span className="itinerary-day-timeline__preview">{day.summary}</span>}
                </span>
                {image && !open && showThumbnail && <img src={image.src} alt={alt}
                    width={image.width} height={image.height} loading="lazy" decoding="async"
                    className="itinerary-day-timeline__thumbnail" />}
                <span className="itinerary-day-timeline__toggle" aria-hidden="true" />
            </summary>
            <div className="itinerary-day-timeline__details">
                {image && open && <Media {...image} alt={alt} ratio="16 / 9"
                    className="itinerary-day-timeline__image" />}
                <p>{day.details}</p>
            </div>
        </details>
    </li>;
}

export default function ItineraryDayTimeline({schedule = [], dayImages = {}}) {
    const {t} = useTranslation();

    const [showThumbnail, setShowThumbnail] = useState(false);
    useEffect(() => {
        const media = window.matchMedia?.("(min-width: 480px)");
        if (!media) return;
        const update = () => setShowThumbnail(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    if (!Array.isArray(schedule) || schedule.length === 0) {
        return <p className="itinerary-story__empty-days">{t("itineraryDayAccordion.emptySchedule")}</p>;
    }

    return (
        <ol className="itinerary-day-timeline" aria-label={t("itineraryPage.dayByDay")}>
            {schedule.map((day, index) => <TimelineDay key={`${day.day}-${day.title}`}
                day={day} initialOpen={index === 0} image={dayImages[day.day]} showThumbnail={showThumbnail} />)}
        </ol>
    );
}
