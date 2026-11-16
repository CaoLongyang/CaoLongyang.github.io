/* ============================================================
   burn · 把一个元素从中心烧掉（对外只有这一个入口）
   burnAway(el, { pad, duration }) → Promise：纸烧光时 resolve；火星和烟之后自己散掉
   优先用 WebGL2 的真实火（fire-gl.js）；不支持就退回 Canvas 2D 版（burn-canvas.js）
   系统要求减少动效：0.3 秒淡出，没有火
   ============================================================ */

export async function burnAway(el, { pad = 0, duration = 1700 } = {}) {
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.transition = 'opacity 300ms ease';
    el.style.opacity = '0';
    await new Promise((r) => setTimeout(r, 320));
    return;
  }
  try {
    const { burnGL } = await import('./fire-gl.js');
    const ok = await burnGL(el, { pad, duration });
    if (ok !== false) return;
  } catch (err) { console.warn('[burn] WebGL 火失败，改用 Canvas 版', err); }
  const { burnAway: burnCanvas } = await import('./burn-canvas.js');
  await burnCanvas(el, { pad, duration: 1150 });
}
