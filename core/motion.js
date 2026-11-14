/* ============================================================
   core/motion.js — 动效相关的小工具
   ============================================================ */

export const reduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const finePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* 缓出：开始快、结束慢，和 --ease 同一个手感 */
export const easeOut = (t) => 1 - Math.pow(1 - t, 4);
