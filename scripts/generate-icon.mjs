/**
 * generate-icon.mjs — writes desktop/assets/icon.png (256px) and icon.ico.
 *
 * WHY A GENERATOR: the repo has no rasteriser (no sharp, no ImageMagick), and
 * electron-builder needs a Windows .ico. Drawing the mark in code keeps the icon
 * reproducible and avoids committing an opaque binary nobody can regenerate.
 *
 * The mark is the placeholder hexagon from the header, drawn at 4x and averaged
 * down so the 16px tray size stays legible.
 */
import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'desktop', 'assets');

const COLORS = {
  bgTop: [11, 24, 42],
  bgBottom: [6, 14, 28],
  ring: [0, 217, 255],
  core: [34, 209, 123],
};

const SS = 4; // supersample factor

function hexDistance(px, py, radius, rotation = Math.PI / 6) {
  // Distance from the centre to the boundary of a regular hexagon at that angle.
  let angle = Math.atan2(py, px) - rotation;
  const sector = Math.PI / 3;
  angle = ((angle % sector) + sector) % sector - sector / 2;
  return radius * Math.cos(Math.PI / 6) / Math.cos(angle);
}

function renderRGBA(size) {
  const W = size * SS;
  const out = Buffer.alloc(size * size * 4);
  const cx = W / 2;
  const cy = W / 2;
  const hexRadius = W * 0.34;
  const ringWidth = Math.max(W * 0.075, 1.5 * SS);
  const coreRadius = hexRadius * 0.34;
  const corner = W * 0.16;

  // Accumulate premultiplied colour + alpha over the supersampled grid.
  const acc = new Float64Array(W * W * 4);

  for (let y = 0; y < W; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;

      // Rounded-square background (alpha 1 inside, 0 outside, soft 1px edge)
      const qx = Math.abs(dx) - (W / 2 - corner);
      const qy = Math.abs(dy) - (W / 2 - corner);
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - corner;
      const bgAlpha = Math.min(1, Math.max(0, 0.5 - outside / (1.5 * SS)));

      let r = 0;
      let g = 0;
      let b = 0;
      const a = bgAlpha;

      if (bgAlpha > 0) {
        const t = y / W;
        r = COLORS.bgTop[0] * (1 - t) + COLORS.bgBottom[0] * t;
        g = COLORS.bgTop[1] * (1 - t) + COLORS.bgBottom[1] * t;
        b = COLORS.bgTop[2] * (1 - t) + COLORS.bgBottom[2] * t;

        const d = Math.hypot(dx, dy);
        const boundary = hexDistance(dx, dy, hexRadius);
        const ringDist = Math.abs(d - boundary);

        if (ringDist < ringWidth) {
          const k = (1 - ringDist / ringWidth) * 1;
          r = COLORS.ring[0] * k + r * (1 - k);
          g = COLORS.ring[1] * k + g * (1 - k);
          b = COLORS.ring[2] * k + b * (1 - k);
        }

        if (d < coreRadius) {
          const k = Math.min(1, (coreRadius - d) / (1.5 * SS));
          r = COLORS.core[0] * k + r * (1 - k);
          g = COLORS.core[1] * k + g * (1 - k);
          b = COLORS.core[2] * k + b * (1 - k);
        }
      }

      const i = (y * W + x) * 4;
      acc[i] += r * a;
      acc[i + 1] += g * a;
      acc[i + 2] += b * a;
      acc[i + 3] += a;
    }
  }

  // Box filter SS x SS -> one pixel
  const n = SS * SS;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const i = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          r += acc[i]; g += acc[i + 1]; b += acc[i + 2]; a += acc[i + 3];
        }
      }
      const alpha = a / n;
      const o = (y * size + x) * 4;
      out[o] = alpha > 0 ? Math.round(Math.min(255, r / n / alpha)) : 0;
      out[o + 1] = alpha > 0 ? Math.round(Math.min(255, g / n / alpha)) : 0;
      out[o + 2] = alpha > 0 ? Math.round(Math.min(255, b / n / alpha)) : 0;
      out[o + 3] = Math.round(Math.min(255, alpha * 255));
    }
  }

  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);           // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const entry of entries) {
    const b = Buffer.alloc(16);
    b[0] = entry.size >= 256 ? 0 : entry.size;
    b[1] = entry.size >= 256 ? 0 : entry.size;
    b[2] = 0;  // palette
    b[3] = 0;  // reserved
    b.writeUInt16LE(1, 4);  // planes
    b.writeUInt16LE(32, 6); // bpp
    b.writeUInt32LE(entry.png.length, 8);
    b.writeUInt32LE(offset, 12);
    offset += entry.png.length;
    dir.push(b);
  }

  return Buffer.concat([header, ...dir, ...entries.map((e) => e.png)]);
}

mkdirSync(OUT_DIR, { recursive: true });

const sizes = [16, 24, 32, 48, 64, 128, 256];
const entries = sizes.map((size) => ({ size, png: encodePNG(size, renderRGBA(size)) }));

writeFileSync(join(OUT_DIR, 'icon.png'), entries[entries.length - 1].png);
writeFileSync(join(OUT_DIR, 'icon.ico'), encodeICO(entries));

console.log(`icon.png  256x256  ${entries[entries.length - 1].png.length} bytes`);
console.log(`icon.ico  ${sizes.join('/')}  ${encodeICO(entries).length} bytes`);
