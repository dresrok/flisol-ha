/**
 * Lava Lamp Simulation V2
 * Canvas 2D with metaball rendering for organic lava shapes
 */

(function () {
  'use strict';

  // ─── DOM References ───
  const canvas  = document.getElementById('lampCanvas');
  const ctx     = canvas.getContext('2d');
  const els = {
    brightness:  document.getElementById('brightness'),
    speed:       document.getElementById('speed'),
    blobCount:   document.getElementById('blobCount'),
    palette:     document.getElementById('palette'),
    customColorA:  document.getElementById('customColorA'),
    customColorB:  document.getElementById('customColorB'),
    customColorWrap: document.getElementById('customColorWrap'),
    resetBtn:    document.getElementById('resetBtn')
  };

  // ─── Palette Presets ───
  const PALETTES = {
    sunset: { a: hsl(18,90,62),  b: hsl(35,95,68),  bg: '#080510' },
    ocean:  { a: hsl(210,85,60), b: hsl(180,90,65), bg: '#050a15' },
    forest: { a: hsl(130,80,55), b: hsl(90,85,60),  bg: '#051005' },
    berry:  { a: hsl(280,75,60), b: hsl(330,80,65), bg: '#100510' },
    gold:   { a: hsl(45,95,62),  b: hsl(55,90,72),  bg: '#111005' },
    ivory:  { a: hsl(42,25,85), b: hsl(40,20,92),  bg: '#0a0908' }
  };

  function hsl(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  let customPalette = null;

  // ─── State ───
  let params = {
    brightness:  parseFloat(els.brightness.value),
    speed:       parseFloat(els.speed.value),
    blobCount:   parseInt(els.blobCount.value, 10),
    palette:     els.palette.value,
    customColorA: els.customColorA.value,
    customColorB: els.customColorB.value
  };

  let lastTime = performance.now();
  const blobs  = [];

  // ─── Metaball constants ───
  const MARGIN_X = 0.06;
  const MARGIN_Y = 0.05;
  const BLOB_MIN_R = 0.06;
  const BLOB_MAX_R = 0.14;
  const BASE_POOL_HEIGHT = 0.08;

  // ─── Blob ───
  function Blob(w, h) {
    this.init(w, h, true);
  }

  Blob.prototype.init = function (w, h, randomY) {
    const minDim = Math.min(w, h);
    this.baseR = (Math.random() * (BLOB_MAX_R - BLOB_MIN_R) + BLOB_MIN_R) * minDim;
    this.r = this.baseR;
    this.x = (0.35 + Math.random() * 0.3) * w;
    this.y = randomY
      ? (MARGIN_Y + Math.random() * (1 - 2 * MARGIN_Y - BASE_POOL_HEIGHT)) * h
      : h - (MARGIN_Y + BASE_POOL_HEIGHT * 0.3) * h;
    this.vx = 0;
    this.vy = 0;
    this.temp = randomY ? Math.random() * 0.5 : 0.2 + Math.random() * 0.3;
    this.phase = Math.random() * Math.PI * 2;
    this.freq  = Math.random() * 0.3 + 0.25;
    this.stretchY = 1.0;
    this.stretchX = 1.0;
  };

  Blob.prototype.update = function (dt, w, h, speedMult) {
    const s = speedMult;
    const my = MARGIN_Y * h;
    const mx = MARGIN_X * w;
    const innerH = h - 2 * my - (BASE_POOL_HEIGHT * h);

    const normY = Math.max(0, Math.min(1, (this.y - my) / innerH));
    const target = (1 - normY) * 0.85 + 0.1;
    this.temp += (target - this.temp) * 0.8 * dt * s;

    const buoyancy = (this.temp - 0.45) * 3.0;
    this.vy += buoyancy * dt * s;
    this.vy *= (1 - 0.5 * dt);

    this.phase += this.freq * dt * s;
    const drift = Math.sin(this.phase) * (0.1 + this.temp * 0.15);
    this.vx += drift * dt * s;
    this.vx *= (1 - 0.4 * dt);

    this.x += this.vx * s;
    this.y += this.vy * s;

    const velY = Math.abs(this.vy);
    const ty = 1.0 + velY * 0.35;
    const tx = 1.0 / Math.sqrt(Math.max(1.05, ty));
    this.stretchY += (ty - this.stretchY) * 4 * dt;
    this.stretchX += (tx - this.stretchX) * 4 * dt;

    // Walls
    if (this.x < mx + this.r)     { this.x = mx + this.r;     this.vx =  Math.abs(this.vx) * 0.3; }
    if (this.x > w - mx - this.r)  { this.x = w - mx - this.r;  this.vx = -Math.abs(this.vx) * 0.3; }

    // Bottom
    if (this.y > h - my - this.r) {
      this.y = h - my - this.r;
      this.vy = -Math.abs(this.vy) * 0.2;
      this.temp = Math.min(this.temp + 0.15, 0.85);
    }

    // Top
    if (this.y < my + this.r * 0.4) {
      if (this.temp < 0.28) {
        this.init(w, h, false);
      } else {
        this.y = my + this.r * 0.4;
        this.vy = Math.abs(this.vy) * 0.12;
        this.temp *= 0.88;
      }
    }

    const pulse = 1.0 + (this.temp - 0.5) * 0.08;
    this.r = this.baseR * pulse;
  };

  // ─── Resize / DPR ───
  let W, H, dpr;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(Math.round(rect.width * dpr), 1);
    H = Math.max(Math.round(rect.height * dpr), 1);
    canvas.width = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Blob Manager ───
  function syncBlobs() {
    const target = Math.max(4, Math.min(20, params.blobCount));
    while (blobs.length < target) blobs.push(new Blob(W, H));
    while (blobs.length > target) blobs.pop();
  }
  syncBlobs();

  // ─── Palette helpers ───
  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      switch (mx) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function buildCustom(aHex, bHex) {
    const a = hexToHsl(aHex), b = hexToHsl(bHex || aHex);
    return {
      a: hsl(a.h,   Math.min(95, a.s + 5),  Math.max(40, a.l)),
      b: hsl(b.h,   Math.min(95, b.s + 5),  Math.min(72, b.l + 10)),
      bg: `hsl(${a.h}, ${Math.max(15, a.s * 0.2)}%, ${Math.max(4, a.l * 0.08)}%)`
    };
  }

  function palette(which) {
    const p = (params.palette === 'custom' && customPalette)
      ? customPalette
      : (PALETTES[params.palette] || PALETTES.sunset);
    return which === 'a' ? p.a : p.b;
  }

  // Extract numeric HSL parts for shading
  function parseHsl(str) {
    const m = str.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    return m ? { h: +m[1], s: +m[2], l: +m[3] } : { h: 25, s: 90, l: 60 };
  }

  // ─── Render ───
  let dt;

  function loop(now) {
    dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const p = (params.palette === 'custom' && customPalette)
      ? customPalette
      : (PALETTES[params.palette] || PALETTES.sunset);
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    syncBlobs();
    const glow = params.brightness;
    const sMult = params.speed;

    for (const b of blobs) b.update(dt, W, H, sMult);

    // Attraction pass for organic merging
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const a = blobs[i], b = blobs[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const thr = (a.r + b.r) * 1.3;
        if (dist < thr && dist > 0.1) {
          const pull = 0.2 * dt;
          a.x -= dx * pull * 0.5; a.y -= dy * pull * 0.5;
          b.x += dx * pull * 0.5; b.y += dy * pull * 0.5;
          const avg = (a.temp + b.temp) * 0.5;
          a.temp = avg; b.temp = avg;
        }
      }
    }

    blobs.sort((a, b) => b.y - a.y);

    // ─── Draw each blob as a metaball with internal glow ───
    for (const b of blobs) {
      const colA = parseHsl(palette('a'));
      const colB = parseHsl(palette('b'));
      const color = b.morphSeed > 0.5
        ? `hsl(${colA.h}, ${colA.s}%, ${colA.l}%)`
        : `hsl(${colB.h}, ${colB.s}%, ${colB.l}%)`;
      const hot = b.temp > 0.55;

      // Outer glow
      const og = ctx.createRadialGradient(
        b.x, b.y, 0,
        b.x, b.y, b.r * b.stretchX * 2.2
      );
      og.addColorStop(0.0, color.replace('hsl', 'hsla').replace(')', `,${0.45 * glow})`));
      og.addColorStop(0.5, color.replace('hsl', 'hsla').replace(')', `,${0.12 * glow})`));
      og.addColorStop(1.0, color.replace('hsl', 'hsla').replace(')', ',0.0)'));

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * b.stretchX * 2.2, b.r * b.stretchY * 2.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Blob core (solid colour)
      const cg = ctx.createRadialGradient(
        b.x, b.y - b.r * 0.15, 0,
        b.x, b.y, b.r
      );
      const alpha1 = (hot ? 0.95 : 0.9) * glow;
      cg.addColorStop(0.0, color.replace('hsl', 'hsla').replace(')', `,${alpha1})`));
      cg.addColorStop(0.55, color.replace('hsl', 'hsla').replace(')', `,${0.5 * glow})`));
      cg.addColorStop(1.0, color.replace('hsl', 'hsla').replace(')', `,${0.15 * glow})`));

      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(
        b.x, b.y,
        b.r * b.stretchX,
        b.r * b.stretchY,
        b.vx * 0.1,
        0, Math.PI * 2
      );
      ctx.fill();

      // Hot bright core
      if (hot) {
        ctx.fillStyle = color.replace('hsl', 'hsla').replace(')', `,${0.35 * glow})`);
        ctx.beginPath();
        ctx.ellipse(b.x, b.y - b.r * 0.1, b.r * 0.3, b.r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Base Pool of lava at the bottom ───
    const col = parseHsl(palette('a'));
    const poolH = BASE_POOL_HEIGHT * H;
    const poolGrad = ctx.createLinearGradient(0, H - poolH * 1.5, 0, H);
    poolGrad.addColorStop(0.0, `hsla(${col.h}, ${col.s}%, ${col.l - 10}%, ${0.0})`);
    poolGrad.addColorStop(0.4, `hsla(${col.h}, ${col.s}%, ${col.l - 5}%, ${0.3 * glow})`);
    poolGrad.addColorStop(0.7, `hsla(${col.h}, ${col.s}%, ${col.l}%, ${0.7 * glow})`);
    poolGrad.addColorStop(1.0, `hsla(${col.h}, ${col.s}%, ${col.l + 5}%, ${0.9 * glow})`);

    ctx.fillStyle = poolGrad;
    ctx.fillRect(MARGIN_X * W, H - poolH, W - 2 * MARGIN_X * W, poolH);

    // Pool top edge
    ctx.strokeStyle = `hsla(${col.h}, ${col.s}%, ${col.l + 15}%, ${0.5 * glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN_X * W, H - poolH);
    ctx.lineTo(W - MARGIN_X * W, H - poolH);
    ctx.stroke();

    // ─── Glass edge glow ───
    const edge = ctx.createLinearGradient(0, 0, W, 0);
    edge.addColorStop(0.0, 'rgba(255,255,255,0.05)');
    edge.addColorStop(0.06, 'rgba(255,255,255,0.01)');
    edge.addColorStop(0.94, 'rgba(255,255,255,0.01)');
    edge.addColorStop(1.0, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);

    // Side highlight
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.beginPath();
    ctx.ellipse(W * 0.32, H * 0.38, W * 0.04, H * 0.14, -0.18, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(loop);
  }

  // ─── UI wiring ───
  els.brightness.addEventListener('input', e => { params.brightness = parseFloat(e.target.value); });
  els.speed.addEventListener('input', e => { params.speed = parseFloat(e.target.value); });
  els.blobCount.addEventListener('input', e => { params.blobCount = parseInt(e.target.value, 10); });

  els.palette.addEventListener('change', e => {
    params.palette = e.target.value;
    if (params.palette === 'custom') {
      customPalette = buildCustom(params.customColorA, params.customColorB);
      els.customColorWrap.classList.add('visible');
    } else {
      els.customColorWrap.classList.remove('visible');
      customPalette = null;
    }
  });
  els.customColorA.addEventListener('input', e => {
    params.customColorA = e.target.value;
    if (params.palette === 'custom') customPalette = buildCustom(params.customColorA, params.customColorB);
  });
  els.customColorB.addEventListener('input', e => {
    params.customColorB = e.target.value;
    if (params.palette === 'custom') customPalette = buildCustom(params.customColorA, params.customColorB);
  });

  els.resetBtn.addEventListener('click', () => {
    els.brightness.value    = 1.2;    params.brightness    = 1.2;
    els.speed.value         = 1.0;    params.speed         = 1.0;
    els.blobCount.value      = 10;    params.blobCount      = 10;
    els.palette.value        = 'sunset'; params.palette   = 'sunset';
    els.customColorA.value  = '#ff6633'; params.customColorA = '#ff6633';
    els.customColorB.value  = '#ffcc00'; params.customColorB = '#ffcc00';
    els.customColorWrap.classList.remove('visible');
    customPalette = null;
  });

  requestAnimationFrame(loop);
})();
