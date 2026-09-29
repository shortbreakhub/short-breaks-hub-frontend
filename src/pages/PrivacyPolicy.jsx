import { useEffect } from "react";
import { Link } from "react-router-dom";
import PageCanonical from "../components/PageCanonical.jsx";
import PageMetadata from "../components/PageMetadata.jsx";
import {STATIC_PAGE_METADATA} from "../utils/pageMetadata.js";

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
            <PageCanonical segments={["privacy"]} />
            <PageMetadata {...STATIC_PAGE_METADATA.privacy} />
            <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <header className="border-b border-slate-200 pb-8">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-700">
                        Short Break Hub
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Privacy Policy
                    </h1>

                    <p className="mt-4 text-sm text-slate-500">
                        Last updated: 31 July 2026
                    </p>
                </header>

                <div className="mt-8 space-y-10 text-base leading-7 text-slate-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            1. Introduction
                        </h2>

                        <p className="mt-3">
                            Short Break Hub respects your privacy and is committed
                            to protecting your personal information.
                        </p>

                        <p className="mt-3">
                            This Privacy Policy explains what information we
                            collect, why we collect it, how we use it, and the
                            choices and rights available to you when you use
                            Short Break Hub.
                        </p>

                        <p className="mt-3">
                            By using this website, you acknowledge the practices
                            described in this Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            2. Information We Collect
                        </h2>

                        <p className="mt-3">
                            The information we collect depends on how you use the
                            website.
                        </p>

                        <h3 className="mt-5 text-lg font-semibold text-slate-900">
                            Account information
                        </h3>

                        <p className="mt-2">
                            When you register for an account, we may collect
                            information such as:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Your name</li>
                            <li>Your email address</li>
                            <li>Your encrypted account password</li>
                            <li>Your preferred currency or language settings</li>
                            <li>
                                Account verification and password-reset
                                information
                            </li>
                        </ul>

                        <h3 className="mt-5 text-lg font-semibold text-slate-900">
                            Content and activity
                        </h3>

                        <p className="mt-2">
                            When you interact with Short Break Hub, we may store:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Saved itineraries and favourites</li>
                            <li>Comments, questions, and answers</li>
                            <li>Community itineraries you create or publish</li>
                            <li>
                                Reports, feedback, or messages you send to us
                            </li>
                        </ul>

                        <h3 className="mt-5 text-lg font-semibold text-slate-900">
                            Technical information
                        </h3>

                        <p className="mt-2">
                            We may automatically receive limited technical
                            information when you use the website, including:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>IP address</li>
                            <li>Browser and device type</li>
                            <li>Operating system</li>
                            <li>Pages visited and basic usage information</li>
                            <li>
                                Authentication, security, and session
                                information
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            3. How We Use Your Information
                        </h2>

                        <p className="mt-3">
                            We may use your information to:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Create and manage your account</li>
                            <li>Authenticate you securely</li>
                            <li>
                                Allow you to save favourites and create community
                                content
                            </li>
                            <li>
                                Send verification and password-reset emails
                            </li>
                            <li>
                                Respond to questions, feedback, or support
                                requests
                            </li>
                            <li>
                                Maintain the security and reliability of the
                                website
                            </li>
                            <li>
                                Investigate misuse, abuse, or technical problems
                            </li>
                            <li>
                                Improve the website and understand how its
                                features are used
                            </li>
                            <li>Meet applicable legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            4. Legal Bases for Processing
                        </h2>

                        <p className="mt-3">
                            Where data-protection law applies, we process
                            personal information using one or more of the
                            following legal bases:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                <strong>Contract:</strong> when processing is
                                necessary to provide your account and requested
                                website features.
                            </li>
                            <li>
                                <strong>Legitimate interests:</strong> when
                                necessary to operate, secure, maintain, and
                                improve Short Break Hub.
                            </li>
                            <li>
                                <strong>Consent:</strong> where you have actively
                                agreed to a particular use of your information.
                            </li>
                            <li>
                                <strong>Legal obligation:</strong> when we must
                                process information to comply with the law.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            5. Cookies and Local Storage
                        </h2>

                        <p className="mt-3">
                            Short Break Hub may use cookies, browser storage, or
                            similar technologies to support essential website
                            functionality.
                        </p>

                        <p className="mt-3">
                            These technologies may be used to keep you signed in,
                            maintain your session, remember selected preferences,
                            protect the website from misuse, and provide core
                            functionality.
                        </p>

                        <p className="mt-3">
                            If non-essential analytics, advertising, or tracking
                            technologies are introduced, appropriate information
                            and consent controls will be provided where required.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            6. Email Communications
                        </h2>

                        <p className="mt-3">
                            We may send transactional emails that are necessary
                            to operate your account, including:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Email verification messages</li>
                            <li>Password-reset messages</li>
                            <li>Important account or security notifications</li>
                            <li>Responses to enquiries or support requests</li>
                        </ul>

                        <p className="mt-3">
                            Marketing or newsletter emails will only be sent
                            where an appropriate legal basis exists, such as your
                            consent. You may unsubscribe from marketing messages
                            using the instructions provided in those emails.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            7. Sharing Your Information
                        </h2>

                        <p className="mt-3">
                            We do not sell your personal information.
                        </p>

                        <p className="mt-3">
                            We may share limited information with trusted
                            service providers that help us operate Short Break
                            Hub, such as:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Website and cloud-hosting providers</li>
                            <li>Database and storage providers</li>
                            <li>Email-delivery providers</li>
                            <li>Security and technical-service providers</li>
                            <li>Analytics providers, where applicable</li>
                        </ul>

                        <p className="mt-3">
                            These providers may only process information as
                            necessary to deliver their services and are expected
                            to protect it appropriately.
                        </p>

                        <p className="mt-3">
                            We may also disclose information where required by
                            law, court order, regulatory request, or to protect
                            the rights, safety, or security of users and the
                            website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            8. Public Content
                        </h2>

                        <p className="mt-3">
                            Content you publish through public areas of Short
                            Break Hub may be visible to other users and visitors.
                            This may include community itineraries, comments,
                            questions, and answers.
                        </p>

                        <p className="mt-3">
                            Please avoid including sensitive personal
                            information in publicly accessible content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            9. Data Retention
                        </h2>

                        <p className="mt-3">
                            We retain personal information only for as long as
                            reasonably necessary to provide the website,
                            maintain security, resolve disputes, enforce our
                            terms, and meet legal obligations.
                        </p>

                        <p className="mt-3">
                            When an account is deleted, some information may be
                            removed, anonymised, or retained for a limited period
                            where required for security, legal, fraud-prevention,
                            or technical-backup purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            10. International Data Transfers
                        </h2>

                        <p className="mt-3">
                            Some service providers may process information in
                            countries outside the United Kingdom or your country
                            of residence.
                        </p>

                        <p className="mt-3">
                            Where required, reasonable safeguards will be used
                            to protect information transferred internationally.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            11. Data Security
                        </h2>

                        <p className="mt-3">
                            We use reasonable technical and organisational
                            measures intended to protect personal information
                            from unauthorised access, alteration, disclosure, or
                            loss.
                        </p>

                        <p className="mt-3">
                            Passwords are not stored as readable plain text.
                            However, no internet service or storage system can be
                            guaranteed to be completely secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            12. Your Rights
                        </h2>

                        <p className="mt-3">
                            Depending on your location and applicable law, you
                            may have rights concerning your personal information,
                            including the right to:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>Request access to your personal information</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your information</li>
                            <li>
                                Request restriction of certain processing
                                activities
                            </li>
                            <li>Object to certain processing activities</li>
                            <li>
                                Request a portable copy of eligible information
                            </li>
                            <li>Withdraw consent where processing relies on it</li>
                            <li>
                                Complain to an appropriate data-protection
                                authority
                            </li>
                        </ul>

                        <p className="mt-3">
                            To exercise a privacy right, contact us at{" "}
                            <a
                                href="mailto:contact@shortbreakhub.com"
                                className="font-medium text-teal-700 underline hover:text-teal-900"
                            >
                                contact@shortbreakhub.com
                            </a>
                            .
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            13. Children’s Privacy
                        </h2>

                        <p className="mt-3">
                            Short Break Hub is not intended for children under
                            the age of 13, and we do not knowingly collect
                            personal information from children under that age.
                        </p>

                        <p className="mt-3">
                            If you believe a child has provided personal
                            information without appropriate permission, please
                            contact us so the matter can be reviewed.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            14. Third-Party Services and Links
                        </h2>

                        <p className="mt-3">
                            Short Break Hub may display information supplied by
                            third-party services, including weather, mapping,
                            transport, accommodation, or destination-information
                            providers.
                        </p>

                        <p className="mt-3">
                            The website may also contain links to third-party
                            websites. Those services operate under their own
                            privacy policies, and Short Break Hub is not
                            responsible for their privacy practices.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            15. Changes to This Privacy Policy
                        </h2>

                        <p className="mt-3">
                            We may update this Privacy Policy to reflect changes
                            to the website, legal requirements, or our
                            information-handling practices.
                        </p>

                        <p className="mt-3">
                            The updated version will be published on this page
                            with a revised “Last updated” date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            16. Contact Us
                        </h2>

                        <p className="mt-3">
                            For questions, concerns, or privacy requests, contact:
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

export default PrivacyPolicy;
