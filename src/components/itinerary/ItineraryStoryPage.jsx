import React from "react";
import {useTranslation} from "react-i18next";
import {Container, EditorialSurface, Media, SectionHeader} from "../ui/EditorialUI.jsx";
import CommentsSection from "../Comments.jsx";
import CurrencyConverter from "../CurrencyConverter.jsx";
import FoodRecommendations from "../FoodRecommendations.jsx";
import TransportTips from "../TransportTips.jsx";
import TravelTips from "../TravelTips.jsx";
import TripPrepRail from "../TripPrepRail.jsx";
import {loadSubFolderImages} from "../../utils/loadItineraryImage.js";
import ItineraryDayTimeline from "./ItineraryDayTimeline.jsx";
import "../../styles/itinerary-story.css";

function getHeroImage(hero) {
    const parts = typeof hero === "string" ? hero.split("/") : [];
    const filename = parts.at(-1) ?? "";
    const subFolder = parts.slice(3, -1).join("/");
    const imageName = filename.replace(/\.[^.]+$/, "");
    return subFolder && imageName ? loadSubFolderImages(subFolder, imageName) : "";
}

export default function ItineraryStoryPage({
    data,
    planning,
    transport,
    city,
    likes,
    onToggleLike,
    fromAmount,
    userCurrency,
    userCurrencyValue,
    convertRate,
    hotelBooking,
    onHotelOpen,
    onHotelChange,
    onHotelReset,
    tripPrepItems,
    onMarkDone,
    onReset,
    onMarkAllDone,
    showSmartSuggestions,
    onToggleSmartSuggestions,
}) {
    const {t, i18n} = useTranslation();
    const heroImage = getHeroImage(data.hero);

    return (
        <EditorialSurface className="itinerary-story" lang={i18n.resolvedLanguage ?? "en"}>
            <main className="itinerary-story__main">
                <section className="itinerary-story__hero" aria-labelledby="itinerary-story-title">
                    {heroImage && (
                        <Media
                            src={heroImage}
                            alt=""
                            loading="eager"
                            ratio="3 / 2"
                            className="itinerary-story__hero-media"
                        />
                    )}
                    <div className="itinerary-story__hero-shade" aria-hidden="true" />
                    <Container className="itinerary-story__hero-content">
                        <p className="itinerary-story__hero-place">{city}{data.country ? `, ${data.country}` : ""}</p>
                        <h1 id="itinerary-story-title">{data.title}</h1>
                        <ul className="itinerary-story__hero-meta" role="list">
                            <li>{data.days} {t("itineraryPage.days")}</li>
                            <li>{t("itineraryPage.from")} ${data.priceFrom} {t("itineraryPage.perPerson")}</li>
                        </ul>
                        <p className="itinerary-story__hero-note">{t("itineraryPage.excludes")}</p>
                    </Container>
                </section>

                <div className="itinerary-story__layout">
                    <article className="itinerary-story__narrative">
                        <section className="itinerary-story__section itinerary-story__highlights" aria-labelledby="itinerary-story-highlights">
                            <SectionHeader
                                title={t("itineraryPage.highlights")}
                                id="itinerary-story-highlights"
                                action={(
                                    <div className="itinerary-story__social">
                                    <button
                                        type="button"
                                        onClick={onToggleLike}
                                        disabled={likes.saving}
                                        aria-pressed={likes.liked}
                                        aria-label={t(likes.liked ? "itineraryPage.unlikeAria" : "itineraryPage.likeAria")}
                                        className="itinerary-story__like"
                                    >
                                        <span aria-hidden="true">{likes.liked ? "♥" : "♡"}</span>
                                        <span>{likes.count}</span>
                                    </button>
                                    <p className="itinerary-story__like-note">{t("itineraryPage.like")}</p>
                                    </div>
                                )}
                            />
                            <ul className="itinerary-story__highlight-list">
                                {data.highlights?.map((highlight, index) => (
                                    <li key={`${index}-${highlight}`}>
                                        <span className="itinerary-story__highlight-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {data.summary && (
                            <section className="itinerary-story__section itinerary-story__overview" aria-labelledby="itinerary-story-overview">
                                <SectionHeader title={t("itineraryPage.overview")} id="itinerary-story-overview" />
                                <p>{data.summary}</p>
                            </section>
                        )}

                        <section className="itinerary-story__section itinerary-story__days" aria-labelledby="itinerary-story-days">
                            <SectionHeader title={t("itineraryPage.dayByDay")} id="itinerary-story-days" />
                            <ItineraryDayTimeline schedule={data.schedule} />
                        </section>

                        <section className="itinerary-story__section itinerary-story__practical" aria-labelledby="itinerary-story-practical">
                            <SectionHeader title={t("itineraryPage.practicalInformation")} id="itinerary-story-practical" />
                            <div className="itinerary-story__practical-tools">
                                {planning && <TravelTips data={planning} defaultOpen={false} />}
                                {transport && <TransportTips data={transport} defaultOpen={false} />}
                                <CurrencyConverter
                                    defaultOpen={false}
                                    data={data}
                                    fromAmount={fromAmount}
                                    userCurrency={userCurrency}
                                    userCurrencyValue={userCurrencyValue}
                                    convertRate={convertRate}
                                />
                                <FoodRecommendations
                                    defaultOpen={false}
                                    mustTry={data.mustTry}
                                    areas={data.areas}
                                    places={data.places}
                                />
                            </div>
                        </section>

                    </article>

                    <aside className="itinerary-story__rail" aria-label={t("tripPrepRail.mainFrame.tripPrep")}>
                        <TripPrepRail
                            city={city}
                            country={data.country}
                            days={data.days}
                            hotelDestination={data.hotelDestination}
                            hotelBooking={hotelBooking}
                            onHotelOpen={onHotelOpen}
                            onHotelChange={onHotelChange}
                            onHotelReset={onHotelReset}
                            items={tripPrepItems}
                            onMarkDone={onMarkDone}
                            onReset={onReset}
                            onMarkAllDone={onMarkAllDone}
                            showSmartSuggestions={showSmartSuggestions}
                            onToggleSmartSuggestions={onToggleSmartSuggestions}
                        />
                    </aside>
                </div>

                <section className="itinerary-story__comments" aria-label={t("comments.comments")}>
                    <CommentsSection itineraryId={data.id} headingLevel={2} />
                </section>
            </main>
        </EditorialSurface>
    );
}
