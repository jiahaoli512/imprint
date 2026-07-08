// Generic numeric helpers with no domain of their own — kept separate from
// e.g. color.js (which used to define its own copy) so a caller looking for a
// plain clamp doesn't have to know it lives inside a color-conversion module.
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
