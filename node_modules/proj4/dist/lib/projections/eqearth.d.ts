/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} e
 * @property {Array<number>} apa
 * @property {number} qp
 * @property {number} rqda
 */
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init(this: import("../defs.js").ProjectionDefinition & LocalThis): void;
export class init {
    long0: number;
    x0: number;
    y0: number;
    apa: number[];
    qp: number;
    rqda: number;
}
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(this: import("../defs.js").ProjectionDefinition & LocalThis, p: any): any;
export const names: string[];
declare namespace _default {
    export { init };
    export { forward };
    export { inverse };
    export { names };
}
export default _default;
export type LocalThis = {
    es: number;
    e: number;
    apa: Array<number>;
    qp: number;
    rqda: number;
};
