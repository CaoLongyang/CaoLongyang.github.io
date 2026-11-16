/* ============================================================
   lab/compare-toc/toc-cmp.js · 三种「自序 → 目录」转场的小卷轴
   进度 p：0 = 自序，1 = 目录，2 = 卷终。拖动、滚轮、键盘都只改 p，
   每种模式只负责把 p 换算成三张纸的位置。
   ============================================================ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (x) => x * x * (3 - 2 * x);                 // 两头慢中间快
const NAMES = ['自序', '目录', '卷终'];

function el(cls, html = '') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; }
const tpl = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);

export function mountCase(box) {
  const mode = box.dataset.mode;
  const stage = box.querySelector('.tc-stage');
  const readout = box.querySelector('.tc-p');

  const win = el('tc-win');                               // 纸的可见窗口（两根轴之间）
  const about = el('tc-sheet s-about'); about.append(tpl('tpl-about'));
  const toc = el('tc-sheet s-toc'); toc.append(tpl('tpl-toc'));
  const end = el('tc-sheet s-end'); end.append(tpl('tpl-end'));
  const dim = el('tc-dim');                               // 被盖住的自序变暗
  about.append(dim);
  win.append(end, about);
  if (mode === 'A') toc.classList.add('slip');            // 笺纸不在卷里，放在 stage 上、下黑边下面
  else win.append(toc);
  if (mode === 'B') toc.classList.add('lay');
  const roll = el('tc-roll', '<i></i>');                  // C 的收卷轴
  if (mode === 'C') win.append(roll);

  stage.append(el('tc-desk'), win, el('tc-stick r'), el('tc-stick l'));
  if (mode === 'A') stage.append(toc);
  stage.append(el('tc-lb top'), el('tc-lb bot', '<span>DRAG · WHEEL · ← →</span>'));

  let p = 0, target = 0, dragging = false, W = 1, H = 1;
  const measure = () => { W = win.clientWidth; H = win.clientHeight; };
  measure(); addEventListener('resize', measure);

  const X = (n, x) => { n.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`; };

  function paint() {
    const q = clamp(p, -.2, 2.2);
    const r = ease(clamp(q, 0, 1));
    if (mode === 'A') {
      const ax = Math.max(0, q - 1) * W + Math.min(0, q) * W;
      X(about, ax); X(end, ax - W);
      // 笺纸：从下黑边里抽上来，最后一点轻轻摆正；之后跟着自序一起走
      const lift = (1 - r) * (H + 70);
      const rot = (1 - r) * -2.2;
      toc.style.transform = `translate3d(${ax.toFixed(1)}px,${lift.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`;
      toc.style.setProperty('--sh', (.25 + .45 * r).toFixed(2));
      dim.style.opacity = (r * .55).toFixed(3);
    } else if (mode === 'B') {
      const ax = q < 1 ? Math.min(0, q) * W : q * W;      // 自序停住，被盖满以后才离开
      X(about, ax);
      X(toc, (q - 1) * W);
      X(end, (q - 2) * W);
      about.style.visibility = q >= 1.001 ? 'hidden' : '';
      dim.style.opacity = (clamp(q, 0, 1) * .5).toFixed(3);
      toc.style.setProperty('--sh', clamp(q, 0, 1) < .999 ? '1' : '0');
    } else {
      // C：轴从右往左扫过去，左边还是自序，右边露出目录
      const rx = W * (1 - r);
      const tx = Math.max(0, q - 1) * W + Math.min(0, q) * W;
      X(toc, tx); X(end, tx - W);
      X(about, Math.min(0, q) * W);
      about.style.clipPath = `inset(0 ${(W - rx).toFixed(1)}px 0 0)`;
      about.style.visibility = r >= .999 ? 'hidden' : '';
      const thick = 18 + 16 * r;                          // 卷得越多越粗
      roll.style.width = thick + 'px';
      roll.style.transform = `translate3d(${(rx - thick / 2).toFixed(1)}px,0,0)`;
      roll.style.opacity = r > .002 && r < .998 ? '1' : '0';
      roll.firstChild.style.backgroundPositionY = (rx * .9).toFixed(1) + 'px';   // 纹样跟着转
      dim.style.opacity = '0';
    }
    const i = Math.floor(clamp(q, 0, 1.999));
    readout.textContent = `p = ${q.toFixed(2)} · ${NAMES[i]} → ${NAMES[i + 1]}`;
  }

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!dragging) p += (target - p) * (1 - Math.exp(-dt * 8));
    paint();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // 拖动：往右拖 = 往后看（和网站一致）
  let x0 = 0, p0 = 0, vx = 0, lx = 0, lt = 0;
  stage.addEventListener('pointerdown', (e) => {
    dragging = true; x0 = lx = e.clientX; p0 = p; lt = e.timeStamp; vx = 0;
    stage.setPointerCapture(e.pointerId); stage.classList.add('grab');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    let np = p0 + (e.clientX - x0) / W;
    if (np < 0) np *= .35; if (np > 2) np = 2 + (np - 2) * .35;   // 橡皮筋
    p = np;
    const dtm = Math.max(1, e.timeStamp - lt);
    vx = .8 * vx + .2 * ((e.clientX - lx) / W) / (dtm / 1000);
    lx = e.clientX; lt = e.timeStamp;
  });
  const up = () => {
    if (!dragging) return;
    dragging = false; stage.classList.remove('grab');
    target = clamp(Math.round(p + clamp(vx, -3, 3) * .18), 0, 2);
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);

  let wheelLock = 0;
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = performance.now();
    if (now < wheelLock || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 4) return;
    wheelLock = now + 520;
    target = clamp(Math.round(target) + ((e.deltaY || e.deltaX) > 0 ? 1 : -1), 0, 2);
  }, { passive: false });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') target = clamp(Math.round(target) + 1, 0, 2);
    if (e.key === 'ArrowRight') target = clamp(Math.round(target) - 1, 0, 2);
  });
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) target = clamp(Math.round(target) + +b.dataset.go, 0, 2);
  });
  box._set = (v) => { p = target = v; paint(); };          // 给测试用
}
