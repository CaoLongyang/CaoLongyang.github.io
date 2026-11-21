/* ============================================================
   eggs · 彩蛋（不碰就不出现）
   墨点：点 .paper 上的空白处
   烧：键盘依次敲 burn 或 shao；烧的代码按需加载，不碰不下载
   ============================================================ */

import { reduced } from '../../core/motion.js';

const BLANK_IGNORE = 'a,button,input,textarea,[data-float],.leaf,.note,.slip,[data-ink]';

document.addEventListener('click', (e) => {
  const paper = e.target.closest?.('.paper');
  if (!paper || e.target.closest(BLANK_IGNORE) || reduced()) return;
  if (!document.body.classList.contains('opened')) return;
  const r = paper.getBoundingClientRect();
  const drop = document.createElement('span');
  drop.className = 'egg-drop';
  drop.style.left = `${e.clientX - r.left}px`;
  drop.style.top = `${e.clientY - r.top}px`;
  paper.append(drop);
  drop.addEventListener('animationend', () => drop.remove());
});

const WORDS = ['burn', 'shao'];
let typed = '';
let burning = false;

document.addEventListener('keydown', async (e) => {
  if (e.target.closest?.('input,textarea,[contenteditable]') || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-6);
  if (!WORDS.some((w) => typed.endsWith(w)) || burning) return;
  typed = '';
  const paper = document.querySelector('body.opened .paper');
  if (!paper) return;
  burning = true;
  const { burn } = await import('./burn.js');
  await burn(paper);
  burning = false;
});
