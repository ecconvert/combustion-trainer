/**
 * Utility helpers for ambient weather data.
 * Live ambient wiring will be implemented in a later phase.
 */

/**
 * Convert a ZIP code to ambient conditions using public providers.
 *
 * @param {string} zip
 * @param {string} baseUrl - Open-Meteo endpoint
 * @param {string} zipGeoBaseUrl - Zippopotam endpoint
 * @returns {Promise<{tempF:number,rh:number,pressure:number}>}
 */
export async function zipToAmbient(zip, baseUrl, zipGeoBaseUrl) {
  // Look up latitude and longitude for the ZIP
  const geoRes = await fetch(`${zipGeoBaseUrl}/${zip}`);
  const geo = await geoRes.json();
  const place = geo?.places?.[0];
  if (!place) throw new Error("Invalid ZIP code");
  const { latitude, longitude } = place;

  // Fetch current temperature, humidity, and pressure
  const url = `${baseUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl`;
  const weatherRes = await fetch(url);
  const weather = await weatherRes.json();
  const cur = weather.current || {};

  const tempF = cur.temperature_2m * 9 / 5 + 32;
  const rh = cur.relative_humidity_2m;
  const pressure = cur.pressure_msl * 0.02953; // hPa → inHg

  return { tempF, rh, pressure };
}
