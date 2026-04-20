import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = {
    mode: 'attach-check',
    evidenceMode: 'debug',
    url: 'http://127.0.0.1:4174/',
    width: 1440,
    height: 1200,
    out: '',
    route: 'home',
    outDir: '',
    currentPage: false,
    fullPage: false,
    diagnosticOverlay: false,
    selector: '',
    screenshotScale: 'css',
    wsUrl: '',
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--mode' && next) {
      args.mode = next;
      i++;
    } else if (arg === '--evidence-mode' && next) {
      args.evidenceMode = next;
      i++;
    } else if (arg === '--url' && next) {
      args.url = next;
      i++;
    } else if (arg === '--width' && next) {
      args.width = Number.parseInt(next, 10);
      i++;
    } else if (arg === '--height' && next) {
      args.height = Number.parseInt(next, 10);
      i++;
    } else if (arg === '--out' && next) {
      args.out = next;
      i++;
    } else if (arg === '--route' && next) {
      args.route = next;
      i++;
    } else if (arg === '--out-dir' && next) {
      args.outDir = next;
      i++;
    } else if (arg === '--current-page') {
      args.currentPage = true;
    } else if (arg === '--full-page') {
      args.fullPage = true;
    } else if (arg === '--diagnostic-overlay') {
      args.diagnosticOverlay = true;
    } else if (arg === '--selector' && next) {
      args.selector = next;
      i++;
    } else if (arg === '--screenshot-scale' && next) {
      args.screenshotScale = next;
      i++;
    } else if (arg === '--ws-url' && next) {
      args.wsUrl = next;
      i++;
    }
  }
  return args;
}

async function tryImport(specifier) {
  try {
    return await import(specifier);
  } catch {
    return null;
  }
}

async function loadPlaywright() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const openClawPlaywright = path.join(
    appData,
    'npm',
    'node_modules',
    'openclaw',
    'node_modules',
    'playwright-core',
    'index.mjs'
  );
  for (const candidate of ['playwright', 'playwright-core', fs.existsSync(openClawPlaywright) ? pathToFileURL(openClawPlaywright).href : null].filter(Boolean)) {
    const mod = await tryImport(candidate);
    if (mod?.chromium) return mod.chromium;
  }
  throw new Error('Playwright not found');
}

function getChromeWsUrl() {
  const devToolsFile = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'Google',
    'Chrome',
    'User Data',
    'DevToolsActivePort'
  );
  const lines = fs
    .readFileSync(devToolsFile, 'utf8')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  return `ws://127.0.0.1:${lines[0]}${lines[1]}`;
}

function toHttpBase(wsUrl) {
  const url = new URL(wsUrl);
  url.protocol = 'http:';
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

async function createPage(browser, wsUrl, args) {
  const context = browser.contexts()[0];
  if (!context) throw new Error('No default browser context');
  if (args.currentPage) {
    const matchedPage = context
      .pages()
      .find((page) => {
        const pageUrl = page.url() || '';
        return pageUrl.startsWith(args.url);
      });
    if (matchedPage) {
      return { page: matchedPage, ownsPage: false };
    }
  }
  try {
    return { page: await context.newPage(), ownsPage: true };
  } catch {
    await fetch(`${toHttpBase(wsUrl)}/json/new?about:blank`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { page: context.pages().at(-1), ownsPage: true };
  }
}

async function attach() {
  const chromium = await loadPlaywright();
  const args = parseArgs(process.argv);
  const wsUrl = args.wsUrl || getChromeWsUrl();
  const browser = await chromium.connectOverCDP(wsUrl, { timeout: 45000 });
  const { page, ownsPage } = await createPage(browser, wsUrl, args);
  return { browser, page, wsUrl, ownsPage };
}

async function bootPage(page, args) {
  const cdp = await page.context().newCDPSession(page).catch(() => null);
  if (cdp && !args.currentPage) {
    await cdp
      .send('Emulation.setDeviceMetricsOverride', {
        width: args.width,
        height: args.height,
        deviceScaleFactor: 1,
        mobile: args.width <= 480,
        screenWidth: args.width,
        screenHeight: args.height,
      })
      .catch(() => {});
  }
  if (!args.currentPage) {
    await page.setViewportSize({ width: args.width, height: args.height }).catch(() => {});
    await page.goto(args.url, { waitUntil: 'networkidle', timeout: 60000 });
  } else if ((page.url() || '').startsWith(args.url) === false) {
    await page.goto(args.url, { waitUntil: 'networkidle', timeout: 60000 });
  }
  await page.keyboard.press('Control+0').catch(() => {});
  await page.waitForTimeout(300);
  await page.waitForFunction(() => typeof window.__spinClashUI === 'object', { timeout: 60000 });
  await page.waitForTimeout(1000);
}

async function setRoute(page, route) {
  await page.evaluate((routeName) => {
    const ui = window.__spinClashUI;
    if (!ui) throw new Error('missing __spinClashUI');
    if (routeName === 'home' && typeof ui.goHome === 'function') ui.goHome();
    if (routeName === 'path' && typeof ui.goPath === 'function') ui.goPath();
    if (routeName === 'quick' && typeof ui.goQuick === 'function') ui.goQuick();
    if (routeName === 'workshop' && typeof ui.goWorkshop === 'function') ui.goWorkshop();
    if (routeName === 'settings' && typeof ui.goSettings === 'function') ui.goSettings();
  }, route);
  await page.waitForTimeout(1000);
}

async function applyDiagnosticOverlay(page) {
  await page.evaluate(() => {
    const existing = document.getElementById('__codex_diag_overlay');
    if (existing) existing.remove();
    const root = document.createElement('div');
    root.id = '__codex_diag_overlay';
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '999999';

    const makeCorner = (left, top, right, bottom, bg, label) => {
      const el = document.createElement('div');
      el.textContent = label;
      el.style.position = 'absolute';
      if (left != null) el.style.left = left;
      if (top != null) el.style.top = top;
      if (right != null) el.style.right = right;
      if (bottom != null) el.style.bottom = bottom;
      el.style.width = '80px';
      el.style.height = '80px';
      el.style.background = bg;
      el.style.color = '#fff';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.font = '700 14px monospace';
      el.style.border = '2px solid rgba(255,255,255,.9)';
      root.appendChild(el);
    };

    makeCorner('0', '0', null, null, 'rgba(255,0,0,.9)', 'TL');
    makeCorner(null, '0', '0', null, 'rgba(0,180,0,.9)', 'TR');
    makeCorner('0', null, null, '0', 'rgba(0,120,255,.9)', 'BL');
    makeCorner(null, null, '0', '0', 'rgba(255,180,0,.95)', 'BR');

    const center = document.createElement('div');
    center.textContent = `CENTER ${window.innerWidth}x${window.innerHeight}`;
    center.style.position = 'absolute';
    center.style.left = '50%';
    center.style.top = '50%';
    center.style.transform = 'translate(-50%,-50%)';
    center.style.padding = '10px 14px';
    center.style.background = 'rgba(255,255,255,.92)';
    center.style.color = '#000';
    center.style.font = '700 16px monospace';
    center.style.border = '2px solid #000';
    root.appendChild(center);

    const overlayHost = document.getElementById('ov-title')?.classList.contains('hide')
      ? document.getElementById('ov-loadout')
      : document.getElementById('ov-title');
    (overlayHost || document.body).appendChild(root);
  });
  await page.waitForTimeout(150);
}

async function main() {
  const args = parseArgs(process.argv);
  if (
    args.evidenceMode === 'visual-approval' &&
    (args.mode === 'screenshot' || args.mode === 'batch-screenshots')
  ) {
    throw new Error(
      'visual-approval mode is not supported by local-browser-qa.js. ' +
      'For final visual approval, use a revalidated Codex browser proxy chain or real user-visible browser screenshots.'
    );
  }
  const { browser, page, wsUrl, ownsPage } = await attach();
  try {
    if (args.mode === 'attach-check') {
      console.log(JSON.stringify({ ok: true, wsUrl, contexts: browser.contexts().length }, null, 2));
      return;
    }

    await bootPage(page, args);

    if (args.mode === 'metrics') {
      if (args.route) {
        await setRoute(page, args.route);
      }
      const metrics = await page.evaluate(() => ({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        innerWidth: window.innerWidth,
        outerWidth: window.outerWidth,
        devicePixelRatio: window.devicePixelRatio,
        visualViewportWidth: window.visualViewport ? window.visualViewport.width : null,
        visualViewportHeight: window.visualViewport ? window.visualViewport.height : null,
        visualViewportScale: window.visualViewport ? window.visualViewport.scale : null,
        bodyClientWidth: document.body.clientWidth,
        bodyClientHeight: document.body.clientHeight,
        docClientWidth: document.documentElement.clientWidth,
        docClientHeight: document.documentElement.clientHeight,
        titleRect: document.getElementById('title-wrap')?.getBoundingClientRect?.() || null,
        homePanelRect: document.getElementById('home-top-panel')?.getBoundingClientRect?.() || null,
        homeProgressRect: document.querySelector('.title-status')?.getBoundingClientRect?.() || null,
        homeActionsRect: document.querySelector('.title-actions')?.getBoundingClientRect?.() || null,
        homePrimaryButtonRect: document.getElementById('btn-enter')?.getBoundingClientRect?.() || null,
        routeBarRect: document.getElementById('shell-route-bar')?.getBoundingClientRect?.() || null,
        challengeRect: document.getElementById('challenge-panel')?.getBoundingClientRect?.() || null,
        pathFightRect: document.getElementById('btn-path-fight')?.getBoundingClientRect?.() || null,
        quickRect: document.getElementById('quick-battle-panel')?.getBoundingClientRect?.() || null,
        quickFightRect: document.getElementById('btn-fight')?.getBoundingClientRect?.() || null,
        quickTopActionRect: document.getElementById('btn-quick-top-action')?.getBoundingClientRect?.() || null,
        workshopRect: document.getElementById('workshop-panel')?.getBoundingClientRect?.() || null,
        workshopHeadRect: document.querySelector('.workshop-head')?.getBoundingClientRect?.() || null,
        settingsRect: document.getElementById('settings-panel')?.getBoundingClientRect?.() || null,
        ovTitleClass: document.getElementById('ov-title')?.className || null,
        ovTitleOpacity: getComputedStyle(document.getElementById('ov-title') || document.body).opacity,
        ovLoadoutOpacity: getComputedStyle(document.getElementById('ov-loadout') || document.body).opacity,
      }));
      console.log(JSON.stringify(metrics, null, 2));
      return;
    }

    if (args.mode === 'screenshot') {
      if (!args.out) throw new Error('--out is required for screenshot mode');
      await setRoute(page, args.route);
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
      await page.waitForTimeout(150);
      if (args.diagnosticOverlay) {
        await applyDiagnosticOverlay(page);
      }
      fs.mkdirSync(path.dirname(args.out), { recursive: true });
      if (args.selector) {
        await page.locator(args.selector).screenshot({ path: args.out, scale: args.screenshotScale });
      } else {
        await page.screenshot({ path: args.out, fullPage: args.fullPage, scale: args.screenshotScale });
      }
      console.log(JSON.stringify({ ok: true, route: args.route, out: args.out }, null, 2));
      return;
    }

    if (args.mode === 'batch-screenshots') {
      if (!args.outDir) throw new Error('--out-dir is required for batch-screenshots mode');
      fs.mkdirSync(args.outDir, { recursive: true });
      for (const route of ['home', 'path', 'quick', 'workshop', 'settings']) {
        await setRoute(page, route);
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await page.waitForTimeout(150);
        const outPath = path.join(args.outDir, `${route}.png`);
        await page.screenshot({ path: outPath, fullPage: args.fullPage });
      }
      console.log(JSON.stringify({ ok: true, outDir: args.outDir }, null, 2));
      return;
    }

    throw new Error(`Unsupported mode: ${args.mode}`);
  } finally {
    if (ownsPage) {
      await page.close().catch(() => {});
    }
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
