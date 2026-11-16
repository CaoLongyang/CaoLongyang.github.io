/* ============================================================
   core/track-map.js · 纸的「逻辑位置 → 画面位置」换算
   drag 只管逻辑位置 x（吸附、惯性都按它算）；
   scroll-fx 画 .track 时先过一遍 mapX(x)。
   默认原样返回；某个功能（比如 roll-up）可以换成自己的换算。
   ============================================================ */

let fn = (x) => x;
export const mapX = (x) => fn(x);
export const setTrackMap = (f) => { fn = typeof f === 'function' ? f : (x) => x; };
