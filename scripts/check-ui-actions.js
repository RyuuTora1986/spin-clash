const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(repoRoot, 'index.html');
const uiEntryToolsPath = path.join(repoRoot, 'src', 'ui-entry-tools.js');
const failures = [];

function collectInvokedActions() {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const pattern = /__spinClashInvoke\(\s*['"]([^'"]+)['"]/g;
  const actions = new Set();
  let match;
  while ((match = pattern.exec(html)) !== null) {
    actions.add(match[1]);
  }
  return actions;
}

function collectExposedActions() {
  const text = fs.readFileSync(uiEntryToolsPath, 'utf8');
  const actions = new Set();
  const bindingBlockMatch = text.match(/window\.__spinClashUI\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!bindingBlockMatch) {
    failures.push('Could not find window.__spinClashUI binding block in src/ui-entry-tools.js');
    return actions;
  }

  const block = bindingBlockMatch[1];
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim().replace(/,$/, '');
    if (!line || line.startsWith('//')) continue;

    const pairMatch = line.match(/^([A-Za-z0-9_]+)\s*:/);
    if (pairMatch) {
      actions.add(pairMatch[1]);
      continue;
    }

    const shorthandMatch = line.match(/^([A-Za-z0-9_]+)$/);
    if (shorthandMatch) {
      actions.add(shorthandMatch[1]);
    }
  }
  return actions;
}

function main() {
  const invoked = collectInvokedActions();
  const exposed = collectExposedActions();
  const requiredActions = new Set(['setLocale', 'guard', 'openInfo', 'closeInfo']);

  for (const action of invoked) {
    if (!exposed.has(action) && action !== 'enterBattle') {
      failures.push(`index.html invokes missing UI action: ${action}`);
    }
  }

  for (const action of requiredActions) {
    if (!exposed.has(action)) {
      failures.push(`Missing required UI action: ${action}`);
    }
  }

  if (failures.length) {
    console.error('UI action contract check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('UI action contract check passed.');
}

main();
