import southeastAsiaCommunityImg from "../assets/southeast-community.jpg";
import eastAsiaCommunityImg from "../assets/eastasia-community.jpg";
import europeCommunityImg from "../assets/europe-community.jpg";
import americasCommunityImg from "../assets/americas-community.jpg";
import anzCommunityImg from "../assets/anz-community.jpg";
import africaCommunityImg from "../assets/africa-community.jpg"
import RegionCard from "../components/RegionCard.jsx";
import {useTranslation} from "react-i18next";
import "../styles/community-journal.css";


export default function CommunityTripsPage() {

    const { t } = useTranslation();

    const regions = [
        {
            title: t("communityTripsPage.southeastAsia.title"),
            description: t("communityTripsPage.southeastAsia.description"),
            image: southeastAsiaCommunityImg,
            onClick: "southeast-asia",
        },
        {
            title: t("communityTripsPage.eastAsia.title"),
            description: t("communityTripsPage.eastAsia.description"),
            image: eastAsiaCommunityImg,
            onClick: "east-asia-community",
        },
        {
            title: t("communityTripsPage.europe.title"),
            description: t("communityTripsPage.europe.description"),
            image: europeCommunityImg,
            onClick: "EUROPE",
        },
        {
            title: t("communityTripsPage.americas.title"),
            description: t("communityTripsPage.americas.description"),
            image: americasCommunityImg,
            onClick: "americas-community",
        },
        {
            title: t("communityTripsPage.oceania.title"),
            description: t("communityTripsPage.oceania.description"),
            image: anzCommunityImg,
            onClick: "anz-community",
        },
        {
            title: t("communityTripsPage.africa.title"),
            description: t("communityTripsPage.africa.description"),
            image: africaCommunityImg,
            onClick: "africa-community",
        },
    ];

    return (
        <>
            <main id="explore" className="community-landing scroll-mt-20">
                <div className="py-16 px-6">
                    <h1 className="text-3xl font-bold text-center mb-10">{t("communityTripsPage.exploreByRegion")}</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        { regions.map((item, index) => (
                            <RegionCard
                                key={index}
                                image={item.image}
                                title={item.title}
                                description={item.description}
                                to={`/community-itineraries/region/${item.onClick}`}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}