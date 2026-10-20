/**
 * LIMINAL — the engine.
 *
 * Layer order is the dependency order, and it is not negotiable: each layer uses
 * only the layers above it. A number measured against an unmeasured support has to
 * be thrown away later, so the order is what makes the numbers keep.
 *
 *   L0  perception   the physics — q, r, the edge threshold
 *   L1  ladder       the canvas and its nine levels
 *   L3  treatments   border, separator, rim, shadow
 *
 * L2 (colour) and L4–L7 are not built yet. Nothing here may import them.
 */

export * from './perception';
export * from './ladder';
export * from './treatments';
export * from './css';
