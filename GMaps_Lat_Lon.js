// The first 3 functions are used to store and retrieve the cache, to avoid constant calls to the Google Maps API server
// The cache key for "New York" and "new york  " should be same
const md5 = (key = '') => {
  const code = key.toLowerCase().replace(/\s/g, '');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, key)
    .map((char) => (char + 256).toString(16).slice(-2))
    .join('');
};

const getCache = (key) => {
  return CacheService.getDocumentCache().get(md5(key));
};

// Store the results for x days, change it as you will to fit your requirements. I'm setting the expiration to 30 days as there is no reason to constantly change
const setCache = (key, value) => {
  let expDays = 30;
  const expirationInSeconds = expDays * 24 * 60 * 60;
  CacheService.getDocumentCache().put(md5(key), value, expirationInSeconds);
};

/**
 * Get the latitude and longitude of any
 * address on Google Maps.
 * Also works with postcodes.
 * If your result is not correct, you can play with the "region" to find the correct one
 *
 * =GOOGLEMAPS_LATLONG("10 Hanover Square, NY", "US")
 * @param {String} address The address to lookup.
 * @param {String} region The region (country code) of the address to lookup.
 * @return {String} The latitude and longitude of the address.
 * @customFunction
 */
const GOOGLEMAPS_LATLONG = (address, region) => {
  // Define the key to search in the cache system
  const key = ['coord', address, region].join(',');
  // Is result in the internal cache?
  const value = getCache(key);
  // If yes, serve the cached result
  if (value !== null) return value;
  // If not, gets the latitude and longitude of an address. If nothing is found, throws an error
  const { results: [data = null] = [] } = Maps.newGeocoder().setRegion(region).geocode(address);
  if (data === null) {
    throw new Error('Address not found!');
  }
  const { geometry: { location: { lat, lng } } = {} } = data;
  const coord = `${lat}, ${lng}`;
  // Store the result in internal cache for future
  setCache(key, coord);
  return `${lat}, ${lng}`;
};
