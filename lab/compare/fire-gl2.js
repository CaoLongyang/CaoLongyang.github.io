/* ============================================================
   lab/compare/fire-gl2.js · 第二版的火（A + B）
   burnGL(el, opts) → Promise：纸烧光时 resolve；灰片、火星和烟之后再飘一会儿

   和第一版相比：
   A1 先烤后烧：火线前面先出现一大片慢慢变深的焦黄，中间一条很细的亮余烬线
   A2 火苗变小变细：沿火线分成一簇簇往上蹿的小火舌，焰根亮、焰尖暗而透明
   A3 火会发光：火光照亮周围的纸和桌面，带闪烁；火苗外面一圈柔光
   A4 节奏：先在中心烤出一个焦点（0.45s），再烧开，约 2.5 秒
   B  灰片：烧过的黑边碎成小片，边缘还红着，卷着翻着往上飘，慢慢变暗消失

   烧穿边界 = 中心 + (R + max(R,8)·起伏)，JS 和着色器用同一个公式。R 可以是负的：
   那时还没烧穿，只有中心一块焦痕。
   ============================================================ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return v; }`;

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uDpr; uniform float uT; uniform vec2 uC; uniform float uR;
uniform vec4 uPh; uniform vec4 uRect; uniform float uAlive; uniform float uSmoke; uniform float uScale; uniform float uFlick;
out vec4 o;
${NOISE}

float sdf(vec2 p){
  vec2 d = p - uC; float a = atan(d.y, d.x); float r = length(d);
  float wob = .13*sin(a*3.+uPh.x+uT*.6) + .08*sin(a*7.+uPh.y-uT*.9) + .05*sin(a*13.+uPh.z+uT*1.7) + .025*sin(a*23.+uPh.w-uT*2.3);
  return r - (uR + max(uR, 8.)*wob);
}
// 火线上离 p 最近的点（沿中心方向近似）：用来判断这段火线是不是还在纸上
vec2 edgePt(vec2 p, float s){ vec2 d = p - uC; float r = max(length(d), 1e-3); return uC + d/r*(r - s); }
// 参差的火线：真实的洞（clip-path）是平滑的，这里在它外面再啃出一圈不规则的炭边
float rag(vec2 p, float S){ return (fbm(p*.03/S)*.7 + noise(p*.11/S)*.3) * 16.*S; }
float inRect(vec2 q, float f){
  return smoothstep(uRect.x-f, uRect.x+f, q.x) * (1.-smoothstep(uRect.z-f, uRect.z+f, q.x))
       * smoothstep(uRect.y-f, uRect.y+f, q.y) * (1.-smoothstep(uRect.w-f, uRect.w+f, q.y));
}
// 火的颜色：按温度。冷 = 暗红、几乎透明；热 = 橙黄。整体压深
vec3 flameCol(float T){
  vec3 c = mix(vec3(.22,.015,.0), vec3(.62,.09,.0), smoothstep(.0,.35,T));
  c = mix(c, vec3(.92,.30,.03), smoothstep(.35,.7,T));
  c = mix(c, vec3(1.,.62,.22), smoothstep(.78,1.,T));
  return c;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float S = uScale, t = uT;
  float onPaper = inRect(p, .5);
  float s = sdf(p);
  vec4 col = vec4(0.);

  // A1 纸上：干净 → 焦黄 → 褐 → 炭黑 → 亮余烬线 → 洞
  float rg = rag(p, S);
  float ds = s - rg;                                          // <0：在炭边里（视觉上已经烧穿）
  if (onPaper > .5 && s > 0.) {
    float w = 15.*S;
    float d = ds - (fbm(p*.045/S) - .5) * w * 1.2;
    float a1 = smoothstep(w*4.2, w*1.3, d) * .55;            // 烤黄（很宽、很淡）
    float a2 = smoothstep(w*1.6, w*.55, d);                  // 褐
    float a3 = smoothstep(w*.62, w*.22, d);                  // 炭黑
    vec3 cc = vec3(.46,.29,.12);
    cc = mix(cc, vec3(.16,.08,.03), a2);
    cc = mix(cc, vec3(.025,.014,.008), a3);
    float ca = max(a1, max(a2*.9, a3*.985));
    col = vec4(cc*ca, ca);
    // 炭边里（ds<0）：发黑的残纸，夹着暗红的余烬
    float lip = smoothstep(1., -2., ds);
    col = mix(col, vec4(vec3(.03,.018,.012)*.985, .985), lip);
    // 亮余烬线：很细、粗细不一、断断续续地明灭
    float wid = w*(.10 + .22*noise(p*.05/S + 3.));
    float line = smoothstep(wid, 0., abs(ds));
    float seg = smoothstep(.28, .62, noise(p*.06/S + vec2(t*.7, -t*.5)));
    float flick = .55 + .7*noise(p*.13/S + vec2(t*2.3, -t*1.7));
    vec3 hot = mix(vec3(.7,.1,.0), vec3(1.,.52,.14), smoothstep(.8,1.2,flick*seg*1.2));
    col.rgb += hot * line * (.25 + .9*seg) * flick * 1.5 * uAlive;
    // 炭边里零星的红点
    float crack = lip * smoothstep(.7,.88, noise(p*.2/S + t*.9)) * smoothstep(-rg, 0., ds);
    col.rgb += vec3(.6,.08,.0) * crack * 1.3 * uAlive;
  }

  // ⑤ 烟：火线上方很淡的暗烟
  {
    vec2 sq = p + vec2(0., 140.*S);
    float m = smoothstep(200.*S, 0., abs(sdf(sq))) * uSmoke * inRect(sq, 50.);
    float wisp = fbm(p*vec2(.012,.006)/S + vec2(t*.06, t*.55));
    float a = m * smoothstep(.45,.85, wisp) * .26;
    col.rgb = col.rgb*(1.-a) + vec3(.09,.06,.04)*a;
    col.a += a*(1.-col.a);
  }

  if (uAlive > 0.) {
    // A2 小火舌：从 p 往下找火线，找到得越近、温度越高
    float H = 58.*S;
    float colN = noise(vec2(p.x*.045/S, t*.9));                     // 每一簇的高矮
    float hgt = H * (.45 + 1.15*colN*colN);
    float sway = (fbm(vec2(p.x*.02/S, p.y*.03/S + t*1.8)) - .5) * 14.*S;
    float src = 0.;
    float jit = hash(p + fract(t)*13.);                              // 抖一下采样位置，避免一圈圈的条纹
    float bw = max(6.*S, hgt/9.);
    for (int i = 0; i < 12; i++) {
      float f = (float(i) + jit)/12.;
      vec2 q = p + vec2(sway*f, f*hgt);
      float sq = sdf(q);
      float dq = sq - rag(q, S);
      float band = smoothstep(bw, 0., abs(dq + 1.5*S)) * inRect(edgePt(q, sq), 3.);
      src = max(src, band * pow(1. - f, 1.3));
    }
    float turb = fbm(p*vec2(.05,.028)/S + vec2(0., t*3.4));       // 往上流的纹理把火舌撕开
    float patchN = smoothstep(.3, .7, noise(p*.012/S + vec2(t*.4, 0.)));   // 火线上一段一段地烧旺
    float T = src * (.3 + 1.1*turb) * (.55 + .6*patchN);
    float fl = smoothstep(.16,.75, T) * uAlive;
    vec3 fc = flameCol(clamp(T,0.,1.)) * fl * (.9 + .25*uFlick);
    col.rgb += fc;
    col.a = max(col.a, fl*fl*.55);                                  // 只有焰心有点遮挡，外焰透明
    // 火苗外面的一圈柔光
    col.rgb += vec3(.55,.14,.01) * src * .22 * uAlive;

    // A3 火光：照亮火线附近的纸和桌面（只加光，不遮挡）；只算还在纸上的那段火线
    float lit = inRect(p, 50.*S);
    float L = exp(-abs(s)/(60.*S)) * .15 + exp(-abs(s)/(180.*S)) * .05;
    col.rgb += vec3(.62,.24,.06) * L * lit * uAlive * uFlick;
  }
  o = col;
}`;

/* ④ 火星 */
const SPARK_VERT = `#version 300 es
in vec2 aP; in float aLife; in float aSize; in float aSeed;
uniform vec2 uRes; uniform float uDpr; uniform float uT;
out float vLife; out float vFl;
void main(){
  vec2 c = aP / uRes * 2. - 1.; c.y = -c.y;
  gl_Position = vec4(c,0.,1.);
  gl_PointSize = aSize * uDpr * (.5 + .5*aLife);
  vLife = aLife; vFl = .55 + .45*sin(uT*24. + aSeed*40.);
}`;
const SPARK_FRAG = `#version 300 es
precision mediump float; in float vLife; in float vFl; out vec4 o;
void main(){
  vec2 d = gl_PointCoord - .5; float r = dot(d,d);
  float core = smoothstep(.06, .0, r), halo = smoothstep(.25, .0, r);
  float a = (core*.8 + halo*.35) * vLife * vFl;
  vec3 c = mix(vec3(.6,.07,.0), vec3(1.,.55,.18), vLife*core);
  o = vec4(c*a, a);
}`;

/* B 灰片 */
const ASH_VERT = `#version 300 es
in vec2 aP; in float aLife; in float aSize; in float aSeed; in float aRot; in float aFlip; in float aHeat;
uniform vec2 uRes; uniform float uDpr;
out float vLife; out float vSeed; out float vRot; out float vFlip; out float vHeat;
void main(){
  vec2 c = aP / uRes * 2. - 1.; c.y = -c.y;
  gl_Position = vec4(c,0.,1.);
  gl_PointSize = aSize * uDpr;
  vLife = aLife; vSeed = aSeed; vRot = aRot; vFlip = aFlip; vHeat = aHeat;
}`;
const ASH_FRAG = `#version 300 es
precision highp float;
in float vLife; in float vSeed; in float vRot; in float vFlip; in float vHeat; out vec4 o;
${NOISE}
void main(){
  vec2 d = gl_PointCoord - .5;
  float cs = cos(vRot), sn = sin(vRot);
  d = mat2(cs,-sn,sn,cs) * d;
  float fx = max(abs(vFlip), .12);
  d.x /= fx;                                   // 翻转：侧过来时变窄
  float n = noise(d*4.5 + vSeed*31.) ;
  float e = length(d) - (.2 + .2*n);           // 不规则的碎片轮廓
  float a = smoothstep(.02, -.02, e);
  if (a <= 0.) discard;
  float rim = smoothstep(-.06, .0, e);         // 边缘还红着（细）
  float spot = smoothstep(.75, .9, noise(d*9. + vSeed*7.));
  float cool = 1. - vHeat;
  vec3 ch = mix(vec3(.05,.035,.025), vec3(.22,.2,.18), cool*.85) * (.55 + .6*fx) * (.8 + .4*noise(d*7.+vSeed*3.));  // 冷下来变成灰白的灰
  vec3 c = ch + vec3(1.,.36,.05) * (rim*.7 + spot*.6) * vHeat;
  float fade = smoothstep(0., .35, vLife);
  o = vec4(c*a*fade, a*fade*(.92 - .3*rim*vHeat));
}`;

function program(gl, vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* ⑥ 热浪 */
function heatFilter() {
  let svg = document.getElementById('heat-svg2');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'heat-svg2';
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0';
    svg.innerHTML = `<filter id="heatwave2" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="2"/>
      <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    document.body.append(svg);
  }
  return { turb: svg.querySelector('feTurbulence'), disp: svg.querySelector('feDisplacementMap') };
}

/* 粒子池：固定大小的 Float32Array，满了挤掉最老的，死了就压紧 */
function pool(max, stride, vstride) {
  const P = { max, stride, vstride, n: 0, data: new Float32Array(max * stride), vel: new Float32Array(max * vstride) };
  P.add = () => {
    if (P.n >= max) { P.data.copyWithin(0, stride, P.n * stride); P.vel.copyWithin(0, vstride, P.n * vstride); P.n--; }
    return P.n++;
  };
  P.compact = (lifeOff) => {
    let w = 0;
    for (let i = 0; i < P.n; i++) {
      if (P.data[i * stride + lifeOff] > 0) {
        if (w !== i) { P.data.copyWithin(w * stride, i * stride, i * stride + stride); P.vel.copyWithin(w * vstride, i * vstride, i * vstride + vstride); }
        w++;
      }
    }
    P.n = w;
  };
  return P;
}

export function burnGL(el, { duration = 2500, tail = 1100, pad = 0, heat = true, smoke = true, ash = true } = {}) {
  return new Promise((done) => {
    const r0 = el.getBoundingClientRect();
    const rect = { x: r0.left - pad, y: r0.top - pad, w: r0.width + pad * 2, h: r0.height + pad * 2 };
    const C = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    const maxR = Math.hypot(rect.w / 2, rect.h / 2) * 1.4;
    const S = clamp(Math.min(rect.w, rect.h) / 520, .45, 1.6);

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:46';
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { done(false); return; }
    document.body.append(cv);

    const pFire = program(gl, VERT, FRAG);
    const pSpark = program(gl, SPARK_VERT, SPARK_FRAG);
    const pAsh = program(gl, ASH_VERT, ASH_FRAG);
    const U = (p, n) => gl.getUniformLocation(p, n);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const vaoFire = gl.createVertexArray();
    gl.bindVertexArray(vaoFire);
    const lp = gl.getAttribLocation(pFire, 'aPos');
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);

    const mkVao = (prog, P, attrs) => {
      const buf = gl.createBuffer(), vao = gl.createVertexArray();
      gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, P.data.byteLength, gl.DYNAMIC_DRAW);
      for (const [name, size, off] of attrs) {
        const l = gl.getAttribLocation(prog, name);
        if (l < 0) continue;
        gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, P.stride * 4, off * 4);
      }
      return { buf, vao };
    };
    // 火星：x y life size seed | vx vy decay
    const SP = pool(3000, 5, 3);
    const vSpark = mkVao(pSpark, SP, [['aP', 2, 0], ['aLife', 1, 2], ['aSize', 1, 3], ['aSeed', 1, 4]]);
    // 灰片：x y life size seed rot flip heat | vx vy decay vrot flipPhase flipSpeed heatDecay
    const AP = pool(600, 8, 7);
    const vAsh = mkVao(pAsh, AP, [['aP', 2, 0], ['aLife', 1, 2], ['aSize', 1, 3], ['aSeed', 1, 4], ['aRot', 1, 5], ['aFlip', 1, 6], ['aHeat', 1, 7]]);

    const ph = [0, 0, 0, 0].map(() => Math.random() * 6.28);
    const edge = (a, R, t) => R + Math.max(R, 8) * (.13 * Math.sin(a * 3 + ph[0] + t * .6) + .08 * Math.sin(a * 7 + ph[1] - t * .9)
      + .05 * Math.sin(a * 13 + ph[2] + t * 1.7) + .025 * Math.sin(a * 23 + ph[3] - t * 2.3));
    const inside = (x, y, m = 0) => x > rect.x - m && y > rect.y - m && x < rect.x + rect.w + m && y < rect.y + rect.h + m;
    const onEdge = (R, t, off) => {           // 火线上一个随机点（在纸上）
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2, rr = Math.max(0, edge(a, R, t) + off);
        const x = C.x + Math.cos(a) * rr, y = C.y + Math.sin(a) * rr;
        if (inside(x, y, -2)) return [x, y, a];
      }
      return null;
    };

    const hf = heat ? heatFilter() : null;
    if (hf) el.style.filter = 'url(#heatwave2)';

    const IGNITE = 450, OUT = 350, SPREAD = duration - OUT - IGNITE;
    const R0 = -26 * S, R1 = 5 * S;
    const t0 = performance.now();
    let last = t0, resolved = false, burst = false;
    let spAcc = 0, ashAcc = 0;

    const frame = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const et = now - t0, t = et / 1000;
      const k = clamp((et - IGNITE) / SPREAD, 0, 1);
      const R = et < IGNITE ? R0 + (R1 - R0) * Math.pow(et / IGNITE, 1.6) : R1 + (maxR - R1) * Math.pow(k, 1.35);
      const alive = et < duration - OUT ? clamp((et - IGNITE * .55) / 220, 0, 1) : clamp(1 - (et - (duration - OUT)) / OUT, 0, 1);
      const smokeK = smoke ? clamp(et / 500, 0, 1) * clamp(1 - (et - duration) / tail, 0, 1) : 0;
      const flick = .82 + .1 * Math.sin(t * 13.1) + .06 * Math.sin(t * 29.7 + 1.3) + .05 * Math.sin(t * 7.3 + 2);

      // ① 洞
      if (R > 0 && et < duration + 50) {
        const m = pad + 6;
        let d = `M${-m} ${-m}H${r0.width + m}V${r0.height + m}H${-m}Z M`;
        for (let i = 0; i < 140; i++) {
          const a = (i / 140) * Math.PI * 2, rr = Math.max(0, edge(a, R, t));
          d += `${(C.x + Math.cos(a) * rr - r0.left).toFixed(1)} ${(C.y + Math.sin(a) * rr - r0.top).toFixed(1)}${i < 139 ? 'L' : 'Z'}`;
        }
        el.style.clipPath = `path(evenodd, "${d}")`;
        if (k > .97) el.style.visibility = 'hidden';
      }
      if (hf) {
        hf.disp.setAttribute('scale', (alive * (1.5 + 5 * Math.sin(Math.PI * k))).toFixed(2));
        hf.turb.setAttribute('baseFrequency', `${(0.012 + Math.sin(t * 3) * .002).toFixed(4)} ${(0.05 + Math.sin(t * 5.3) * .008).toFixed(4)}`);
        hf.turb.setAttribute('seed', String((t * 12) | 0));
      }

      // ④ 火星：比第一版少，大小差别更大
      if (alive > 0 && R > 0) {
        spAcc += (6 + 34 * k) * alive * dt * 60;
        while (spAcc >= 1) {
          spAcc--;
          const e = onEdge(R, t, (Math.random() - .4) * 6 * S); if (!e) continue;
          const i = SP.add(), o = i * 5, v = i * 3;
          const big = Math.random() < .12;
          SP.data.set([e[0], e[1], 1, big ? 3.5 + Math.random() * 3 : 1.2 + Math.random() * 2, Math.random()], o);
          SP.vel[v] = (Math.random() - .5) * 50 * S + Math.cos(e[2]) * 20;
          SP.vel[v + 1] = -(60 + Math.random() * 200) * S;
          SP.vel[v + 2] = big ? .35 + Math.random() * .4 : .6 + Math.random() * 1.1;
        }
      }
      for (let i = 0; i < SP.n; i++) {
        const o = i * 5, v = i * 3, y = SP.data[o + 1], seed = SP.data[o + 4];
        SP.vel[v] += Math.sin(y * .02 + t * 3 + seed * 6) * 80 * dt * S;
        SP.vel[v + 1] -= 50 * dt * S;
        SP.vel[v] *= .985;
        SP.data[o] += SP.vel[v] * dt; SP.data[o + 1] += SP.vel[v + 1] * dt;
        SP.data[o + 2] -= SP.vel[v + 2] * dt;
      }
      SP.compact(2);

      // B 灰片：从火线后面的炭边上掉下来；最后剩下的纸角整片碎掉
      const addAsh = (x, y, hot) => {
        const i = AP.add(), o = i * 8, v = i * 7;
        AP.data.set([x, y, 1, (9 + Math.random() * 15) * S, Math.random(), Math.random() * 6.28, 1, hot], o);
        AP.vel.set([(Math.random() - .5) * 40 * S, -(25 + Math.random() * 70) * S, .32 + Math.random() * .3,
          (Math.random() - .5) * 5, Math.random() * 6.28, 2 + Math.random() * 5, .5 + Math.random() * .7], v);
      };
      if (ash && alive > 0 && R > 0) {
        ashAcc += (.4 + 1.8 * k) * alive * dt * 60 * S;
        while (ashAcc >= 1) {
          ashAcc--;
          const e = onEdge(R, t, -(2 + Math.random() * 10) * S);
          if (e) addAsh(e[0], e[1], .7 + Math.random() * .3);
        }
      }
      if (ash && !burst && k > .9) {            // 纸角最后一下碎成一阵灰
        burst = true;
        for (let n = 0; n < 34; n++) {
          const x = rect.x + Math.random() * rect.w, y = rect.y + Math.random() * rect.h;
          const dx = x - C.x, dy = y - C.y;
          if (Math.hypot(dx, dy) < edge(Math.atan2(dy, dx), R, t) * .92) continue;
          addAsh(x, y, Math.random() * .8);
        }
      }
      for (let i = 0; i < AP.n; i++) {
        const o = i * 8, v = i * 7, D = AP.data, V = AP.vel;
        V[v] += Math.sin(D[o + 1] * .015 + t * 1.6 + D[o + 4] * 9) * 40 * dt * S;   // 左右飘
        V[v + 1] -= 28 * dt * S;                                                  // 热气往上托
        V[v] *= .98; V[v + 1] *= .992;
        D[o] += V[v] * dt; D[o + 1] += V[v + 1] * dt;
        D[o + 2] -= V[v + 2] * dt;
        D[o + 5] += V[v + 3] * dt;
        V[v + 4] += V[v + 5] * dt; D[o + 6] = Math.cos(V[v + 4]);
        D[o + 7] = Math.max(0, D[o + 7] - V[v + 6] * dt);
      }
      AP.compact(2);

      // 画
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(pFire); gl.bindVertexArray(vaoFire);
      gl.uniform2f(U(pFire, 'uRes'), cv.width, cv.height);
      gl.uniform1f(U(pFire, 'uDpr'), dpr);
      gl.uniform1f(U(pFire, 'uT'), t);
      gl.uniform2f(U(pFire, 'uC'), C.x, C.y);
      gl.uniform1f(U(pFire, 'uR'), et < duration + 50 ? R : maxR * 3);
      gl.uniform4f(U(pFire, 'uPh'), ...ph);
      gl.uniform4f(U(pFire, 'uRect'), rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      gl.uniform1f(U(pFire, 'uAlive'), alive);
      gl.uniform1f(U(pFire, 'uSmoke'), smokeK);
      gl.uniform1f(U(pFire, 'uScale'), S);
      gl.uniform1f(U(pFire, 'uFlick'), flick);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (AP.n) {
        gl.useProgram(pAsh); gl.bindVertexArray(vAsh.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vAsh.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, AP.data.subarray(0, AP.n * 8));
        gl.uniform2f(U(pAsh, 'uRes'), innerWidth, innerHeight);
        gl.uniform1f(U(pAsh, 'uDpr'), dpr);
        gl.drawArrays(gl.POINTS, 0, AP.n);
      }
      if (SP.n) {
        gl.useProgram(pSpark); gl.bindVertexArray(vSpark.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vSpark.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, SP.data.subarray(0, SP.n * 5));
        gl.uniform2f(U(pSpark, 'uRes'), innerWidth, innerHeight);
        gl.uniform1f(U(pSpark, 'uDpr'), dpr);
        gl.uniform1f(U(pSpark, 'uT'), t);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, SP.n);
      }

      if (!resolved && et >= duration) {
        resolved = true;
        el.style.visibility = 'hidden';
        el.style.filter = '';
        done(true);
      }
      if (et < duration + tail || SP.n || AP.n) requestAnimationFrame(frame);
      else { cv.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
    };
    requestAnimationFrame(frame);
  });
}
