# Lava Lamp Experience — V2 (by kimi-k2.6)

A fully interactive, canvas-based lava lamp simulation meant to run anywhere — open locally or publish via GitHub Pages.

## What's New in V2

- **Classic lava lamp silhouette** — iconic thin vessel with chrome top and base
- **Heat-driven physics** — blobs rise when hot, cool, then sink; stretch and deform as they move
- **Custom colours** — built-in palette presets plus a native colour picker for your own combos
- **More responsive layout** across desktop and mobile

---

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
| **Heat / Convection Speed** | Thermal cycle intensity — higher = faster heat/cool and more energetic rising/sinking |
| **Blob Count** | Number of blobs inside the lamp (3–25) |
| **Color Palette** | Switch between Sunset, Ocean, Forest, Berry, Gold presets, or choose **Custom…** |
| **Custom Colors** (when Custom selected) | Choose your own primary and secondary blob colours |
| **Restore Defaults** | Resets all controls to factory settings |

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Main page structure, lamp hardware chrome, and layout |
| `styles.css` | Responsive styles, glass morphism UI, classic lamp silhouette |
| `script.js` | Canvas rendering engine, heat/buoyancy physics, blob merging/stretching, controls |
| `README.md` | This file |

## Design Notes

- Uses **Canvas 2D** with `screen` compositing for soft additive glow.
- Blobs model simple thermal states: heat at the bottom → rise and stretch → cool at the top → sink and contract.
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
