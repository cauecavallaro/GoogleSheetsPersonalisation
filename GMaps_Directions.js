/**
 * Find the driving direction between two
 * locations on Google Maps.
 *
 * =GMaps_Directions("Cork, IE", "Dublin, IE", "Driving")
 *
 * @param {String} origin The address of starting point
 * @param {String} destination The address of destination
 * @param {String} mode The mode of travel (driving, walking, bicycling or transit)
 * @return {String} The driving direction
 * @customFunction
 */
const GMaps_Directions = (origin, destination, mode) => {
  const { routes = [] } = Maps.newDirectionFinder()
    .setOrigin(origin)
    .setDestination(destination)
    .setMode(mode)
    .getDirections();
  if (!routes.length) {
    throw new Error('No route found!');
  }
  return routes
    .map(({ legs }) => {
      return legs.map(({ steps }) => {
        return steps.map((step) => {
          return step.html_instructions.replace(/<[^>]+>/g, '');
        });
      });
    })
    .join(', ');
};
