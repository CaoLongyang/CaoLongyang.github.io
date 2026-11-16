/* ============================================================
   lab/compare/fire-gl.js · 真实的火（WebGL）
   burnGL(el, opts) → Promise：纸烧光时 resolve；火星和烟之后再飘一会儿自己消失

   ① 洞：元素本身每帧用 clip-path 挖掉（网页文字不变）
   ②–⑤ 焦痕、火苗、烟：一个全屏着色器
   ④ 火星：GPU 点精灵，最多 4000 颗，加色混合
   ⑥ 热浪：元素上挂一个 SVG 位移滤镜，强度随火势变化

   烧穿边界 = 中心 + 半径 R(t) × 一串正弦起伏（JS 和着色器用同一个公式）
   ============================================================ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uDpr; uniform float uT; uniform vec2 uC; uniform float uR;
uniform vec4 uPh; uniform vec4 uRect; uniform float uAlive; uniform float uSmoke; uniform float uScale;
out vec4 o;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return v; }

// 到烧穿边界的有向距离（像素）：<0 已烧穿，>0 还是纸
float sdf(vec2 p){
  vec2 d = p - uC; float a = atan(d.y, d.x); float r = length(d);
  float e = uR*(1. + .13*sin(a*3.+uPh.x+uT*.6) + .08*sin(a*7.+uPh.y-uT*.9) + .05*sin(a*13.+uPh.z+uT*1.7) + .025*sin(a*23.+uPh.w-uT*2.3));
  return r - e;
}

vec3 ramp(float x){
  // 深色的火：暗红 → 深红 → 赭橙 → 琥珀，最亮处也不到黄白
  vec3 c = mix(vec3(.16,.0,.0), vec3(.50,.04,.0), smoothstep(.0,.3,x));
  c = mix(c, vec3(.80,.18,.02), smoothstep(.3,.62,x));
  c = mix(c, vec3(.98,.42,.07), smoothstep(.66,1.,x));
  return c;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS 像素，y 向下
  float S = uScale;                 // 随纸的大小缩放火苗
  bool onPaper = p.x>uRect.x && p.y>uRect.y && p.x<uRect.z && p.y<uRect.w;
  float s = sdf(p);

  // ② 焦痕：只画在还没烧穿的纸上
  vec4 col = vec4(0.);
  if (onPaper && s > 0. && uR > .5) {
    float w = 22.*S;
    float tex = fbm(p*.06);
    float c1 = smoothstep(w*2.6, w*.9, s - tex*w*.6);          // 烤黄
    float c2 = smoothstep(w*1.1, 0., s - tex*w*.5);            // 焦黑
    vec3 cc = mix(vec3(.42,.25,.11), vec3(.03,.015,.01), c2);
    float ca = max(c1*.42, c2*.97);
    // 焦黑边上的余烬：一闪一闪的暗红
    float ember = smoothstep(w*.35, 0., s) * smoothstep(.45,.8, noise(p*.18 + uT*3.));
    cc += vec3(.62,.1,.01) * ember * 1.4 * uAlive;
    col = vec4(cc*ca, ca);
  }

  // ⑤ 烟：火苗上方的暗烟，往上流动
  float t = uT;
  float smk = fbm(p*.006/S + vec2(t*.08, t*.45));
  float above = sdf(p + vec2(0., 160.*S));
  vec2 sq0 = p + vec2(0., 160.*S);
  float sIn = smoothstep(uRect.x-40., uRect.x+40., sq0.x) * (1.-smoothstep(uRect.z-40., uRect.z+40., sq0.x))
            * smoothstep(uRect.y-40., uRect.y+40., sq0.y) * (1.-smoothstep(uRect.w-40., uRect.w+40., sq0.y));
  float sMask = smoothstep(220.*S, 0., abs(above)) * uSmoke * sIn;
  float sa = sMask * smoothstep(.35,.85, smk) * .55;
  col.rgb = col.rgb*(1.-sa) + vec3(.05,.04,.035)*sa;
  col.a = col.a + sa*(1.-col.a);

  // ③ 火苗：用噪声把采样点往下推，火舌就站在边界上往上窜
  if (uAlive > 0.) {
    float n1 = fbm(p*.010/S + vec2(0., t*2.1));
    float n2 = fbm(p*.026/S + vec2(t*.35, t*3.6));
    float H = 70.*S;
    vec2 q = p + vec2((n2-.5)*14.*S, (n1*1.1 + n2*.7) * H);
    float sq = sdf(q);
    // 火只从纸上烧起来：采样点 q 要落在纸里（所以火舌可以窜出纸的上沿）
    float inR = smoothstep(uRect.x-6., uRect.x+10., q.x) * (1.-smoothstep(uRect.z-10., uRect.z+6., q.x))
              * smoothstep(uRect.y-6., uRect.y+10., q.y) * (1.-smoothstep(uRect.w-10., uRect.w+6., q.y));
    float body = smoothstep(H*.95, 0., abs(sq + H*.15));
    float I = body * pow(n2*1.35, 1.6) * 1.55;
    I *= smoothstep(-H*1.4, -H*.2, s) ;                    // 火苗只在边界附近，不进到洞里太深
    I = clamp(I*uAlive*inR, 0., 1.2);
    float fa = smoothstep(.08,.32,I);
    vec3 fc = ramp(clamp(I,0.,1.)) * fa;
    col.rgb = col.rgb + fc;                                  // 火是发光的：加上去
    col.a = max(col.a, fa*.95);
  }
  o = col;
}`;

const SPARK_VERT = `#version 300 es
in vec2 aP; in float aLife; in float aSize; in float aSeed;
uniform vec2 uRes; uniform float uDpr; uniform float uT;
out float vLife; out float vFl;
void main(){
  vec2 c = aP / uRes * 2. - 1.; c.y = -c.y;
  gl_Position = vec4(c,0.,1.);
  gl_PointSize = aSize * uDpr * (.6 + .4*aLife);
  vLife = aLife; vFl = .6 + .4*sin(uT*28. + aSeed*40.);
}`;
const SPARK_FRAG = `#version 300 es
precision mediump float; in float vLife; in float vFl; out vec4 o;
void main(){
  vec2 d = gl_PointCoord - .5; float r = dot(d,d);
  float a = smoothstep(.25, .0, r) * vLife * vFl;
  vec3 c = mix(vec3(.55,.06,.0), vec3(1.,.48,.12), vLife);
  o = vec4(c*a, a);
}`;

function program(gl, vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* ⑥ 热浪：挂在被烧的元素上 */
function heatFilter() {
  let svg = document.getElementById('heat-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'heat-svg';
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0';
    svg.innerHTML = `<filter id="heatwave" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="2" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    document.body.append(svg);
  }
  return { turb: svg.querySelector('feTurbulence'), disp: svg.querySelector('feDisplacementMap') };
}

export function burnGL(el, { duration = 1700, tail = 650, pad = 0, heat = true, smoke = true } = {}) {
  return new Promise((done) => {
    const r0 = el.getBoundingClientRect();
    const rect = { x: r0.left - pad, y: r0.top - pad, w: r0.width + pad * 2, h: r0.height + pad * 2 };
    const C = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    const maxR = Math.hypot(rect.w / 2, rect.h / 2) * 1.45;
    const S = clamp(Math.min(rect.w, rect.h) / 520, .45, 1.6);   // 火苗大小跟着纸走

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:46';
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { done(false); return; }      // 交给调用方用备用方案
    document.body.append(cv);

    const pFire = program(gl, VERT, FRAG);
    const pSpark = program(gl, SPARK_VERT, SPARK_FRAG);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const vaoFire = gl.createVertexArray();
    gl.bindVertexArray(vaoFire);
    const locPos = gl.getAttribLocation(pFire, 'aPos');
    gl.enableVertexAttribArray(locPos); gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    const MAX = 4000, STRIDE = 5;           // x, y, life, size, seed
    const data = new Float32Array(MAX * STRIDE);
    const vel = new Float32Array(MAX * 3);  // vx, vy, decay
    let count = 0;
    const sbuf = gl.createBuffer();
    const vaoSpark = gl.createVertexArray();
    gl.bindVertexArray(vaoSpark);
    gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    const attr = (name, size, off) => { const l = gl.getAttribLocation(pSpark, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, STRIDE * 4, off * 4); };
    attr('aP', 2, 0); attr('aLife', 1, 2); attr('aSize', 1, 3); attr('aSeed', 1, 4);

    const U = (p, n) => gl.getUniformLocation(p, n);
    const ph = [0, 0, 0, 0].map(() => Math.random() * 6.28);
    const edge = (a, R, t) => R * (1 + .13 * Math.sin(a * 3 + ph[0] + t * .6) + .08 * Math.sin(a * 7 + ph[1] - t * .9)
      + .05 * Math.sin(a * 13 + ph[2] + t * 1.7) + .025 * Math.sin(a * 23 + ph[3] - t * 2.3));

    const hf = heat ? heatFilter() : null;
    if (hf) el.style.filter = 'url(#heatwave)';

    const IGNITE = 200, SPREAD = duration - 300 - IGNITE;   // 最后 0.3 秒火苗熄灭
    const t0 = performance.now();
    let last = t0, resolved = false;

    const spawn = (R, t, n) => {
      for (let i = 0; i < n; i++) {
        if (count >= MAX) {             // 满了就挤掉最老的
          data.copyWithin(0, STRIDE, count * STRIDE); vel.copyWithin(0, 3, count * 3); count--;
        }
        const a = Math.random() * Math.PI * 2;
        const rr = edge(a, R, t) + (Math.random() - .3) * 10 * S;
        const x = C.x + Math.cos(a) * rr, y = C.y + Math.sin(a) * rr;
        if (x < rect.x - 20 || y < rect.y - 20 || x > rect.x + rect.w + 20 || y > rect.y + rect.h + 20) continue;
        const k = count * STRIDE;
        data[k] = x; data[k + 1] = y; data[k + 2] = 1; data[k + 3] = 1.4 + Math.random() * 3; data[k + 4] = Math.random();
        const j = count * 3;
        vel[j] = (Math.random() - .5) * 60 * S + Math.cos(a) * 25;
        vel[j + 1] = -(70 + Math.random() * 230) * S;
        vel[j + 2] = .55 + Math.random() * 1.1;    // 每秒衰减
        count++;
      }
    };

    const frame = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const el_t = now - t0, t = el_t / 1000;
      const k = clamp((el_t - IGNITE) / SPREAD, 0, 1);
      const R = el_t < IGNITE ? 6 * S * (el_t / IGNITE) : 6 * S + (maxR - 6 * S) * Math.pow(k, 1.45);
      const alive = el_t < duration - 300 ? clamp(el_t / 120, 0, 1) : clamp(1 - (el_t - (duration - 300)) / 300, 0, 1);
      const smokeK = smoke ? clamp(el_t / 300, 0, 1) * clamp(1 - (el_t - duration) / tail, 0, 1) : 0;

      // ① 洞
      if (R > .5 && el_t < duration + 50) {
        const m = pad + 6;   // 外框比元素大一圈，避免边上残留一像素的亮线
        let d = `M${-m} ${-m}H${r0.width + m}V${r0.height + m}H${-m}Z M`;
        for (let i = 0; i < 120; i++) {
          const a = (i / 120) * Math.PI * 2, rr = edge(a, R, t);
          d += `${(C.x + Math.cos(a) * rr - r0.left).toFixed(1)} ${(C.y + Math.sin(a) * rr - r0.top).toFixed(1)}${i < 119 ? 'L' : 'Z'}`;
        }
        el.style.clipPath = `path(evenodd, "${d}")`;
        if (k > .97) el.style.visibility = 'hidden';
      }
      // ⑥ 热浪：火越大扭得越明显
      if (hf) {
        hf.disp.setAttribute('scale', (alive * (2 + 6 * Math.sin(Math.PI * k))).toFixed(2));
        hf.turb.setAttribute('baseFrequency', `${(0.012 + Math.sin(t * 3) * .002).toFixed(4)} ${(0.05 + Math.sin(t * 5.3) * .008).toFixed(4)}`);
        hf.turb.setAttribute('seed', String((t * 12) | 0));
      }

      // ④ 火星
      if (alive > 0) spawn(R, t, Math.round((12 + 60 * k) * alive * dt * 60));
      for (let i = 0; i < count; i++) {
        const k5 = i * STRIDE, j = i * 3;
        const x = data[k5], y = data[k5 + 1], seed = data[k5 + 4];
        // 旋转的热气流：左右摆、往上加速
        vel[j] += Math.sin(y * .02 + t * 3 + seed * 6) * 90 * dt * S;
        vel[j + 1] -= 60 * dt * S;
        vel[j] *= .985;
        data[k5] = x + vel[j] * dt;
        data[k5 + 1] = y + vel[j + 1] * dt;
        data[k5 + 2] -= vel[j + 2] * dt;
      }
      // 清掉熄灭的
      let w = 0;
      for (let i = 0; i < count; i++) {
        if (data[i * STRIDE + 2] > 0) {
          if (w !== i) { data.copyWithin(w * STRIDE, i * STRIDE, i * STRIDE + STRIDE); vel.copyWithin(w * 3, i * 3, i * 3 + 3); }
          w++;
        }
      }
      count = w;

      // 画
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(pFire);
      gl.bindVertexArray(vaoFire);
      gl.uniform2f(U(pFire, 'uRes'), cv.width, cv.height);
      gl.uniform1f(U(pFire, 'uDpr'), dpr);
      gl.uniform1f(U(pFire, 'uT'), t);
      gl.uniform2f(U(pFire, 'uC'), C.x, C.y);
      gl.uniform1f(U(pFire, 'uR'), el_t < duration + 50 ? R : maxR * 3);
      gl.uniform4f(U(pFire, 'uPh'), ...ph);
      gl.uniform4f(U(pFire, 'uRect'), rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      gl.uniform1f(U(pFire, 'uAlive'), alive);
      gl.uniform1f(U(pFire, 'uSmoke'), smokeK);
      gl.uniform1f(U(pFire, 'uScale'), S);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (count) {
        gl.useProgram(pSpark);
        gl.bindVertexArray(vaoSpark);
        gl.bindBuffer(gl.ARRAY_BUFFER, sbuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * STRIDE));
        gl.uniform2f(U(pSpark, 'uRes'), innerWidth, innerHeight);
        gl.uniform1f(U(pSpark, 'uDpr'), dpr);
        gl.uniform1f(U(pSpark, 'uT'), t);
        gl.blendFunc(gl.ONE, gl.ONE);           // 火星发光：叠加
        gl.drawArrays(gl.POINTS, 0, count);
      }

      if (!resolved && el_t >= duration) {
        resolved = true;
        el.style.visibility = 'hidden';
        el.style.filter = '';
        done(true);
      }
      if (el_t < duration + tail || count) requestAnimationFrame(frame);
      else { cv.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
    };
    requestAnimationFrame(frame);
  });
}
