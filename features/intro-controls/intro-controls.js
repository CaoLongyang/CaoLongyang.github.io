/* intro-controls · <sc-intro-controls> 跳过、重看、落款
   发：intro:skip / intro:replay */

import { EV, emit } from '../../core/events.js';

class ScIntroControls extends HTMLElement {
  connectedCallback() {
    if (this.firstChild) return;
    const name = this.getAttribute('name') || '';
    const tag = this.getAttribute('tag') || 'handscroll · mmxxvi';
    this.innerHTML = `
      <button class="ic-btn ic-skip" type="button" data-en="SKIP" data-zh="跳过">SKIP</button>
      <button class="ic-btn ic-replay" type="button" data-en="REPLAY INTRO" data-zh="重看开场">REPLAY INTRO</button>
      <p class="ic-colophon" aria-hidden="true"><b>${name}</b><span>${tag}</span></p>`;
    this.querySelector('.ic-skip').addEventListener('click', () => emit(EV.INTRO_SKIP));
    this.querySelector('.ic-replay').addEventListener('click', () => emit(EV.INTRO_REPLAY));
  }
}

customElements.define('sc-intro-controls', ScIntroControls);
