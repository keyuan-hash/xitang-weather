const origins = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  'air-quality': 'https://air-quality-api.open-meteo.com/v1/air-quality',
  search: 'https://geocoding-api.open-meteo.com/v1/search',
} as const;

// The hosted build keeps the phone's weather traffic on the app's HTTPS origin.
// The ordinary static/Tauri build still supports direct Open-Meteo requests.
export function weatherEndpoint(kind: keyof typeof origins, params: URLSearchParams) {
  const endpoint =
    import.meta.env.VITE_WEATHER_GATEWAY === 'same-origin' ? `/api/${kind}` : origins[kind];
  return `${endpoint}?${params}`;
}
