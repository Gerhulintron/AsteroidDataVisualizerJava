/* Pure geometry shared by the browser and optional maintainer tests. */
(function (root) {
  'use strict';
  function layoutAsteroids(asteroids, width, height, mode = 'linear') {
    const horizon = height - 48;
    const valid = asteroids.filter(a => Number.isFinite(a.diameterM) && a.diameterM > 0
      && Number.isFinite(a.missDistanceKm) && a.missDistanceKm >= 0);
    if (!valid.length) return [];
    const identity = (a, b) => String(a.id || a.name).localeCompare(String(b.id || b.name));
    const maxDiameter = Math.max(...valid.map(a => a.diameterM));
    const maxDistance = Math.max(...valid.map(a => a.missDistanceKm), 1);
    if (mode !== 'layered') {
      // Preserve the original linear view's geometry and stable identity order.
      const maxRadius = Math.min(35, width / 12), padding = maxRadius + 20;
      return [...valid].sort(identity).map((a, i) => {
        const radius = 5 + (maxRadius - 5) * a.diameterM / maxDiameter;
        const gap = 12 + a.missDistanceKm / maxDistance * (horizon - 2 * maxRadius - 40);
        return {...a, radius, gap, x: valid.length === 1 ? width / 2 : padding + i * (width - padding * 2) / (valid.length - 1), y: horizon - gap - radius};
      });
    }
    const minDiameter = Math.min(...valid.map(a => a.diameterM));
    const maxRadius = Math.min(width * .35, (horizon - 40) * .38);
    const minRadius = Math.min(8, maxRadius);
    // One common distance scale, independent of each object's diameter.
    const maxGap = Math.max(0, horizon - 2 * maxRadius - 20);
    const positiveFloor = Math.min(6, maxGap);
    return [...valid].sort((a, b) => b.diameterM - a.diameterM || identity(a, b)).map(a => {
      const ratio = maxDiameter === minDiameter ? .5 : (a.diameterM - minDiameter) / (maxDiameter - minDiameter);
      const radius = minRadius + ratio * (maxRadius - minRadius);
      const gap = a.missDistanceKm === 0 ? 0 : positiveFloor + a.missDistanceKm / maxDistance * (maxGap - positiveFloor);
      return {...a, radius, gap, x: width / 2, y: horizon - gap - radius};
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {layoutAsteroids};
  else root.layoutAsteroids = layoutAsteroids;
})(typeof globalThis !== 'undefined' ? globalThis : this);
