/* ============================================================
   lang · EN / 中
   文案写法：<p data-en="Hello" data-zh="你好">Hello</p>；aria-label 用 data-en-label / data-zh-label
   选择记在 localStorage 'lang'；切换后发 lang:change
   动态插入的内容调用 applyLang(root) 再套一遍
   ============================================================ */

const KEY = 'lang';
let lang = 'en';
try { lang = localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en'; } catch {}

export const getLang = () => lang;
export const t = (obj) => (obj && typeof obj === 'object' ? (obj[lang] ?? obj.en) : obj);

export function applyLang(root = document) {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  root.querySelectorAll('[data-en]').forEach((el) => {
    const v = el.getAttribute('data-' + lang);
    if (v !== null) el.textContent = v;
  });
  root.querySelectorAll('[data-en-label]').forEach((el) => {
    const v = el.getAttribute('data-' + lang + '-label');
    if (v) el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
    b.innerHTML = lang === 'zh' ? '<b>中</b>&nbsp;·&nbsp;EN' : '<b>EN</b>&nbsp;·&nbsp;中';
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest?.('[data-lang-toggle]')) return;
  lang = lang === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem(KEY, lang); } catch {}
  applyLang();
  document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
});

applyLang();
