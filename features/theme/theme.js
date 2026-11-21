/* ============================================================
   theme · 天青（亮）/ 黑漆朱（暗）
   <button data-theme-toggle></button>
   - 第一次来：跟随系统；点过以后记住（localStorage 'theme'）
   - 切换时从按钮处一圈晕开（View Transitions；不支持的浏览器直接切）
   head 里还有一段内联脚本，在第一帧之前就把主题定好，避免闪一下
   ============================================================ */

const KEY = 'theme';
const root = document.documentElement;
const label = { light: '☀ Light', dark: '☾ Dark' };
const labelZh = { light: '☀ 天青', dark: '☾ 黑漆' };

export const current = () => root.dataset.theme === 'dark' ? 'dark' : 'light';

function paint() {
  const zh = root.lang.startsWith('zh');
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.textContent = (zh ? labelZh : label)[current()];
    b.setAttribute('aria-label', zh ? '切换明暗' : 'Toggle light / dark');
  });
}

function set(theme, from) {
  const apply = () => { root.dataset.theme = theme; paint(); };
  try { localStorage.setItem(KEY, theme); } catch {}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) { apply(); return; }
  const r = from?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth - 80, y = r ? r.top + r.height / 2 : 50;
  root.style.setProperty('--vt-x', x + 'px');
  root.style.setProperty('--vt-y', y + 'px');
  root.classList.add('vt-theme');
  const t = document.startViewTransition(apply);
  t.finished.finally(() => root.classList.remove('vt-theme'));
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-theme-toggle]');
  if (b) set(current() === 'dark' ? 'light' : 'dark', b);
});
// 系统主题变了、而用户没手动选过：跟着变
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
  if (!saved) { root.dataset.theme = e.matches ? 'dark' : 'light'; paint(); }
});
document.addEventListener('lang:change', paint);
paint();
