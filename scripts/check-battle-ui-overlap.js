const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startLocalServer } = require('./serve-local');

const REPO_ROOT = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { id: 'desktop', width: 1280, height: 720, isMobile: false },
  { id: 'portrait', width: 390, height: 844, isMobile: true },
  { id: 'landscape', width: 844, height: 390, isMobile: true }
];

const UI_SELECTORS = [
  { label: 'player-hud', selector: '#p-panel' },
  { label: 'enemy-hud', selector: '#e-panel' },
  { label: 'skill-panel', selector: '#skill-panel' },
  { label: 'swap-button', selector: '#act-swap' },
  { label: 'score-area', selector: '#score-area' },
  { label: 'timer', selector: '#timer-txt' },
  { label: 'hint', selector: '#hint-bar' },
  { label: 'message', selector: '#msg-txt' },
  { label: 'battle-intro', selector: '#battle-intro' },
  { label: 'commentary', selector: '#battle-commentary .battle-commentary-item', multiple: true }
];

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseArgs(argv) {
  const args = {
    outDir: path.join(REPO_ROOT, 'output', `battle-ui-overlap-check-${timestampSlug()}`),
    headed: false
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--out-dir' && next) {
      args.outDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (token === '--headed') {
      args.headed = true;
    }
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPageReady(page) {
  await page.waitForFunction(() => {
    return typeof window.__spinClashInvoke === 'function'
      && !!document.querySelector('#gc canvas')
      && !!document.getElementById('btn-enter-quick');
  }, { timeout: 60000 });
}

async function enterQuickBattle(page) {
  await page.evaluate(() => {
    window.__spinClashInvoke('setLocale', 'en');
    window.__spinClashInvoke('goQuick');
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    window.__spinClashInvoke('startFight');
  });
  await page.waitForFunction(() => {
    const hud = document.getElementById('hud');
    return hud && window.getComputedStyle(hud).display !== 'none';
  }, { timeout: 20000 });
}

async function launchFromPrepare(page) {
  await page.evaluate(() => {
    const canvas = document.querySelector('#gc canvas');
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const points = [
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.82 },
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.72 },
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.62 }
    ];

    function fire(type, point) {
      canvas.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: type === 'mouseup' ? 0 : 1,
        clientX: point.x,
        clientY: point.y
      }));
    }

    fire('mousedown', points[0]);
    fire('mousemove', points[1]);
    fire('mousemove', points[2]);
    fire('mouseup', points[2]);
    return true;
  });
}

async function seedCommentaryStress(page) {
  await page.waitForFunction(() => {
    return !!(
      window.SpinClash
      && window.SpinClash.debug
      && window.SpinClash.debug.battleCommentaryTools
      && typeof window.SpinClash.debug.battleCommentaryTools.showCommentary === 'function'
    );
  }, { timeout: 10000 });
  await page.evaluate(() => {
    const tools = window.SpinClash.debug.battleCommentaryTools;
    tools.clear();
    tools.showCommentary('centerClaim', { leader: 'You' }, {
      priority: 10,
      minGapMs: 0,
      duration: 6,
      tone: 'momentum'
    });
    tools.showCommentary('edgePressure', { leader: 'You', target: 'Opponent' }, {
      priority: 10,
      minGapMs: 0,
      duration: 6,
      tone: 'alert'
    });
  });
}

function intersection(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return {
    width,
    height,
    area: width * height
  };
}

function isRealOverlap(a, b) {
  const hit = intersection(a.rect, b.rect);
  return hit.width >= 5 && hit.height >= 5 && hit.area >= 30;
}

async function collectUiState(page) {
  const selectors = UI_SELECTORS;
  return page.evaluate((targetSelectors) => {
    function hasInvisibleAncestor(node) {
      let current = node;
      while (current && current.nodeType === 1) {
        const style = window.getComputedStyle(current);
        const opacity = Number.parseFloat(style.opacity || '1');
        if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || opacity <= 0.08) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    }

    function rectOf(node) {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    }

    const boxes = [];
    for (const spec of targetSelectors) {
      const nodes = Array.from(document.querySelectorAll(spec.selector));
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2 || hasInvisibleAncestor(node)) return;
        boxes.push({
          label: spec.multiple ? `${spec.label}-${index + 1}` : spec.label,
          selector: spec.selector,
          rect: rectOf(node)
        });
      });
    }
    return boxes;
  }, selectors);
}

async function auditViewport(browser, viewport, outDir) {
  const context = await browser.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height
    },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (error) {}
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon\.ico/i.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });

  const frames = [];
  const overlaps = [];
  try {
    await page.goto(global.__spinClashServerUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageReady(page);
    await page.evaluate(() => {
      const debugPanel = document.getElementById('debug-panel-wrap');
      if (debugPanel) debugPanel.style.display = 'none';
    });
    await enterQuickBattle(page);
    await sleep(250);
    await launchFromPrepare(page);
    await seedCommentaryStress(page);
    await sleep(350);

    for (let frameIndex = 0; frameIndex < 6; frameIndex += 1) {
      const boxes = await collectUiState(page);
      for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
          const leftBox = boxes[leftIndex];
          const rightBox = boxes[rightIndex];
          if (isRealOverlap(leftBox, rightBox)) {
            overlaps.push({
              frame: frameIndex + 1,
              pair: [leftBox.label, rightBox.label],
              rects: [leftBox.rect, rightBox.rect]
            });
          }
        }
      }

      const screenshotName = `${viewport.id}-${String(frameIndex + 1).padStart(2, '0')}.png`;
      await page.screenshot({
        path: path.join(outDir, screenshotName),
        scale: 'css'
      });
      frames.push({
        frame: frameIndex + 1,
        screenshot: screenshotName,
        boxes
      });
      await sleep(350);
    }
  } finally {
    await context.close();
  }

  return {
    viewport,
    frames,
    overlaps,
    consoleErrors,
    pageErrors
  };
}

async function main() {
  const args = parseArgs(process.argv);
  ensureDir(args.outDir);

  const server = await startLocalServer({
    host: '127.0.0.1',
    port: 4473,
    maxPort: 4573,
    silent: true
  });
  global.__spinClashServerUrl = server.debugUrl;

  const browser = await chromium.launch({ headless: !args.headed });
  const results = [];
  let runError = null;
  try {
    for (const viewport of VIEWPORTS) {
      results.push(await auditViewport(browser, viewport, args.outDir));
    }
  } catch (error) {
    runError = error;
  } finally {
    await browser.close();
    await server.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    outDir: args.outDir,
    results
  };
  fs.writeFileSync(path.join(args.outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  if (runError) {
    throw runError;
  }

  const allOverlaps = results.flatMap((result) =>
    result.overlaps.map((overlap) => ({
      viewport: result.viewport.id,
      ...overlap
    }))
  );
  const allConsoleErrors = results.flatMap((result) => result.consoleErrors);
  const allPageErrors = results.flatMap((result) => result.pageErrors);

  if (allOverlaps.length || allConsoleErrors.length || allPageErrors.length) {
    const summaryPath = path.join(args.outDir, 'report.json');
    console.error(`Battle UI overlap check failed. Report: ${summaryPath}`);
    if (allOverlaps.length) {
      console.error(JSON.stringify(allOverlaps.slice(0, 12), null, 2));
    }
    if (allConsoleErrors.length || allPageErrors.length) {
      console.error(JSON.stringify({ consoleErrors: allConsoleErrors, pageErrors: allPageErrors }, null, 2));
    }
    process.exit(1);
  }

  console.log(`battle ui overlap check ok: ${args.outDir}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
