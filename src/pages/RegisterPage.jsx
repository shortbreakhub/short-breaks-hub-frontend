import {useState, useMemo, useEffect, useRef} from "react";
import { Link, useNavigate } from "react-router-dom";
import { postUserRegister } from "../api";
import {useTranslation} from "react-i18next";
import postageStamp from "../assets/auth/auth-postage-stamp.png";
import suitcase from "../assets/auth/auth-vintage-suitcase.png";
import globe from "../assets/auth/auth-vintage-globe.png";
import "../styles/auth-journal.css";
import "../styles/auth-login-heading.css";
import "../styles/auth-register.css";

const isEmailValid = (email) => /^([a-z0-9.-_]+)@([a-z0-9_-])+\.[a-z]{2,10}(.[a-z]{2,8})?$/i.test(email);
const hasUpper = (s) => /[A-Z]/.test(s);
const hasLower = (s) => /[a-z]/.test(s);
const hasDigit = (s) => /\d/.test(s);
const hasSpecial = (s) => /[^A-Za-z0-9]/.test(s);
const minLen = (s, n = 8) => s.length >= n;
const isValidDisplayName = (name) => {
    const trimmed = name.trim();
    const regex = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
    return trimmed.length >= 2 && trimmed.length <= 30 && regex.test(trimmed);
};
const isPasswordMatch = (confirmPassword, password) => confirmPassword === password



export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [out, setOut] = useState(null);
    const [pending, setPending] = useState(false);
    const submitting = useRef(false);
    const redirectTimer = useRef(null);
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedPwd, setTouchedPwd] = useState(false);
    const [touchedConfirmation, setTouchedConfirmation] = useState(false);
    const [touchedDisplayName, setTouchedDisplayName] = useState(false);
    const navigate = useNavigate();
    const [redirectIn, setRedirectIn] = useState(5);
    const [showPwd, setShowPwd] = useState(false)
    const { t } = useTranslation();

    useEffect(() => () => clearTimeout(redirectTimer.current), []);

    useEffect(() => {
        if (!out?.success) return;
        const id = setInterval(() => setRedirectIn(s => (s > 1 ? s - 1 : 1)), 1000);
        return () => clearInterval(id);
    }, [out?.success]);


    const checks = useMemo(() => ({
        email:isEmailValid(email),
        len: minLen(password),
        upper: hasUpper(password),
        lower: hasLower(password),
        digit: hasDigit(password),
        special: hasSpecial(password),
        displayName: isValidDisplayName(displayName),
        passwordMatch: isPasswordMatch(passwordConfirm,password),
    }), [password,email,displayName,passwordConfirm]);

    const allOk = checks.len && checks.upper && checks.lower
        && checks.digit && checks.special && checks.displayName && checks.email && checks.passwordMatch;

    const submit = (e) => {
        e.preventDefault();
        if (!allOk || submitting.current || !e.currentTarget.checkValidity()) return;
        submitting.current = true;
        setPending(true);
        setOut(null);

        postUserRegister(email, password, displayName)
            .then(() => {
                setOut({ success: t("registerPage.accountCreatedMessage") });
                redirectTimer.current = setTimeout(() => navigate("/login"), 5000);
            }).catch((err) => {

            const status = err?.response?.status;
            const dataMsg = err?.response?.data?.message || err?.response?.data?.error;
            let message;

            if (status === 409) {
                message = t("registerPage.errorEmailExist");
            } else if (status) {
                message = dataMsg || `${t("registerPage.errorStatus")} ${status}`;
            } else {
                message = t("registerPage.networkError");
            }

            setOut({ ok: false, message });
        }).finally(() => {
            submitting.current = false;
            setPending(false);
        });
    };

    const item = (ok, label) => <li className={ok ? "auth-check-pass" : "auth-check-fail"}>{ok ? "✓" : "✗"} {label}</li>;

    return (
        <main className="auth-journal auth-register-journal" aria-labelledby="register-title">
            <section className="auth-postcard auth-register-postcard">
                <img className="auth-postage" src={postageStamp} width="715" height="650" alt="" aria-hidden="true" decoding="async"/>
                <svg className="auth-postmark" viewBox="0 0 160 80" fill="none" stroke="currentColor" aria-hidden="true">
                    <circle cx="36" cy="38" r="30"/><circle cx="36" cy="38" r="25" strokeDasharray="2 4"/>
                    <path d="m20 40 10-3 14-14 4 1-7 17 10 7-2 3-13-6-6 10-3-1 1-13-8 1Z"/>
                    <path d="M70 20q20-8 40 0t40 0M70 32q20-8 40 0t40 0M70 44q20-8 40 0t40 0M70 56q20-8 40 0t40 0"/>
                </svg>
                <header className="auth-introduction">
                    <h1 id="register-title">{t("registerPage.heading")}</h1>
                    <div className="auth-heading-rule" aria-hidden="true"><span>✧</span></div>
                    <p>{t("registerPage.introduction")}</p>
                </header>
                {out?.success ? (
                    <div role="status" aria-live="polite" className="auth-register-success">
                        <p>{out.success}</p>
                        <p>{t("registerPage.redirectingTo")} <strong>{t("registerPage.login")}</strong> {t("registerPage.in")} <strong>{redirectIn}</strong> {t("registerPage.seconds")} <button type="button" onClick={() => navigate("/login")}>{t("registerPage.goNow")}</button></p>
                    </div>
                ) : (
                    <form onSubmit={submit} aria-busy={pending}>
                        <fieldset disabled={pending}>
                            <div className="auth-field">
                                <label htmlFor="register-email">{t("registerPage.email")}</label>
                                <input id="register-email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setTouchedEmail(true)} required aria-invalid={touchedEmail && !checks.email} aria-describedby={touchedEmail && !checks.email ? "register-email-help" : undefined}/>
                                {touchedEmail && !checks.email && <ul id="register-email-help" className="auth-checks">{item(checks.email, t("registerPage.validEmailCheck"))}</ul>}
                            </div>
                            <div className="auth-field">
                                <label htmlFor="register-password">{t("registerPage.password")}</label>
                                <div className="auth-password-field">
                                    <input id="register-password" name="password" type={showPwd ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} onBlur={() => setTouchedPwd(true)} required aria-invalid={touchedPwd && !(checks.len && checks.upper && checks.lower && checks.digit && checks.special)} aria-describedby={touchedPwd ? "register-password-help" : undefined}/>
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={t(showPwd ? "registerPage.hidePassword" : "registerPage.showPassword")} aria-pressed={showPwd}>
                                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPwd && <path d="m3 3 18 18"/>}</svg>
                                    </button>
                                </div>
                                {touchedPwd && <ul id="register-password-help" className="auth-checks">
                                    {item(checks.len, t("registerPage.passwordCheckLength"))}
                                    {item(checks.upper, t("registerPage.passwordCheckUpper"))}
                                    {item(checks.lower, t("registerPage.passwordCheckLower"))}
                                    {item(checks.digit, t("registerPage.passwordCheckNumber"))}
                                    {item(checks.special, t("registerPage.passwordCheckSpecialChar"))}
                                </ul>}
                            </div>
                            <div className="auth-field">
                                <label htmlFor="register-confirm">{t("registerPage.confirmPassword")}</label>
                                <input id="register-confirm" name="passwordConfirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onBlur={() => setTouchedConfirmation(true)} required aria-invalid={touchedConfirmation && !checks.passwordMatch} aria-describedby={touchedConfirmation && !checks.passwordMatch ? "register-confirm-help" : undefined}/>
                                {touchedConfirmation && !checks.passwordMatch && <p id="register-confirm-help" className="auth-checks auth-check-fail">{t("registerPage.passwordNotMatch")}</p>}
                            </div>
                            <div className="auth-field">
                                <label htmlFor="register-display-name">{t("registerPage.displayName")}</label>
                                <input id="register-display-name" name="displayName" autoComplete="nickname" value={displayName} onChange={e => setDisplayName(e.target.value)} onBlur={() => setTouchedDisplayName(true)} required aria-invalid={touchedDisplayName && !checks.displayName} aria-describedby={touchedDisplayName && !checks.displayName ? "register-name-help" : undefined}/>
                                {touchedDisplayName && !checks.displayName && <ul id="register-name-help" className="auth-checks">{item(checks.displayName, t("registerPage.displayNameCheck"))}</ul>}
                            </div>
                            <button className="auth-submit" type="submit" disabled={!allOk || pending}>{t(pending ? "registerPage.creatingAccount" : "registerPage.createAccount")}</button>
                        </fieldset>
                        <div className="auth-feedback" aria-live="polite">{out?.message && <p role="alert">{out.message}</p>}</div>
                    </form>
                )}
                <div className="auth-navigation"><p>{t("registerPage.haveAccount")} <Link to="/login">{t("registerPage.login")}</Link></p></div>
                <div className="auth-register-art" aria-hidden="true">
                    <img className="auth-suitcase" src={suitcase} width="738" height="591" alt="" decoding="async"/>
                    <img className="auth-globe" src={globe} width="485" height="698" alt="" decoding="async"/>
                </div>
            </section>
        </main>
    );
}
