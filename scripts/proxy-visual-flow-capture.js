const fs = require('fs');
const path = require('path');
const { startLocalServer } = require('./serve-local.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    proxyPort: Number.parseInt(process.env.CODEX_BROWSER_PROXY_PORT || '3460', 10),
    profile: 'desktop',
    dryRun: false
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--proxy-port' && next) {
      args.proxyPort = Number.parseInt(next, 10);
      i += 1;
    } else if (token === '--profile' && next) {
      args.profile = next;
      i += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    }
  }
  return args;
}

function getProfileConfig(profile) {
  if (profile === 'mobile') {
    return {
      profile: 'mobile',
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
        touch: true
      }
    };
  }
  return {
    profile: 'desktop',
    viewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
      touch: false
    }
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestampSlug() {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return iso.slice(0, 19);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}: ${text}`);
  }
  return text;
}

async function fetchJson(url, options = {}) {
  const text = await fetchText(url, options);
  return JSON.parse(text);
}

async function createTarget(proxyPort, url) {
  const payload = await fetchJson(
    `http://127.0.0.1:${proxyPort}/new?url=${encodeURIComponent(url)}`
  );
  if (!payload.targetId) {
    throw new Error(`Proxy did not return a targetId for ${url}`);
  }
  return payload.targetId;
}

async function closeTarget(proxyPort, targetId) {
  await fetchJson(`http://127.0.0.1:${proxyPort}/close?target=${encodeURIComponent(targetId)}`);
}

async function evalValue(proxyPort, targetId, expression) {
  const payload = await fetchJson(
    `http://127.0.0.1:${proxyPort}/eval?target=${encodeURIComponent(targetId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: expression
    }
  );
  return payload.value;
}

async function screenshot(proxyPort, targetId, filePath) {
  ensureDir(path.dirname(filePath));
  await fetchJson(
    `http://127.0.0.1:${proxyPort}/screenshot?target=${encodeURIComponent(targetId)}&file=${encodeURIComponent(filePath)}`
  );
  return filePath;
}

async function applyViewport(proxyPort, targetId, viewport) {
  return fetchJson(
    `http://127.0.0.1:${proxyPort}/viewport?target=${encodeURIComponent(targetId)}&width=${viewport.width}&height=${viewport.height}&dpr=${viewport.deviceScaleFactor}&mobile=${viewport.mobile ? 1 : 0}&touch=${viewport.touch ? 1 : 0}`
  );
}

async function capture(proxyPort, targetId, outputDir, manifest, name, note) {
  const fileName = `${String(manifest.length).padStart(2, '0')}-${name}.png`;
  const absPath = path.join(outputDir, fileName);
  await screenshot(proxyPort, targetId, absPath);
  manifest.push({
    file: fileName,
    note
  });
  return absPath;
}

async function getState(proxyPort, targetId) {
  const raw = await evalValue(proxyPort, targetId, 'window.render_game_to_text ? window.render_game_to_text() : "{}"');
  return JSON.parse(raw || '{}');
}

async function waitFor(predicate, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

function buildReplayHtml(manifest, profile) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Spin Clash Visual Flow Replay · ${profile}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #071018;
      --panel: #0d1821;
      --ink: #d8f7ef;
      --muted: #89b5aa;
      --accent: #00f0cd;
      --border: rgba(0, 240, 205, 0.22);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
      background: radial-gradient(circle at top, rgba(0,240,205,.08), transparent 42%), var(--bg);
      color: var(--ink);
      min-height: 100vh;
      padding: 20px;
    }
    .wrap {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }
    .player {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px;
    }
    .screen {
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      overflow: hidden;
      background: #02060b;
    }
    .screen img {
      display: block;
      width: 100%;
      height: auto;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    button {
      border: 1px solid var(--border);
      background: rgba(0,240,205,.08);
      color: var(--ink);
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      cursor: pointer;
    }
    button:hover { background: rgba(0,240,205,.14); }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      color: var(--muted);
      font-size: 14px;
    }
    .timeline {
      display: grid;
      gap: 10px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 14px;
    }
    .timeline-item {
      display: grid;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.06);
      background: rgba(255,255,255,.02);
      cursor: pointer;
    }
    .timeline-item.active {
      border-color: var(--accent);
      background: rgba(0,240,205,.08);
    }
    .timeline-item small {
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="player">
      <div class="screen"><img id="frame" src="${manifest[0]?.file || ''}" alt="" /></div>
      <div class="controls" style="margin-top:14px">
        <button id="prev">上一帧</button>
        <button id="play">自动播放</button>
        <button id="next">下一帧</button>
      </div>
      <div class="meta" style="margin-top:12px">
        <div id="counter"></div>
        <div id="note"></div>
      </div>
    </div>
    <div class="timeline" id="timeline"></div>
  </div>
  <script>
    const manifest = ${JSON.stringify(manifest, null, 2)};
    const frame = document.getElementById('frame');
    const counter = document.getElementById('counter');
    const note = document.getElementById('note');
    const timeline = document.getElementById('timeline');
    const play = document.getElementById('play');
    let index = 0;
    let timer = null;

    function renderTimeline() {
      timeline.innerHTML = '';
      manifest.forEach((entry, i) => {
        const item = document.createElement('div');
        item.className = 'timeline-item' + (i === index ? ' active' : '');
        item.innerHTML = '<strong>' + entry.file + '</strong><small>' + (entry.note || '') + '</small>';
        item.addEventListener('click', () => {
          stop();
          index = i;
          render();
        });
        timeline.appendChild(item);
      });
    }

    function render() {
      const entry = manifest[index];
      frame.src = entry.file;
      counter.textContent = '帧 ' + (index + 1) + ' / ' + manifest.length;
      note.textContent = entry.note || '';
      renderTimeline();
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      play.textContent = '自动播放';
    }

    function start() {
      stop();
      timer = setInterval(() => {
        index = (index + 1) % manifest.length;
        render();
      }, 500);
      play.textContent = '停止';
    }

    document.getElementById('prev').addEventListener('click', () => {
      stop();
      index = (index - 1 + manifest.length) % manifest.length;
      render();
    });
    document.getElementById('next').addEventListener('click', () => {
      stop();
      index = (index + 1) % manifest.length;
      render();
    });
    play.addEventListener('click', () => {
      if (timer) stop();
      else start();
    });

    render();
  </script>
</body>
</html>`;
}

function buildReport({
  profile,
  viewport,
  outputDir,
  replayPath,
  manifest,
  revalidationFrame,
  battleFrames,
  roundResultFrame,
  matchResultFrame,
  finalState
}) {
  const lines = [];
  lines.push('# Spin Clash Visual Flow Video Validation');
  lines.push('');
  lines.push(`- Profile: \`${profile}\``);
  lines.push(`- Viewport: \`${viewport.width}x${viewport.height}\` / dpr \`${viewport.deviceScaleFactor}\` / mobile \`${viewport.mobile}\``);
  lines.push(`- Output dir: \`${outputDir}\``);
  lines.push(`- Replay: \`${replayPath}\``);
  lines.push(`- Frames captured: \`${manifest.length}\``);
  lines.push('');
  lines.push('## Coverage');
  lines.push('');
  lines.push('- Home');
  lines.push('- Championship Path');
  lines.push('- Workshop');
  lines.push('- Settings');
  lines.push('- Quick Battle');
  lines.push('- Battle HUD / active combat');
  lines.push('- Round result overlay');
  lines.push('- Match result overlay');
  lines.push('');
  lines.push('## Revalidation');
  lines.push('');
  lines.push(`- Proxy-chain diagnostic frame: \`${path.basename(revalidationFrame)}\``);
  lines.push('- Diagnostic overlay used to verify corners + center alignment before visual judgement.');
  lines.push('');
  lines.push('## Key Frames');
  lines.push('');
  battleFrames.forEach((framePath, index) => {
    lines.push(`- Battle frame ${index + 1}: \`${path.basename(framePath)}\``);
  });
  if (roundResultFrame) {
    lines.push(`- Round result: \`${path.basename(roundResultFrame)}\``);
  } else {
    lines.push('- Round result: `not observed in this run`');
  }
  lines.push(`- Match result: \`${path.basename(matchResultFrame)}\``);
  lines.push('');
  lines.push('## Final Runtime Snapshot');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(finalState, null, 2));
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  if (!Number.isFinite(args.proxyPort) || args.proxyPort <= 0) {
    throw new Error('A valid --proxy-port is required.');
  }
  const profileConfig = getProfileConfig(args.profile);
  if (args.dryRun) {
    console.log(JSON.stringify(profileConfig, null, 2));
    return;
  }
  const slug = timestampSlug();
  const outputDir = path.join(REPO_ROOT, 'output', `proxy-visual-flow-video-${profileConfig.profile}-${slug}`);
  ensureDir(outputDir);

  const server = await startLocalServer({
    host: '127.0.0.1',
    port: 4173,
    silent: true,
    repoRoot: REPO_ROOT
  });

  const manifest = [];
  let targetId = null;
  const proxyPort = args.proxyPort;

  try {
    const url = server.indexUrl;
    targetId = await createTarget(proxyPort, url);
    await sleep(1200);
    await applyViewport(proxyPort, targetId, profileConfig.viewport);
    await sleep(500);

    await evalValue(proxyPort, targetId, `
      (() => {
        const existing = document.getElementById('__proxy_diag');
        if (existing) existing.remove();
        const root = document.createElement('div');
        root.id = '__proxy_diag';
        root.style.position = 'fixed';
        root.style.inset = '0';
        root.style.pointerEvents = 'none';
        root.style.zIndex = '999999';
        const specs = [
          ['TL', '0', '0', null, null, 'rgba(255,0,0,.92)'],
          ['TR', null, '0', '0', null, 'rgba(0,180,0,.92)'],
          ['BL', '0', null, null, '0', 'rgba(0,120,255,.92)'],
          ['BR', null, null, '0', '0', 'rgba(255,180,0,.95)']
        ];
        specs.forEach(([label,left,top,right,bottom,bg]) => {
          const box = document.createElement('div');
          box.textContent = label;
          box.style.position = 'absolute';
          if (left !== null) box.style.left = left;
          if (top !== null) box.style.top = top;
          if (right !== null) box.style.right = right;
          if (bottom !== null) box.style.bottom = bottom;
          box.style.width = '72px';
          box.style.height = '72px';
          box.style.display = 'flex';
          box.style.alignItems = 'center';
          box.style.justifyContent = 'center';
          box.style.background = bg;
          box.style.color = '#fff';
          box.style.font = '700 14px monospace';
          box.style.border = '2px solid rgba(255,255,255,.9)';
          root.appendChild(box);
        });
        const center = document.createElement('div');
        center.textContent = 'CENTER';
        center.style.position = 'absolute';
        center.style.left = '50%';
        center.style.top = '50%';
        center.style.transform = 'translate(-50%, -50%)';
        center.style.padding = '10px 14px';
        center.style.background = 'rgba(255,255,255,.92)';
        center.style.color = '#000';
        center.style.font = '700 16px monospace';
        center.style.border = '2px solid #000';
        root.appendChild(center);
        document.body.appendChild(root);
        return true;
      })()
    `);
    const revalidationFrame = await capture(proxyPort, targetId, outputDir, manifest, 'home-diagnostic', '代理链重校验：角点与中心定位');
    await evalValue(proxyPort, targetId, `(() => { const el = document.getElementById('__proxy_diag'); if (el) el.remove(); return true; })()`);

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke && window.__spinClashInvoke('setLocale', 'zh')`);
    await sleep(300);
    await capture(proxyPort, targetId, outputDir, manifest, 'home', '主页');

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('goPath')`);
    await sleep(900);
    await capture(proxyPort, targetId, outputDir, manifest, 'path', '冠军之路');

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('goWorkshop')`);
    await sleep(700);
    await capture(proxyPort, targetId, outputDir, manifest, 'workshop', '工坊研究');

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('goSettings')`);
    await sleep(700);
    await capture(proxyPort, targetId, outputDir, manifest, 'settings', '设置');

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('goQuick')`);
    await sleep(900);
    await capture(proxyPort, targetId, outputDir, manifest, 'quick', '快速对战');

    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('goPath')`);
    await sleep(800);
    await evalValue(proxyPort, targetId, `window.__spinClashInvoke('startFight')`);
    await sleep(500);
    await evalValue(proxyPort, targetId, `window.launch()`);
    await sleep(300);

    const battleFrames = [];
    battleFrames.push(await capture(proxyPort, targetId, outputDir, manifest, 'battle-01', '对战开始，HUD 已进入'));

    let finalState = await getState(proxyPort, targetId);
    let roundResultFrame = null;
    let matchResultFrame = null;
    let roundLoop = 0;
    let battleFrameCount = 1;

    for (; battleFrameCount < 5; battleFrameCount += 1) {
      await evalValue(proxyPort, targetId, `window.advanceTime(900)`);
      await sleep(120);
      battleFrames.push(
        await capture(
          proxyPort,
          targetId,
          outputDir,
          manifest,
          `battle-0${battleFrameCount + 1}`,
          `对战中，第 ${battleFrameCount + 1} 个战斗关键帧`
        )
      );
      finalState = await getState(proxyPort, targetId);
      if (finalState.overlays?.roundResult || finalState.overlays?.matchResult) {
        break;
      }
    }

    while (!finalState.overlays?.matchResult && roundLoop < 8) {
      if (finalState.mode === 'prepare') {
        await evalValue(proxyPort, targetId, `window.launch()`);
        await sleep(250);
      }

      if (finalState.mode === 'active') {
        await evalValue(proxyPort, targetId, `window.advanceTime(36000)`);
        await sleep(150);
        finalState = await getState(proxyPort, targetId);
        if (finalState.overlays?.roundResult && !roundResultFrame) {
          roundResultFrame = await capture(proxyPort, targetId, outputDir, manifest, 'round-result', '单回合结算界面');
        }
      } else if (finalState.overlays?.roundResult) {
        if (!roundResultFrame) {
          roundResultFrame = await capture(proxyPort, targetId, outputDir, manifest, 'round-result', '单回合结算界面');
        }
        await sleep(2600);
      } else if (finalState.overlays?.matchResult) {
        break;
      } else {
        await sleep(500);
      }

      finalState = await getState(proxyPort, targetId);
      if (finalState.overlays?.matchResult) {
        break;
      }
      roundLoop += 1;
    }

    finalState = await waitFor(async () => {
      const state = await getState(proxyPort, targetId);
      return state.overlays?.matchResult ? state : null;
    }, { timeoutMs: 20000, intervalMs: 500 });

    matchResultFrame = await capture(proxyPort, targetId, outputDir, manifest, 'match-result', '整局结算界面');

    const replayPath = path.join(outputDir, 'replay.html');
    fs.writeFileSync(replayPath, buildReplayHtml(manifest, profileConfig.profile), 'utf8');

    const reportPath = path.join(outputDir, 'report.md');
    fs.writeFileSync(
      reportPath,
      buildReport({
        profile: profileConfig.profile,
        viewport: profileConfig.viewport,
        outputDir,
        replayPath,
        manifest,
        revalidationFrame,
        battleFrames,
        roundResultFrame,
        matchResultFrame,
        finalState
      }),
      'utf8'
    );

    console.log(JSON.stringify({
      ok: true,
      profile: profileConfig.profile,
      viewport: profileConfig.viewport,
      outputDir,
      replayPath,
      reportPath,
      frames: manifest.map((entry) => entry.file),
      finalState
    }, null, 2));
  } finally {
    if (targetId) {
      try {
        await closeTarget(proxyPort, targetId);
      } catch {}
    }
    await server.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  getProfileConfig
};
