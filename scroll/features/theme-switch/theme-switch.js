/* ============================================================
   theme-switch · <sc-theme-switch> 昼 / 夜
   写 <html data-theme="day|night">；没选过就跟随系统
   页面 <head> 里有一行启动脚本提前设好，避免闪一下
   ============================================================ */

import { EV, emit } from '../../core/events.js';
import { KEYS, get, set } from '../../core/store.js';

const system = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day');
const current = () => document.documentElement.dataset.theme || get(KEYS.THEME) || system();

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('sc-theme-switch button[data-theme]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
}

class ScThemeSwitch extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', 'Theme');
    this.innerHTML = `
      <button type="button" data-theme="day" data-en-label="Day" data-zh-label="昼" aria-label="Day">昼</button>
      <span class="ts-dot" aria-hidden="true"></span>
      <button type="button" data-theme="night" data-en-label="Night" data-zh-label="夜" aria-label="Night">夜</button>`;
    this.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-theme]');
      if (!b) return;
      set(KEYS.THEME, b.dataset.theme);
      apply(b.dataset.theme);
      emit(EV.THEME, { theme: b.dataset.theme });
    });
    apply(current());
  }
}

customElements.define('sc-theme-switch', ScThemeSwitch);
apply(current());
