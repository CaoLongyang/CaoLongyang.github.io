/* ============================================================
   lang-switch · <sc-lang-switch> 中英切换
   文案写法：<p data-en="Hello" data-zh="你好">Hello</p>
   无障碍标签：data-en-label / data-zh-label → aria-label
   内容载入或变化后自动重新套一遍
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { KEYS, get, set } from '../../core/store.js';

let current = get(KEYS.LANG, 'en') === 'zh' ? 'zh' : 'en';

export function applyLang(lang = current, root = document) {
  current = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  root.querySelectorAll('[data-en]').forEach((el) => {
    const t = el.getAttribute('data-' + lang);
    if (t !== null) el.textContent = t;
  });
  root.querySelectorAll('[data-en-label]').forEach((el) => {
    const t = el.getAttribute('data-' + lang + '-label');
    if (t) el.setAttribute('aria-label', t);
  });
  document.querySelectorAll('sc-lang-switch button[data-lang]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

class ScLangSwitch extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', 'Language');
    this.innerHTML = `
      <button type="button" data-lang="en" aria-pressed="false">EN</button>
      <span class="ls-slash" aria-hidden="true">/</span>
      <button type="button" data-lang="zh" aria-pressed="false">中</button>`;
    this.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-lang]');
      if (!b) return;
      set(KEYS.LANG, b.dataset.lang);
      applyLang(b.dataset.lang);
      emit(EV.LANG, { lang: b.dataset.lang });
    });
    applyLang();
  }
}

customElements.define('sc-lang-switch', ScLangSwitch);

on(EV.CONTENT_READY, () => applyLang());
on(EV.CONTENT_CHANGED, () => applyLang());
applyLang();
