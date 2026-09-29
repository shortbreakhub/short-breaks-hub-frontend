import {Helmet} from "react-helmet-async";
import {getCanonicalUrl} from "../utils/canonicalUrl.js";

export default function PageCanonical({segments}) {
    return (
        <Helmet>
            <link rel="canonical" href={getCanonicalUrl(segments)} />
        </Helmet>
    );
}
