 The first 3 functions are used to store and retrieve the cache, to avoid constant calls to the Google Maps API server
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

//gives the sum of distance taking the distance column
function sumOfDistance(arr, col) {
  var sumOfDistance = arr
    .map((row) => row[col]) // pull column into new array
    .reduce((a, b) => a + b); // reduce as normal;
  return sumOfDistance;
}

// creates a new direction finder on maps API
function mapsWithWaypoints(origin, destination, wayPoints) {
  // Initializes the maps API
  var directions = Maps.newDirectionFinder().setOrigin(origin).setDestination(destination);
  // loop through the waypoints to add it to the directions finder
  for (var i = 0; i < wayPoints.length; i++) {
    directions.addWaypoint(wayPoints[i]);
  }
  // calls the maps getDirections function and throws an error if route is not found
  var res = directions.getDirections();
  if (directions.length == 0) {
    throw 'Unable to calculate directions between these addresses.';
  } else {
    //Logger.log(res);
    return res;
  }
}


/**
 * A custom function that gets the freight distance between two addresses.
 * It was scripted to get the distances by Road and by Sea when ferry is required for the freight.
 * Use the "waypoints" to add the geo location of the ferry ports used for freights, if known.
 * If not know, leave empty, the API will return you the best distances based on car routes.
 * 
 *  =freightDistances("Paris, FR", "Fermoy,IE", B2:C2)
 * 
 * @param {String} origin - The starting address coordinates.
 * @param {String} destination - The ending address coordinates.
 * @param {String or Array} wayPoints - The wayPoints coordinates, referenced by cells. If not needed, leave empty.
 * @return {Number} Distance by Road and Distance by Ferry.
 * @customFunction
 */
function freightDistances(origin, destination, wayPoints) {
  // Get the raw directions information.
  var results = new Array(1);
  // Checks for the results in cache
  const key = ['results', origin, destination, wayPoints].join(',');
  //Logger.log(key);
  // Is result in the internal cache?
  var value = getCache(key);
  // If yes, serve the cached result, if not it continues
  if (value !== null) {
    var cachedArray = [];
    value.split(",").forEach(item => cachedArray.push(Number(item)))
    results[0] = cachedArray;
    console.log(typeof (results[0][1]));
    console.log(results);
    return results;
  }
  // Calls the function to generate the routes
  const directions = mapsWithWaypoints(origin, destination, wayPoints);
  // Creates an array to limit the size of the routes
  const routes = directions.routes[0];
  //Logger.log(routes);
  //Logger.log(Object.keys(routes));
  // Saves the polyline for future map view if required
  //const polyline = routes.overview_polyline;
  //Logger.log(polyline);
  // Creates a new array to only contain the legs
  const legs = [];
  // Pushes the legs of the routes into the legs array
  for (let leg of routes.legs) {
    legs.push(leg);
  }
  //Logger.log((legs.length));
  // Creates an array with the steps containing instructions and distance only
  const steps = [];
  for (var i = 0; i < legs.length; i++) {
    for (let step of legs[i].steps) {
      const instructions = step.html_instructions.replace(/<br>|<div.*?>/g, '\n').replace(/<.*?>/g, '');
      steps.push([
        instructions,
        step.distance.value / 1000
      ]);
    }
  }
  // Loop through the instructions to find where ferry is found, then add the distances to the variable withFerry
  var withFerry = 0;
  const instructions = steps.map((row) => row[0]);
  //Logger.log(instructions[0].includes(" ferry"))
  for (var i = 0; i < steps.length; i++) {
    //var index2 = instructions[i].findIndex(step => step.includes(' ferry'));
    if (instructions[i].includes(" ferry") != false) {
      withFerry = withFerry + steps[i][1];
    }
  }
  //Logger.log(withFerry)
  // takes the sum of distances and substracts the distance by ferry for the road distance
  const byRoad = sumOfDistance(steps, 1) - withFerry;
  var ans = new Array(2);
  ans[0] = byRoad;
  ans[1] = withFerry;
  results[0] = ans;
  // Store the result in internal cache for future
  //setCache(key, results.join(","));
  Logger.log(results);
  return results;
}
