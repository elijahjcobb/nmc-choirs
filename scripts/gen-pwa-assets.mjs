// Generates the PWA icon set, Media Session artwork, and Apple splash screens:
// the NMC pine mark (vector paths from components/icon.tsx) rendered white on the
// brand-green tile. Run: node scripts/gen-pwa-assets.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(root, "public");
const GREEN = "#0e6537";
const CANVAS_LIGHT = { r: 242, g: 245, b: 242, alpha: 1 };
const CANVAS_DARK = { r: 13, g: 18, b: 16, alpha: 1 };

// The pine tree paths (in a 220×400 viewBox), extracted from the logo component.
const iconSrc = readFileSync(join(root, "components/icon.tsx"), "utf8");
const PINE_PATHS = [...iconSrc.matchAll(/<path\s+d=\{?"([^"]+)"/g)].map((m) => m[1]);
const PW = 220;
const PH = 400;

function pineGroup(size, pineRatio) {
  const scale = (pineRatio * size) / PH;
  const tx = (size - PW * scale) / 2;
  const ty = (size - PH * scale) / 2;
  const paths = PINE_PATHS.map((d) => `<path fill="#ffffff" d="${d}"/>`).join("");
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">${paths}</g>`;
}

function iconSvg(size, { rounded = true, pineRatio = 0.62 } = {}) {
  const rx = rounded ? Math.round(size * 0.22) : 0;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="${GREEN}"/>` +
      pineGroup(size, pineRatio) +
      `</svg>`,
  );
}

async function writeIcon(name, size, opts) {
  await sharp(iconSvg(size, opts)).png().toFile(join(PUB, name));
  console.log("icon", name, size);
}

async function splash(name, w, h, dark) {
  const bg = dark ? CANVAS_DARK : CANVAS_LIGHT;
  const tileSize = Math.round(Math.min(w, h) * 0.34);
  const tile = await sharp(iconSvg(tileSize, { rounded: true, pineRatio: 0.62 })).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background: bg } })
    .composite([{ input: tile, gravity: "center" }])
    .png()
    .toFile(join(PUB, name));
  console.log("splash", name, `${w}x${h}`, dark ? "dark" : "light");
}

const DEVICES = [
  { w: 828, h: 1792, cw: 414, ch: 896, dpr: 2 },
  { w: 1170, h: 2532, cw: 390, ch: 844, dpr: 3 },
  { w: 1179, h: 2556, cw: 393, ch: 852, dpr: 3 },
  { w: 1290, h: 2796, cw: 430, ch: 932, dpr: 3 },
];

async function main() {
  await writeIcon("icon-16.png", 16, { rounded: false, pineRatio: 0.72 });
  await writeIcon("icon-32.png", 32, { rounded: false, pineRatio: 0.72 });
  await writeIcon("icon-192x192.png", 192);
  await writeIcon("icon-256x256.png", 256);
  await writeIcon("icon-384x384.png", 384);
  await writeIcon("icon-512x512.png", 512);
  await writeIcon("icon-192-maskable.png", 192, { rounded: false, pineRatio: 0.5 });
  await writeIcon("icon-512-maskable.png", 512, { rounded: false, pineRatio: 0.5 });
  await writeIcon("apple-touch-icon.png", 180);
  await writeIcon("artwork-192.png", 192, { rounded: false });
  await writeIcon("artwork-512.png", 512, { rounded: false });

  for (const d of DEVICES) {
    for (const dark of [false, true]) {
      await splash(`splash-${d.w}x${d.h}${dark ? "-dark" : ""}.png`, d.w, d.h, dark);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
