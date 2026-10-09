import {useEffect, useRef, useState} from "react";
import { postUserLogin } from "../api.js";
import {Auth} from "../auth.js";
import {Link, useLocation, useNavigate} from "react-router-dom";
import { toast } from 'react-toastify';
import {showToast} from "../utils/toast.js";
import {useTranslation} from "react-i18next";
import postageStamp from "../assets/auth/auth-postage-stamp.png";
import "../styles/auth-journal.css";
import "../styles/auth-login-heading.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [out, setOut] = useState(null);
    const [pending, setPending] = useState(false);
    const submitting = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const reason = params.get('reason');
        const msg = localStorage.getItem('auth:toast');


        if (reason === 'unauthorized' || reason === 'expired') {
            showToast(msg || (reason === 'expired' ? t("loginPage.sessionExpired") : t("loginPage.unauthorizedLogin")),{
                variant: 'error',
                duration: 3500,
            });
            localStorage.removeItem('auth:toast');
        }
    }, [location.search]);

    const submit = (e) => {
        e.preventDefault();
        if (submitting.current || !e.currentTarget.checkValidity()) return;
        submitting.current = true;
        setPending(true);
        setOut(null);
        postUserLogin(email, password).then((res) => {
            Auth.save(res.token,res.emailVerified);
            setOut({ ok: true, user: res.user });
            toast.success(`${t("loginPage.welcomeBack")}, ${res?.displayName || t("loginPage.traveler")} !`);
            navigate("/");
        }).catch((err) => {
            setOut({error: err.response?.data ? "loginPage.incorrectEmailOrPassword" : "registerPage.networkError"});
        }).finally(() => {
            submitting.current = false;
            setPending(false);
        });
    };

    return (
        <main className="auth-journal" aria-labelledby="login-title">
            <section className="auth-postcard">
                <img className="auth-postage" src={postageStamp} width="715" height="650" alt="" aria-hidden="true" decoding="async"/>
                <svg className="auth-postmark" viewBox="0 0 160 80" fill="none" stroke="currentColor" aria-hidden="true">
                    <circle cx="36" cy="38" r="30"/><circle cx="36" cy="38" r="25" strokeDasharray="2 4"/>
                    <path d="m20 40 10-3 14-14 4 1-7 17 10 7-2 3-13-6-6 10-3-1 1-12-8 1Z"/>
                    <path d="M70 20q20-8 40 0t40 0M70 32q20-8 40 0t40 0M70 44q20-8 40 0t40 0M70 56q20-8 40 0t40 0"/>
                </svg>
                <header className="auth-introduction">
                    <h1 id="login-title">{t("loginPage.welcomeBack")}</h1>
                    <div className="auth-heading-rule" aria-hidden="true"><span>✧</span></div>
                    <p>{t("loginPage.introduction")}</p>
                </header>
                <form onSubmit={submit} aria-busy={pending}>
                    <fieldset disabled={pending}>
                        <div className="auth-field">
                            <label htmlFor="login-email">{t("loginPage.email")}</label>
                            <input id="login-email" name="email" type="email" autoComplete="username"
                                value={email} onChange={e => setEmail(e.target.value)} required/>
                        </div>
                        <div className="auth-field">
                            <label htmlFor="login-password">{t("loginPage.password")}</label>
                            <input id="login-password" name="password" type="password" autoComplete="current-password"
                                value={password} onChange={e => setPassword(e.target.value)} required/>
                        </div>
                        <button className="auth-submit" type="submit">{t(pending ? "loginPage.signingIn" : "loginPage.login")}</button>
                    </fieldset>
                    <div className="auth-feedback" aria-live="polite">
                        {out?.error && <p role="alert">{t(out.error)}</p>}
                    </div>
                </form>
                <div className="auth-navigation">
                    <p><Link to="/forgot-password">{t("loginPage.forgotPassword")}</Link></p>
                    <p>{t("loginPage.noAccount")} <Link to="/register">{t("loginPage.register")}</Link></p>
                </div>
            </section>
        </main>
    );
}
