import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function generatePng(size) {
  const width = size;
  const height = size;
  const rawData = [];

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded circle
      if (dist <= radius) {
        // Gradient from Indigo-600 #4f46e5 to Violet-500 #8b5cf6
        const t = (x + y) / (width + height);
        let r = Math.round(79 + (139 - 79) * t);
        let g = Math.round(70 + (92 - 70) * t);
        let b = Math.round(229 + (246 - 229) * t);
        let a = 255;

        // Antialias outer circle edge
        if (dist > radius - 1) {
          a = Math.round(255 * (radius - dist));
        }

        // Draw a download arrow / play symbol
        // Triangle/Arrow pointing down or right: Let's do a stylish download arrow
        const arrowWidth = width * 0.44;
        const shaftWidth = width * 0.16;
        const arrowTop = height * 0.26;
        const arrowMid = height * 0.58;
        const arrowBottom = height * 0.74;

        // Arrow shaft
        const inShaft = (x >= cx - shaftWidth / 2 && x <= cx + shaftWidth / 2 && y >= arrowTop && y <= arrowMid);
        // Arrow head (pointing down)
        const inHead = (y >= arrowMid && y <= arrowBottom && Math.abs(x - cx) <= (arrowWidth / 2) * ((arrowBottom - y) / (arrowBottom - arrowMid)));
        // Base bar
        const barTop = height * 0.78;
        const barBottom = height * 0.84;
        const inBar = (y >= barTop && y <= barBottom && x >= cx - arrowWidth / 2 && x <= cx + arrowWidth / 2);

        if (inShaft || inHead || inBar) {
          // White symbol with bright glow
          r = 255;
          g = 255;
          b = 255;
        }

        rawData.push(r, g, b, a);
      } else if (dist <= radius + 1) {
        // Antialias outer ring
        const a = Math.round(255 * Math.max(0, radius + 1 - dist));
        rawData.push(79, 70, 229, Math.min(255, Math.max(0, a)));
      } else {
        // Transparent
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk("IHDR", ihdr);
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.resolve("public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const pngBuf = generatePng(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated icon: ${filePath} (${size}x${size})`);
}
console.log("All icons generated successfully!");
