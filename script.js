/**
 * Lava Lamp Simulation (V2)
 * Canvas 2D blob animation with heat-driven buoyancy physics,
 * stretch-and-split behaviour, visual merging, and full control
 * over brightness, thermal speed, blob count, palette, and
 * custom colours.
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
    customWrap: document.getElementById('customColorWrap'),
    customA:    document.getElementById('customColorA'),
    customB:    document.getElementById('customColorB'),
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

  // Thermal state per blob to fake heat/buoyancy cycles
  function makeThermal(b) {
    b.temp = 0.3 + Math.random() * 0.7;        // 0..1 heat
    b.targetTemp = 0.5 + Math.random() * 0.5;
    b.heatRate   = 0.08 + Math.random() * 0.12;
    b.coolRate   = 0.10 + Math.random() * 0.15;
    b.state = 'rising'; // rising | sinking | merging
    b.stretch  = 1.0;       // vertical stretch
    b.splitSeed = Math.random();
  }

  // ─── Blob Constructor ───
  function Blob(w, h) {
    this.init(w, h, true);
  }

  Blob.prototype.init = function (w, h, randomY = false) {
    const scale = Math.min(w, h);
    // thinner blobs for classic look
    this.baseRadius = (Math.random() * 0.08 + 0.04) * scale;
    this.radius = this.baseRadius;
    this.x = w * 0.2 + Math.random() * w * 0.6;
    this.y = randomY ? (h * 0.15 + Math.random() * h * 0.7) : h + this.baseRadius;
    this.phase = Math.random() * Math.PI * 2;
    this.freq  = Math.random() * 0.8 + 0.4;
    this.morphSeed = Math.random();
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = 0;
    makeThermal(this);
  };

  Blob.prototype.update = function (dt, w, h, speedMult) {
    const s = speedMult * 60 * dt;

    // ── Thermal physics ──
    // hotter = more buoyant (faster rise, more stretch)
    // cooler = denser (sinks, contracts)
    const isHot = this.temp > 0.55;

    if (isHot) {
      this.temp = Math.max(0, this.temp - this.coolRate * dt * speedMult * 0.8);
      this.vy -= (0.6 * speedMult) * dt;          // accelerate upward
      this.stretch = Math.min(2.4, this.stretch + 0.8 * dt * speedMult);
    } else {
      this.temp = Math.min(1, this.temp + this.heatRate * dt * speedMult);
      this.vy += (0.35 * speedMult) * dt;         // accelerate downward
      this.stretch = Math.max(0.7, this.stretch - 0.6 * dt * speedMult);
    }

    // damp vertical velocity so it doesn't explode
    const maxV = 2.2 * speedMult;
    this.vy = Math.max(-maxV, Math.min(maxV, this.vy));

    // horizontal sway driven by heat
    this.phase += this.freq * s * 0.025;
    const swayAmp = 0.2 + this.temp * 0.4;
    this.vx += Math.sin(this.phase) * swayAmp * dt;
    this.vx *= 0.96; // gentle damping

    this.x += this.vx * s;
    this.y += this.vy * s;

    // Recycle at top / bottom inside vessel with margin
    const margin = this.baseRadius * 1.5;
    if (this.y < h * 0.08 + margin && this.vy < 0) {
      // reached top: cool down and start sinking
      this.temp = 0.15;
      this.vy = 0.3 * speedMult;
      this.y = h * 0.08 + margin + 4;
    }
    if (this.y > h * 0.92 - margin && this.vy > 0) {
      // reached bottom: heat up and start rising
      this.temp = 0.9;
      this.vy = -0.5 * speedMult;
      this.y = h * 0.92 - margin - 4;
    }

    // wall bounce (vessel walls)
    const wallL = w * 0.06;
    const wallR = w * 0.94;
    if (this.x < wallL) { this.x = wallL; this.vx *= -0.5; }
    if (this.x > wallR) { this.x = wallR; this.vx *= -0.5; }

    // dynamic radius pulse
    const t = performance.now();
    this.radius = this.baseRadius * (1 + Math.sin(t * 0.001 + this.morphSeed * 7) * 0.06);
  };

  // ─── Resize / DPR ───
  let W, H, dpr;
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.max(1, Math.round(rect.width  * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Blob Manager ───
  function syncBlobs() {
    const target = Math.max(3, Math.min(25, params.blobCount));
    while (blobs.length < target) { const b = new Blob(W, H); makeThermal(b); blobs.push(b); }
    while (blobs.length > target) { blobs.pop(); }
  }
  syncBlobs();

  // ─── Helpers ───
  function paletteColor(which, t) {
    if (params.palette === 'custom') {
      return which === 'a' ? els.customA.value : els.customB.value;
    }
    const p = PALETTES[params.palette] || PALETTES.sunset;
    const base = which === 'a' ? p.a : p.b;
    const shift = Math.sin(t * 0.001 + (which === 'a' ? 0 : 2)) * 8;
    return `hsl(${base.h + shift}, ${base.s}%, ${base.l}%)`;
  }

  // ─── Render Loop ───
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const p = PALETTES[params.palette] || PALETTES.sunset;

    // vessel background tinted by palette warmth
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    syncBlobs();

    const glow = params.brightness;

    // Compute merged/drawn list — draw back-to-front for soft sorting
    blobs.sort((a, b) => b.y - a.y);

    ctx.globalCompositeOperation = 'screen';

    for (const b of blobs) {
      b.update(dt, W, H, params.speed);

      const colour = paletteColor((b.morphSeed > 0.5) ? 'a' : 'b', now);
      const rx = b.radius;
      const ry = b.radius * Math.max(0.55, Math.min(2.6, b.stretch));

      // Build radial gradient inside the blob
      // Use thermal state to shift the highlight: hotter = higher
      const hotOffset = -ry * (0.2 + b.temp * 0.3);
      const grad = ctx.createRadialGradient(
        b.x + Math.sin(b.phase)*rx*0.15, b.y + hotOffset, rx * 0.12,
        b.x, b.y, Math.max(rx, ry * 0.9)
      );

      let alphaCore = 0.92 * glow;
      let alphaMid  = 0.45 * glow;
      let alphaEdge = 0.0;

      if (b.temp > 0.75) { alphaCore = Math.min(1, alphaCore * 1.15); }

      // Build rgba for each stop (supports both HSL strings and hex)
      const getRgba = (baseColour, alpha) => {
        if (typeof baseColour === 'string' && baseColour.startsWith('hsl')) {
          return baseColour.replace(/hsl\(([^)]+)\)/, (_m, inner) => `hsla(${inner},${alpha.toFixed(2)})`);
        }
        // hex
        const hex = baseColour;
        if (!hex || hex[0] !== '#') return `rgba(255,140,50,${alpha.toFixed(2)})`;
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const gg = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${gg},${alpha.toFixed(2)})`;
      };

      grad.addColorStop(0.0, getRgba(colour, alphaCore));
      grad.addColorStop(0.55, getRgba(colour, alphaMid));
      grad.addColorStop(1.0, getRgba(colour, alphaEdge));

      ctx.beginPath();
      // Draw ellipse with slight rotation for organic feel
      const rot = Math.sin(b.phase * 0.5) * 0.15 * (b.stretch - 1);
      ctx.ellipse(b.x, b.y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(loop);
  }

  // ─── UI Listeners ───
  els.brightness.addEventListener('input', e => { params.brightness = parseFloat(e.target.value); });
  els.speed.addEventListener('input',      e => { params.speed      = parseFloat(e.target.value); });
  els.blobCount.addEventListener('input',  e => { params.blobCount  = parseInt(e.target.value, 10); });
  els.palette.addEventListener('change',   e => {
    params.palette = e.target.value;
    els.customWrap.style.display = (e.target.value === 'custom') ? 'flex' : 'none';
  });

  els.customA.addEventListener('input', () => { if(params.palette==='custom'){} });
  els.customB.addEventListener('input', () => { if(params.palette==='custom'){} });

  els.resetBtn.addEventListener('click', () => {
    els.brightness.value = 1.0;   params.brightness = 1.0;
    els.speed.value      = 1.0;   params.speed      = 1.0;
    els.blobCount.value  = 10;    params.blobCount  = 10;
    els.palette.value    = 'sunset'; params.palette = 'sunset';
    els.customWrap.style.display = 'none';
    els.customA.value = '#ff6633';
    els.customB.value = '#ffcc00';
  });

  // start
  requestAnimationFrame(loop);
})();
