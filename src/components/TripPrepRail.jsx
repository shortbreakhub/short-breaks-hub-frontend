import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function ProgressBar({ done, total }) {
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const { t } = useTranslation();
    return (
        <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          {done}/{total}  {t("tripPrepRail.progressBar.done")}
        </span>
                <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                    className="h-2 rounded-full bg-gray-900 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function StatusPill({ done }) {
    const { t } = useTranslation();
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                done ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}

        >
      <span
          className={[
              "h-1.5 w-1.5 rounded-full",
              done ? "bg-green-600" : "bg-amber-600",
          ].join(" ")}
      />
            {done ? t("tripPrepRail.statusPill.done") : t("tripPrepRail.statusPill.pending")}
    </span>
    );
}

function PrimaryButton({ children, onClick, disabled, className = "" }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition",
                disabled
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-black",
                className,
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function SecondaryButton({ children, onClick, disabled, className = "" }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                "inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition",
                disabled
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-800 hover:bg-gray-50",
                className,
            ].join(" ")}
        >
            {children}
        </button>
    );
}


function Field({ field, value, onChange }) {
    if (field.type === "toggle") {
        return (
            <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <div>
                    <p className="text-sm font-medium text-gray-900">{field.label}</p>
                </div>
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(field.key, e.target.checked)}
                    className="h-4 w-4"
                />
            </label>
        );
    }

    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">{field.label}</label>

            {field.type === "text" && (
                <input
                    type="text"
                    value={value ?? ""}
                    placeholder={field.placeholder ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
            )}

            {field.type === "date" && (
                <input
                    type="date"
                    value={value ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
            )}

            {field.type === "number" && (
                <input
                    type="number"
                    value={value ?? ""}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder ?? ""}
                    onChange={(e) =>
                        onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
            )}

            {field.type === "select" && (
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                >
                    <option value="">Select…</option>
                    {(field.options ?? []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}

function Drawer({ open, title, onClose, children, footer }) {
    if (!open) return null;
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-50">

            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 bg-black/30"
            />


            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500">{t("tripPrepRail.drawer.adjustFilters")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                        {t("tripPrepRail.drawer.close")}
                    </button>
                </div>

                <div className="p-4 overflow-auto flex-1">{children}</div>

                {footer ? <div className="p-4 border-t">{footer}</div> : null}
            </div>
        </div>
    );
}


export default function TripPrepRail({
                                         city,
                                         country,
                                         days,
                                         items,
                                         onMarkDone,
                                         onReset,
                                         onMarkAllDone,
                                     }) {
    const total = items.length;
    const doneCount = useMemo(() => items.filter((i) => i.done).length, [items]);
    const remaining = total - doneCount;
    const nextUp = useMemo(() => items.find((i) => !i.done) || null, [items]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeKey, setActiveKey] = useState(null); // "hotel" | "flights" | ...
    const [filtersByKey, setFiltersByKey] = useState({});
    const { t } = useTranslation();

    const FILTER_SCHEMAS = {
        hotel: {
            title: t("tripPrepRail.hotel.title"),
            fields: [
                { key: "checkIn", label: t("tripPrepRail.hotel.checkIn"), type: "date" },
                { key: "checkOut", label: t("tripPrepRail.hotel.checkOut"), type: "date" },
                { key: "rooms", label: t("tripPrepRail.hotel.rooms"), type: "number", min: 1, max: 5, placeholder: "1" },
                { key: "adults", label: t("tripPrepRail.hotel.adults"), type: "number", min: 1, max: 10, placeholder: "2" },
                { key: "children", label: t("tripPrepRail.hotel.children"), type: "number", min: 0, max: 6, placeholder: "0" },
                { key: "landmark", label: t("tripPrepRail.hotel.landmark"), type: "text", placeholder: t("tripPrepRail.hotel.landmarkPlaceholder") },
                { key: "breakfast", label: t("tripPrepRail.hotel.breakfast"), type: "toggle" },
                { key: "freeCancel", label: t("tripPrepRail.hotel.freeCancel"), type: "toggle" },
            ],
        },
        flights: {
            title: t("tripPrepRail.flights.title"),
            fields: [
                { key: "from", label: t("tripPrepRail.flights.from"), type: "text", placeholder: t("tripPrepRail.flights.fromPlaceholder") },
                { key: "to", label: t("tripPrepRail.flights.to"), type: "text", placeholder: t("tripPrepRail.flights.toPlaceholder") },
                { key: "depart", label: t("tripPrepRail.flights.depart"), type: "date" },
                { key: "return", label: t("tripPrepRail.flights.return"), type: "date" },
                {
                    key: "cabin",
                    label: t("tripPrepRail.flights.cabin"),
                    type: "select",
                    options: [
                        { label: t("tripPrepRail.flights.economy"), value: "economy" },
                        { label: t("tripPrepRail.flights.premium"), value: "premium" },
                        { label: t("tripPrepRail.flights.business"), value: "business" },
                        { label: t("tripPrepRail.flights.first"), value: "first" },
                    ],
                },
                {
                    key: "bags",
                    label: t("tripPrepRail.flights.bags"),
                    type: "select",
                    options: [
                        { label: t("tripPrepRail.flights.hand"), value: "hand" },
                        { label: t("tripPrepRail.flights.checked"), value: "checked" },
                    ],
                },
            ],
        },
        insurance: {
            title: t("tripPrepRail.insurance.title"),
            fields: [
                { key: "start", label: t("tripPrepRail.insurance.start"), type: "date" },
                { key: "end", label: t("tripPrepRail.insurance.end"), type: "date" },
                { key: "travellers", label: t("tripPrepRail.insurance.travellers"), type: "number", min: 1, max: 8, placeholder: "2" },
                {
                    key: "cover",
                    label: t("tripPrepRail.insurance.cover"),
                    type: "select",
                    options: [
                        { label: t("tripPrepRail.insurance.standard"), value: "standard" },
                        { label: t("tripPrepRail.insurance.comprehensive"), value: "comprehensive" },
                    ],
                },
                { key: "winterSports", label: t("tripPrepRail.insurance.winterSports"), type: "toggle" },
                { key: "medical", label: t("tripPrepRail.insurance.medical"), type: "toggle" },
            ],
        },
        parking: {
            title: t("tripPrepRail.parking.title"),
            fields: [
                { key: "airport", label: t("tripPrepRail.parking.airport"), type: "text", placeholder: t("tripPrepRail.parking.airportPlaceholder") },
                { key: "departTime", label: t("tripPrepRail.parking.departTime"), type: "text", placeholder: "e.g. 08:30" },
                { key: "returnTime", label: t("tripPrepRail.parking.returnTime"), type: "text", placeholder: "e.g. 21:10" },
                {
                    key: "type",
                    label: t("tripPrepRail.parking.type"),
                    type: "select",
                    options: [
                        { label: t("tripPrepRail.parking.parking"), value: "parking" },
                        { label: t("tripPrepRail.parking.transfer"), value: "transfer" },
                        { label: t("tripPrepRail.parking.shuttle"), value: "shuttle" },
                    ],
                },
            ],
        },
        car: {
            title: t("tripPrepRail.car.title"),
            fields: [
                { key: "pickup", label: t("tripPrepRail.car.pickup"), type: "text", placeholder: t("tripPrepRail.car.pickupPlaceholder") },
                { key: "pickupDate", label: t("tripPrepRail.car.pickupDate"), type: "date" },
                { key: "dropoffDate", label: t("tripPrepRail.car.dropOffDate"), type: "date" },
                {
                    key: "transmission",
                    label: t("tripPrepRail.car.transmission"),
                    type: "select",
                    options: [
                        { label: t("tripPrepRail.car.auto"), value: "auto" },
                        { label: t("tripPrepRail.car.manual"), value: "manual" },
                    ],
                },
                { key: "driverAge", label: t("tripPrepRail.car.driverAge"), type: "number", min: 18, max: 80, placeholder: "30" },
            ],
        },
    };

    function getDefaultFilters(key) {
        const base = filtersByKey[key] ?? {};

        if (key === "flights") {
            return {
                ...base,
                to: base.to ?? city ?? "",
            };
        }
        if (key === "insurance") {
            return {
                ...base,
                travellers: base.travellers ?? 2,
            };
        }
        if (key === "hotel") {
            return {
                ...base,
                rooms: base.rooms ?? 1,
                adults: base.adults ?? 2,
                children: base.children ?? 0,
            };
        }
        return base;
    }

    function openFilters(key) {
        setActiveKey(key);
        setFiltersByKey((prev) => ({
            ...prev,
            [key]: getDefaultFilters(key),
        }));
        setDrawerOpen(true);
    }

    function closeFilters() {
        setDrawerOpen(false);
    }

    function changeFilter(key, fieldKey, value) {
        setFiltersByKey((prev) => ({
            ...prev,
            [key]: { ...(prev[key] ?? {}), [fieldKey]: value },
        }));
    }

    function resetFilters(key) {
        setFiltersByKey((prev) => ({ ...prev, [key]: {} }));
    }


    const idToSchemaKey = {
        hotel: "hotel",
        flights: "flights",
        insurance: "insurance",
        airport: "parking",
        car: "car",
    };

    const activeSchema = activeKey ? FILTER_SCHEMAS[activeKey] : null;
    const activeFilters = activeKey ? (filtersByKey[activeKey] ?? {}) : {};

    function handleSearch() {
        if (!activeKey) return;

        const matchingItemId = Object.keys(idToSchemaKey).find(
            (id) => idToSchemaKey[id] === activeKey
        );

        const item = items.find((i) => i.id === matchingItemId);

        const context = { city, country, days };

        if (item?.onSearch) {
            item.onSearch(activeFilters, context);
        } else if (item?.onFind) {
            item.onFind(activeFilters, context);
        }

        closeFilters();
    }

    return (
        <>
            <aside className="space-y-4">

                <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold">{t("tripPrepRail.mainFrame.tripPrep")}</h3>
                            <p className="text-sm text-gray-600">
                                {city ? `${city}${country ? `, ${country}` : ""}` : t("tripPrepRail.mainFrame.progress")}
                                {days ? ` · ${days} days` : ""}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <SecondaryButton onClick={onMarkAllDone} disabled={total === 0 || remaining === 0}>
                                {t("tripPrepRail.mainFrame.markAllDone")}
                            </SecondaryButton>
                            <SecondaryButton onClick={onReset} disabled={total === 0 || doneCount === 0}>
                                {t("tripPrepRail.mainFrame.reset")}
                            </SecondaryButton>
                        </div>
                    </div>

                    <ProgressBar done={doneCount} total={total} />
                </div>


                <div className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">{t("tripPrepRail.mainFrame.nextUp")}</h4>
                        <span className="text-xs text-gray-600">{remaining} {t("tripPrepRail.mainFrame.remaining")}</span>
                    </div>

                    <div className="mt-3 rounded-lg border border-gray-200 p-3">
                        {nextUp ? (
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{nextUp.title}</p>
                                    <StatusPill done={false} />
                                </div>
                                <p className="mt-1 text-sm text-gray-600">{nextUp.hint}</p>

                                <div className="mt-3 flex gap-2">
                                    <PrimaryButton
                                        className="flex-1"
                                        onClick={() => {
                                            const schemaKey = idToSchemaKey[nextUp.id];
                                            if (schemaKey) openFilters(schemaKey);
                                            else nextUp.onFind?.();
                                        }}
                                    >
                                        {nextUp.ctaLabel ?? "Find"}
                                    </PrimaryButton>

                                    <SecondaryButton className="flex-1" onClick={() => onMarkDone(nextUp.id)}>
                                        {t("tripPrepRail.mainFrame.markDone")}
                                    </SecondaryButton>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-medium text-gray-900">🎉 {t("tripPrepRail.mainFrame.goodToGo")}</p>
                                <p className="text-sm text-gray-600">{t("tripPrepRail.mainFrame.readyMessage")}</p>
                            </div>
                        )}
                    </div>
                </div>


                <div className="bg-white rounded-xl shadow p-4">
                    <h4 className="text-sm font-semibold text-gray-900">{t("tripPrepRail.mainFrame.beforeYouGo")}</h4>
                    <p className="text-sm text-gray-600">{t("tripPrepRail.mainFrame.filtersOpen")}</p>

                    <div className="mt-3 space-y-3">
                        {items.map((item) => {
                            const cardStyle = item.done
                                ? "border-green-200 bg-green-50"
                                : "border-amber-200 bg-amber-50";

                            return (
                                <div key={item.id} className={`rounded-lg border p-3 ${cardStyle}`}>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{item.title}</p>
                                        <StatusPill done={item.done} />
                                    </div>

                                    <p className="mt-1 text-sm text-gray-700">{item.hint}</p>

                                    <div className="mt-3 flex gap-2">
                                        <PrimaryButton
                                            className="flex-1"
                                            onClick={() => {
                                                const schemaKey = idToSchemaKey[item.id];
                                                if (schemaKey) openFilters(schemaKey);
                                                else item.onFind?.();
                                            }}
                                        >
                                            {item.ctaLabel ?? t("tripPrepRail.mainFrame.find")}
                                        </PrimaryButton>

                                        <SecondaryButton
                                            className="flex-1"
                                            onClick={() => onMarkDone(item.id)}
                                            disabled={item.done}
                                        >
                                            {t("tripPrepRail.mainFrame.markDone")}
                                        </SecondaryButton>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {remaining === 0 && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-sm font-medium text-gray-900">🎉 {t("tripPrepRail.mainFrame.goodToGo")}</p>
                            <p className="text-sm text-gray-700">{t("tripPrepRail.mainFrame.readyMessage")}</p>
                        </div>
                    )}
                </div>
            </aside>


            <Drawer
                open={drawerOpen}
                title={activeSchema?.title ?? "Filters"}
                onClose={closeFilters}
                footer={
                    activeKey ? (
                        <div className="flex gap-2">
                            <SecondaryButton className="flex-1" onClick={() => resetFilters(activeKey)}>
                                {t("tripPrepRail.mainFrame.resetFilters")}
                            </SecondaryButton>
                            <PrimaryButton className="flex-1" onClick={handleSearch}>
                                {t("tripPrepRail.mainFrame.search")}
                            </PrimaryButton>
                        </div>
                    ) : null
                }
            >
                {activeSchema ? (
                    <div className="space-y-3">
                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                            <p className="text-xs text-gray-600">
                                Destination: <span className="font-medium text-gray-900">{city || "—"}</span>
                                {country ? <span className="text-gray-400"> · </span> : null}
                                {country ? <span className="font-medium text-gray-900">{country}</span> : null}
                                {days ? <span className="text-gray-400"> · </span> : null}
                                {days ? <span className="font-medium text-gray-900">{days} {t("tripPrepRail.mainFrame.days")}</span> : null}
                            </p>
                        </div>

                        {activeSchema.fields.map((field) => (
                            <Field
                                key={field.key}
                                field={field}
                                value={activeFilters[field.key]}
                                onChange={(k, v) => changeFilter(activeKey, k, v)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">{t("tripPrepRail.mainFrame.noFiltersAvailable")}</p>
                )}
            </Drawer>
        </>
    );
}


