/* ============================================================
   toc-slip · 「目」字布带 + 目录笺
   <sc-toc-slip data-toc="sections/toc.html"></sc-toc-slip>  （不用 data-src：那个会被 core/include.js 当成要载入的段落）
   - 上黑边正中垂下一根「目」字布带；点它（或按 T）目录笺从下黑边里抽上来，盖在卷上
   - 再点布带、按 Esc、点笺外面：笺退回去
   - 笺里的内容就是 sections/toc.html，和卷上的目录同一份；点「画心」照常进入场景
   打开时 body 加 .slip-open（drag 会停下）
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';

const body = document.body;

class ScTocSlip extends HTMLElement {
  async connectedCallback() {
    if (this.firstChild) return;
    this.innerHTML = `
      <button class="ts-tab" type="button" aria-expanded="false" aria-controls="ts-slip"
        data-en-label="Contents" data-zh-label="目录" aria-label="Contents" title="Contents · T"><b>目</b></button>
      <div class="ts-shade" aria-hidden="true"></div>
      <div class="ts-slip" id="ts-slip" role="dialog" aria-modal="true" aria-label="Contents" inert>
        <div class="ts-paper"></div>
      </div>`;
    this.tab = this.querySelector('.ts-tab');
    this.slip = this.querySelector('.ts-slip');
    this.tab.addEventListener('click', () => this.toggle());
    this.querySelector('.ts-shade').addEventListener('click', () => this.close());
    this.slip.addEventListener('click', (e) => {
      // 点了笺里的入口（画心）：笺先退下，场景照常从入口处晕开
      if (e.target.closest('[data-scene],[data-goto],a')) setTimeout(() => this.close(), 0);
    });
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input,textarea,[contenteditable]')) return;
      if (e.key === 'Escape' && this.isOpen) { e.preventDefault(); e.stopPropagation(); this.close(); }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && body.classList.contains('settled') && !body.classList.contains('in-scene')) this.toggle();
    }, true);
    on(EV.SCENE_OPENED, () => this.close());

    try {
      const src = new URL(this.dataset.toc || 'sections/toc.html', document.baseURI);
      const html = await (await fetch(src)).text();
      const paper = this.querySelector('.ts-paper');
      paper.innerHTML = html;
      // 笺不跟着卷显影：墨直接是干的
      paper.querySelectorAll('[data-ink]').forEach((el) => el.removeAttribute('data-ink'));
      emit(EV.CONTENT_CHANGED);   // 让中英文套上
    } catch (err) { console.warn('[toc-slip] 目录载入失败', err); }
  }

  get isOpen() { return body.classList.contains('slip-open'); }
  open() {
    if (this.isOpen || !body.classList.contains('settled') || body.classList.contains('in-scene')) return;
    body.classList.add('slip-open');
    this.slip.inert = false;
    this.tab.setAttribute('aria-expanded', 'true');
    setTimeout(() => this.slip.querySelector('button,a')?.focus({ preventScroll: true }), 420);
  }
  close() {
    if (!this.isOpen) return;
    body.classList.remove('slip-open');
    this.slip.inert = true;
    this.tab.setAttribute('aria-expanded', 'false');
    if (this.contains(document.activeElement)) this.tab.focus({ preventScroll: true });
  }
  toggle() { this.isOpen ? this.close() : this.open(); }
}

customElements.define('sc-toc-slip', ScTocSlip);
