import {createContext, useState} from "react";

export const PrerenderDataContext = createContext(null);

export function PrerenderDataProvider({initialData = null, children}) {
    const [data, setData] = useState(initialData);
    const value = {
        ...data,
        clear: () => setData(null),
    };

    return (
        <PrerenderDataContext.Provider value={data ? value : null}>
            {children}
        </PrerenderDataContext.Provider>
    );
}
