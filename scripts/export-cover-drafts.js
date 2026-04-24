const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const args = {
    htmlFile: ''
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--html-file' && next) {
      args.htmlFile = next;
      index += 1;
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

async function isolateDraft(page, selector, width, height) {
  await page.evaluate(({ nextSelector, nextWidth, nextHeight }) => {
    const source = document.querySelector(nextSelector);
    if (!source) {
      throw new Error(`Missing draft selector: ${nextSelector}`);
    }

    const clone = source.cloneNode(true);
    clone.style.width = `${nextWidth}px`;
    clone.style.height = `${nextHeight}px`;
    clone.style.maxWidth = 'none';
    clone.style.margin = '0';

    document.body.innerHTML = '';
    document.body.className = 'export-mode';
    document.body.style.margin = '0';
    document.body.style.minHeight = `${nextHeight}px`;
    document.body.style.display = 'grid';
    document.body.style.placeItems = 'center';
    document.body.style.background = '#040712';
    document.body.style.padding = '0';
    document.body.appendChild(clone);
  }, {
    nextSelector: selector,
    nextWidth: width,
    nextHeight: height
  });
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const args = parseArgs(process.argv);
  const sourceDir = args.htmlFile
    ? path.dirname(path.resolve(args.htmlFile))
    : getLatestMarketingDir(repoRoot);
  const htmlFile = path.resolve(args.htmlFile || path.join(sourceDir, 'cover-board.html'));

  if (!fs.existsSync(htmlFile)) {
    throw new Error(`Missing HTML file: ${htmlFile}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: {
      width: 1800,
      height: 2200
    }
  });

  try {
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(350);

    const previewPath = path.join(sourceDir, 'cover-board-preview.png');
    await page.screenshot({
      path: previewPath,
      fullPage: true,
      scale: 'css'
    });

    const exports = [
      {
        selector: '#draft-landscape',
        width: 1920,
        height: 1080,
        file: 'cover-draft-landscape-1920x1080.png'
      },
      {
        selector: '#draft-portrait',
        width: 800,
        height: 1200,
        file: 'cover-draft-portrait-800x1200.png'
      },
      {
        selector: '#draft-square',
        width: 800,
        height: 800,
        file: 'cover-draft-square-800x800.png'
      }
    ];

    for (const draft of exports) {
      await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(180);
      await isolateDraft(page, draft.selector, draft.width, draft.height);
      await page.setViewportSize({
        width: draft.width,
        height: draft.height
      });
      await page.waitForTimeout(80);
      await page.locator(draft.selector).screenshot({
        path: path.join(sourceDir, draft.file),
        scale: 'css'
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          htmlFile,
          preview: previewPath,
          files: exports.map((entry) => path.join(sourceDir, entry.file))
        },
        null,
        2
      )
    );
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exit(1);
  });
}
