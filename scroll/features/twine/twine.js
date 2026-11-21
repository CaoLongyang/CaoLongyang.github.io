/* twine · <sc-twine> —— 绕卷两道的丝绳，展开时滑落淡出
   绳子是两段弧线：卷是竖着的圆柱，从斜上方看，绕在上面的绳往下弯 */

const ARC = (y) => `M0 ${y} Q50 ${y + 13} 100 ${y}`;

class ScTwine extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    this.setAttribute('aria-hidden', 'true');
    const rope = (y) => `
      <path class="c-body" d="${ARC(y)}" vector-effect="non-scaling-stroke"/>
      <path class="c-dark" d="${ARC(y)}" vector-effect="non-scaling-stroke"/>
      <path class="c-hi"   d="${ARC(y - 1.2)}" vector-effect="non-scaling-stroke"/>`;
    this.innerHTML = `
      <svg class="twine-svg" viewBox="0 0 100 34" preserveAspectRatio="none">${rope(6)}${rope(15)}</svg>
      <span class="twine-knot"></span>`;
  }
}

customElements.define('sc-twine', ScTwine);
