import {useEffect, useState} from "react";
import { postUserLogin } from "../api.js";
import {Auth} from "../auth.js";
import {Link, useLocation, useNavigate} from "react-router-dom";
import { toast } from 'react-toastify';
import {showToast} from "../utils/toast.js";
import {useTranslation} from "react-i18next";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [out, setOut] = useState(null);
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
        setOut(null);
        postUserLogin(email, password).then((res) => {
            Auth.save(res.token,res.emailVerified);
            setOut({ ok: true, user: res.user });
            toast.success(`${t("loginPage.welcomeBack")}, ${res?.displayName || t("loginPage.traveler")} !`);
            navigate("/");
        }).catch((err) => {
            setOut(err.response?.data ? { error: t("loginPage.incorrectEmailOrPassword") } : null);
        });
    };

    return (
        <div className="container mx-auto max-w-md p-4">
            <h1 className="text-2xl font-semibold mb-4">{t("loginPage.login")}</h1>
            <form onSubmit={submit} className="space-y-3">
                <div>
                    <label className="block mb-1">{t("loginPage.email")}</label>
                    <input
                        className="w-full border p-2 rounded-md"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1">{t("loginPage.password")}</label>
                    <input
                        className="w-full border p-2 rounded-md"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button className="bg-black text-white px-4 py-2 rounded cursor-pointer">{t("loginPage.login")}</button>
                <p className="mt-3 text-sm text-gray-600">
                    <Link
                        to="/forgot-password"
                        className="text-blue-600 hover:underline"
                    >
                        {t("loginPage.forgotPassword")}
                    </Link>
                </p>

            </form>

            <p className="mt-4 text-sm text-gray-600">
                {t("loginPage.noAccount")}{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                    {t("loginPage.register")}
                </Link>
            </p>
            {out && out.error ? (
                <p className="text-red-500 mt-3 text-[14px]">{out.error}</p>
            ): null}
        </div>
    )
}
