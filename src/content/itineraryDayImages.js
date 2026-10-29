import {loadSubFolderImages} from "../utils/loadItineraryImage.js";

// Frontend presentation metadata; schedule content and hero images remain independent.
const images = {
    "4-days-sydney-light-water-and-open-living": {
        folder: "itineraries/australia/sydney",
        days: {
            1: {name: "day-1-sydney-opera-house-circular-quay", alt: {
                en: "Sydney Opera House beside the harbour at Circular Quay",
                fr: "L’Opéra de Sydney au bord du port à Circular Quay"}},
            2: {name: "day-2-sydney-harbour-bridge", alt: {
                en: "Sydney Harbour Bridge spanning the harbour",
                fr: "Le Harbour Bridge de Sydney au-dessus du port"}},
            3: {name: "day-3-bondi-to-coogee-coastal-walk", alt: {
                en: "Ocean cliffs and coastal path on the Bondi to Coogee walk",
                fr: "Falaises et sentier côtier de la promenade de Bondi à Coogee"}},
            4: {name: "day-4-circular-quay-harbour-farewell", alt: {
                en: "Waterfront cafés overlooking the harbour at Circular Quay in daylight",
                fr: "Cafés au bord de l’eau face au port de Circular Quay en journée"}},
        },
    },
    "4-days-vanuatu-fire-water-and-everyday-earth": {
        folder: "itineraries/vanuatu",
        days: {
            1: {name: "day-1-efate-island-coast", alt: {
                en: "Thatched bungalows above a turquoise reef lagoon on the Efate coast",
                fr: "Bungalows au toit de chaume au-dessus d’un lagon turquoise sur la côte d’Efate"}},
            2: {name: "day-2-efate-blue-lagoon", alt: {
                en: "Clear blue freshwater pool with a rope swing, surrounded by forest on Efate",
                fr: "Bassin d’eau douce bleu et limpide avec une balançoire de corde, entouré de forêt à Efate"}},
            3: {name: "day-3-mount-yasur-volcano", alt: {
                en: "Lava glowing inside the crater of Mount Yasur on Tanna at sunset",
                fr: "Lave incandescente dans le cratère du mont Yasur à Tanna au coucher du soleil"}},
            4: {name: "day-4-tanna-village-morning", alt: {
                en: "Villagers cooking over an open fire beside thatched huts on a Tanna morning",
                fr: "Villageois cuisinant sur un feu de bois près de cases au toit de chaume, un matin à Tanna"}},
        },
    },
    "2-days-haarlem-where-craft-feels-enough": {
        folder: "itineraries/netherlands/haarlem",
        days: {
            1: {name: "day-1-grote-markt", alt: {
                en: "Grote Markt in Haarlem with the Grote Kerk, café terraces and historic buildings",
                fr: "La Grote Markt de Haarlem avec la Grote Kerk, des terrasses de café et des bâtiments historiques"}},
            2: {name: "day-2-molen-de-adriaan", alt: {
                en: "De Adriaan windmill beside the Spaarne river in Haarlem",
                fr: "Le moulin De Adriaan au bord de la Spaarne à Haarlem"}},
        },
    },
    "3-days-rotterdam-where-the-city-decided-to-start-again": {
        folder: "itineraries/netherlands/rotterdam",
        days: {
            1: {name: "day-1-erasmus-bridge", alt: {
                en: "Erasmus Bridge over the Maas river beside high-rise towers and a riverside cycle path",
                fr: "Le pont Érasme au-dessus de la Meuse, près de tours et d’une piste cyclable au bord du fleuve"}},
            2: {name: "day-2-rotterdam-harbour", alt: {
                en: "Container ship moored beneath gantry cranes at a Rotterdam harbour terminal",
                fr: "Porte-conteneurs à quai sous des portiques de manutention dans un terminal du port de Rotterdam"}},
            3: {name: "day-3-rotterdam-neighbourhood-streets", alt: {
                en: "Tree-lined café terrace beside a Rotterdam waterway with moored boats, bicycles and a windmill",
                fr: "Terrasse de café bordée d’arbres le long d’un canal de Rotterdam, avec bateaux amarrés, vélos et moulin à vent"}},
        },
    },
    "4-days-shanghai-where-the-future-never-waits": {
        folder: "itineraries/china/shanghai",
        days: {
            1: {name: "day-1-bund-river-light", alt: {
                en: "Crowds along the Bund promenade at dusk, facing the lit Lujiazui skyline across the Huangpu River",
                fr: "Promeneurs sur le Bund au crépuscule, face aux tours illuminées de Lujiazui de l’autre côté du Huangpu"}},
            2: {name: "day-2-french-concession-streets", alt: {
                en: "Plane-tree-lined street with a corner café and historic buildings in the former French Concession",
                fr: "Rue bordée de platanes avec un café d’angle et des bâtiments historiques dans l’ancienne Concession française"}},
            3: {name: "day-3-lujiazui-skyscrapers", alt: {
                en: "Looking up at Shanghai Tower, the World Financial Center and Jin Mao Tower in Lujiazui",
                fr: "Vue en contre-plongée de la Shanghai Tower, du World Financial Center et de la tour Jin Mao à Lujiazui"}},
            4: {name: "day-4-shanghai-morning-street-life", alt: {
                en: "Morning breakfast stalls serving dumplings beside a plane-tree-lined Shanghai street",
                fr: "Échoppes de petit-déjeuner servant des raviolis le matin, le long d’une rue de Shanghai bordée de platanes"}},
        },
    },
    "4-days-papua-new-guinea-land-ancestry-and-presence": {
        folder: "itineraries/papua-new-guinea",
        days: {
            1: {name: "day-1-port-moresby", alt: {
                en: "Port Moresby’s waterfront and harbour seen from a green hillside, with ships and distant hills",
                fr: "Le front de mer et le port de Port Moresby vus d’une colline verdoyante, avec des navires et des collines au loin"}},
            2: {name: "day-2-papua-new-guinea-highlands", alt: {
                en: "Highland valley with low cloud, gardens and tin-roofed houses below forested mountains",
                fr: "Vallée des Hautes-Terres sous les nuages bas, avec jardins et maisons au toit de tôle au pied des montagnes boisées"}},
            3: {name: "day-3-highlands-cultural-traditions", alt: {
                en: "Highlands villagers in feathered headdresses weaving grass beside thatched houses",
                fr: "Villageois des Hautes-Terres coiffés de plumes tressant de l’herbe près de maisons au toit de chaume"}},
            4: {name: "day-4-highlands-farewell-journey", alt: {
                en: "Four-wheel drive on a mountain dirt road above cloud-filled highland valleys at sunset",
                fr: "Un 4x4 sur une piste de montagne surplombant des vallées des Hautes-Terres noyées de nuages au coucher du soleil"}},
        },
    },
};

export function getItineraryDayImages(slug) {
    return Object.fromEntries(Object.entries(images[slug]?.days || {}).map(([day, image]) => [day, {
        src: loadSubFolderImages(images[slug].folder, image.name),
        alt: image.alt,
        width: 1672,
        height: 941,
    }]));
}
