import {useMemo, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {postRestPassword} from "../api.js";
import {useTranslation} from "react-i18next";

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [touchedPwd,setTouchedPwd] = useState(false);
    const [touchedConfirmation,setTouchedConfirmation] = useState(false);
    const [showErrorResetModal, setShowErrorResetModal] = useState(null);
    const [showSuccessResetModal, setShowSuccessResetModal] = useState(null);
    const { t } = useTranslation();

    const hasUpper = (s) => /[A-Z]/.test(s);
    const hasLower = (s) => /[a-z]/.test(s);
    const hasDigit = (s) => /\d/.test(s);
    const hasSpecial = (s) => /[^A-Za-z0-9]/.test(s);
    const minLen = (s, n = 8) => s.length >= n;
    const isPasswordMatch = (confirmPassword, password) => confirmPassword === password

    const checks = useMemo(() => ({
        len: minLen(password),
        upper: hasUpper(password),
        lower: hasLower(password),
        digit: hasDigit(password),
        special: hasSpecial(password),
        passwordMatch: isPasswordMatch(passwordConfirm,password),
    }), [password,passwordConfirm]);

    const allOk = checks.len && checks.upper && checks.lower
        && checks.digit && checks.special && checks.passwordMatch;

    function handleSubmit(e) {
        e.preventDefault();
        if(allOk) {
            postRestPassword(token,password).then(res => {
                setShowSuccessResetModal({message:res.message});
            }).catch(err => setShowErrorResetModal({message: err.response.data.error}));
        }
    }

    const item = (ok, label) => (
        <li style={{ color: ok ? "green" : "crimson" }}>
            {ok ? "✓" : "✗"} {label}
        </li>
    );

    return (
        <div className="container mx-auto max-w-md p-4">
            <h1 className="text-2xl font-semibold mb-4">Set New Password</h1>

            <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block mb-1">Password</label>
                    <div className="relative">
                        <input
                            className="w-full border p-2 pr-10 rounded-md"
                            type={showPwd ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => setTouchedPwd(true)}
                            required
                            aria-label="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPwd(!showPwd)}
                            className="absolute inset-y-0 right-2 flex items-center"
                            aria-label={showPwd ? "Hide password" : "Show password"}
                            title={showPwd ? "Hide password" : "Show password"}
                            tabIndex={-1}
                        >
                            {showPwd ? (

                                <svg xmlns="http://www.w3.org/2000/svg"
                                     fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor"
                                     className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.598 0 3.111-.37 4.444-1.035M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L21 21" />
                                </svg>
                            ) : (

                                <svg xmlns="http://www.w3.org/2000/svg"
                                     fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor"
                                     className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.183.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>

                            )}
                        </button>
                    </div>

                    {(touchedPwd || (!allOk )) && (
                        <ul style={{ marginTop: 8, fontSize: 14, lineHeight: 1.4 }}>
                            {item(checks.len, "At least 8 characters")}
                            {item(checks.upper, "At least one uppercase letter (A–Z)")}
                            {item(checks.lower, "At least one lowercase letter (a–z)")}
                            {item(checks.digit, "At least one digit (0–9)")}
                            {item(checks.special, "At least one special character")}
                        </ul>
                    )}


                <div>
                    <label className="block mb-1 ">Confirm Password</label>
                    <input
                        className="w-full border p-2 rounded-md"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        onBlur={() => setTouchedConfirmation(true)}
                        required
                    />

                    {(touchedConfirmation && passwordConfirm !== password) && (
                        <p className="text-red-500 mt-2 text-[14px]">✗ Password Not Match.</p>
                    )}
                </div>

                <button className="bg-black text-white px-4 py-2 rounded mt-5">
                    Reset Password
                </button>
            </form>
            {showSuccessResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            🟢 Reset Password Successful
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {showSuccessResetModal.message}
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            Login Now
                        </button>
                    </div>
                </div>
            )}
            {showErrorResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white max-w-md w-full mx-4 rounded-xl shadow-xl p-6 text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            ⚠️ Reset Password Request Failed
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {showErrorResetModal.message}
                            <br />
                            Please request a new one.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowErrorResetModal(null)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            Ok
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            className="inline-flex items-center justify-center ml-6 px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                        >
                            Request A New One
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
