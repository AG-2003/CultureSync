export const CITY_LANGUAGE_MAP: Record<string, { language: string; script: string }> = {
  // Hindi belt
  'Delhi': { language: 'Hindi', script: 'Devanagari' },
  'Jaipur': { language: 'Hindi', script: 'Devanagari' },
  'Varanasi': { language: 'Hindi', script: 'Devanagari' },
  'Lucknow': { language: 'Hindi', script: 'Devanagari' },
  'Agra': { language: 'Hindi', script: 'Devanagari' },

  // South India
  'Bangalore': { language: 'Kannada', script: 'Kannada' },
  'Mysore': { language: 'Kannada', script: 'Kannada' },
  'Chennai': { language: 'Tamil', script: 'Tamil' },
  'Madurai': { language: 'Tamil', script: 'Tamil' },
  'Kochi': { language: 'Malayalam', script: 'Malayalam' },
  'Trivandrum': { language: 'Malayalam', script: 'Malayalam' },
  'Hyderabad': { language: 'Telugu', script: 'Telugu' },

  // West India
  'Mumbai': { language: 'Hindi/Marathi', script: 'Devanagari' },
  'Pune': { language: 'Marathi', script: 'Devanagari' },
  'Ahmedabad': { language: 'Gujarati', script: 'Gujarati' },
  'Goa': { language: 'Konkani/English', script: 'Devanagari' },

  // East India
  'Kolkata': { language: 'Bengali', script: 'Bengali' },

  // North India
  'Amritsar': { language: 'Punjabi', script: 'Gurmukhi' },
  'Chandigarh': { language: 'Punjabi/Hindi', script: 'Gurmukhi/Devanagari' },
};

/** Common alternate names for Indian cities (lowercase → canonical key) */
const CITY_ALIASES: Record<string, string> = {
  'bengaluru': 'Bangalore',
  'bombay': 'Mumbai',
  'calcutta': 'Kolkata',
  'thiruvananthapuram': 'Trivandrum',
  'new delhi': 'Delhi',
  'madras': 'Chennai',
  'kochin': 'Kochi',
  'cochin': 'Kochi',
  'poona': 'Pune',
  'ernakulam': 'Kochi',
  'gurugram': 'Delhi',
  'gurgaon': 'Delhi',
  'noida': 'Delhi',
  'navi mumbai': 'Mumbai',
  'thane': 'Mumbai',
  'secunderabad': 'Hyderabad',
  'mysuru': 'Mysore',
};

export const SUPPORTED_CITIES = Object.keys(CITY_LANGUAGE_MAP);

export function getLanguageForCity(city: string): { language: string; script: string } {
  return CITY_LANGUAGE_MAP[city] ?? { language: 'Hindi', script: 'Devanagari' };
}

/**
 * Resolve a raw city input (from geocoding or user text) to a canonical city
 * in our map. Tries: exact match → alias match → partial match.
 * Returns { city, language, script } or null if no match.
 */
export function resolveCity(rawInput: string): { city: string; language: string; script: string } | null {
  const input = rawInput.trim();
  if (!input) return null;

  const inputLower = input.toLowerCase();

  // 1. Exact match (case-insensitive) against map keys
  for (const city of SUPPORTED_CITIES) {
    if (city.toLowerCase() === inputLower) {
      const { language, script } = CITY_LANGUAGE_MAP[city];
      return { city, language, script };
    }
  }

  // 2. Alias match
  const aliasMatch = CITY_ALIASES[inputLower];
  if (aliasMatch && CITY_LANGUAGE_MAP[aliasMatch]) {
    const { language, script } = CITY_LANGUAGE_MAP[aliasMatch];
    return { city: aliasMatch, language, script };
  }

  // 3. Partial match — input contains a supported city name or vice versa
  for (const city of SUPPORTED_CITIES) {
    if (inputLower.includes(city.toLowerCase()) || city.toLowerCase().includes(inputLower)) {
      const { language, script } = CITY_LANGUAGE_MAP[city];
      return { city, language, script };
    }
  }

  return null;
}
