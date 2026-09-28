import {useTranslation} from "react-i18next";

export default function WeatherFooter() {
    const { t } = useTranslation();
    return (
        <footer className="mx-5 my-4 justify-between text-xs text-slate-500">
            <p>{t("weatherFooter.dataSource")}</p>
        </footer>
    )
}