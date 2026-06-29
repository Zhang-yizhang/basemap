/**
 * Internal transform: accepts an already-cloned point object, returns transformed point object.
 * @param {import('./defs').ProjectionDefinition} source
 * @param {import('./defs').ProjectionDefinition} dest
 * @param {import('./core').InterfaceCoordinates} point
 * @param {boolean} [enforceAxis]
 * @returns {import('./core').InterfaceCoordinates | undefined}
 */
export function transformInternal(source: import("./defs").ProjectionDefinition, dest: import("./defs").ProjectionDefinition, point: import("./core").InterfaceCoordinates, enforceAxis?: boolean): import("./core").InterfaceCoordinates | undefined;
/**
 * @param {import('./defs').ProjectionDefinition} source
 * @param {import('./defs').ProjectionDefinition} dest
 * @param {import('./core').TemplateCoordinates} point
 * @param {boolean} [enforceAxis]
 * @returns {import('./core').InterfaceCoordinates | undefined}
 */
export default function transform(source: import("./defs").ProjectionDefinition, dest: import("./defs").ProjectionDefinition, point: import("./core").TemplateCoordinates, enforceAxis?: boolean): import("./core").InterfaceCoordinates | undefined;
