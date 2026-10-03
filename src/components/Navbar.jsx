import React, {useEffect, useMemo, useState} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from "../assets/logo-icon.png"
import { toast } from 'react-toastify';
import {Auth} from "../auth.js";
import {FaUserCircle} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [activeScroll, setActiveScroll] = useState("home");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setIsLoggedIn(Auth.isLoggedIn());
    }, [location.key]);

    const links = useMemo(() => {
        const base = [
            { id: 'home', label: t("navbar.home"), type: 'scroll' },
            { id: 'explore', label: t("navbar.explore"), type: 'scroll' },
            { id: '/contact', label: t("navbar.contact"), type: 'route' },
            {
                id: '/live-weather',
                label: t("navbar.liveWeather"),
                type: 'route'
            },
            {
                id: '/community-itineraries/region',
                label: t("navbar.communityTrips"),
                type: 'route'
            },
        ];

        if (isLoggedIn) {
            base.push({
                id: 'logout',
                label: t("navbar.logout"),
                type: 'logout'
            });
        } else {
            base.push({
                id: '/login',
                label: t("navbar.login"),
                type: 'route'
            });
        }

        return base;
    }, [isLoggedIn, location.key, t]);


    const navigateAndScroll = (item) => {
        setOpen(false);

        if (item.type === 'route') {
            navigate(item.id);
            return;
        }

        const scrollToSection = () => {
            const el = document.getElementById(item.id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(scrollToSection, 50);
        } else {
            scrollToSection();
        }

        if (item.type === "logout") {
            Auth.clear();
            navigate("/");
            toast.success(t("navbar.logoutSuccess"));
            return;
        }

    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">

            <nav className="hidden md:flex max-w-screen-xl mx-auto h-14 px-6 items-center justify-between">
                <a href="/" className="flex items-center">
                    <img
                        src={Logo}
                        alt="Travel Explorer Logo"
                        className="h-28 w-auto"
                    />
                </a>

                <div className="flex items-center">
                    <ul className="flex items-center gap-6">
                        {links.map((l) => {
                            const Control = l.type === "route" ? Link : "button";
                            return (
                            <li key={l.id}>
                                <Control
                                    {...(l.type === "route" ? {to: l.id} : {type: "button"})}
                                    onClick={() => {
                                        if (l.type === "route") {
                                            setOpen(false);
                                            return;
                                        }
                                        if (l.type === "scroll") {
                                            setActiveScroll(l.id);
                                        }

                                        navigateAndScroll(l);
                                    }}
                                    className={`inline-block text-left py-3 text-gray-700 text-sm font-medium cursor-pointer
                            ${
                                        l.type === "route" &&
                                        (
                                            (l.id === "/" && location.pathname === "/") ||
                                            (l.id !== "/" && location.pathname.startsWith(l.id))
                                        )
                                            ? "text-blue-600 border-b-[2px] border-blue-600"
                                            : ""
                                    }
                            ${
                                        l.type === "scroll" &&
                                        location.pathname === "/" &&
                                        activeScroll === l.id
                                            ? "text-blue-600 border-b-[2px] border-blue-600"
                                            : l.type === "scroll"
                                                ? "text-gray-700 hover:text-gray-900"
                                                : ""
                                    }`}
                                >
                                    {l.label}
                                </Control>
                            </li>
                            );
                        })}
                    </ul>

                    {isLoggedIn && (
                        <Link
                            to="/profile"
                            title={t("navbar.profile")}
                            className="ml-10 flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
                        >
                            <FaUserCircle size={36}/>
                        </Link>
                    )}

                    <LanguageSwitcher/>
                </div>
            </nav>

            <nav className="md:hidden grid grid-cols-3 items-center h-14 px-4">

                <a href="/" className="justify-self-start">
                    <img
                        src={Logo}
                        alt="Travel Explorer Logo"
                        className="h-12 w-auto"
                    />
                </a>

                <div className="justify-self-center">
                    <LanguageSwitcher/>
                </div>

                <button
                    type="button"
                    className="justify-self-end p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => setOpen((current) => !current)}
                    aria-label="Open navigation menu"
                >
                    {open ? "✕" : "☰"}
                </button>
            </nav>

            {open && (
                <div className="md:hidden bg-white border-t">

                    {isLoggedIn && (
                        <Link
                            to="/profile"
                            onClick={() => {
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-4 border-b text-gray-800 font-medium cursor-pointer"
                        >
                            <FaUserCircle size={24}/>
                            {t("navbar.profile")}
                        </Link>
                    )}

                    {links.map((l) => {
                        const Control = l.type === "route" ? Link : "button";
                        return (
                        <Control
                            key={l.id}
                            {...(l.type === "route" ? {to: l.id} : {type: "button"})}
                            onClick={() => l.type === "route" ? setOpen(false) : navigateAndScroll(l)}
                            className="block w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                            {l.label}
                        </Control>
                        );
                    })}
                </div>
            )}

        </header>
    );
}
