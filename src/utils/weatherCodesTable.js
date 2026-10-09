const weatherCodesTable = {
    0:  { illustration: "sunny", emoji: "☀️", description: "Clear sky" },
    1:  { illustration: "sunny", emoji: "🌤️", description: "Mainly clear" },
    2:  { illustration: "partly-cloudy", emoji: "⛅", description: "Partly cloudy" },
    3:  { illustration: "overcast", emoji: "☁️", description: "Overcast" },
    45: { illustration: "fog", emoji: "🌫️", description: "Fog" },
    48: { illustration: "fog", emoji: "🌫️", description: "Rime fog" },
    51: { illustration: "drizzle", emoji: "🌦️", description: "Light drizzle" },
    53: { illustration: "drizzle", emoji: "🌦️", description: "Moderate drizzle" },
    55: { illustration: "drizzle", emoji: "🌧️", description: "Dense drizzle" },
    56: { illustration: "freezing-rain", emoji: "🌧️❄️", description: "Light freezing drizzle" },
    57: { illustration: "freezing-rain", emoji: "🌧️❄️", description: "Dense freezing drizzle" },
    61: { illustration: "rain", emoji: "🌧️", description: "Slight rain" },
    63: { illustration: "rain", emoji: "🌧️", description: "Moderate rain" },
    65: { illustration: "rain", emoji: "🌧️", description: "Heavy rain" },
    66: { illustration: "freezing-rain", emoji: "🌧️❄️", description: "Light freezing rain" },
    67: { illustration: "freezing-rain", emoji: "🌧️❄️", description: "Heavy freezing rain" },
    71: { illustration: "snow", emoji: "🌨️", description: "Slight snowfall" },
    73: { illustration: "snow", emoji: "🌨️", description: "Moderate snowfall" },
    75: { illustration: "snow", emoji: "❄️", description: "Heavy snowfall" },
    77: { illustration: "snow", emoji: "🌨️", description: "Snow grains" },
    80: { illustration: "rain", emoji: "🌦️", description: "Slight rain showers" },
    81: { illustration: "rain", emoji: "🌦️", description: "Moderate rain showers" },
    82: { illustration: "rain", emoji: "🌧️", description: "Violent rain showers" },
    85: { illustration: "snow", emoji: "🌨️", description: "Slight snow showers" },
    86: { illustration: "snow", emoji: "🌨️", description: "Heavy snow showers" },
    95: { illustration: "thunderstorm", emoji: "⛈️", description: "Thunderstorm" },
    96: { illustration: "thunderstorm", emoji: "⛈️🧊", description: "Thunderstorm with slight hail" },
    99: { illustration: "thunderstorm", emoji: "⛈️🧊", description: "Thunderstorm with heavy hail" }
};

export default function getWeatherDescriptionAndEmoji(code) {
    return weatherCodesTable[code] || { emoji: "❔", description: "Unknown Weather" };
}

// Unknown conditions keep their text without implying a known weather condition.
export function getWeatherIllustrationCategory(code) {
    return weatherCodesTable[code]?.illustration ?? null;
}
