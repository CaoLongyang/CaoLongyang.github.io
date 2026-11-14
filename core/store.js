/* ============================================================
   core/store.js — localStorage 安全读写
   隐私模式、禁用存储时不报错，直接用默认值。
   ============================================================ */

export const KEYS = {
  OPENED: 'scroll-opened-v1',
  LANG:   'scroll-lang',
  THEME:  'scroll-theme',
  TURN:   'scroll-turn-dir',
};

export function get(key, fallback = '') {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
  catch { return fallback; }
}

export function set(key, value) {
  try { localStorage.setItem(key, value); } catch { /* 写不进去就算了 */ }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}
