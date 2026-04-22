/**
 * Lava Lamp Simulation
 * Canvas 2D blob animation with real-time control over brightness, speed,
 * blob count, and colour palette.
 */

(function () {
  'use strict';

  // ─── DOM References ───
  const canvas  = document.getElementById('lampCanvas');
  const ctx     = canvas.getContext('2d');
  const els = {
    brightness: document.getElementById('brightness'),
    speed:      document.getElementById('speed'),
    blobCount:  document.getElementById('blobCount'),
    palette:    document.getElementById('palette'),
    resetBtn:   document.getElementById('resetBtn')
  };

  // ─── Palette Presets ───
  const PALETTES = {
    sunset: { a: {h:18, s:90, l:55}, b: {h:35, s:95, l:65}, bg: '#080510' },
    ocean:  { a: {h:210, s:85, l:55}, b: {h:180, s:90, l:65}, bg: '#050a15' },
    forest: { a: {h:130, s:80, l:50}, b: {h:90, s:85, l:60},  bg: '#051005' },
    berry:  { a: {h:280, s:75, l:55}, b: {h:330, s:80, l:65}, bg: '#100510' },
    gold:   { a: {h:45, s:95, l:55},  b: {h:55, s:90, l:70},  bg: '#111005' }
  };

  // ─── State ───
  let params = {
    brightness: parseFloat(els.brightness.value),
    speed:      parseFloat(els.speed.value),
    blobCount:  parseInt(els.blobCount.value, 10),
    palette:    els.palette.value
  };

  let lastTime = performance.now();
  const blobs  = [];

  // ─── Blob Constructor ───
  function Blob(w, h) {
    this.init(w, h, true);
  }

  Blob.prototype.init = function (w, h, randomY = false) {
    this.radius = (Math.random() * 0.12 + 0.06) * Math.min(w, h);
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : h + this.radius;
    this.vx = (Math.random() - 0.5) * 0.4;           // horizontal drift
    this.vy = -(Math.random() * 0.4 + 0.15);         // upward speed
    this.phase = Math.random() * Math.PI * 2;
    this.freq  = Math.random() * 0.5 + 0.5;
    this.morphSeed = Math.random();
  };

  Blob.prototype.update = function (dt, w, h, speedMult) {
    const s = speedMult * 60 * dt;
    this.x += this.vx * s;
    this.y += this.vy * s;

    // Gentle horizontal sway
    this.phase += this.freq * s * 0.03;
    this.x += Math.sin(this.phase) * 0.3 * s;

    // Wrap / recycle
    if (this.y < -this.radius * 2) {
      this.init(w, h, false);
    }
    if (this.x < -this.radius) this.x = w + this.radius;
    if (this.x > w + this.radius) this.x = -this.radius;
  };

  // ─── Resize / DPR ───
  let W, H, dpr;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.round(rect.width * dpr);
    H = Math.round(rect.height * dpr);
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Blob Manager ───
  function syncBlobs() {
    const target = Math.max(3, Math.min(25, params.blobCount));
    // add
    while (blobs.length < target) blobs.push(new Blob(W, H));
    // remove
    while (blobs.length > target) blobs.pop();
  }
  syncBlobs();

  // ─── Helpers ───
  function paletteColor(which, t) {
    const p = PALETTES[params.palette] || PALETTES.sunset;
    const base = which === 'a' ? p.a : p.b;
    const shift = Math.sin(t * 0.001 + (which === 'a' ? 0 : 2)) * 8;
    return `hsl(${base.h + shift}, ${base.s}%, ${base.l}%)`;
  }

  function glassGradient(w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0.0, 'rgba(255,255,255,0.06)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.02)');
    g.addColorStop(1.0, 'rgba(255,255,255,0.08)');
    return g;
  }

  // ─── Render Loop ───
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta
    lastTime = now;

    const p = PALETTES[params.palette] || PALETTES.sunset;
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    syncBlobs();

    // glow multiplier
    const glow = params.brightness;

    // draw blobs back-to-front for soft overlap feel
    blobs.sort((a, b) => b.y - a.y);

    for (const b of blobs) {
      b.update(dt, W, H, params.speed);

      const t = now + b.morphSeed * 1000;
      const pulse = 1 + Math.sin(t * 0.002) * 0.08;
      const r = b.radius * pulse;

      // radial gradient per blob
      const grad = ctx.createRadialGradient(
        b.x, b.y - r * 0.25, r * 0.15,
        b.x, b.y, r
      );
      const colour = paletteColor((b.morphSeed > 0.5) ? 'a' : 'b', now);
      grad.addColorStop(0.0, colour.replace(/hsl/, 'hsla').replace(/\)/, `,${0.95 * glow})`));
      grad.addColorStop(0.5, colour.replace(/hsl/, 'hsla').replace(/\)/, `,${0.5 * glow})`));
      grad.addColorStop(1.0, colour.replace(/hsl/, 'hsla').replace(/\)/, ',0.0)'));

      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      // slightly squashed circle
      ctx.ellipse(b.x, b.y, r, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // glass reflection overlay
    const gg = glassGradient(W, H);
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W * 0.48, H * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // base cap (bottom)
    ctx.fillStyle = '#1a1a24';
    ctx.beginPath();
    ctx.ellipse(W / 2, H - 8, W * 0.42, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // top cap
    ctx.fillStyle = '#1a1a24';
    ctx.beginPath();
    ctx.ellipse(W / 2, 8, W * 0.38, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(loop);
  }

  // ─── UI Listeners ───
  els.brightness.addEventListener('input', e => { params.brightness = parseFloat(e.target.value); });
  els.speed.addEventListener('input',      e => { params.speed      = parseFloat(e.target.value); });
  els.blobCount.addEventListener('input',  e => { params.blobCount  = parseInt(e.target.value, 10); });
  els.palette.addEventListener('change',   e => { params.palette    = e.target.value; });

  els.resetBtn.addEventListener('click', () => {
    els.brightness.value = 1.0;   params.brightness = 1.0;
    els.speed.value      = 1.0;   params.speed      = 1.0;
    els.blobCount.value  = 10;    params.blobCount  = 10;
    els.palette.value    = 'sunset'; params.palette = 'sunset';
  });

  // start
  requestAnimationFrame(loop);
})();
