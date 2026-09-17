const fs = require("fs");
const path = require("path");

const dir = __dirname;

const C = {
  void: "#0A0814",
  dusk: "#141022",
  star: "#F6F0E4",
  solar: "#FF8A3D",
  corona: "#FFC56A",
  aurora: "#3EE6C8",
  nebula: "#7B5CFF",
  plasma: "#FF4F9A",
  ice: "#6BA6FF",
};

function svg(w, h, body, label) {
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
${body}
</svg>
`;
}

function markBox(inner) {
  return svg(1024, 1024, inner, "mark").replace(
    'viewBox="0 0 1024 1024"',
    'viewBox="0 0 100 100"'
  );
}

const sparkPath =
  "M50 8C51.6 42 62 48.4 92 50C62 51.6 51.6 62 50 92C48.4 62 38 51.6 8 50C38 48.4 48.4 42 50 8Z";

function spark(fill) {
  return `  <path fill="${fill}" d="${sparkPath}"/>`;
}

function halo(core, orbit, moon) {
  return `  <ellipse cx="50" cy="50" rx="40" ry="14.5" fill="none" stroke="${orbit}" stroke-width="3.4" transform="rotate(-26 50 50)"/>
  <rect x="34" y="34" width="32" height="32" rx="9" fill="${core}"/>
  <circle cx="86" cy="33" r="4.8" fill="${moon}"/>`;
}

function axis(ring, pole) {
  return `  <ellipse cx="50" cy="50" rx="36" ry="13" fill="none" stroke="${ring}" stroke-width="3.3"/>
  <path fill="${pole}" d="M50 6C51.2 41 55.5 46.5 62 50C55.5 53.5 51.2 59 50 94C48.8 59 44.5 53.5 38 50C44.5 46.5 48.8 41 50 6Z"/>`;
}

function well(core, r1, r2, r3) {
  return `  <circle cx="50" cy="50" r="36" fill="none" stroke="${r3}" stroke-width="1.6"/>
  <circle cx="50" cy="50" r="26" fill="none" stroke="${r2}" stroke-width="2.3"/>
  <circle cx="50" cy="50" r="16" fill="none" stroke="${r1}" stroke-width="3"/>
  <path fill="${core}" transform="translate(50 50) scale(0.28) translate(-50 -50)" d="${sparkPath}"/>`;
}

function drift(head, tail) {
  return `  <path fill="none" stroke="${tail}" stroke-width="5.5" stroke-linecap="round" d="M18 78C28 62 40 50 54 44"/>
  <path fill="none" stroke="${tail}" stroke-width="3.2" stroke-linecap="round" opacity="0.5" d="M16 68C26 56 40 46 52 42"/>
  <path fill="${head}" transform="translate(22 8) scale(0.52)" d="${sparkPath}"/>`;
}

function corona(ring, starFill) {
  return `  <circle cx="50" cy="50" r="30" fill="none" stroke="${ring}" stroke-width="6"/>
  <path fill="${starFill}" transform="translate(50 50) scale(0.38) translate(-50 -50)" d="${sparkPath}"/>`;
}

const marks = [
  { id: "01-spark", name: "Spark", ink: spark("currentColor"), color: spark(C.star) },
  { id: "02-halo", name: "Halo", ink: halo("currentColor", "currentColor", "currentColor"), color: halo(C.solar, C.aurora, C.star) },
  { id: "03-axis", name: "Axis", ink: axis("currentColor", "currentColor"), color: axis(C.ice, C.star) },
  { id: "04-well", name: "Well", ink: well("currentColor", "currentColor", "currentColor", "currentColor"), color: well(C.corona, C.solar, C.nebula, C.ice) },
  { id: "05-drift", name: "Drift", ink: drift("currentColor", "currentColor"), color: drift(C.star, C.plasma) },
  { id: "06-corona", name: "Corona", ink: corona("currentColor", "currentColor"), color: corona(C.solar, C.star) },
];

for (const m of marks) {
  fs.writeFileSync(path.join(dir, `${m.id}.svg`), markBox(m.ink).replace('aria-label="mark"', `aria-label="${m.name}"`));
  fs.writeFileSync(
    path.join(dir, `${m.id}-color.svg`),
    markBox(m.color).replace('aria-label="mark"', `aria-label="${m.name} color"`)
  );
  const icon = svg(
    512,
    512,
    `  <rect width="512" height="512" rx="112" fill="${C.void}"/>
  <g transform="translate(56 56) scale(4)">${m.color}</g>`,
    `${m.name} app icon`
  );
  fs.writeFileSync(path.join(dir, `${m.id}-icon.svg`), icon);
}

fs.writeFileSync(
  path.join(dir, "palette.json"),
  JSON.stringify(C, null, 2) + "\n"
);

console.log("wrote cosmos marks");
