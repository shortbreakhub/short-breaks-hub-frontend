import React from "react";
import {renderToString} from "react-dom/server";
import {HelmetProvider} from "react-helmet-async";
import {MemoryRouter} from "react-router-dom";
import App from "./App.jsx";
import * as prerenderPages from "./prerenderPages.js";
import {PrerenderDataProvider} from "./context/PrerenderDataContext.jsx";
import "./i18n";

export function renderRoute(pathname, initialData = null) {
    const markup = renderToString(
        <div id="shortbreakhub-prerender-root">
            <MemoryRouter initialEntries={[pathname]}>
                <HelmetProvider>
                    <PrerenderDataProvider initialData={initialData}>
                        <App pages={prerenderPages} />
                    </PrerenderDataProvider>
                </HelmetProvider>
            </MemoryRouter>
        </div>
    );

    return {markup};
}
