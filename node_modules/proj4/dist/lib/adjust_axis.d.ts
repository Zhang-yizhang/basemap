/**
 * Convert a point in a given CRS axis order to ENU (east/north/up) order
 * @param {import('./defs').ProjectionDefinition} crs
 * @param {import('./core').InterfaceCoordinates} point
 * @returns {import('./core').InterfaceCoordinates | null}
 */
export function adjustAxisToEnu(crs: import("./defs").ProjectionDefinition, point: import("./core").InterfaceCoordinates): import("./core").InterfaceCoordinates | null;
/**
 * Convert a point in ENU (east/north/up) order to the given CRS axis order.
 * @param {import('./defs').ProjectionDefinition} crs
 * @param {import('./core').InterfaceCoordinates} point
 * @returns {import('./core').InterfaceCoordinates | null}
 */
export function adjustAxisFromEnu(crs: import("./defs").ProjectionDefinition, point: import("./core").InterfaceCoordinates): import("./core").InterfaceCoordinates | null;
