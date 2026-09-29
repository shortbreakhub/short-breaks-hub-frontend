import { useEffect } from "react";
import { Link } from "react-router-dom";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {STATIC_PAGE_METADATA} from "../utils/pageMetadata.js";

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <PageCanonical segments={["terms"]} />
            <PageMetadata {...STATIC_PAGE_METADATA.terms} />
            <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <header className="border-b border-slate-200 pb-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-700">
                        Short Break Hub
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Terms of Service
                    </h1>

                    <p className="mt-4 text-sm text-slate-500">
                        Last updated: 31 July 2026
                    </p>
                </header>

                <div className="mt-8 space-y-10 text-base leading-7 text-slate-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            1. About These Terms
                        </h2>

                        <p className="mt-3">
                            These Terms of Service govern your access to and use
                            of Short Break Hub, including its itineraries,
                            planning features, community content, weather
                            information, account services, and related
                            functionality.
                        </p>

                        <p className="mt-3">
                            By accessing or using Short Break Hub, you agree to
                            these Terms. If you do not agree, you should not use
                            the website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            2. Nature of the Service
                        </h2>

                        <p className="mt-3">
                            Short Break Hub provides travel inspiration,
                            suggested itineraries, destination information,
                            planning tools, community features, and related
                            informational content.
                        </p>

                        <p className="mt-3">
                            Short Break Hub is not a travel agency, tour
                            operator, accommodation provider, transport
                            provider, insurance provider, or booking service
                            unless a particular feature expressly states
                            otherwise.
                        </p>

                        <p className="mt-3">
                            The website does not guarantee the availability,
                            suitability, price, quality, legality, or safety of
                            any destination, activity, transport option,
                            accommodation, business, or third-party service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            3. Travel Information Disclaimer
                        </h2>

                        <p className="mt-3">
                            Itineraries, estimated budgets, opening times,
                            transport details, travel durations, weather data,
                            entry requirements, and other destination
                            information are provided for general guidance only.
                        </p>

                        <p className="mt-3">
                            Travel information can change without notice. Before
                            making a booking or beginning a journey, you should
                            independently verify important information with
                            official or relevant providers.
                        </p>

                        <p className="mt-3">
                            You remain responsible for checking matters such as:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Passports and visas</li>
                            <li>Travel restrictions and entry requirements</li>
                            <li>Health and vaccination requirements</li>
                            <li>Travel insurance</li>
                            <li>Weather and local safety conditions</li>
                            <li>Transport schedules and cancellations</li>
                            <li>Opening hours and reservation requirements</li>
                            <li>Prices, fees, and availability</li>
                            <li>
                                Accessibility and suitability for your individual
                                circumstances
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            4. Accounts
                        </h2>

                        <p className="mt-3">
                            Some features require you to create an account. You
                            agree to provide accurate information and keep your
                            account details reasonably up to date.
                        </p>

                        <p className="mt-3">
                            You are responsible for protecting your login
                            credentials and for activity carried out through your
                            account.
                        </p>

                        <p className="mt-3">
                            You must notify us promptly if you believe your
                            account has been accessed without permission.
                        </p>

                        <p className="mt-3">
                            You may not create an account using another person’s
                            identity or use another person’s account without
                            authorisation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            5. Acceptable Use
                        </h2>

                        <p className="mt-3">
                            You agree not to use Short Break Hub:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>For unlawful, fraudulent, or abusive purposes</li>
                            <li>To impersonate another person or organisation</li>
                            <li>
                                To upload malicious code, malware, or harmful
                                material
                            </li>
                            <li>
                                To interfere with the website’s security,
                                availability, or operation
                            </li>
                            <li>
                                To gain unauthorised access to accounts, systems,
                                or data
                            </li>
                            <li>
                                To collect information about other users without
                                permission
                            </li>
                            <li>
                                To publish threatening, hateful, harassing,
                                discriminatory, or defamatory content
                            </li>
                            <li>
                                To publish content that infringes intellectual
                                property, privacy, or other legal rights
                            </li>
                            <li>
                                To send spam, misleading promotions, or
                                unauthorised advertising
                            </li>
                            <li>
                                To use automated systems in a way that places an
                                unreasonable load on the service
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            6. Community Content
                        </h2>

                        <p className="mt-3">
                            Short Break Hub may allow users to create or publish
                            itineraries, comments, questions, answers, reviews,
                            or other material.
                        </p>

                        <p className="mt-3">
                            You remain responsible for content you submit and
                            must ensure that you have the right to publish it.
                        </p>

                        <p className="mt-3">
                            By publishing content on Short Break Hub, you grant
                            us a non-exclusive, worldwide, royalty-free licence
                            to host, store, display, reproduce, format, and make
                            that content available as necessary to operate,
                            promote, and improve the service.
                        </p>

                        <p className="mt-3">
                            You retain ownership of your original content. The
                            licence described above does not transfer ownership
                            to Short Break Hub.
                        </p>

                        <p className="mt-3">
                            We may remove, restrict, or moderate content that
                            violates these Terms, creates legal or security
                            concerns, or is otherwise inappropriate for the
                            service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            7. Content Accuracy
                        </h2>

                        <p className="mt-3">
                            We aim to provide helpful and accurate information,
                            but we do not guarantee that all website content is
                            complete, current, error-free, or suitable for every
                            traveller.
                        </p>

                        <p className="mt-3">
                            Community content represents the views and
                            experiences of individual users and does not
                            necessarily represent the views of Short Break Hub.
                        </p>

                        <p className="mt-3">
                            You should use your own judgement and verify
                            important information before relying on it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            8. Weather Information
                        </h2>

                        <p className="mt-3">
                            Weather forecasts and current-condition information
                            may be supplied by third-party services.
                        </p>

                        <p className="mt-3">
                            Weather can change rapidly, and forecast information
                            is not guaranteed to be complete or accurate. You
                            should consult appropriate official services before
                            making safety-sensitive travel decisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            9. Prices and Estimated Budgets
                        </h2>

                        <p className="mt-3">
                            Any prices, estimated budgets, or “price from”
                            figures displayed on Short Break Hub are approximate
                            and provided for general planning purposes.
                        </p>

                        <p className="mt-3">
                            Actual costs may vary because of dates, demand,
                            exchange rates, availability, location, booking
                            conditions, personal choices, and provider pricing.
                        </p>

                        <p className="mt-3">
                            Unless expressly stated otherwise, estimated travel
                            budgets may exclude flights, accommodation,
                            insurance, visas, and personal expenses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            10. Third-Party Services and Links
                        </h2>

                        <p className="mt-3">
                            Short Break Hub may contain links to, integrations
                            with, or information supplied by third-party
                            websites and services.
                        </p>

                        <p className="mt-3">
                            We do not control third-party services and are not
                            responsible for their content, availability,
                            security, pricing, policies, or performance.
                        </p>

                        <p className="mt-3">
                            Your use of a third-party service is governed by that
                            provider’s own terms and policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            11. Intellectual Property
                        </h2>

                        <p className="mt-3">
                            Unless otherwise stated, the Short Break Hub name,
                            branding, website design, software, original
                            itineraries, text, graphics, and other original
                            website material are owned by or licensed to Short
                            Break Hub.
                        </p>

                        <p className="mt-3">
                            You may use the website for personal,
                            non-commercial purposes.
                        </p>

                        <p className="mt-3">
                            You may not copy, reproduce, republish, sell,
                            distribute, scrape, or commercially exploit
                            protected website content without permission, except
                            where permitted by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            12. Account Suspension and Termination
                        </h2>

                        <p className="mt-3">
                            We may suspend, restrict, or terminate access to an
                            account where we reasonably believe that:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>These Terms have been violated</li>
                            <li>The account creates a security risk</li>
                            <li>The service is being abused</li>
                            <li>Fraudulent or unlawful activity has occurred</li>
                            <li>
                                Suspension is necessary to protect other users,
                                third parties, or the website
                            </li>
                        </ul>

                        <p className="mt-3">
                            Where reasonably possible, we may provide notice or
                            an opportunity to resolve the issue.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            13. Availability of the Service
                        </h2>

                        <p className="mt-3">
                            We aim to keep Short Break Hub available and working
                            reliably, but uninterrupted or error-free access
                            cannot be guaranteed.
                        </p>

                        <p className="mt-3">
                            We may modify, suspend, withdraw, or discontinue any
                            part of the website for maintenance, security,
                            technical, operational, or business reasons.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            14. Limitation of Responsibility
                        </h2>

                        <p className="mt-3">
                            Nothing in these Terms excludes or limits liability
                            where it would be unlawful to do so.
                        </p>

                        <p className="mt-3">
                            To the extent permitted by law, Short Break Hub is
                            not responsible for losses or harm arising from:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                Reliance on travel information that has changed
                                or is inaccurate
                            </li>
                            <li>
                                Decisions made using suggested itineraries,
                                budgets, forecasts, or community content
                            </li>
                            <li>
                                Acts, omissions, failures, or policies of
                                third-party providers
                            </li>
                            <li>
                                Travel disruption, cancellation, delay, injury,
                                illness, loss, or property damage
                            </li>
                            <li>
                                Unauthorised access caused by a user’s failure to
                                protect account credentials
                            </li>
                            <li>
                                Temporary interruptions, technical faults, or
                                loss of access to the website
                            </li>
                        </ul>

                        <p className="mt-3">
                            You remain responsible for evaluating travel risks,
                            making suitable arrangements, and obtaining
                            professional advice where necessary.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            15. Privacy
                        </h2>

                        <p className="mt-3">
                            Information about how we collect and use personal
                            information is available in our{" "}
                            <Link
                                to="/privacy"
                                className="font-medium text-teal-700 underline hover:text-teal-900"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            16. Changes to These Terms
                        </h2>

                        <p className="mt-3">
                            We may update these Terms to reflect changes to the
                            website, legal requirements, or how the service
                            operates.
                        </p>

                        <p className="mt-3">
                            Updated Terms will be published on this page with a
                            revised “Last updated” date.
                        </p>

                        <p className="mt-3">
                            Continuing to use Short Break Hub after updated Terms
                            take effect means that you accept the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            17. Governing Law
                        </h2>

                        <p className="mt-3">
                            These Terms are governed by the laws of England and
                            Wales.
                        </p>

                        <p className="mt-3">
                            Any dispute will be subject to the jurisdiction of
                            the courts of England and Wales, except where
                            applicable consumer law gives you the right to bring
                            proceedings elsewhere.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            18. Contact Us
                        </h2>

                        <p className="mt-3">
                            For questions about these Terms, contact:
                        </p>

                        <p className="mt-3">
                            <a
                                href="mailto:contact@shortbreakhub.com"
                                className="font-medium text-teal-700 underline hover:text-teal-900"
                            >
                                contact@shortbreakhub.com
                            </a>
                        </p>
                    </section>
                </div>

                <footer className="mt-12 border-t border-slate-200 pt-8">
                    <Link
                        to="/"
                        className="inline-flex items-center font-medium text-teal-700 hover:text-teal-900"
                    >
                        ← Return to Short Break Hub
                    </Link>
                </footer>
            </article>
        </main>
    );
};

export default TermsOfService;
