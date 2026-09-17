const fs = require("fs");
const path = require("path");

const WORDMARK =
  "M60.48 0L32.80 0L32.80-21.28L56.48-21.28Q63.20-21.28 67.12-25.04Q71.04-28.80 71.04-34.88Q71.04-38.88 69.28-42Q67.52-45.12 64.24-46.80Q60.96-48.48 56.48-48.48L32.80-48.48L32.80-69.12L54.72-69.12Q60.32-69.12 63.92-71.92Q67.52-74.72 67.52-80.64Q67.52-86.56 63.92-89.36Q60.32-92.16 54.72-92.16L32.80-92.16L32.80-113.44L61.60-113.44Q72.16-113.44 79.92-109.44Q87.68-105.44 91.84-98.72Q96-92 96-83.52Q96-72.16 88.24-64.72Q80.48-57.28 65.76-55.52L65.76-65.12Q82.08-63.20 90.72-54.64Q99.36-46.08 99.36-33.12Q99.36-23.52 94.56-16.08Q89.76-8.64 81.04-4.32Q72.32 0 60.48 0M38.24 0L10.08 0L10.08-113.44L38.24-113.44L38.24 0M136.80 0L108.80 0L108.80-78.24L136.80-78.24L136.80 0M122.72-87.36Q116.48-87.36 112.32-91.60Q108.16-95.84 108.16-102.24Q108.16-108.48 112.32-112.80Q116.48-117.12 122.72-117.12Q129.28-117.12 133.36-112.80Q137.44-108.48 137.44-102.24Q137.44-95.84 133.36-91.60Q129.28-87.36 122.72-87.36M188.32 0L160.48 0L160.48-110.56L188.32-110.56L188.32 0M205.60-55.04L143.20-55.04L143.20-78.24L205.60-78.24L205.60-55.04M250.72 0L222.88 0L222.88-110.56L250.72-110.56L250.72 0M268-55.04L205.60-55.04L205.60-78.24L268-78.24L268-55.04M313.12 1.76Q300.48 1.76 290.64-3.60Q280.80-8.96 275.04-18.32Q269.28-27.68 269.28-39.36Q269.28-51.04 274.96-60.24Q280.64-69.44 290.56-74.80Q300.48-80.16 312.96-80.16Q325.44-80.16 335.28-74.80Q345.12-69.44 350.88-60.24Q356.64-51.04 356.64-39.36Q356.64-27.68 350.96-18.32Q345.28-8.96 335.44-3.60Q325.60 1.76 313.12 1.76M312.96-23.04Q317.60-23.04 321.04-25.04Q324.48-27.04 326.40-30.72Q328.32-34.40 328.32-39.20Q328.32-44 326.32-47.60Q324.32-51.20 320.96-53.20Q317.60-55.20 312.96-55.20Q308.48-55.20 304.96-53.12Q301.44-51.04 299.52-47.44Q297.60-43.84 297.60-39.04Q297.60-34.40 299.52-30.72Q301.44-27.04 304.96-25.04Q308.48-23.04 312.96-23.04M446.72 0L414.72 0L390.08-40.96L414.56-78.24L445.12-78.24L414.72-36.16L415.52-46.40L446.72 0M392.32 0L364.48 0L364.48-116.64L392.32-116.64L392.32 0M531.04 0L499.04 0L482.24-28.96L475.84-32.80L444.96-78.24L477.12-78.24L493.60-50.08L499.68-46.56L531.04 0M473.12 0L443.36 0L475.52-46.24L491.36-29.12L473.12 0M529.44-78.24L498.72-32.80L482.88-49.92L499.68-78.24";

function mark(color) {
  // Eclipse: equal outer diameter. Solid = the business. Ring = the AI.
  // Centers sit one radius apart so each form reaches the other's core —
  // the OS lives in the overlap.
  return `<g>
    <circle cx="38" cy="50" r="24" fill="${color}"/>
    <circle cx="62" cy="50" r="20.5" fill="none" stroke="${color}" stroke-width="7"/>
  </g>`;
}

function svg(w, h, body, label) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
${body}
</svg>
`;
}

const logoDir = path.join(__dirname, "../..");
const selected = __dirname;

fs.writeFileSync(path.join(selected, "mark.svg"), svg(100, 100, `  ${mark("currentColor")}`, "Bittokx").replace(' width="100" height="100"', ""));
fs.writeFileSync(path.join(selected, "mark-ink.svg"), svg(1024, 1024, `  ${mark("#111111")}`, "Bittokx").replace('viewBox="0 0 1024 1024"', 'viewBox="0 0 100 100"'));
fs.writeFileSync(path.join(selected, "mark-white.svg"), svg(1024, 1024, `  ${mark("#FFFFFF")}`, "Bittokx, white").replace('viewBox="0 0 1024 1024"', 'viewBox="0 0 100 100"'));

fs.writeFileSync(
  path.join(logoDir, "bittokx-mark.svg"),
  svg(512, 512, `  <g transform="translate(56 56) scale(4)">${mark("#111111")}</g>`, "Bittokx mark")
);
fs.writeFileSync(
  path.join(logoDir, "bittokx-mark-white.svg"),
  svg(512, 512, `  <g transform="translate(56 56) scale(4)">${mark("#FFFFFF")}</g>`, "Bittokx mark, white")
);
fs.writeFileSync(
  path.join(logoDir, "bittokx-app-icon.svg"),
  svg(
    512,
    512,
    `  <rect width="512" height="512" rx="112" fill="#111111"/>
  <g transform="translate(86 86) scale(3.4)">${mark("#FFFFFF")}</g>`,
    "Bittokx app icon"
  )
);

const lockup = (color) => `
  <g transform="translate(8 16) scale(2.4)">${mark(color)}</g>
  <path transform="translate(256 178)" fill="${color}" d="${WORDMARK}"/>
`;

fs.writeFileSync(path.join(logoDir, "bittokx-logo.svg"), svg(900, 280, lockup("#111111"), "Bittokx logo"));
fs.writeFileSync(path.join(logoDir, "bittokx-logo-white.svg"), svg(900, 280, lockup("#FFFFFF"), "Bittokx logo, white"));
fs.writeFileSync(path.join(selected, "lockup.svg"), svg(900, 280, lockup("#111111"), "Bittokx logo"));
fs.writeFileSync(path.join(selected, "lockup-white.svg"), svg(900, 280, lockup("#FFFFFF"), "Bittokx logo, white"));
fs.writeFileSync(path.join(selected, "app-icon.svg"), fs.readFileSync(path.join(logoDir, "bittokx-app-icon.svg")));

console.log("wrote selected + production svgs");
