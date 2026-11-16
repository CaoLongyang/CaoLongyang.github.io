/* ============================================================
   lab/compare/paper-gl.js · 有重量的纸（WebGL 版）
   - 物理：书页横截面是一条 24 段的软链（重力 · 空气阻力 · 很弱的弯曲回弹 · 不穿桌面）
   - 显示：翻动时，这一页由 WebGL 画成一张连续弯曲的网格，贴上这一页的「快照」；
           纸是一整张，不再一条条拼起来，所以没有接缝
   - 平时：页面仍然是普通网页（可选中、可复制）；只在动的时候换成 WebGL
   - 快照用 SVG foreignObject 把这一页画成图。某些浏览器（Safari）会拒绝把它交给 WebGL，
     这时退回到分段铰链版（paper-sim.js）
   ============================================================ */

import { PRESETS, makePaperBook as makeStripBook } from './paper-sim.js';

const N = 24;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- 把一块 DOM 画成图（内联计算后的样式） ---------- */
async function snapshot(el, scale = 2) {
  const w = el.offsetWidth, h = el.offsetHeight;
  const clone = el.cloneNode(true);
  const src = [el, ...el.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((s, i) => {
    const cs = getComputedStyle(s);
    let css = '';
    for (const p of cs) css += `${p}:${cs.getPropertyValue(p)};`;
    dst[i].setAttribute('style', css);
  });
  // 放回原点：先清掉 inset（含逻辑方向的 left/right），否则右页会被挤到画面外
  clone.style.inset = 'auto'; clone.style.position = 'relative'; clone.style.left = '0'; clone.style.top = '0'; clone.style.transform = 'none';
  const xml = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}"><foreignObject width="${w}" height="${h}" transform="scale(${scale})">${xml}</foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  c.getContext('2d').drawImage(img, 0, 0);
  return c;
}

const VS = `#version 300 es
in vec2 aPos; in float aZ; in vec2 aUV; in vec2 aShade;
out vec2 vUV; out vec2 vShade;
void main(){ gl_Position = vec4(aPos, aZ, 1.); vUV = aUV; vShade = aShade; }`;
const FS = `#version 300 es
precision mediump float;
in vec2 vUV; in vec2 vShade; uniform sampler2D uFront, uBack; uniform float uDbg; out vec4 o;
void main(){
  vec4 c; float s;
  // 三角形的绕向：纸在左边（正面朝上）时是「背面朝向」，所以这里反过来取
  if (!gl_FrontFacing) { c = texture(uFront, vec2(1. - vUV.x, vUV.y)); s = vShade.x; }
  else { c = texture(uBack, vec2(vUV.x, vUV.y)); s = vShade.y; }
  o = vec4(c.rgb * s, c.a);
  if (uDbg > 0.5) o = gl_FrontFacing ? vec4(1.,0.,0.,1.) : vec4(0.,0.,1.,1.);
}`;

export async function makePaperBookGL(host, opts) {
  const { preset = 'xuan', front, back, left, right } = opts;
  const P = PRESETS[preset];
  host.innerHTML = `
    <div class="bk">
      <div class="bk-page bk-left">${left}</div>
      <div class="bk-page bk-right">${right}</div>
      <div class="bk-page bk-left bk-rest" data-face="front">${front}</div>
      <div class="bk-page bk-right bk-rest" data-face="back" hidden>${back}</div>
      <div class="bk-cast" data-side="left"></div><div class="bk-cast" data-side="right"></div>
    </div>`;
  const book = host.querySelector('.bk');
  const restF = book.querySelector('[data-face="front"]');
  const restB = book.querySelector('[data-face="back"]');
  const [castL, castR] = book.querySelectorAll('.bk-cast');

  // 快照（背面先临时显示出来才能量尺寸）
  let texF, texB;
  try {
    restB.hidden = false;
    [texF, texB] = await Promise.all([snapshot(restF), snapshot(restB)]);
    restB.hidden = true;
  } catch { restB.hidden = true; return makeStripBook(host, opts); }

  const cv = document.createElement('canvas');
  cv.className = 'bk-gl';
  host.style.position = 'relative';
  host.append(cv);
  const gl = cv.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: true });
  if (!gl) { cv.remove(); return makeStripBook(host, opts); }
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  const tex = (canvas, unit) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); } catch { return null; }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    return t;
  };
  if (!tex(texF, 0) || !tex(texB, 1)) { cv.remove(); return makeStripBook(host, opts); }
  gl.useProgram(prog);
  gl.uniform1i(gl.getUniformLocation(prog, 'uFront'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'uBack'), 1);
  gl.uniform1f(gl.getUniformLocation(prog, 'uDbg'), location.search.includes('dbg') ? 1 : 0);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const STR = 7;                    // x, y, z, u, v, shadeF, shadeB
  const verts = new Float32Array((N + 1) * 2 * STR);
  gl.bufferData(gl.ARRAY_BUFFER, verts.byteLength, gl.DYNAMIC_DRAW);
  const at = (n, size, off) => { const l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, STR * 4, off * 4); };
  at('aPos', 2, 0); at('aZ', 1, 2); at('aUV', 2, 3); at('aShade', 2, 5);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /* ---------- 和 CSS 一样的投影：.bk rotateX(TILT)，宿主 perspective ---------- */
  const TILT = 26 * Math.PI / 180, PERSP = 1700;
  let BW, BH, HW, cvRect;
  const MARGIN_TOP = 0.9, MARGIN_X = 0.12;   // 画布比书大一圈：纸翘起来会超出书的范围
  const layout = () => {
    BW = book.offsetWidth; BH = book.offsetHeight; HW = host.clientWidth;
    const mt = BH * MARGIN_TOP, mx = BW * MARGIN_X;
    cvRect = { x: -mx, y: -mt, w: BW + mx * 2, h: BH + mt };
    const dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(cv.style, { left: `${cvRect.x}px`, top: `${cvRect.y}px`, width: `${cvRect.w}px`, height: `${cvRect.h}px` });
    cv.width = cvRect.w * dpr; cv.height = cvRect.h * dpr;
  };
  // 书上的点 (X 从书左, Y 从书顶, Z 离纸面) → 宿主坐标
  const project = (X, Y, Z) => {
    const oy = BH;
    const y = Y - oy, z = Z;
    const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
    const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
    const Xh = X, Yh = oy + y2, Zh = z2;
    const px = HW / 2, py = 0;                // perspective-origin: 50% 0%
    const f = PERSP / (PERSP - Zh);
    return [px + (Xh - px) * f, py + (Yh - py) * f, Zh];
  };

  /* ---------- 软链 ---------- */
  let L = 1;
  const u = new Float32Array(N + 1), v = new Float32Array(N + 1), pu = new Float32Array(N + 1), pv = new Float32Array(N + 1);
  const flat = (side) => { for (let i = 0; i <= N; i++) { u[i] = pu[i] = side * i * (L / N); v[i] = pv[i] = 0; } };
  let hand = null, running = false, rest = 0, lastT = 0, side = -1;

  const step = (dt) => {
    const seg = L / N, damp = 1 - P.drag;
    for (let i = 1; i <= N; i++) {
      const vu = (u[i] - pu[i]) * damp, vv = (v[i] - pv[i]) * damp;
      pu[i] = u[i]; pv[i] = v[i]; u[i] += vu; v[i] += vv - P.g * dt * dt;
    }
    const stiff = P.stiff * (16 / N);
    for (let it = 0; it < 14; it++) {
      if (hand) { u[N] += (hand.u - u[N]) * hand.k; v[N] += (hand.v - v[N]) * hand.k; }
      for (let i = 0; i < N; i++) {
        const du = u[i + 1] - u[i], dv = v[i + 1] - v[i];
        const d = Math.hypot(du, dv) || 1e-6, diff = (d - seg) / d;
        if (i === 0) { u[1] -= du * diff; v[1] -= dv * diff; }
        else { u[i] += du * diff * .5; v[i] += dv * diff * .5; u[i + 1] -= du * diff * .5; v[i + 1] -= dv * diff * .5; }
      }
      for (let i = 1; i < N; i++) {
        u[i] += ((u[i - 1] + u[i + 1]) / 2 - u[i]) * stiff;
        v[i] += ((v[i - 1] + v[i + 1]) / 2 - v[i]) * stiff;
      }
      for (let i = 1; i <= N; i++) if (v[i] < 0) { v[i] = 0; pu[i] = u[i] - (u[i] - pu[i]) * .4; pv[i] = 0; }
      u[0] = 0; v[0] = 0;
    }
  };

  /* ---------- 画一帧 ---------- */
  const LIGHT = (() => { const l = [-.35, -.45, 1]; const n = Math.hypot(...l); return l.map((x) => x / n); })();
  const draw = () => {
    for (let i = 0; i <= N; i++) {
      // 这一点的法线（正面朝上）
      const a = Math.max(0, i - 1), b = Math.min(N, i + 1);
      const tu = u[b] - u[a], tv = v[b] - v[a], tl = Math.hypot(tu, tv) || 1;
      const nx = tv / tl, nz = -tu / tl;                         // 正面法线
      const dF = nx * LIGHT[0] + nz * LIGHT[2], dB = -dF;
      const shF = .62 + .38 * clamp(dF, 0, 1), shB = .62 + .38 * clamp(dB, 0, 1);
      for (let r = 0; r < 2; r++) {
        const [hx, hy, hz] = project(BW / 2 + u[i], r * BH, v[i]);
        const k = (i * 2 + r) * STR;
        verts[k] = ((hx - cvRect.x) / cvRect.w) * 2 - 1;
        verts[k + 1] = 1 - ((hy - cvRect.y) / cvRect.h) * 2;
        verts[k + 2] = -hz / 4000;                                // 越高越靠前
        verts[k + 3] = i / N; verts[k + 4] = r;
        verts[k + 5] = shF; verts[k + 6] = shB;
      }
    }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, (N + 1) * 2);
    // 投影落在下面那页上：纸越贴近，影子越深
    let hL = 0, nL = 0, hR = 0, nR = 0;
    for (let i = 1; i <= N; i++) { if (u[i] < 0) { hL += v[i]; nL++; } else { hR += v[i]; nR++; } }
    const sh = (h, n) => (n ? clamp(1 - h / n / (L * .55), 0, 1) * .5 : 0);
    castL.style.opacity = nL && nR ? sh(hL, nL).toFixed(3) : '0';
    castR.style.opacity = nL && nR ? sh(hR, nR).toFixed(3) : '0';
  };

  const showRest = () => {
    // 停下来：换回网页
    restF.hidden = side > 0; restB.hidden = side < 0;
    cv.style.visibility = 'hidden';
    castL.style.opacity = castR.style.opacity = '0';
  };
  const showGL = () => { restF.hidden = true; restB.hidden = true; cv.style.visibility = 'visible'; };

  const loop = (t) => {
    const dt = lastT ? Math.min(1 / 30, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    for (let k = 0; k < 3; k++) step(dt / 3);
    draw();
    let maxV = 0, maxH = 0;
    for (let i = 1; i <= N; i++) { maxV = Math.max(maxV, Math.abs(u[i] - pu[i]) + Math.abs(v[i] - pv[i])); maxH = Math.max(maxH, v[i]); }
    rest = !hand && maxV < .04 && maxH < .4 ? rest + 1 : 0;
    if (rest > 12) { running = false; lastT = 0; side = u[N] > 0 ? 1 : -1; flat(side); showRest(); return; }
    requestAnimationFrame(loop);
  };
  const wake = () => { if (!running) { running = true; rest = 0; showGL(); requestAnimationFrame(loop); } };

  /* ---------- 手 ---------- */
  const handAt = (x) => {
    const r = book.getBoundingClientRect();
    const p = clamp((x - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
    const th = Math.acos(-p), rad = L * (.97 - .14 * Math.sin(th));
    return { u: -Math.cos(th) * rad, v: Math.sin(th) * rad };
  };
  let drag = false;
  book.addEventListener('pointerdown', (e) => { book.setPointerCapture(e.pointerId); drag = true; hand = { ...handAt(e.clientX), k: .5 }; wake(); });
  book.addEventListener('pointermove', (e) => {
    if (drag) { Object.assign(hand, handAt(e.clientX)); return; }
    const r = book.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    const near = side < 0 ? x < .2 : x > .8;
    if (near) {
      const prox = side < 0 ? 1 - x / .2 : 1 - (1 - x) / .2, th = .32 * prox;
      hand = { u: side * Math.cos(th) * L * .985, v: Math.sin(th) * L * .985, k: .12 };
      wake();
    } else if (hand) hand = null;
  });
  const up = () => { if (drag) { drag = false; hand = null; } };
  book.addEventListener('pointerup', up); book.addEventListener('pointercancel', up);
  book.addEventListener('pointerleave', () => { if (!drag) hand = null; });

  const autoFlip = () => {
    const from = side < 0 ? 0 : Math.PI, to = side < 0 ? Math.PI * .8 : Math.PI * .2;
    const t0 = performance.now(), dur = 480;
    const tick = (t) => {
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 2), th = from + (to - from) * e;
      const rad = L * (.97 - .14 * Math.sin(th));
      hand = { u: -Math.cos(th) * rad, v: Math.sin(th) * rad, k: .3 };
      wake();
      if (k < 1) requestAnimationFrame(tick); else hand = null;
    };
    requestAnimationFrame(tick);
  };

  const init = () => { layout(); L = BW / 2; flat(side); showRest(); };
  init();
  addEventListener('resize', init);
  return { play: autoFlip, reset: () => { hand = null; side = -1; flat(-1); showRest(); } };
}
