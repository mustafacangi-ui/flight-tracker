import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1d4ed8"/>
      <stop offset="100%" style="stop-color:#020817"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <path fill="#ffffff" d="M96 288h64l96-160h64l-32 160h80l32-48h48l-16 64 16 64h-48l-32-48h-80l32 160h-64L160 288H96v-64z" opacity="0.95"/>
</svg>`;

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true });
  const buf = Buffer.from(svg);

  await sharp(buf).png().resize(192, 192).toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(buf).png().resize(512, 512).toFile(path.join(iconsDir, "icon-512.png"));
  await sharp(buf).png().resize(180, 180).toFile(path.join(iconsDir, "apple-touch-icon.png"));

  console.log("Wrote PNG icons to public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
