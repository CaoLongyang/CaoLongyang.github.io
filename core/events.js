/* ============================================================
   core/events.js — 功能之间唯一的说话方式
   功能不互相 import，只在 document 上发事件、听事件。
   ============================================================ */

export const EV = {
  SEAL_BROKEN:    'seal:broken',     // 火漆被点碎
  INTRO_SKIP:     'intro:skip',      // 点了「跳过」
  INTRO_REPLAY:   'intro:replay',    // 点了「重看开场」
  OPENED:         'scroll:opened',   // 卷已展开   detail: { instant }
  ROLL_UP:        'scroll:rollup',   // 请求收卷
  CLOSED:         'scroll:closed',   // 卷已收好
  CONTENT_READY:  'content:ready',   // 段落内容已载入
  CONTENT_CHANGED:'content:changed', // 内容有增减，需要重新量尺寸
  PANEL_IN:       'panel:in',        // 某一段第一次进入视野   detail: { id, el }
  SECTION:        'section:change',  // 当前所在段落变了       detail: { id }
  GOTO:           'nav:goto',        // 请求跳到某段           detail: { id }
  MOVE:           'drag:move',       // 纸的位置变了           detail: { x, maxX }
  BURN_REQUEST:   'burn:request',    // 第一页拖过阈值，请求烧开
  BURN_START:     'burn:start',      // 有人接手烧开（drag 就不自己滑过去了）
  BURN_END:       'burn:end',
  SCENE_ENTER:    'scene:enter',     // 请求进入场景           detail: { name, sub, from }
  SCENE_EXIT:     'scene:exit',      // 请求退出场景
  SCENE_OPENED:   'scene:opened',    // 场景已显示             detail: { name }
  SCENE_CLOSED:   'scene:closed',    // 场景已关闭             detail: { name }
  LANG:           'lang:change',     // detail: { lang }
  THEME:          'theme:change',    // detail: { theme }
};

export function emit(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, fn) {
  const h = (e) => fn(e.detail || {}, e);
  document.addEventListener(name, h);
  return () => document.removeEventListener(name, h);
}
