import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {useTranslation} from "react-i18next";
import "../i18n.js";
import "../index.css";
import "./showcase.css";
import {optimizedImages} from "../utils/optimizedImages.js";
import {Action, Badge, CardGrid, Container, ContentCard, ContentState, EditorialLink,
    EditorialSurface, Field, Media, Metadata, Section, SectionHeader} from "../components/ui/EditorialUI.jsx";

// Separate development entry. No production App/route imports this module.
const copy = {
    en: {
        title: "An editorial language for journeys", intro: "Development showcase · shared UI foundations",
        description: "Photography, thoughtful stories and practical planning, with room to explore.",
        typography: "Type & rhythm", display: "A world worth exploring", page: "Places with a story", section: "A little inspiration",
        card: "A weekend in Copenhagen", body: "Take time for the streets, the food and the small discoveries along the way.",
        support: "Curated itineraries for a few memorable days.", metadata: "3 days · Denmark", colors: "Surfaces & color",
        actions: "Actions & links", primary: "Explore destinations", secondary: "Plan a short break", quiet: "Read the guide",
        disabled: "Unavailable", save: "Save this itinerary", saved: "Saved", links: "Explore our travel guides", view: "View all itineraries",
        cards: "Photography & discovery", picks: "Editorial selection", france: "A few days in France", story: "Small moments by the coast",
        long: "Saint-Rémy-de-Provence and the villages of the Alpilles", days: "4 days", category: "Travel guide",
        forms: "Search & planning controls", destination: "Destination", placeholder: "Where would you like to go?",
        hint: "Try a city or a destination with a longer name.", dates: "Check-in", travellers: "Travellers", region: "Region",
        choose: "Choose a region", error: "Please choose a destination before continuing.", unavailable: "Not available yet",
        filter: "Free cancellation", reset: "Clear filters", badges: "Labels & useful details", curated: "Editor's pick", season: "Spring",
        media: "Responsive photography", alt: "An aerial view of the Arc de Triomphe and the streets of Paris", overlay: "Paris · France",
        states: "Loading, empty & recovery", loading: "Loading itineraries…", empty: "No itineraries match yet",
        emptyDescription: "Try a different destination or adjust your filters.", failed: "We couldn’t load these itineraries",
        failedDescription: "Your plans are still here. Please try again.", retry: "Try again", recovered: "Itineraries are ready",
    },
    fr: {
        title: "Un langage éditorial pour les voyages", intro: "Présentation de développement · composants partagés",
        description: "Des photographies, des récits et des conseils pratiques qui invitent à la découverte.",
        typography: "Typographie et rythme", display: "Un monde à découvrir", page: "Des lieux qui racontent une histoire", section: "Un peu d’inspiration",
        card: "Un week-end à Copenhague", body: "Prenez le temps de découvrir les rues, les saveurs et les petits moments qui rendent un voyage mémorable.",
        support: "Des itinéraires sélectionnés pour quelques jours inoubliables.", metadata: "3 jours · Danemark", colors: "Surfaces et couleurs",
        actions: "Actions et liens", primary: "Découvrir les destinations", secondary: "Préparer une escapade de quelques jours", quiet: "Lire le guide de voyage",
        disabled: "Indisponible", save: "Enregistrer cet itinéraire", saved: "Enregistré", links: "Découvrir nos guides de voyage", view: "Voir tous les itinéraires",
        cards: "Photographies et découvertes", picks: "Sélection de la rédaction", france: "Quelques jours en France", story: "Petits moments au bord de la mer",
        long: "Saint-Rémy-de-Provence et les villages du massif des Alpilles", days: "4 jours", category: "Guide de voyage",
        forms: "Recherche et préparation du voyage", destination: "Destination", placeholder: "Quelle destination souhaitez-vous découvrir ?",
        hint: "Essayez une ville ou une destination dont le nom est plus long.", dates: "Date d’arrivée", travellers: "Voyageurs", region: "Région",
        choose: "Choisissez une région", error: "Veuillez choisir une destination avant de continuer.", unavailable: "Pas encore disponible",
        filter: "Annulation gratuite", reset: "Réinitialiser les filtres", badges: "Repères et informations utiles", curated: "Choix de la rédaction", season: "Printemps",
        media: "Photographies adaptatives", alt: "Une vue aérienne de l’Arc de Triomphe et des rues de Paris", overlay: "Paris · France",
        states: "Chargement, absence de résultats et reprise", loading: "Chargement des itinéraires…", empty: "Aucun itinéraire ne correspond pour le moment",
        emptyDescription: "Essayez une autre destination ou modifiez vos filtres de recherche.", failed: "Impossible de charger ces itinéraires",
        failedDescription: "Votre préparation est conservée. Veuillez réessayer.", retry: "Réessayer", recovered: "Les itinéraires sont disponibles",
    },
};

function Showcase() {
    const {i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "fr" ? "fr" : "en";
    const c = copy[language];
    const [saved, setSaved] = useState(false);
    const [failed, setFailed] = useState(true);
    const [destination, setDestination] = useState("");
    const paris = optimizedImages.france;
    const photo = {src: paris.src, srcSet: paris.srcSet, sizes: "(min-width: 1024px) 390px, (min-width: 640px) 45vw, 90vw",
        width: paris.width, height: paris.height, alt: c.alt};
    return <EditorialSurface lang={language}>
        <Container>
            <main>
                <Section>
                    <div className="sbh-cluster">
                        <Action variant="secondary" aria-pressed={language === "en"} onClick={() => i18n.changeLanguage("en")}>English</Action>
                        <Action variant="secondary" aria-pressed={language === "fr"} onClick={() => i18n.changeLanguage("fr")}>Français</Action>
                    </div>
                    <p className="sbh-kicker">{c.intro}</p>
                    <h1 className="sbh-page-title">{c.title}</h1>
                    <p className="sbh-support">{c.description}</p>
                </Section>
                <Section aria-labelledby="type-heading">
                    <SectionHeader id="type-heading" title={c.typography} />
                    <div className="sbh-stack">
                        <p className="sbh-display">{c.display}</p>
                        <p className="sbh-page-title">{c.page}</p>
                        <p className="sbh-section-title">{c.section}</p>
                        <p className="sbh-card-title">{c.card}</p>
                        <p>{c.body}</p><p className="sbh-support">{c.support}</p><p className="sbh-meta">{c.metadata}</p>
                    </div>
                </Section>
                <Section>
                    <SectionHeader title={c.colors} />
                    <div className="sbh-cluster">
                        {["page", "surface", "surface-soft", "accent", "focus"].map(color => <div key={color} className="showcase-swatch">
                            <span style={{background: `var(--sbh-${color})`}} />{color}
                        </div>)}
                    </div>
                </Section>
                <Section>
                    <SectionHeader title={c.actions} />
                    <div className="sbh-cluster">
                        <Action to="/europe">{c.primary}</Action>
                        <Action variant="secondary" href="/browse/france">{c.secondary}</Action>
                        <Action variant="quiet" to="/contact">{c.quiet}</Action>
                        <Action disabled>{c.disabled}</Action>
                        <Action to="/browse/france" disabled variant="secondary">{c.disabled}</Action>
                        <Action iconOnly variant="secondary" aria-label={c.save} aria-pressed={saved} onClick={() => setSaved(!saved)}><span aria-hidden="true">{saved ? "★" : "☆"}</span></Action>
                    </div>
                    <p><EditorialLink to="/browse/france">{c.links}</EditorialLink></p>
                    <EditorialLink navigation to="/europe">{c.view}</EditorialLink>
                </Section>
                <Section>
                    <SectionHeader eyebrow={c.picks} title={c.cards} description={c.support}
                        action={<Action variant="quiet" to="/browse/france">{c.view}</Action>} />
                    <CardGrid>
                        <ContentCard title={c.france} to="/browse/france" media={photo} eyebrow={c.picks} metadata={[c.days, "France"]} description={c.body} />
                        <ContentCard title={c.story} to="/europe" media={{...photo, ratio: "3 / 2"}} eyebrow={c.category} description={c.body}
                            action={<Action variant="quiet" onClick={() => setSaved(!saved)}>{saved ? c.saved : c.save}</Action>} />
                        <ContentCard title={c.long} to="/browse/france" media={photo} metadata={[c.season, c.category]} description={c.support} />
                    </CardGrid>
                </Section>
                <Section>
                    <SectionHeader title={c.forms} />
                    <form className="sbh-stack" onSubmit={event => event.preventDefault()}>
                        <CardGrid>
                            <Field label={c.destination} type="search" value={destination} onChange={event => setDestination(event.target.value)} placeholder={c.placeholder} hint={c.hint} />
                            <Field label={c.dates} type="date" defaultValue="2026-11-01" />
                            <Field label={c.travellers} type="number" min={1} max={12} defaultValue={2} />
                            <Field label={c.region} as="select" defaultValue=""><option value="">{c.choose}</option><option value="europe">Europe</option></Field>
                            <Field label={c.destination} error={c.error} aria-required="true" />
                            <Field label={c.unavailable} disabled defaultValue={c.unavailable} />
                        </CardGrid>
                        <label className="sbh-toggle"><input type="checkbox" />{c.filter}</label>
                        <div className="sbh-cluster"><Action type="submit">{c.primary}</Action><Action variant="quiet" type="reset">{c.reset}</Action></div>
                    </form>
                </Section>
                <Section><SectionHeader title={c.badges} /><div className="sbh-cluster"><Badge>{c.curated}</Badge><Badge tone="success">{c.saved}</Badge><Metadata items={[c.days, c.season, c.category]} /></div></Section>
                <Section><SectionHeader title={c.media} /><Container reading><Media {...photo} loading="eager" overlay={c.overlay} sizes="(min-width: 768px) 700px, 90vw" /></Container></Section>
                <Section>
                    <SectionHeader title={c.states} />
                    <div className="sbh-stack">
                        <ContentState kind="loading" title={c.loading} />
                        <ContentState title={c.empty} description={c.emptyDescription} action={<Action variant="secondary" onClick={() => setDestination("")}>{c.reset}</Action>} />
                        <ContentState kind={failed ? "error" : "empty"} title={failed ? c.failed : c.recovered} description={failed ? c.failedDescription : undefined}
                            action={failed ? <Action variant="secondary" onClick={() => setFailed(false)}>{c.retry}</Action> : undefined} />
                    </div>
                </Section>
            </main>
        </Container>
    </EditorialSurface>;
}

// A direct dev-server page, outside public routing and production Rollup inputs.
if (import.meta.env.DEV) createRoot(document.getElementById("root")).render(<BrowserRouter><Showcase /></BrowserRouter>);
