/** Local, reproducible photographic collage. No image-generation service is called.
 * Run prepare-cat-cutouts.py first; install sharp in the optional authoring environment.
 * XITANG_SHARP_MODULE may point to an existing sharp package directory.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.XITANG_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const work = path.join(root, '.asset-work');
const target = path.join(root, 'src/assets/xitang/scenes-local');
let seed = 915;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const defs = `<defs>
<linearGradient id="sky" x2=".7" y2="1"><stop stop-color="#a4b8b5"/><stop offset="1" stop-color="#354b49"/></linearGradient>
<linearGradient id="storm" x2=".8" y2="1"><stop stop-color="#162631"/><stop offset=".65" stop-color="#3a4c5d"/><stop offset="1" stop-color="#222d39"/></linearGradient>
<linearGradient id="wood" x2="0" y2="1"><stop stop-color="#a0927b"/><stop offset=".15" stop-color="#72634f"/><stop offset="1" stop-color="#393b35"/></linearGradient>
<linearGradient id="wet" x2="0" y2="1"><stop stop-color="#687976"/><stop offset=".4" stop-color="#89928a"/><stop offset="1" stop-color="#526462"/></linearGradient>
<linearGradient id="canopy" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#edf9f7" stop-opacity=".65"/><stop offset=".45" stop-color="#e0f2f1" stop-opacity=".13"/><stop offset="1" stop-color="#d5e6e3" stop-opacity=".42"/></linearGradient>
<linearGradient id="linen" x2=".6" y2="1"><stop stop-color="#9b8f78"/><stop offset=".4" stop-color="#766b5d"/><stop offset="1" stop-color="#403e38"/></linearGradient>
<linearGradient id="floor" x2=".7" y2="1"><stop stop-color="#dcc8a2"/><stop offset=".55" stop-color="#afaa96"/><stop offset="1" stop-color="#888f87"/></linearGradient>
<radialGradient id="vignette"><stop offset=".25" stop-color="#18231e" stop-opacity="0"/><stop offset="1" stop-color="#14241f" stop-opacity=".35"/></radialGradient>
<radialGradient id="lamp"><stop stop-color="#ffdb93" stop-opacity=".38"/><stop offset="1" stop-color="#ffdb93" stop-opacity="0"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="15"/><feColorMatrix type="saturate" values="0"/></filter>
<clipPath id="outside"><rect width="1536" height="785"/></clipPath>
</defs>`;
const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const line = (x, y, x2, y2, color, width = 1, opacity = 1) =>
  `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
const grain = (opacity = '.045') =>
  `<rect width="1536" height="1024" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode:soft-light"/>`;
function garden(dark = false) {
  let s = rect(0, 0, 1536, 1024, dark ? 'url(#storm)' : 'url(#sky)');
  s += '<g filter="url(#blur)">';
  for (let i = 0; i < 50; i++) {
    const x = random() * 1750 - 100,
      y = 350 + random() * 490;
    s += ellipse(
      x,
      y,
      40 + random() * 120,
      80 + random() * 160,
      dark ? '#172f35' : '#476355',
      `opacity="${0.12 + random() * 0.28}"`,
    );
  }
  return s + '</g>';
}
function rain(count, confined = false) {
  let s = '<g clip-path="url(#outside)">';
  for (let i = 0; i < count; i++) {
    const x = random() * 1600,
      y = random() * 850;
    if (confined && y > 270 && x > 630 && x < 1450) continue;
    const len = 12 + random() * 45;
    s += line(x, y, x - 9, y + len, '#deeeed', 0.6 + random(), 0.08 + random() * 0.2);
  }
  return s + '</g>';
}
function droplets(count) {
  let s = '';
  for (let i = 0; i < count; i++) {
    let x = random() * 1536,
      y = random() * 730,
      r = 1 + random() * 3;
    s += ellipse(x, y, r, r * 1.6, '#dbe8e4', `opacity="${0.1 + random() * 0.24}"`);
    s += line(x - r, y, x - r, y + 4, '#20393e', 0.8, 0.35);
  }
  return s;
}
function boards(y, base) {
  let s = rect(0, y, 1536, 1024 - y, base);
  for (let i = 0; i < 50; i++) {
    let yy = y + random() * (1024 - y);
    s += line(0, yy, 1536, yy - 12, '#e4d4b5', 0.5, 0.09);
  }
  return s;
}
function shadow(x, y, w) {
  return ellipse(x, y, w, w * 0.11, '#111e1c', 'opacity=".48" filter="url(#soft)"');
}
async function cat(name, x, y, w, h, brightness = 1) {
  let p = sharp(path.join(work, 'cutouts', `${name}.png`));
  if (brightness !== 1) p = p.modulate({ brightness, saturation: 0.88 });
  const b = await p.png().toBuffer();
  return `<image href="data:image/png;base64,${b.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"/>`;
}
function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">${defs}${body}${grain()}${rect(0, 0, 1536, 1024, 'url(#vignette)')}</svg>`;
}
async function save(id, body) {
  const svg = wrap(body);
  await fs.writeFile(path.join(work, `${id}.svg`), svg);
  await sharp(Buffer.from(svg))
    .webp({ quality: 91, effort: 5 })
    .toFile(path.join(target, `${id}.webp`));
  console.log(`Composed ${id}`);
}
async function main() {
  await fs.mkdir(target, { recursive: true });
  // Fine rain: a clear canopy is above the ears, and its pole is behind the cat.
  let s = garden() + rain(250, true) + boards(824, 'url(#wet)');
  for (let i = 0; i < 34; i++) {
    let x = random() * 1536,
      y = 855 + random() * 160;
    if (x > 740 && x < 1390) continue;
    s += ellipse(
      x,
      y,
      5 + random() * 23,
      2 + random() * 3,
      'none',
      'stroke="#ccdfda" stroke-width="1" opacity=".25"',
    );
  }
  s += ellipse(1085, 935, 300, 60, '#5c6963', 'opacity=".7"') + shadow(1080, 939, 245);
  s +=
    '<path d="M781 233 L781 874 Q781 935 728 918" fill="none" stroke="#8caaa6" stroke-width="9"/>';
  s += await cat('sitting', 794, 295, 555, 650);
  s +=
    '<path d="M576 294 Q665 96 1009 85 Q1352 108 1458 302 Q1352 270 1272 310 Q1170 271 1061 309 Q951 273 835 307 Q702 270 576 294Z" fill="url(#canopy)" stroke="#deeeeb" stroke-width="3" opacity=".9"/>';
  s +=
    '<g fill="none" stroke="#e3efeb" stroke-width="2" opacity=".6"><path d="M1009 85 Q861 107 835 307M1009 85 Q1050 135 1061 309M1009 85 Q1190 138 1272 310M1009 85L1009 64"/></g>';
  for (let i = 0; i < 44; i++) {
    let x = 660 + random() * 690,
      y = 157 + random() * 103;
    s += ellipse(x, y, 1.5, 2.7, '#e9f4ee', 'opacity=".65"');
  }
  await save('rain', s);
  // Heavy rain: droplets and streaks remain outside; the sill and cat are dry.
  s = garden(true) + rain(700) + droplets(180);
  s +=
    rect(0, 0, 1536, 75, '#292f2d') +
    rect(500, 40, 24, 756, '#5d6258') +
    rect(0, 753, 1536, 25, '#292f2d');
  s += boards(778, 'url(#wood)') + shadow(1100, 900, 265);
  s += await cat('shelter', 802, 316, 585, 591, 1.08);
  s +=
    rect(1342, 0, 194, 1024, 'url(#wood)') +
    rect(1335, 0, 9, 1024, '#c0b299') +
    ellipse(1520, 470, 620, 700, 'url(#lamp)');
  await save('heavy-rain', s);
  // Thunderstorm: a close protective bed, with lightning confined to the distant window.
  s = garden(true) + rain(370) + droplets(80);
  s +=
    '<path d="M398 5L335 124L386 112L290 289L323 178L280 192L343 37" fill="#d7edf1" opacity=".8"/><path d="M398 5L335 124L386 112L290 289" fill="none" stroke="#d7edf1" stroke-width="24" opacity=".18" filter="url(#soft)"/>';
  s += rect(555, 0, 50, 805, '#363d3b') + boards(795, 'url(#wood)');
  s += shadow(1080, 949, 390);
  s +=
    '<path d="M672 921 Q642 353 828 254 Q1071 113 1320 320 Q1470 490 1507 939Z" fill="url(#linen)"/><path d="M753 893 Q716 426 882 343 Q1086 252 1272 407 Q1385 553 1404 898Z" fill="#242b2b"/>';
  s += await cat('alert', 779, 305, 628, 573, 0.93);
  s +=
    '<path d="M674 857 Q784 914 1073 900 Q1315 887 1452 825 L1503 958 Q1081 1050 683 970Z" fill="url(#linen)"/><path d="M689 866 Q1078 972 1444 843" fill="none" stroke="#ac9e85" stroke-width="9" opacity=".55"/>';
  s += ellipse(1500, 610, 540, 620, 'url(#lamp)');
  await save('thunderstorm', s);
  // Hot day: the original sideways lounge, cool tile shade, water and a floor fan.
  s = rect(0, 0, 1536, 1024, 'url(#floor)');
  s +=
    '<path d="M0 0H1536V211L520 1024H0Z" fill="#fce5af" opacity=".55"/><path d="M0 80L1096 0L0 854M0 372L1525 0" fill="none" stroke="#655b4e" stroke-width="52" opacity=".16" filter="url(#soft)"/>';
  for (let i = 0; i < 5; i++) s += line(0, 220 + i * 200, 1536, 80 + i * 205, '#625f54', 2, 0.27);
  for (let i = 0; i < 6; i++) s += line(i * 370 - 350, 0, i * 500 - 100, 1024, '#625f54', 2, 0.22);
  s +=
    shadow(1030, 861, 410) +
    ellipse(1045, 754, 498, 210, '#687976', 'opacity=".15" filter="url(#blur)"');
  s += await cat('hot', 608, 418, 892, 461);
  // Freestanding fan is deliberately beside the cat, never over the face.
  s +=
    shadow(390, 763, 137) +
    rect(359, 434, 39, 278, '#949b92', 'rx="14"') +
    ellipse(378, 728, 116, 27, '#888f85');
  s += ellipse(378, 343, 158, 166, '#a3aca1', 'stroke="#d2d7c7" stroke-width="10"');
  for (let i = 0; i < 3; i++)
    s += `<path d="M378 343 C296 259 326 174 414 233 Q481 281 378 343" fill="#d5d9c9" opacity=".6" transform="rotate(${i * 120} 378 343)"/>`;
  for (let r = 30; r < 155; r += 17)
    s += ellipse(378, 343, r, r * 1.045, 'none', 'stroke="#65756c" stroke-width="2" opacity=".5"');
  for (let i = 0; i < 16; i++) {
    let a = (i * Math.PI) / 8;
    s += line(378, 343, 378 + 153 * Math.cos(a), 343 + 160 * Math.sin(a), '#647268', 1, 0.4);
  }
  s += ellipse(378, 343, 24, 24, '#737e71');
  s +=
    shadow(558, 948, 84) +
    ellipse(558, 930, 81, 27, '#d4d7c9') +
    ellipse(558, 920, 81, 24, '#e4e6d7') +
    ellipse(558, 921, 64, 16, '#819991') +
    line(528, 916, 579, 916, '#e7f1de', 2, 0.6);
  await save('hot', s);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
