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
 * Calculate the distance between two
 * locations on Google Maps.
 *
 * =GMaps_Distance("NY 10005", "Hoboken NJ", "walking")
 *
 * @param {String} origin The address of starting point
 * @param {String} destination The address of destination
 * @param {String} mode The mode of travel (driving, walking, bicycling or transit)
 * @return {String} The distance in miles
 * @customFunction
 */
const GMaps_Distance = (origin, destination, mode) => {
  // Define the key to search in the cache system
  const key = ['distance', origin, destination, mode].join(',');
  // Is result in the internal cache?
  const value = getCache(key);
  // If yes, serve the cached result
  if (value !== null) return value;
  // If not, gets the distance between two points. If no route is found, throws an error
  const { routes: [data] = [] } = Maps.newDirectionFinder()
    .setOrigin(origin)
    .setDestination(destination)
    .setMode(mode)
    .getDirections();
  if (!data) {
    throw new Error('No route found!');
  }
  const { legs: [{ distance: { text: distance } } = {}] = [] } = data;
  // Store the result in internal cache for future
  setCache(key, distance);
  return distance;
};
