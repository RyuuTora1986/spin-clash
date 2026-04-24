const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startLocalServer } = require('./serve-local.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    outDir: '',
    headless: true,
    width: 1600,
    height: 1200
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--out-dir' && next) {
      args.outDir = next;
      index += 1;
      continue;
    }
    if (token === '--headed') {
      args.headless = false;
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
  }
  return args;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getState(page) {
  const raw = await page.evaluate(() => {
    return typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : '{}';
  });
  return JSON.parse(raw || '{}');
}

async function waitFor(page, predicate, { timeoutMs = 15000, intervalMs = 200 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = await getState(page);
    if (predicate(state)) return state;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

async function setCaptureStyle(page, cssText, options = {}) {
  const waitMs = Number.isFinite(options.waitMs) ? options.waitMs : 100;
  await page.evaluate((css) => {
    let styleEl = document.getElementById('__spin_clash_marketing_capture_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = '__spin_clash_marketing_capture_style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, cssText);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

async function clearCaptureStyle(page) {
  await page.evaluate(() => {
    const styleEl = document.getElementById('__spin_clash_marketing_capture_style');
    if (styleEl) styleEl.remove();
  });
  await sleep(100);
}

async function goRoute(page, route, locale = 'en') {
  await page.evaluate(({ nextRoute, nextLocale }) => {
    if (!window.__spinClashUI) throw new Error('missing __spinClashUI');
    window.__spinClashUI.setLocale(nextLocale);
    if (nextRoute === 'home') window.__spinClashUI.goHome();
    if (nextRoute === 'quick') window.__spinClashUI.goQuick();
    if (nextRoute === 'path') window.__spinClashUI.goPath();
    if (nextRoute === 'workshop') window.__spinClashUI.goWorkshop();
    if (nextRoute === 'settings') window.__spinClashUI.goSettings();
  }, { nextRoute: route, nextLocale: locale });
  await sleep(900);
}

async function capturePage(page, outputDir, manifest, name, note, options = {}) {
  const fileName = typeof options.fileName === 'string' && options.fileName.trim()
    ? options.fileName.trim()
    : `${String(manifest.length + 1).padStart(2, '0')}-${name}.png`;
  const absPath = path.join(outputDir, fileName);
  if (options.selector) {
    await page.locator(options.selector).screenshot({
      path: absPath,
      scale: 'css'
    });
  } else {
    await page.screenshot({
      path: absPath,
      scale: 'css',
      fullPage: false
    });
  }
  manifest.push({
    file: fileName,
    note,
    selector: options.selector || null,
    state: await getState(page)
  });
  return absPath;
}

function buildReport({ outputDir, viewport, manifest, consoleErrors, pageErrors }) {
  const lines = [];
  lines.push('# Marketing Capture Run');
  lines.push('');
  lines.push(`- Output dir: \`${outputDir}\``);
  lines.push(`- Viewport: \`${viewport.width}x${viewport.height}\``);
  lines.push(`- Captures: \`${manifest.length}\``);
  lines.push('');
  lines.push('## Frames');
  lines.push('');
  manifest.forEach((entry) => {
    lines.push(`- \`${entry.file}\``);
    lines.push(`  - note: ${entry.note}`);
    lines.push(`  - mode: ${entry.state.mode}`);
    lines.push(`  - overlays: ${JSON.stringify(entry.state.overlays || {})}`);
  });
  lines.push('');
  lines.push('## Console Errors');
  lines.push('');
  if (consoleErrors.length === 0 && pageErrors.length === 0) {
    lines.push('- none');
  } else {
    consoleErrors.forEach((value) => lines.push(`- console: ${value}`));
    pageErrors.forEach((value) => lines.push(`- pageerror: ${value}`));
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const outputDir = path.resolve(
    args.outDir || path.join(REPO_ROOT, 'output', `marketing-captures-${timestampSlug()}`)
  );
  ensureDir(outputDir);

  const server = await startLocalServer({
    host: '127.0.0.1',
    port: 4173,
    silent: true,
    repoRoot: REPO_ROOT
  });

  const browser = await chromium.launch({
    headless: args.headless
  });
  const page = await browser.newPage({
    viewport: {
      width: args.width,
      height: args.height
    }
  });
  const consoleErrors = [];
  const pageErrors = [];
  let runError = null;

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });

  const manifest = [];

  try {
    await page.goto(server.indexUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.__spinClashUI === 'object', { timeout: 60000 });
    await sleep(1000);

    await goRoute(page, 'home', 'en');
    await setCaptureStyle(
      page,
      [
        '#ov-title .title-status,',
        '#ov-title .deco-line,',
        '#ov-title .title-actions,',
        '#ov-title .title-build-meta,',
        '#ov-title #home-command-panel,',
        '#ov-title .title-locale-switcher { display:none !important; }',
        '#ov-title { padding-top: 56px !important; }',
        '#ov-title .home-hero-panel { display:block !important; max-width:1100px !important; margin:0 auto !important; }',
        '#ov-title .home-top-panel { margin:32px auto 0 !important; }',
        '#ov-title .home-top-traits { display:none !important; }'
      ].join('\n')
    );
    await capturePage(page, outputDir, manifest, 'home-hero-wide-en', 'wide home hero source in English');
    await capturePage(page, outputDir, manifest, 'home-hero-panel-en', 'portrait-leaning hero panel source in English', {
      selector: '#home-top-panel'
    });
    await setCaptureStyle(
      page,
      [
        '.home-top-stage-shell { padding: 0 !important; overflow: hidden !important; }',
        '.home-top-stage { margin-top: -56px !important; }',
        '.home-top-stage canvas { transform: translateY(-56px) scale(1.06); transform-origin: center top; }'
      ].join('\n')
    );
    await capturePage(page, outputDir, manifest, 'home-top-stage-en', 'clean top-stage source in English', {
      selector: '.home-top-stage-shell'
    });
    await clearCaptureStyle(page);

    await goRoute(page, 'quick', 'en');
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
        '#quick-battle-panel { margin-top: 28px !important; }'
      ].join('\n')
    );
    await capturePage(page, outputDir, manifest, 'quick-shell-en', 'quick-battle shell source in English');
    await clearCaptureStyle(page);

    await page.evaluate(() => {
      window.__spinClashUI.setLocale('en');
      window.__spinClashUI.goQuick();
      window.__spinClashUI.startFight();
    });
    await sleep(900);
    await waitFor(page, (state) => state.mode === 'prepare');
    await page.evaluate(() => window.launch());
    await waitFor(page, (state) => state.mode === 'active');

    await page.evaluate(() => window.advanceTime(1400));
    await sleep(120);
    await capturePage(page, outputDir, manifest, 'battle-action-ui-01', 'battle action with gameplay UI', {
      fileName: '05-battle-action-ui-01.png'
    });

    await setCaptureStyle(
      page,
      [
        '#hud,',
        '#msg-txt,',
        '#hint-bar,',
        '.battle-commentary,',
        '#skill-panel,',
        '#act-swap,',
        '#timer-txt,',
        '#score-area { opacity:0 !important; visibility:hidden !important; }'
      ].join('\n'),
      { waitMs: 0 }
    );
    await page.evaluate(() => window.advanceTime(200));
    await sleep(50);
    await capturePage(page, outputDir, manifest, 'battle-action-clean', 'clean battle action source with HUD hidden and impact effect visible', {
      selector: '#gc',
      fileName: '07-battle-action-clean.png'
    });
    await clearCaptureStyle(page);

    await page.evaluate(() => window.advanceTime(1200));
    await sleep(120);
    await capturePage(page, outputDir, manifest, 'battle-action-ui-02', 'second battle action frame with gameplay UI', {
      fileName: '06-battle-action-ui-02.png'
    });

    let roundResultCaptured = false;
    let matchResultState = null;
    for (let loop = 0; loop < 8; loop += 1) {
      const state = await getState(page);
      if (state.overlays && state.overlays.matchResult) {
        matchResultState = state;
        break;
      }
      if (state.mode === 'active') {
        await page.evaluate(() => window.advanceTime(36000));
        await sleep(150);
        const nextState = await getState(page);
        if (nextState.overlays && nextState.overlays.roundResult && !roundResultCaptured) {
          await capturePage(page, outputDir, manifest, 'battle-round-result-en', 'round result source in English');
          roundResultCaptured = true;
        }
        continue;
      }
      if (state.overlays && state.overlays.roundResult) {
        if (!roundResultCaptured) {
          await capturePage(page, outputDir, manifest, 'battle-round-result-en', 'round result source in English');
          roundResultCaptured = true;
        }
        await sleep(2800);
        continue;
      }
      if (state.mode === 'prepare') {
        await page.evaluate(() => window.launch());
        await sleep(250);
        continue;
      }
      await sleep(300);
    }
    if (!matchResultState) {
      matchResultState = await waitFor(
        page,
        (state) => Boolean(state.overlays && state.overlays.matchResult),
        { timeoutMs: 20000 }
      );
    }
    await capturePage(page, outputDir, manifest, 'battle-finish-en', 'match result source in English');

    console.log(
      JSON.stringify(
        {
          ok: true,
          outputDir,
          files: manifest.map((entry) => entry.file),
          consoleErrors,
          pageErrors
        },
        null,
        2
      )
    );
  } catch (error) {
    runError = error;
    throw error;
  } finally {
    if (manifest.length > 0) {
      fs.writeFileSync(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            viewport: { width: args.width, height: args.height },
            outputDir,
            manifest,
            consoleErrors,
            pageErrors,
            runError: runError ? (runError.message || String(runError)) : null
          },
          null,
          2
        ),
        'utf8'
      );

      fs.writeFileSync(
        path.join(outputDir, 'report.md'),
        buildReport({
          outputDir,
          viewport: { width: args.width, height: args.height },
          manifest,
          consoleErrors,
          pageErrors
        }) + (runError ? `\n## Run Error\n\n- ${runError.message || String(runError)}\n` : ''),
        'utf8'
      );
    }
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
