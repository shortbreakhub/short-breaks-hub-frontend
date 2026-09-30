# 🌍 Short Breaks Hub  

Discover the best short city breaks and weekend getaways — all in one place.  
Browse curated itineraries, explore highlights by region, and find recommended stays with budget, mid-range, and luxury options.  

## 🚀 Live Demo  
[👉 View the Website](https://www.shortbreakhub.com)  

---

## ✨ Features  

- 🌎 **Browse by Region** – Explore itineraries for **Southeast Asia, East Asia, and Europe**.  
- 🏙️ **City Break Itineraries** – Day-by-currentTime highlights for popular destinations.  
- 🛏️ **Stay Options** – Budget, mid-range, and luxury hotel recommendations with affiliate links.  
- 📅 **Date Picker** – Choose your travel dates and see available stays (planned feature).  
- 📱 **Responsive Design** – Optimized for desktop, tablet, and mobile.  
- 🎨 **Modern UI** – Built with **TailwindCSS** for a clean and engaging design.  

---
## 🛠 Tech Stack

- Frontend: React (Vite) + React Router
- Styling: Tailwind CSS
- State Management: React Hooks
- Backend API: Java Spring Boot REST API (separate repository)
- Database: PostgreSQL
- Deployment: AWS / S3 frontend hosting

## ⚙️ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/wonton1979/short-breaks-hub.git
cd short-breaks-hub
npm install
npm run dev
```

## Google Analytics 4

Set `VITE_GA_MEASUREMENT_ID=G-JKME4M1QMZ` in the production build environment
before running `npm run build`. Vite embeds this public identifier at build time;
changing it requires rebuilding. See `.env.example`. Keep local `.env` files private.
An absent or invalid `G-…` identifier disables analytics. Leave it blank for local
development unless deliberately testing GA4.

The browser entry point mounts `RouteAnalytics` under `BrowserRouter`; prerendering
does not initialize analytics. The analytics utility loads gtag once, disables its
automatic initial page view, and sends one manual `page_view` on initial mount and
each pathname/search change (including Back/Forward). Consecutive identical URLs
and hash-only changes do not send another view. Language changes without a URL
change do not send another view. Authentication query parameters containing token,
email, password, code, or secret are removed, and URL fragments are excluded.

**Required GA4 setup to avoid duplicate views:** Admin → Data streams → select the
web stream → Enhanced measurement settings → Page views → Show advanced settings →
turn off **Page changes based on browser history events**, then save. Manual page
views own SPA navigation. `send_page_view: false` alone does not disable enhanced
measurement history tracking. See [Google's page view documentation](https://developers.google.com/analytics/devguides/collection/ga4/views).

There is currently no cookie banner or consent gate. With a valid ID, GA4 loads
and collects analytics before explicit consent. The existing `/privacy` policy
promises appropriate information and consent controls if non-essential tracking
is introduced; that policy and consent controls need a follow-up before enabling
collection where consent is required. Keep initialization and page tracking behind
a future consent gate, set Consent Mode defaults before loading gtag, update them
on consent changes, and handle withdrawal. This issue adds no consent UI.

After a separately authorized deployment:

1. Confirm the build used the production variable above and disable automatic
   history page views in the GA4 web stream as described above.
2. In Admin → Data streams → the web stream → View tag instructions → Install
   manually, use **Test installation** with `https://www.shortbreakhub.com`.
3. Open the production site in a fresh browser session with tracking blockers
   disabled. In DevTools Network, confirm one `gtag/js?id=G-JKME4M1QMZ` script
   and GA collection requests with `tid=G-JKME4M1QMZ` and `en=page_view`.
4. Open GA4 Reports → Realtime. Visit the homepage, follow an internal link to
   `/europe`, navigate to an itinerary, and use Back/Forward. Confirm page views
   and page locations change once per navigation. Reload a deep link to verify
   its initial view. Switching English/French without navigation should not add
   a page view. Allow a few minutes for Realtime to update.
5. For precise event inspection, connect Google Tag Assistant to the production
   URL and inspect GA4 DebugView. Confirm one `page_view` per tested navigation
   and check `page_location`, `page_referrer`, and `page_title`.
