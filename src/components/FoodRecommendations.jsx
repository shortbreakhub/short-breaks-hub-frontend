import React, {useEffect, useId, useState} from "react";
import MapModal from "./MapModal";
import GoogleMap from "./GoogleMap";
import {loadSubFolderImages} from "../utils/loadImage.js";
import { useTranslation } from "react-i18next";

export default function FoodRecommendations({ mustTry,areas,places, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();
    const [mapOpen, setMapOpen] = useState(false);
    const [mapPlace, setMapPlace] = useState(null);
    const { t } = useTranslation();

    const openMapForPlace = (place) => {
        setMapPlace(place);
        setMapOpen(true);
    };

    useEffect(() => {
        console.log(places)
    },[])

    return (
        <section className="rounded-xl border border-slate-200 bg-white">

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left rounded-xl hover:bg-slate-50 cursor-pointer"
                aria-expanded={open}
                aria-controls={contentId}
            >
                <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">
                        {t("foodRecommendations.foodRecommendations")}
                    </h3>
                    <p className="text-xs text-slate-500">{t("foodRecommendations.description")}</p>
                </div>

                <span
                    className={`shrink-0 grid place-items-center h-10 w-10 rounded-full border text-xl font-semibold transition
            ${
                        open
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
                    }`}
                    aria-hidden="true"
                >
          {open ? "−" : "+"}
        </span>
            </button>

            <div
                id={contentId}
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden border-t border-slate-200">
                    <div className="p-4">

                        {mustTry?.length ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">{t("foodRecommendations.mustTry")}</div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    {mustTry.map((item) => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center font-bold rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                                        >
                      {item}
                    </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {areas?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">{t("foodRecommendations.bestAreas")}</div>

                                <ul className="mt-2 space-y-2 text-xs text-slate-600">
                                    {areas.map((a) => (
                                        <li key={a.name}>
                                            <span className="font-semibold text-slate-800">{a.name}:</span>{" "}
                                            {a.note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {places?.length ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-semibold text-slate-800">
                                    {t("foodRecommendations.recommendedPlaces")}
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {places.map((p) => (
                                        <div
                                            key={p.name}
                                            className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                                        >

                                            <div className="h-40 w-full bg-slate-100">
                                                {p.imageUrl ? (
                                                    <img
                                                        src={loadSubFolderImages(p.imageUrl.split("/")[3] + "/"+p.imageUrl.split("/")[4]+"/"+p.imageUrl.split("/")[5],p.imageUrl.split("/")[6].split(".")[0])}
                                                        alt={p.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : null}
                                            </div>

                                            <div className="p-3">
                                                <div className="text-xs font-semibold text-slate-900">
                                                    {p.name}
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-slate-500">
                                                    {p.area}
                                                </div>
                                                <div className="mt-2 text-xs text-slate-600">
                                                    {p.reason}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openMapForPlace(p)}
                                                    className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                                                >
                                                    {t("foodRecommendations.viewOnMap")}
                                                </button>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <MapModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                title={mapPlace ? `${mapPlace.name} • ${mapPlace.area || ""}` : "Map"}
            >
                {mapPlace?.lat && mapPlace?.lng ? (
                    <GoogleMap center={{ lat: mapPlace.lat, lng: mapPlace.lng }} zoom={16} />
                ) : (
                    <div className="h-full w-full grid place-items-center text-sm text-slate-600">
                        {t("foodRecommendations.noCoordinates")}
                    </div>
                )}
            </MapModal>

        </section>
    );
}
