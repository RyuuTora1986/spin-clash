const fs = require('fs');
const path = require('path');
const {
  collectBuildVersionFailures,
  collectVersioningFailures,
  readPackageVersion
} = require('./static-asset-versioning');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const indexHtmlPath = path.join(repoRoot, 'index.html');
const configTextPath = path.join(srcDir, 'config-text.js');
const failures = [];

const dynamicIds = new Set([
  'debug-panel-wrap',
  'debug-panel',
  'debug-panel-status',
  'storage-notice',
  'runtime-error-box'
]);

function collectJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(absPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(absPath);
    }
  }
  return results;
}

function collectReferencedIds() {
  const idPattern = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  const ids = new Set();

  for (const jsFile of collectJsFiles(srcDir)) {
    const text = fs.readFileSync(jsFile, 'utf8');
    let match;
    while ((match = idPattern.exec(text)) !== null) {
      ids.add(match[1]);
    }
  }

  return ids;
}

function collectHtmlIds() {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const idPattern = /\bid="([^"]+)"/g;
  const ids = new Set();
  let match;
  while ((match = idPattern.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

function main() {
  const packageVersion = readPackageVersion(repoRoot);
  const referencedIds = collectReferencedIds();
  const htmlIds = collectHtmlIds();
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const configText = fs.readFileSync(configTextPath, 'utf8');
  const requiredIds = [
    'locale-title-switcher',
    'locale-loadout-switcher',
    'locale-settings-switcher',
    'locale-title-en',
    'locale-title-zh',
    'locale-title-ja',
    'locale-loadout-en',
    'locale-loadout-zh',
    'locale-loadout-ja',
    'locale-settings-en',
    'locale-settings-zh',
    'locale-settings-ja'
  ];

  for (const id of referencedIds) {
    if (dynamicIds.has(id)) continue;
    if (!htmlIds.has(id)) {
      failures.push(`Missing DOM id in index.html: ${id}`);
    }
  }

  for (const id of requiredIds) {
    if (!htmlIds.has(id)) {
      failures.push(`Missing required localization DOM id in index.html: ${id}`);
    }
  }

  for (const failure of collectVersioningFailures(html, packageVersion)) {
    failures.push(`Static runtime asset version mismatch: ${failure}`);
  }

  for (const failure of collectBuildVersionFailures(configText, packageVersion)) {
    failures.push(`Build version label mismatch: ${failure}`);
  }

  if (failures.length) {
    console.error('DOM contract check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('DOM contract check passed.');
}

main();
