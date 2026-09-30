import {Helmet} from "react-helmet-async";
import {getCanonicalUrl} from "../utils/canonicalUrl.js";

const socialImage = getCanonicalUrl(["og-cover.png"]);

export default function PageMetadata({title, description, canonicalSegments}) {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {canonicalSegments && <meta property="og:url" content={getCanonicalUrl(canonicalSegments)} />}
            <meta property="og:image" content={socialImage} />
            <meta property="og:image:type" content="image/png" />
            <meta property="og:image:alt" content="Collage of city break scenes from Asia and Europe" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={socialImage} />
        </Helmet>
    );
}
