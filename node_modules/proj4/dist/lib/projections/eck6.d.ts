/**
 * Eckert VI projection — spherical sinusoidal variant with m=1, n=1+π/2.
 * Always forces spherical computation regardless of the ellipsoid.
 *
 * @typedef {Object} LocalThis
 * @property {number} m
 * @property {number} n
 * @property {number} C_y
 * @property {number} C_x
 * @property {number} es
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    sphere: boolean;
    b: number;
    m: number;
    n: number;
    es: number;
    C_y: number;
    C_x: number;
}
export const forward: typeof sinuForward;
export const inverse: typeof sinuInverse;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
/**
 * Eckert VI projection — spherical sinusoidal variant with m=1, n=1+π/2.
 * Always forces spherical computation regardless of the ellipsoid.
 */
export type LocalThis = {
    m: number;
    n: number;
    C_y: number;
    C_x: number;
    es: number;
};
import { forward as sinuForward } from './sinu';
import { inverse as sinuInverse } from './sinu';
