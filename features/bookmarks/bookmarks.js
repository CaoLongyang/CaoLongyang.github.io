/* ============================================================
   bookmarks · <sc-bookmarks>
   读取 [data-bookmark][data-mark][data-name] 生成布带
   点击 → 发 nav:goto { id }；听 section:change 高亮当前段
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';

class ScBookmarks extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    this.setAttribute('role', 'navigation');
    this.setAttribute('aria-label', 'Sections');
    const targets = [...document.querySelectorAll('[data-bookmark]')];
    this.innerHTML = targets.map((t, n) => `
      <a class="bm" href="#${t.id}" data-id="${t.id}" style="--n:${n}" aria-current="false">
        <span class="bm-zh">${t.dataset.mark || ''}</span>
        <span class="bm-en">${t.dataset.name || t.id}</span>
      </a>`).join('');

    this.addEventListener('click', (e) => {
      const a = e.target.closest('.bm');
      if (!a) return;
      e.preventDefault();
      history.replaceState(null, '', '#' + a.dataset.id);
      emit(EV.GOTO, { id: a.dataset.id });
    });

    this.off = on(EV.SECTION, ({ id }) => {
      this.querySelectorAll('.bm').forEach((a) => a.setAttribute('aria-current', String(a.dataset.id === id)));
    });
  }
  disconnectedCallback() { this.off?.(); }
}

customElements.define('sc-bookmarks', ScBookmarks);
