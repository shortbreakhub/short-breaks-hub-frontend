import React, {useEffect, useMemo, useState} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import mobileMasthead from "../assets/brand/shortbreakhub-navbar-masthead-mobile.png";
import compactMasthead from "../assets/brand/shortbreakhub-navbar-masthead-compact.png";
import masthead from "../assets/brand/shortbreakhub-navbar-masthead.png";
import "../styles/navbar.css";

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
    const { t, i18n } = useTranslation();

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

        if (item.type === 'scroll' && item.id === 'home') {
            if (location.pathname !== '/') navigate('/');
            window.scrollTo({top: 0, left: 0, behavior: 'instant'});
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

    const active = (item) => item.type === "route"
        ? location.pathname.startsWith(item.id)
        : item.type === "scroll" && location.pathname === "/" && activeScroll === item.id;
    const renderLink = (item) => {
        const Control = item.type === "route" ? Link : "button";
        return <Control key={item.id}
            {...(item.type === "route" ? {to: item.id} : {type: "button"})}
            aria-current={active(item) ? (item.type === "route" ? "page" : "location") : undefined}
            onClick={() => {
                if (item.type === "route") {setOpen(false); return;}
                if (item.type === "scroll") setActiveScroll(item.id);
                navigateAndScroll(item);
            }}>{item.label}</Control>;
    };

    return (
        <header className="journey-navbar" onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
                setOpen(false);
                event.currentTarget.querySelector(".journey-menu-toggle")?.focus();
            }
        }}>
            {/* Each responsive range uses its approved complete masthead; all controls remain semantic HTML. */}
            <div className="journey-scenery-frame" aria-hidden="true">
                <picture>
                    <source media="(min-width: 768px) and (max-width: 1279px)" srcSet={compactMasthead} width="1550" height="202" />
                    <source media="(max-width: 767px)" srcSet={mobileMasthead} width="1100" height="202" />
                    <img className="journey-scenery" src={masthead} width="2142" height="202" alt="" aria-hidden="true" />
                </picture>
            </div>
            <nav className="journey-nav">
                <button className="journey-menu-toggle" type="button"
                    onClick={() => setOpen(current => !current)}
                    aria-label={t("navbar.openMenu")} aria-expanded={open} aria-controls="navbar-menu">
                    <span className="journey-menu-icon" aria-hidden="true"><span/><span/><span/></span>
                </button>
                <Link to="/" className="journey-brand" aria-label="Short Break Hub" onClick={() => setOpen(false)}/>
                <div className="journey-desktop-links" lang={i18n.resolvedLanguage}>
                    {links.map(renderLink)}
                    {isLoggedIn && <Link to="/profile" aria-label={t("navbar.profile")}><FaUserCircle size={24}/></Link>}
                </div>
                <div className="journey-language"><LanguageSwitcher/></div>
            </nav>
            {open && <nav id="navbar-menu" className="journey-mobile-links">
                {isLoggedIn && <Link to="/profile" onClick={() => setOpen(false)}>{t("navbar.profile")}</Link>}
                {links.map(renderLink)}
                <p className="journey-menu-motto">{t("homeMagazine.hero.lineOne")} {t("homeMagazine.hero.lineTwo")}</p>
            </nav>}
        </header>
    );
}
