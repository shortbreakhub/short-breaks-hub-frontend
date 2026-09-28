import { useState } from "react";
import {postRestPasswordEmail} from "../api.js"
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const [showSuccessSendModal,setShowSuccessSendModal] = useState(false);
    const [showErrorSendModal,setShowErrorSendModal] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    function handleSubmit(e) {
        e.preventDefault();
        postRestPasswordEmail(email).then(res => {
            setShowSuccessSendModal(true);
            setSuccess(true);
            setEmail("");
        }).catch(err => setShowErrorSendModal(true))
    }

    return (
        <div className="container mx-auto max-w-md p-4 my-10">
            <h1 className="text-2xl font-semibold mb-4">{t("forgotPasswordPage.resetPassword")}</h1>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    className="w-full border p-2 rounded-md"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("forgotPasswordPage.emailPlaceholder")}
                />

                <button className="bg-black text-white px-4 py-2 rounded cursor-pointer">
                    {t("forgotPasswordPage.sendResetLink")}
                </button>

                {success && (
                        <button type={"button"} className="bg-black text-white px-4 py-2 rounded ml-5 cursor-pointer"
                                onClick={() => navigate("/login")}>
                            {t("forgotPasswordPage.loginNow")}
                        </button>
                )}
            </form>

            {showSuccessSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            🟢 {t("forgotPasswordPage.resetPasswordRequest")}
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {t("forgotPasswordPage.passwordLinkSent")}
                            <br />
                            {t("forgotPasswordPage.hint")}
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowSuccessSendModal(!showSuccessSendModal)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            {t("forgotPasswordPage.ok")}
                        </button>
                    </div>
                </div>
            )}
            {showErrorSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            ⚠️  {t("forgotPasswordPage.resetFailed")}
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {t("forgotPasswordPage.technicalProblem")}
                            <br />
                            {t("forgotPasswordPage.tryLaterHint")}
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowErrorSendModal(!showErrorSendModal)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            {t("forgotPasswordPage.ok")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
