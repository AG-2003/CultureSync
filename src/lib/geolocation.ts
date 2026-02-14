import { resolveCity } from './language-map';

interface BigDataCloudResponse {
  city: string;
  locality: string;
  principalSubdivision: string;
  countryCode: string;
}

/**
 * Get the user's lat/lng from the browser Geolocation API.
 * Returns null if permission is denied or an error occurs.
 */
function getBrowserPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null), // denied or error → null
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

/**
 * Reverse geocode lat/lng to a city name using BigDataCloud (free, no API key).
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: BigDataCloudResponse = await res.json();
    // BigDataCloud returns city or locality — try city first, fall back to locality
    return data.city || data.locality || null;
  } catch {
    return null;
  }
}

/**
 * Full location detection pipeline:
 *   Browser GPS → lat/lng → BigDataCloud reverse geocode → match to supported city
 *
 * Returns { city, language, script } if successful, null if anything fails
 * (permission denied, timeout, geocoding error, etc.)
 */
export async function detectLocation(): Promise<{
  city: string;
  language: string;
  script: string;
} | null> {
  const position = await getBrowserPosition();
  if (!position) return null;

  const { latitude, longitude } = position.coords;
  const rawCity = await reverseGeocode(latitude, longitude);
  if (!rawCity) return null;

  // Try to match to our supported city list
  const matched = resolveCity(rawCity);
  if (matched) return matched;

  // City not in our map — use the raw name with Hindi as default
  return {
    city: rawCity,
    language: 'Hindi',
    script: 'Devanagari',
  };
}
