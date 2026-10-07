import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import englishFlag from "../assets/english-flag.png";
import frenchFlag from "../assets/french-flag.png";

const LANGUAGES = [
    {
        code: "en",
        label: "English",
        flag: englishFlag,
        flagAlt: "British flag",
    },
    {
        code: "fr",
        label: "Français",
        flag: frenchFlag,
        flagAlt: "French flag",
    },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const currentLanguage =
        LANGUAGES.find((language) =>
            i18n.resolvedLanguage?.startsWith(language.code)
        ) ?? LANGUAGES[0];

    useEffect(() => {
        function handleClickOutside(event) {

            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    async function handleLanguageChange(languageCode) {
        await i18n.changeLanguage(languageCode);
        setIsOpen(false);
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-label={currentLanguage.label}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            >
                <img
                    src={currentLanguage.flag}
                    alt={currentLanguage.flagAlt}
                    className="h-6 w-6 shrink-0"
                />

                <span>{currentLanguage.label}</span>

                <span
                    aria-hidden="true"
                    className={`text-xs transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                >
                    ▼
                </span>
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {LANGUAGES.map((language) => {
                        const isSelected =
                            currentLanguage.code === language.code;

                        return (
                            <button
                                key={language.code}
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                    handleLanguageChange(language.code)
                                }
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                <span className="w-4">
                                    {isSelected ? "✓" : ""}
                                </span>

                                <img
                                    src={language.flag}
                                    alt={language.flagAlt}
                                    className="h-5 w-5 shrink-0"
                                />

                                <span>{language.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
