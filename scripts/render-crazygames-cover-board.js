const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    sourceDir: '',
    outFile: ''
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--source-dir' && next) {
      args.sourceDir = next;
      index += 1;
      continue;
    }
    if (token === '--out-file' && next) {
      args.outFile = next;
      index += 1;
      continue;
    }
  }
  return args;
}

function getLatestMarketingDir(repoRoot) {
  const outputRoot = path.join(repoRoot, 'output');
  const dirs = fs
    .readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('marketing-captures-'))
    .map((entry) => {
      const fullPath = path.join(outputRoot, entry.name);
      return {
        name: entry.name,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (dirs.length === 0) {
    throw new Error('No marketing-captures-* directory was found under output/.');
  }
  return dirs[0].fullPath;
}

function ensureFile(sourceDir, name) {
  const absPath = path.join(sourceDir, name);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing required source image: ${absPath}`);
  }
  return name;
}

function buildHtml(files) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Spin Clash CrazyGames Cover Board</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #040712;
      --panel: #07111d;
      --panel-2: #0a1625;
      --ink: #e6fff8;
      --muted: #8aa7a5;
      --accent: #00f0cd;
      --line: rgba(0, 240, 205, 0.14);
      --title-font: "Segoe UI", "Inter", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--title-font);
      background:
        radial-gradient(circle at top, rgba(0,240,205,.08), transparent 32%),
        radial-gradient(circle at 20% 10%, rgba(0,157,255,.08), transparent 26%),
        linear-gradient(180deg, #030611, #060b14 52%, #050811);
      color: var(--ink);
      padding: 28px 28px 72px;
    }
    .wrap {
      max-width: 1540px;
      margin: 0 auto;
      display: grid;
      gap: 22px;
    }
    .masthead,
    .source-section {
      border: 1px solid var(--line);
      border-radius: 28px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.008)),
        linear-gradient(90deg, rgba(0,240,205,.06), rgba(255,255,255,0));
      padding: 24px;
      overflow: hidden;
    }
    h1, h2, h3, p { margin: 0; }
    .eyebrow {
      font-size: 12px;
      letter-spacing: .24em;
      text-transform: uppercase;
      color: rgba(255,255,255,.6);
    }
    .masthead h1 {
      margin-top: 10px;
      font-size: clamp(40px, 6vw, 84px);
      line-height: .96;
      letter-spacing: .18em;
      color: var(--accent);
      text-transform: uppercase;
      text-shadow: 0 0 32px rgba(0, 240, 205, 0.18);
    }
    .masthead p {
      margin-top: 14px;
      color: var(--muted);
      font-size: 15px;
      max-width: 720px;
    }
    .drafts {
      display: grid;
      grid-template-columns: minmax(0, 1.36fr) minmax(280px, .72fr);
      gap: 22px;
      align-items: start;
    }
    .stack {
      display: grid;
      gap: 22px;
    }
    .source-section h2,
    .stack-label {
      font-size: 15px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(255,255,255,.65);
    }
    .cover {
      overflow: hidden;
      position: relative;
      isolation: isolate;
      border-radius: 34px;
      border: 1px solid rgba(255,255,255,.08);
      background:
        radial-gradient(circle at top, rgba(255,255,255,.04), transparent 44%),
        linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.2)),
        #02050d;
      box-shadow:
        0 28px 90px rgba(0,0,0,.42),
        inset 0 1px 0 rgba(255,255,255,.05);
    }
    .cover.landscape { aspect-ratio: 16 / 9; }
    .cover.portrait { aspect-ratio: 2 / 3; }
    .cover.square { aspect-ratio: 1 / 1; }
    .cover__bg,
    .cover__wash,
    .cover__echo,
    .cover__grain,
    .cover__flare,
    .cover__halo {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .cover__bg {
      inset: -10%;
      background-repeat: no-repeat;
      background-size: cover;
      filter: saturate(1.16) contrast(1.06) brightness(1.02);
      transform: scale(1.02);
    }
    .cover__wash {
      background:
        linear-gradient(180deg, rgba(0,0,0,.28), transparent 20%, transparent 76%, rgba(0,0,0,.38)),
        radial-gradient(circle at 18% 14%, rgba(0,240,205,.12), transparent 28%),
        radial-gradient(circle at 76% 26%, rgba(0,141,255,.14), transparent 26%);
      mix-blend-mode: screen;
      opacity: .8;
    }
    .cover__echo {
      opacity: 0;
    }
    .cover__grain {
      opacity: .12;
      background-image:
        linear-gradient(transparent 0, rgba(255,255,255,.08) 48%, transparent 100%),
        linear-gradient(90deg, rgba(255,255,255,.05) 0, transparent 40%, rgba(255,255,255,.05) 100%);
      background-size: 100% 3px, 3px 100%;
      mix-blend-mode: overlay;
    }
    .cover__flare {
      background:
        radial-gradient(circle at 50% 112%, rgba(0,240,205,.24), transparent 24%),
        radial-gradient(circle at 76% 20%, rgba(255,120,46,.18), transparent 16%);
      mix-blend-mode: screen;
    }
    .cover__halo {
      inset: auto 6% 8%;
      height: 22%;
      border-radius: 999px;
      filter: blur(28px);
      background: linear-gradient(90deg, rgba(0,240,205,.06), rgba(62,185,255,.32), rgba(0,240,205,.06));
      opacity: .85;
    }
    .cover__content {
      position: absolute;
      left: 50%;
      right: 0;
      bottom: 0;
      z-index: 2;
      padding: 7%;
    }
    .cover__title {
      color: #00f0cd;
      font-size: clamp(24px, 3.8vw, 78px);
      line-height: .92;
      letter-spacing: .18em;
      font-weight: 700;
      text-transform: uppercase;
      text-shadow:
        0 0 20px rgba(0, 240, 205, 0.18),
        0 0 42px rgba(0, 240, 205, 0.08);
    }
    .cover__subtitle {
      margin-top: 12px;
      color: rgba(255,255,255,.72);
      font-size: clamp(11px, 1vw, 17px);
      letter-spacing: .28em;
      text-transform: uppercase;
    }
    .cover__meta {
      position: absolute;
      left: 7%;
      right: 7%;
      bottom: 7%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 18px;
      z-index: 3;
    }
    .cover__kicker {
      font-size: clamp(12px, 1vw, 16px);
      letter-spacing: .18em;
      text-transform: uppercase;
      color: rgba(255,255,255,.92);
    }
    .cover__format {
      font-size: clamp(11px, .95vw, 15px);
      letter-spacing: .22em;
      text-transform: uppercase;
      color: rgba(255,255,255,.62);
    }
    .cover__line {
      position: absolute;
      left: 7%;
      top: 14%;
      width: 14%;
      height: 1px;
      background: linear-gradient(90deg, rgba(255,255,255,.75), transparent);
      z-index: 3;
      opacity: .65;
    }
    .cover__badge {
      position: absolute;
      right: 7%;
      top: 9%;
      z-index: 3;
      font-size: 11px;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: rgba(255,255,255,.72);
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(3,8,18,.45);
      backdrop-filter: blur(8px);
    }
    .cover.landscape .cover__bg {
      background-image:
        radial-gradient(circle at 46% 26%, rgba(255,255,255,.1), transparent 24%),
        url('${files.landscape}');
      background-position: center 20%;
      background-size: 118% auto;
    }
    .cover.landscape .cover__content {
      left: 0;
      top: 0;
      padding-top: 11%;
    }
    .cover.landscape .cover__title {
      max-width: 62%;
    }
    .cover.landscape .cover__wash {
      background:
        linear-gradient(90deg, rgba(0,0,0,.44), rgba(0,0,0,.08) 46%, rgba(0,0,0,.26)),
        linear-gradient(180deg, rgba(0,0,0,.28), transparent 24%, transparent 78%, rgba(0,0,0,.34)),
        radial-gradient(circle at 22% 22%, rgba(0,240,205,.14), transparent 30%),
        radial-gradient(circle at 76% 28%, rgba(72,149,255,.1), transparent 24%);
    }
    .cover.portrait .cover__bg {
      background-image:
        linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,.18) 62%, rgba(0,0,0,.82) 100%),
        url('${files.stage}');
      background-position: center 10%;
      background-size: 108% auto;
    }
    .cover.portrait .cover__content {
      left: 0;
      top: 0;
      text-align: center;
      padding-top: 12%;
      padding-bottom: 11%;
    }
    .cover.portrait .cover__title {
      font-size: clamp(24px, 4vw, 64px);
    }
    .cover.portrait .cover__echo {
      opacity: .82;
      filter: blur(18px);
      background:
        radial-gradient(circle at 50% 68%, rgba(0,240,205,.32), transparent 14%),
        radial-gradient(circle at 50% 73%, rgba(64,160,255,.24), transparent 18%),
        repeating-radial-gradient(circle at 50% 72%, rgba(255,255,255,.06) 0 2px, transparent 2px 28px),
        radial-gradient(ellipse at 50% 92%, rgba(0,240,205,.18), transparent 38%);
      mix-blend-mode: screen;
    }
    .cover.portrait .cover__line {
      left: 50%;
      top: 13%;
      width: 28%;
      transform: translateX(-50%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
    }
    .cover.portrait .cover__badge {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      top: auto;
      bottom: 8%;
    }
    .cover.portrait .cover__meta {
      justify-content: center;
      bottom: 15%;
    }
    .cover.portrait .cover__format {
      display: none;
    }
    .cover.square .cover__bg {
      background-image:
        linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.18)),
        url('${files.stage}');
      background-position: center 10%;
      background-size: 104% auto;
    }
    .cover.square .cover__content {
      left: 0;
      top: 0;
      padding-top: 8%;
      text-align: center;
    }
    .cover.square .cover__title {
      font-size: clamp(22px, 4vw, 66px);
    }
    .cover.square .cover__echo {
      opacity: .78;
      filter: blur(16px);
      background:
        radial-gradient(circle at 50% 63%, rgba(0,240,205,.26), transparent 14%),
        radial-gradient(circle at 50% 68%, rgba(64,160,255,.18), transparent 18%),
        repeating-radial-gradient(circle at 50% 67%, rgba(255,255,255,.05) 0 2px, transparent 2px 26px),
        radial-gradient(ellipse at 50% 88%, rgba(0,240,205,.16), transparent 36%);
      mix-blend-mode: screen;
    }
    .cover.square .cover__line {
      left: 50%;
      top: 11%;
      width: 32%;
      transform: translateX(-50%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
    }
    .cover.square .cover__badge {
      display: none;
    }
    .cover.square .cover__meta {
      left: 8%;
      right: 8%;
      bottom: 8%;
    }
    .draft-note {
      margin-top: 12px;
      color: rgba(255,255,255,.56);
      font-size: 13px;
      line-height: 1.5;
    }
    .source-section {
      padding-top: 20px;
    }
    .source-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-top: 18px;
    }
    .source {
      background: var(--panel-2);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 18px;
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .source img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.06);
      background: #03060d;
    }
    .source p {
      font-size: 13px;
      color: rgba(255,255,255,.68);
      word-break: break-all;
    }
    @media (max-width: 1100px) {
      .drafts,
      .source-grid {
        grid-template-columns: 1fr;
      }
    }
    body.export-mode {
      padding: 0;
      background: #040712;
    }
    body.export-mode .wrap,
    body.export-mode .masthead,
    body.export-mode .source-section,
    body.export-mode .stack-label,
    body.export-mode .draft-note {
      display: none !important;
    }
    body.export-mode .drafts,
    body.export-mode .stack {
      display: block;
    }
    body.export-mode .cover {
      border-radius: 0;
      border: none;
      box-shadow: none;
      background: #02050d;
    }
    body.export-mode .cover__subtitle,
    body.export-mode .cover__meta,
    body.export-mode .cover__badge,
    body.export-mode .cover__line {
      display: none !important;
    }
    body.export-mode .cover.landscape .cover__title {
      font-size: 122px;
      max-width: 58%;
    }
    body.export-mode .cover.portrait .cover__title {
      font-size: 72px;
    }
    body.export-mode .cover.square .cover__title {
      font-size: 66px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="masthead">
      <div class="eyebrow">CrazyGames Submission Drafts</div>
      <h1>Spin Clash</h1>
      <p>First-pass storefront covers built directly from the current in-game capture set. The goal is a cleaner poster read, stronger title control, and immediately exportable landscape, portrait, and square drafts.</p>
    </section>

    <section class="drafts">
      <div class="stack">
        <div>
          <div class="stack-label">Landscape Draft</div>
          <div class="cover landscape" id="draft-landscape">
            <div class="cover__bg"></div>
            <div class="cover__wash"></div>
            <div class="cover__echo"></div>
            <div class="cover__grain"></div>
            <div class="cover__flare"></div>
            <div class="cover__halo"></div>
            <div class="cover__line"></div>
            <div class="cover__badge">Impact Frame</div>
            <div class="cover__content">
              <div class="cover__title">Spin Clash</div>
              <div class="cover__subtitle">Neon Arena Top Battles</div>
            </div>
          <div class="cover__meta">
              <div class="cover__kicker">Collision sparks. Two-top tension.</div>
              <div class="cover__format">1920 x 1080</div>
            </div>
          </div>
          <p class="draft-note">Closest to the main storefront direction, with the collision sparks and two-top standoff kept as the primary read.</p>
        </div>
      </div>

      <div class="stack">
        <div>
          <div class="stack-label">Portrait Draft</div>
          <div class="cover portrait" id="draft-portrait">
            <div class="cover__bg"></div>
            <div class="cover__wash"></div>
            <div class="cover__echo"></div>
            <div class="cover__grain"></div>
            <div class="cover__flare"></div>
            <div class="cover__line"></div>
            <div class="cover__content">
              <div class="cover__title">Spin Clash</div>
              <div class="cover__subtitle">Precision. Impact. Control.</div>
            </div>
            <div class="cover__meta">
              <div class="cover__kicker">Hero top focus</div>
              <div class="cover__format">800 x 1200</div>
            </div>
            <div class="cover__badge">Vertical</div>
          </div>
          <p class="draft-note">The portrait draft stays on a hero-top poster direction and avoids pulling any gameplay UI into frame.</p>
        </div>

        <div>
          <div class="stack-label">Square Draft</div>
          <div class="cover square" id="draft-square">
            <div class="cover__bg"></div>
            <div class="cover__wash"></div>
            <div class="cover__echo"></div>
            <div class="cover__grain"></div>
            <div class="cover__flare"></div>
            <div class="cover__line"></div>
            <div class="cover__content">
              <div class="cover__title">Spin Clash</div>
              <div class="cover__subtitle">Clean hero icon crop</div>
            </div>
            <div class="cover__meta">
              <div class="cover__kicker">Thumbnail-first read</div>
              <div class="cover__format">800 x 800</div>
            </div>
          </div>
          <p class="draft-note">The square draft prioritizes thumbnail readability with a tighter title lockup and a more forward hero subject.</p>
        </div>
      </div>
    </section>

    <section class="source-section">
      <h2>Source Images</h2>
      <div class="source-grid">
        <article class="source">
          <img src="${files.hero}" alt="" />
          <p>${files.hero}</p>
        </article>
        <article class="source">
          <img src="${files.stage}" alt="" />
          <p>${files.stage}</p>
        </article>
        <article class="source">
          <img src="${files.landscape}" alt="" />
          <p>${files.landscape}</p>
        </article>
      </div>
    </section>
  </div>
</body>
</html>`;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const args = parseArgs(process.argv);
  const sourceDir = path.resolve(args.sourceDir || getLatestMarketingDir(repoRoot));
  const outFile = path.resolve(args.outFile || path.join(sourceDir, 'cover-board.html'));

  const files = {
    hero: ensureFile(sourceDir, '01-home-hero-wide-en.png'),
    stage: ensureFile(sourceDir, '03-home-top-stage-en.png'),
    landscape: ensureFile(sourceDir, '07-battle-action-clean.png')
  };

  fs.writeFileSync(outFile, buildHtml(files), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceDir,
        outFile,
        files
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}
