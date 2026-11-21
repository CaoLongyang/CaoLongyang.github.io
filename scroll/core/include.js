/* ============================================================
   core/include.js — 把 sections/*.html 拼进页面
   <section data-src="sections/about.html"></section>
   全部载入后发 content:ready。
   ============================================================ */

import { EV, emit } from './events.js';

export async function includeAll(root = document) {
  const slots = [...root.querySelectorAll('[data-src]')];
  await Promise.all(slots.map(async (el) => {
    try {
      const res = await fetch(el.dataset.src);
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
    } catch (err) {
      el.innerHTML = '<p class="include-error">这一段没能载入。请用本地服务器打开（python -m http.server）。</p>';
      console.warn('[include]', el.dataset.src, err);
    }
    el.removeAttribute('data-src');
  }));
  emit(EV.CONTENT_READY);
}

includeAll();
