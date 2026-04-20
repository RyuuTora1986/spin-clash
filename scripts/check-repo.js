const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function assertExists(relPath, label) {
  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    failures.push(`${label || relPath} missing: ${relPath}`);
  }
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function normalizeWebPath(ref) {
  return ref
    .replace(/^[.][\\/]/, '')
    .replace(/[?#].*$/, '')
    .replace(/\//g, path.sep);
}

function checkIndexReferences() {
  const html = readText('index.html');
  const refPattern = /<(?:script|link)\b[^>]+(?:src|href)="(\.\/[^"]+)"/g;
  const seen = new Set();
  let match;
  while ((match = refPattern.exec(html)) !== null) {
    const rawRef = match[1];
    if (/^\.\/https?:/i.test(rawRef)) continue;
    if (/^\.\/\//.test(rawRef)) continue;
    const relPath = normalizeWebPath(rawRef);
    if (seen.has(relPath)) continue;
    seen.add(relPath);
    assertExists(relPath, `index.html reference`);
  }
}

function checkForbiddenRemoteRuntimeAssets() {
  const html = readText('index.html');
  const css = readText('css/game.css');
  const remoteAssetPattern = /https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i;
  if (remoteAssetPattern.test(html) || remoteAssetPattern.test(css)) {
    failures.push('Remote font dependency detected in runtime entry files.');
  }
}

function checkRequiredDocs() {
  [
    'docs/docs-index.md',
    'docs/local-operations.md',
    'docs/manual-test-batches.md',
    'docs/deployment-preflight.md',
    'docs/deployment-notes.md',
    'docs/launch-blockers.md',
    'docs/project-status-2026-04-17.md',
    'docs/host-validation-plan.md',
    'docs/host-validation-report-template.md',
    'docs/provider-preflight.md',
    'docs/provider-phase-plan.md',
    'docs/provider-phase-report-template.md'
  ].forEach((docPath) => assertExists(docPath, 'required doc'));
}

function main() {
  [
    'index.html',
    'ads.txt',
    'css/game.css',
    'src/main.js',
    'assets/vendor/three.min.js',
    'originals/spin_clash.original.html',
    'run-preflight.cmd',
    'run-local-server.cmd'
  ].forEach((relPath) => assertExists(relPath, 'required runtime file'));

  checkIndexReferences();
  checkForbiddenRemoteRuntimeAssets();
  checkRequiredDocs();

  if (failures.length) {
    console.error('Repository structure check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Repository structure check passed.');
}

main();
