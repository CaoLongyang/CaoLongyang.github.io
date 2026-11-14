/* letterbox · <sc-letterbox> 画出上下两条黑边；下黑边里放一行提示 */

class ScLetterbox extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    // 用 data-hint-*，不用 data-en/zh：后者会被 lang-switch 当成要替换的文字
    const en = this.dataset.hintEn || '';
    const zh = this.dataset.hintZh || en;
    this.setAttribute('aria-hidden', 'true');
    this.innerHTML = `
      <div class="lb-bar lb-top"></div>
      <div class="lb-bar lb-bottom"><p class="lb-hint" data-en="${en}" data-zh="${zh}">${en}</p></div>`;
  }
}

customElements.define('sc-letterbox', ScLetterbox);
