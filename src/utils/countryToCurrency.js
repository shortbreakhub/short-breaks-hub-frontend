const countryToCurrency =
    {
        "Southeast Asia": {
            "Cambodia" : {
                "Base Code":"KHR",
                "Symbol" : "៛"
            },
            "Indonesia": {
                "Base Code":"IDR",
                "Symbol" : "Rp"
            },
            "Laos": {
                "Base Code": "LAK",
                "Symbol" : "₭"
            },
            "Malaysia":{
                "Base Code": "MYR",
                "Symbol" : "RM"
            },
            "Myanmar": {
                "Base Code": "MMK",
                "Symbol" : "K"
            },
            "Philippines": {
                "Base Code": "PHP",
                "Symbol" : "₱"
            },
            "Singapore" : {
                "Base Code": "SGD",
                "Symbol" : "S$"
            },
            "Thailand" : {
                "Base Code": "THB",
                "Symbol" : "฿"
            },
            "Vietnam" : {
                "Base Code": "VND",
                "Symbol" : "₫"
            }
        },
        "East Asia": {
            "China": {
                "Base Code": "CNY",
                "Symbol" : "¥"
            },
            "Hong Kong" : {
                "Base Code": "HKD",
                "Symbol" : "HK$"
            },
            "Japan" : {
                "Base Code": "JPY",
                "Symbol" : "¥"
            },
            "Macau" : {
                "Base Code": "MOP",
                "Symbol" : "MOP$"
            },
            "Mongolia" :  {
                "Base Code": "MNT",
                "Symbol" : "₮"
            },
            "South Korea" : {
                "Base Code": "KRW",
                "Symbol" : "₩"
            },
            "Taiwan" : {
                "Base Code": "TWD",
                "Symbol" : "NT$"
            }
        },
        "Europe":{
            "France" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Germany" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Greece" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Italy" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Netherlands" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Portugal" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Spain" : {
                "Base Code": "EUR",
                "Symbol" : "€"
            },
            "Switzerland" : {
                "Base Code": "CHF",
                "Symbol" : "Fr."
            },
            "United Kingdom" : {
                "Base Code": "GBP",
                "Symbol" : "£"
            }
        },
        "Americas":{
            "Argentina" : {
                "Base Code": "ARS",
                "Symbol" : "Arg$"
            },
            "Brazil" : {
                "Base Code": "BRL",
                "Symbol" : "R$"
            },
            "Canada" : {
                "Base Code": "CAD",
                "Symbol" : "CA$",
            },
            "Chile" : {
                "Base Code": "CLP",
                "Symbol" : "CH$"
            },
            "Colombia" : {
                "Base Code": "COP",
                "Symbol" : "COL$"
            },
            "Costa Rica" : {
                "Base Code": "CRC",
                "Symbol" : "₡"
            },
            "Mexico" : {
                "Base Code": "MXN",
                "Symbol" : "MEX$"
            },
            "Peru" : {
                "Base Code": "PEN",
                "Symbol" : "S/"
            },
            "United States" : {
                "Base Code": "USD",
                "Symbol" : "$"
            }
        },
        "Oceania":{
            "Australia" : {
                "Base Code": "AUD",
                "Symbol" : "AU$"
            },
            "Fiji" : {
                "Base Code": "FJD",
                "Symbol" : "FJ$"
            },
            "French Polynesia": {
                "Base Code": "XPF",
                "Symbol" : "₣"
            },
            "New Caledonia" : {
                "Base Code": "XPF",
                "Symbol" : "₣"
            },
            "New Zealand" : {
                "Base Code": "NZD",
                "Symbol" : "NZ$"
            },
            "Papua New Guinea" : {
                "Base Code": "PGK",
                "Symbol" : "K"
            },
            "Samoa" : {
                "Base Code": "WST",
                "Symbol" : "WS$"
            },
            "Tonga" : {
                "Base Code": "TOP",
                "Symbol" : "TO$"
            },
            "Vanuatu" : {
                "Base Code": "VUV",
                "Symbol" : "VT"
            }
        },
        "Africa":{
            "Egypt" : {
                "Base Code": "EGP",
                "Symbol" : "£"
            },
            "Ghana" : {
                "Base Code": "GHS",
                "Symbol" : "₵"
            },
            "Kenya" : {
                "Base Code": "KES",
                "Symbol" : "S"
            },
            "Morocco" : {
                "Base Code": "MAD",
                "Symbol" : "DH"
            },
            "Namibia" : {
                "Base Code": "NAD",
                "Symbol" : "N$"
            },
            "Rwanda" : {
                "Base Code": "RWF",
                "Symbol" : "R₣"
            },
            "Senegal" : {
                "Base Code": "XOF",
                "Symbol" : "FR"
            },
            "South Africa" : {
                "Base Code": "ZAR",
                "Symbol" : "R"
            },
            "Tanzania" : {
                "Base Code": "TZS",
                "Symbol" : "SH"
            }
        }
    }

// Country names are unique across regions, so currencies resolve by country alone. Itinerary
// region values are not trusted here: a malformed one must never break the itinerary page.
const byCountry = Object.fromEntries(Object.values(countryToCurrency).flatMap(countries => Object.entries(countries)));

export function getCurrencyBaseCode(countryName) {
    const code = Object.hasOwn(byCountry, countryName) ? byCountry[countryName]["Base Code"] : undefined;
    return /^[A-Z]{3}$/.test(code ?? "") ? code : null;
}

// regionName is accepted for existing callers and ignored. Unknown countries return null.
export default function getCurrencyCode(regionName, countryName) {
    return getCurrencyBaseCode(countryName) ? byCountry[countryName] : null;
}
