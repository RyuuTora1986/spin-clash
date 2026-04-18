const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const analyticsDocPath = path.join(repoRoot, 'docs', 'analytics-events.md');
const failures = [];

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

function collectTrackedEvents() {
  const events = new Set();
  const pattern = /\.track\(\s*['"]([^'"]+)['"]/g;

  for (const jsFile of collectJsFiles(srcDir)) {
    const text = fs.readFileSync(jsFile, 'utf8');
    let match;
    while ((match = pattern.exec(text)) !== null) {
      events.add(match[1]);
    }
  }

  return events;
}

function collectDocumentedEvents() {
  const text = fs.readFileSync(analyticsDocPath, 'utf8');
  const events = new Set();
  const pattern = /^### `([^`]+)`/gm;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    events.add(match[1]);
  }
  return events;
}

function main() {
  const trackedEvents = collectTrackedEvents();
  const documentedEvents = collectDocumentedEvents();

  for (const eventName of trackedEvents) {
    if (!documentedEvents.has(eventName)) {
      failures.push(`Tracked event missing from docs/analytics-events.md: ${eventName}`);
    }
  }

  if (failures.length) {
    console.error('Analytics event consistency check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Analytics event consistency check passed.');
}

main();
