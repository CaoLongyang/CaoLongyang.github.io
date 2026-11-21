/* ============================================================
   scenes/works/sheet.js · 有重量的书页（WebGL）
   翻动时，把这一叶的正反两面拍成图，贴到一张会弯的网格上；
   网格的形状由一条 24 段的软链算出来（重力 · 空气阻力 · 弱回弹 · 不穿桌面）
   平时这一叶还是普通网页；只有动的时候换成这张纸，落定后立刻换回来

   createSheet(album) → { ok, prepare(leaf), start(leaf, side), hand(h), release(), busy }
   - side：这一叶开始时躺在哪边（-1 左、+1 右）
   - hand(h)：h = { u, v, k } 牵着外沿的点（书页坐标，书脊为原点），k 越大越紧；null = 松手
   - start() 返回 Promise，纸停稳时 resolve(最终躺在哪边)
   ============================================================ */

const N = 24;
const PAPER = { g: 2500, drag: .05, stiff: .08 };      // 书页
const PERSP = 2800;                                    // 和 works.css 里 .wk-leaf 的 perspective() 一致
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- 把一块 DOM 画成图（内联计算后的样式，再用 SVG foreignObject 栅格化） ---------- */
async function snapshot(el, scale = 2) {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w || !h) throw new Error('empty');
  const clone = el.cloneNode(true);
  const src = [el, ...el.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((s, i) => {
    const cs = getComputedStyle(s);
    let css = '';
    for (const p of cs) css += `${p}:${cs.getPropertyValue(p)};`;
    dst[i].setAttribute('style', css);
  });
  Object.assign(clone.style, { inset: 'auto', position: 'relative', left: '0', top: '0', transform: 'none', backfaceVisibility: 'visible' });
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
in vec2 vUV; in vec2 vShade; uniform sampler2D uFront, uBack; out vec4 o;
void main(){
  vec4 c; float s;
  // 纸在左边（正面朝上）时三角形是「背面朝向」，所以反过来取
  if (!gl_FrontFacing) { c = texture(uFront, vec2(1. - vUV.x, vUV.y)); s = vShade.x; }
  else { c = texture(uBack, vUV); s = vShade.y; }
  o = vec4(c.rgb * s, c.a);
}`;

export function createSheet(album) {
  const cv = document.createElement('canvas');
  cv.className = 'wk-sheet';
  cv.setAttribute('aria-hidden', 'true');
  album.append(cv);
  const gl = cv.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: true });
  const fail = { ok: false };
  if (!gl) { cv.remove(); return fail; }

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return fail; }
  gl.useProgram(prog);
  gl.uniform1i(gl.getUniformLocation(prog, 'uFront'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'uBack'), 1);
  const texF = gl.createTexture(), texB = gl.createTexture();
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const STR = 7;
  const verts = new Float32Array((N + 1) * 2 * STR);
  gl.bufferData(gl.ARRAY_BUFFER, verts.byteLength, gl.DYNAMIC_DRAW);
  const at = (n, size, off) => { const l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, STR * 4, off * 4); };
  at('aPos', 2, 0); at('aZ', 1, 2); at('aUV', 2, 3); at('aShade', 2, 5);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const upload = (t, unit, canvas) => {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);   // 被浏览器拒绝时会抛错
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  };

  /* ---------- 尺寸与投影 ---------- */
  let W = 1, H = 1, L = 1, box = null;
  const M = 0.28;                         // 画布四周多出的余量（纸翘起来会变大）
  const layout = () => {
    W = album.offsetWidth; H = album.offsetHeight; L = W / 2;
    box = { x: -W * M, y: -H * M, w: W * (1 + 2 * M), h: H * (1 + 2 * M) };
    const dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(cv.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    cv.width = box.w * dpr; cv.height = box.h * dpr;
  };
  layout();
  addEventListener('resize', layout);
  // 书页上的点 → 册页坐标：透视中心在书脊正中，和 CSS 的 perspective(2800px) 一样
  const project = (X, Y, Z) => {
    const cx = W / 2, cy = H / 2, f = PERSP / (PERSP - Z);
    return [cx + (X - cx) * f, cy + (Y - cy) * f, Z];
  };

  /* ---------- 软链 ---------- */
  const u = new Float32Array(N + 1), v = new Float32Array(N + 1), pu = new Float32Array(N + 1), pv = new Float32Array(N + 1);
  const flat = (side) => { for (let i = 0; i <= N; i++) { u[i] = pu[i] = side * i * (L / N); v[i] = pv[i] = 0; } };
  let hand = null, running = false, lastT = 0, rest = 0, resolveDone = null;

  const step = (dt) => {
    const seg = L / N, damp = 1 - PAPER.drag, stiff = PAPER.stiff * (16 / N);
    for (let i = 1; i <= N; i++) {
      const vu = (u[i] - pu[i]) * damp, vv = (v[i] - pv[i]) * damp;
      pu[i] = u[i]; pv[i] = v[i]; u[i] += vu; v[i] += vv - PAPER.g * dt * dt;
    }
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

  const LIGHT = (() => { const l = [-.35, -.4, 1]; const n = Math.hypot(...l); return l.map((x) => x / n); })();
  const draw = () => {
    for (let i = 0; i <= N; i++) {
      const a = Math.max(0, i - 1), b = Math.min(N, i + 1);
      const tu = u[b] - u[a], tv = v[b] - v[a], tl = Math.hypot(tu, tv) || 1;
      const nx = tv / tl, nz = -tu / tl;
      const d = nx * LIGHT[0] + nz * LIGHT[2];
      const shF = .64 + .36 * clamp(d, 0, 1), shB = .64 + .36 * clamp(-d, 0, 1);
      for (let r = 0; r < 2; r++) {
        const [x, y, z] = project(W / 2 + u[i], r * H, v[i]);
        const k = (i * 2 + r) * STR;
        verts[k] = ((x - box.x) / box.w) * 2 - 1;
        verts[k + 1] = 1 - ((y - box.y) / box.h) * 2;
        verts[k + 2] = -z / 6000;
        verts[k + 3] = i / N; verts[k + 4] = r; verts[k + 5] = shF; verts[k + 6] = shB;
      }
    }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, (N + 1) * 2);
    // 投影：纸越贴近下面那页，影子越深
    let hL = 0, nL = 0, hR = 0, nR = 0;
    for (let i = 1; i <= N; i++) { if (u[i] < 0) { hL += v[i]; nL++; } else { hR += v[i]; nR++; } }
    const cast = album.querySelector('.wk-cast');
    const lifted = Math.max(...v) > 1;
    if (cast) {
      const onLeft = nL >= nR;
      const h = onLeft ? hL / (nL || 1) : hR / (nR || 1);
      cast.dataset.side = onLeft ? 'right' : 'left';
      cast.style.opacity = lifted ? (clamp(1 - h / (L * .6), 0, 1) * .45).toFixed(3) : '0';
    }
  };

  const loop = (t) => {
    const dt = lastT ? Math.min(1 / 30, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    for (let k = 0; k < 3; k++) step(dt / 3);
    draw();
    let maxV = 0, maxH = 0;
    for (let i = 1; i <= N; i++) { maxV = Math.max(maxV, Math.abs(u[i] - pu[i]) + Math.abs(v[i] - pv[i])); maxH = Math.max(maxH, v[i]); }
    rest = !hand && maxV < .04 && maxH < .4 ? rest + 1 : 0;
    if (rest > 10) {
      running = false; lastT = 0;
      const side = u[N] > 0 ? 1 : -1;
      cv.style.visibility = 'hidden';
      const c = album.querySelector('.wk-cast'); if (c) c.style.opacity = '0';
      const r = resolveDone; resolveDone = null; r?.(side);
      return;
    }
    requestAnimationFrame(loop);
  };

  /* ---------- 对外 ---------- */
  let cache = new WeakMap();        // leaf → { f, b } 两面的快照
  const prepare = async (leaf) => {
    if (!leaf) return null;
    if (cache.has(leaf)) return cache.get(leaf);
    const vis = leaf.style.visibility;
    leaf.style.visibility = 'visible';
    const p = Promise.all([snapshot(leaf.querySelector('.wk-front')), snapshot(leaf.querySelector('.wk-back'))])
      .then(([f, b]) => ({ f, b }))
      .finally(() => { leaf.style.visibility = vis; });
    cache.set(leaf, p);
    return p;
  };

  const api = {
    ok: true,
    get busy() { return running; },
    prepare,
    clear() { cache = new WeakMap(); },
    async start(leaf, side, onShow) {
      const snap = await prepare(leaf);
      upload(texF, 0, snap.f); upload(texB, 1, snap.b);
      layout(); flat(side); draw();
      cv.style.visibility = 'visible';
      onShow?.();                       // 纸已经画出来了，调用方再把网页那一叶藏起来，不会闪
      running = true; rest = 0; lastT = 0;
      requestAnimationFrame(loop);
      return new Promise((r) => { resolveDone = r; });
    },
    hand(h) { hand = h; },
    release() { hand = null; },
    get L() { return L; },
    get edge() { return { u: u[N], v: v[N] }; },
  };
  return api;
}
