# Lava Lamp Experience

A fully interactive, canvas-based lava lamp simulation meant to run anywhere — open locally or publish via GitHub Pages.

---

## What is this?

A single-page web experience that recreates the aesthetic of a classic lava lamp using HTML5 Canvas. Blobs rise, fall, and morph inside a glass vessel with soft glows, glass reflections, and real-time controls.

## Quick Start

1. Clone or download this repository to your machine.
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge).
3. No build tools, no installation, no server required.

## GitHub Pages Publishing

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**.
4. Select the `main` branch and the root folder.
5. Click **Save**. The site will be live within a minute.

Live URL will look like: `https://dresrok.github.io/flisol-ha/`

## Controls

| Control | Description |
|---|---|
| **Brightness / Glow** | Adjusts the intensity of the blob glow |
| **Animation Speed** | Multiplier for blob movement |
| **Blob Count** | Number of blobs inside the lamp (3–25) |
| **Color Palette** | Switch between Sunset, Ocean, Forest, Berry, Gold presets |
| **Restore Defaults** | Resets all controls to factory settings |

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Main page structure and layout |
| `styles.css` | Responsive styles, glass morphism UI, and lamp shape |
| `script.js` | Canvas rendering engine, blob physics, and controls wiring |
| `README.md` | This file |

## Design Notes

- Uses **Canvas 2D** with `screen` compositing for soft additive glow.
- Blobs are procedural — they spawn, rise, sway, and recycle continuously.
- Responsive layout switches from side-by-side (desktop) to stacked (mobile).
- All paths are relative so it works on any host, including GitHub Pages.
- Zero external dependencies — no CDNs, no build step.

## Browser Support

Any browser with modern ES6 and Canvas 2D support (all evergreen browsers).

## Performance Tips

- Lower **Blob Count** if running on older hardware.
- Reduce **Brightness** to ease GPU load on high-DPI displays.

## License

MIT — free to remix and share.
