import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import "./i18n";
import {PrerenderDataProvider} from "./context/PrerenderDataContext.jsx";
import RouteAnalytics from "./components/RouteAnalytics.jsx";

const rootElement = document.getElementById('root');
const prerenderDataElement = document.getElementById('shortbreakhub-prerender-data');
const prerenderData = prerenderDataElement
    ? JSON.parse(prerenderDataElement.textContent)
    : null;
prerenderDataElement?.remove();

const app = (
    <BrowserRouter>
        <HelmetProvider>
            <PrerenderDataProvider initialData={prerenderData}>
                <App />
                <RouteAnalytics />
            </PrerenderDataProvider>
        </HelmetProvider>
    </BrowserRouter>
);

if (rootElement.dataset.prerendered === "true") {
    hydrateRoot(rootElement, app);
} else {
    createRoot(rootElement).render(app);
}
