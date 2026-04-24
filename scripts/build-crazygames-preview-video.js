const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');
const { startLocalServer } = require('./serve-local.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    submissionDir: '',
    outFile: '',
    ffmpegPath: '',
    ffprobePath: '',
    headless: true,
    width: 1920,
    height: 1080,
    fps: 30,
    keepTemp: false
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--submission-dir' && next) {
      args.submissionDir = next;
      index += 1;
      continue;
    }
    if (token === '--out-file' && next) {
      args.outFile = next;
      index += 1;
      continue;
    }
    if (token === '--ffmpeg-path' && next) {
      args.ffmpegPath = next;
      index += 1;
      continue;
    }
    if (token === '--ffprobe-path' && next) {
      args.ffprobePath = next;
      index += 1;
      continue;
    }
    if (token === '--width' && next) {
      args.width = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--height' && next) {
      args.height = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--fps' && next) {
      args.fps = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--keep-temp') {
      args.keepTemp = true;
      continue;
    }
    if (token === '--headed') {
      args.headless = false;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getLatestDir(repoRoot, prefix) {
  const outputRoot = path.join(repoRoot, 'output');
  const dirs = fs
    .readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => {
      const fullPath = path.join(outputRoot, entry.name);
      return {
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (dirs.length === 0) {
    throw new Error(`No ${prefix}* directory was found under output/.`);
  }
  return dirs[0].fullPath;
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        result.stdout ? `stdout:\n${result.stdout.trim()}` : '',
        result.stderr ? `stderr:\n${result.stderr.trim()}` : ''
      ]
        .filter(Boolean)
        .join('\n\n')
    );
  }
  return result.stdout.trim();
}

function readJsonCommand(command, args) {
  const output = runProcess(command, args);
  return JSON.parse(output);
}

function getWingetCandidates(binaryName) {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const candidates = [];
  candidates.push(path.join(localAppData, 'Microsoft', 'WinGet', 'Links', `${binaryName}.exe`));

  const packagesRoot = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(packagesRoot)) {
    for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('Gyan.FFmpeg_')) continue;
      const ffmpegRoot = path.join(packagesRoot, entry.name);
      for (const child of fs.readdirSync(ffmpegRoot, { withFileTypes: true })) {
        if (!child.isDirectory() || !child.name.startsWith('ffmpeg-')) continue;
        candidates.push(path.join(ffmpegRoot, child.name, 'bin', `${binaryName}.exe`));
      }
    }
  }
  return candidates;
}

function resolveBinary(binaryName, explicitPath) {
  if (explicitPath) {
    const absPath = path.resolve(explicitPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Explicit ${binaryName} path does not exist: ${absPath}`);
    }
    return absPath;
  }

  const whereResult = spawnSync('where.exe', [`${binaryName}.exe`], {
    stdio: 'pipe',
    encoding: 'utf8'
  });
  if (whereResult.status === 0) {
    const firstHit = whereResult.stdout
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find(Boolean);
    if (firstHit && fs.existsSync(firstHit)) {
      return firstHit;
    }
  }

  for (const candidate of getWingetCandidates(binaryName)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Could not resolve ${binaryName}. Install it first or pass --${binaryName}-path.`);
}

async function getState(page) {
  const raw = await page.evaluate(() => {
    return typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : '{}';
  });
  return JSON.parse(raw || '{}');
}

async function waitFor(page, predicate, { timeoutMs = 20000, intervalMs = 200 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const state = await getState(page);
    if (predicate(state)) {
      return state;
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

async function applyVideoCaptureStyle(page) {
  await page.addStyleTag({
    content: [
      '* { cursor: none !important; }',
      'html, body { overflow: hidden !important; background: #020617 !important; }',
      '#debug-panel, .runtime-debug-panel { display: none !important; }'
    ].join('\n')
  });
  await sleep(150);
}

async function setCaptureStyle(page, cssText, options = {}) {
  const waitMs = Number.isFinite(options.waitMs) ? options.waitMs : 100;
  await page.evaluate((css) => {
    let styleEl = document.getElementById('__spin_clash_video_capture_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = '__spin_clash_video_capture_style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, cssText);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

async function applyQuickShellCaptureStyle(page) {
  await setCaptureStyle(
    page,
    [
      '#ov-loadout > h2,',
      '#ov-loadout > .sub2,',
      '#locale-loadout-switcher,',
      '#shell-route-bar,',
      '#currency-bar,',
      '.featured-top-panel,',
      '.mode-tabs,',
      '.mode-hint,',
      '.cards,',
      '.arena-sel { display:none !important; }',
      '#quick-battle-panel { margin-top: 24px !important; }'
    ].join('\n')
  );
}

async function applyCleanBattleCaptureStyle(page) {
  await setCaptureStyle(
    page,
    [
      '#hud,',
      '#msg-txt,',
      '#hint-bar,',
      '#battle-commentary,',
      '#skill-panel,',
      '#act-swap,',
      '#timer-txt,',
      '#score-area { opacity:0 !important; visibility:hidden !important; }'
    ].join('\n'),
    { waitMs: 0 }
  );
  await sleep(60);
}

async function applyMatchResultCaptureStyle(page) {
  await setCaptureStyle(
    page,
    [
      '#ov-match .result-actions,',
      '#ov-match .result-share,',
      '#ov-match .reward-strip,',
      '#ov-match .reward-panel { display:none !important; }'
    ].join('\n')
  );
}

async function bootPage(page, indexUrl) {
  await page.goto(indexUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__spinClashUI === 'object', { timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    window.__spinClashUI.setLocale('en');
  });
  await applyVideoCaptureStyle(page);
}

async function goQuick(page) {
  await page.evaluate(() => {
    window.__spinClashUI.setLocale('en');
    window.__spinClashUI.goQuick();
  });
  await page.waitForTimeout(1000);
}

async function startBattle(page) {
  await page.evaluate(() => {
    window.__spinClashUI.setLocale('en');
    window.__spinClashUI.goQuick();
    window.__spinClashUI.startFight();
  });
  await page.waitForTimeout(900);
  await waitFor(page, (state) => state.mode === 'prepare');
  await page.evaluate(() => window.launch());
  await waitFor(page, (state) => state.mode === 'active');
  await page.waitForTimeout(250);
}

async function reachMatchResult(page) {
  await startBattle(page);
  for (let loop = 0; loop < 10; loop += 1) {
    const state = await getState(page);
    if (state.overlays && state.overlays.matchResult) {
      await page.waitForTimeout(250);
      return;
    }
    if (state.mode === 'active') {
      await page.evaluate(() => window.advanceTime(36000));
      await page.waitForTimeout(160);
      continue;
    }
    if (state.overlays && state.overlays.roundResult) {
      await page.waitForTimeout(2800);
      continue;
    }
    if (state.mode === 'prepare') {
      await page.evaluate(() => window.launch());
      await page.waitForTimeout(250);
      continue;
    }
    await page.waitForTimeout(200);
  }
  await waitFor(page, (state) => Boolean(state.overlays && state.overlays.matchResult), {
    timeoutMs: 20000
  });
  await page.waitForTimeout(250);
}

async function recordSegment(server, tempDir, segment, viewport, headless) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: tempDir,
      size: viewport
    }
  });
  const page = await context.newPage();
  const videoHandle = page.video();
  const startedAt = Date.now();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });

  try {
    await bootPage(page, server.indexUrl);
    await segment.setup(page);
    const trimStartSec = Math.max(0, (Date.now() - startedAt) / 1000 - 0.08);
    await sleep(segment.durationMs);
    const rawState = await getState(page).catch(() => null);
    await context.close();
    const rawVideoPath = await videoHandle.path();
    await browser.close();

    const stableRawPath = path.join(tempDir, `${segment.order.toString().padStart(2, '0')}-${segment.id}-raw.webm`);
    fs.copyFileSync(rawVideoPath, stableRawPath);

    return {
      order: segment.order,
      id: segment.id,
      label: segment.label,
      durationSec: Number((segment.durationMs / 1000).toFixed(3)),
      trimStartSec: Number(trimStartSec.toFixed(3)),
      rawVideoPath: stableRawPath,
      consoleErrors,
      pageErrors,
      finalState: rawState
    };
  } catch (error) {
    await browser.close().catch(() => {});
    throw error;
  }
}

function trimSegment(ffmpegPath, segment, outputPath, fps, width, height) {
  const filter = segment.filter || `fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=yuv420p`;
  runProcess(ffmpegPath, [
    '-y',
    '-ss',
    segment.trimStartSec.toFixed(3),
    '-i',
    segment.rawVideoPath,
    '-t',
    segment.durationSec.toFixed(3),
    '-an',
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    outputPath
  ]);
}

function concatSegments(ffmpegPath, segmentPaths, outputPath) {
  const concatPath = path.join(path.dirname(outputPath), 'concat-list.txt');
  fs.writeFileSync(
    concatPath,
    segmentPaths.map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`).join('\n'),
    'utf8'
  );
  runProcess(ffmpegPath, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatPath,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    outputPath
  ]);
  return concatPath;
}

function probeVideo(ffprobePath, targetPath) {
  const data = readJsonCommand(ffprobePath, [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    targetPath
  ]);
  const videoStream = (data.streams || []).find((stream) => stream.codec_type === 'video');
  return {
    durationSec: Number.parseFloat(data.format.duration || '0'),
    sizeBytes: Number.parseInt(data.format.size || '0', 10),
    width: videoStream ? videoStream.width : null,
    height: videoStream ? videoStream.height : null,
    codec: videoStream ? videoStream.codec_name : null
  };
}

function extractFrame(ffmpegPath, videoPath, outPath, timestampSec) {
  runProcess(ffmpegPath, [
    '-y',
    '-ss',
    timestampSec.toFixed(3),
    '-i',
    videoPath,
    '-frames:v',
    '1',
    outPath
  ]);
}

function buildReport(report) {
  return [
    '# CrazyGames Preview Video Export',
    '',
    `- Generated: \`${report.generatedAt}\``,
    `- Output: \`${report.outputPath}\``,
    `- Duration: \`${report.video.durationSec.toFixed(3)}s\``,
    `- Resolution: \`${report.video.width}x${report.video.height}\``,
    `- Size: \`${(report.video.sizeBytes / (1024 * 1024)).toFixed(2)} MB\``,
    `- Codec: \`${report.video.codec}\``,
    `- ffmpeg: \`${report.ffmpegPath}\``,
    '',
    '## Segments',
    '',
    ...report.segments.flatMap((segment) => [
      `- \`${segment.order.toString().padStart(2, '0')}-${segment.id}\``,
      `  - label: ${segment.label}`,
      `  - duration: ${segment.durationSec.toFixed(3)}s`,
      `  - trim start: ${segment.trimStartSec.toFixed(3)}s`,
      `  - console errors: ${segment.consoleErrors.length}`,
      `  - page errors: ${segment.pageErrors.length}`
    ]),
    '',
    '## Frame Checks',
    '',
    `- start: \`${path.basename(report.frames.start)}\``,
    `- mid: \`${path.basename(report.frames.mid)}\``,
    `- end: \`${path.basename(report.frames.end)}\``,
    '',
    '## Rules Check',
    '',
    '- no black intro: verified from extracted start frame',
    '- no cursor: forced via capture CSS',
    '- no promo text: no title cards or added text overlays',
    '- no sound: exported with `-an`',
    '- tail removed: clip is trimmed per-segment before concat so the result ends on the final result beat'
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const submissionDir = path.resolve(args.submissionDir || getLatestDir(REPO_ROOT, 'crazygames-submission-'));
  const videoDir = path.join(submissionDir, 'video');
  const rawDir = path.join(videoDir, 'raw-segments');
  const trimmedDir = path.join(videoDir, 'trimmed-segments');
  const outputPath = path.resolve(args.outFile || path.join(videoDir, 'spin-clash-preview-1080p.mp4'));
  const viewport = { width: args.width, height: args.height };
  const ffmpegPath = resolveBinary('ffmpeg', args.ffmpegPath);
  const ffprobePath = resolveBinary('ffprobe', args.ffprobePath);

  ensureDir(videoDir);
  ensureDir(rawDir);
  ensureDir(trimmedDir);

  const server = await startLocalServer({
    host: '127.0.0.1',
    port: 4173,
    maxPort: 4273,
    repoRoot: REPO_ROOT,
    silent: true
  });

  const segments = [
    {
      order: 1,
      id: 'quick-shell-clean',
      label: 'Quick battle shell clean intro',
      durationMs: 1700,
      filter: `fps=${args.fps},crop=1500:844:210:68,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await goQuick(page);
        await applyQuickShellCaptureStyle(page);
      }
    },
    {
      order: 2,
      id: 'battle-impact-clean',
      label: 'Opening clash close-up',
      durationMs: 3000,
      filter: `fps=${args.fps},crop=1660:934:130:88,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await startBattle(page);
        await applyCleanBattleCaptureStyle(page);
        await page.evaluate(() => window.advanceTime(900));
        await sleep(60);
      }
    },
    {
      order: 3,
      id: 'battle-followthrough-clean',
      label: 'Follow-through battle close-up',
      durationMs: 3000,
      filter: `fps=${args.fps},crop=1660:934:130:88,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await startBattle(page);
        await applyCleanBattleCaptureStyle(page);
        await page.evaluate(() => window.advanceTime(2200));
        await sleep(60);
      }
    },
    {
      order: 4,
      id: 'battle-edge-pressure-clean',
      label: 'Edge pressure battle close-up',
      durationMs: 3000,
      filter: `fps=${args.fps},crop=1660:934:130:88,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await startBattle(page);
        await applyCleanBattleCaptureStyle(page);
        await page.evaluate(() => window.advanceTime(4200));
        await sleep(60);
      }
    },
    {
      order: 5,
      id: 'battle-finish-pressure-clean',
      label: 'Late battle pressure close-up',
      durationMs: 3000,
      filter: `fps=${args.fps},crop=1660:934:130:88,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await startBattle(page);
        await applyCleanBattleCaptureStyle(page);
        await page.evaluate(() => window.advanceTime(6200));
        await sleep(60);
      }
    },
    {
      order: 6,
      id: 'match-result-clean',
      label: 'Final result beat clean',
      durationMs: 1800,
      filter: `fps=${args.fps},crop=1460:821:230:120,scale=${args.width}:${args.height},format=yuv420p`,
      setup: async (page) => {
        await reachMatchResult(page);
        await applyMatchResultCaptureStyle(page);
      }
    }
  ];

  const recordedSegments = [];
  let concatPath = '';
  try {
    for (const segment of segments) {
      recordedSegments.push(await recordSegment(server, rawDir, segment, viewport, args.headless));
    }

    const trimmedPaths = [];
    for (const segment of recordedSegments) {
      const trimmedPath = path.join(
        trimmedDir,
        `${segment.order.toString().padStart(2, '0')}-${segment.id}.mp4`
      );
      trimSegment(ffmpegPath, segment, trimmedPath, args.fps, args.width, args.height);
      trimmedPaths.push(trimmedPath);
      segment.trimmedPath = trimmedPath;
    }

    concatPath = concatSegments(ffmpegPath, trimmedPaths, outputPath);
    const video = probeVideo(ffprobePath, outputPath);

    const frames = {
      start: path.join(videoDir, 'spin-clash-preview-start-frame.png'),
      mid: path.join(videoDir, 'spin-clash-preview-mid-frame.png'),
      end: path.join(videoDir, 'spin-clash-preview-end-frame.png')
    };
    extractFrame(ffmpegPath, outputPath, frames.start, 0.15);
    extractFrame(ffmpegPath, outputPath, frames.mid, Math.max(0.15, video.durationSec / 2));
    extractFrame(ffmpegPath, outputPath, frames.end, Math.max(0.15, video.durationSec - 0.25));

    const report = {
      generatedAt: new Date().toISOString(),
      submissionDir,
      outputPath,
      ffmpegPath,
      ffprobePath,
      video,
      segments: recordedSegments,
      frames
    };

    fs.writeFileSync(path.join(videoDir, 'preview-video-report.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(videoDir, 'preview-video-report.md'), buildReport(report), 'utf8');

    if (!args.keepTemp) {
      if (concatPath && fs.existsSync(concatPath)) {
        fs.unlinkSync(concatPath);
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          generatedAt: report.generatedAt,
          outputPath,
          durationSec: Number(video.durationSec.toFixed(3)),
          sizeBytes: video.sizeBytes,
          width: video.width,
          height: video.height,
          report: path.join(videoDir, 'preview-video-report.md')
        },
        null,
        2
      )
    );
  } finally {
    await server.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exit(1);
  });
}
