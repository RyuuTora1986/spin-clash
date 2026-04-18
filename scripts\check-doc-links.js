const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function walkMarkdownFiles(startDir) {
  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(absPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(absPath);
    }
  }
  return results;
}

function stripAnchor(target) {
  return target.split('#')[0];
}

function shouldCheckTarget(target) {
  if (!target) return false;
  if (target.startsWith('http://') || target.startsWith('https://')) return false;
  if (target.startsWith('mailto:')) return false;
  if (target.startsWith('file://')) return false;
  if (target.startsWith('<')) return false;
  return true;
}

function checkFileLinks(absFilePath) {
  const text = fs.readFileSync(absFilePath, 'utf8');
  const relFilePath = path.relative(repoRoot, absFilePath);
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const rawTarget = match[1].trim();
    if (!shouldCheckTarget(rawTarget)) continue;

    const target = stripAnchor(rawTarget);
    if (!target) continue;

    const resolved = path.resolve(path.dirname(absFilePath), target);
    if (!fs.existsSync(resolved)) {
      failures.push(`${relFilePath} -> missing link target: ${rawTarget}`);
    }
  }
}

function main() {
  const markdownFiles = [
    path.join(repoRoot, 'README.md'),
    ...walkMarkdownFiles(path.join(repoRoot, 'docs'))
  ];

  markdownFiles.forEach(checkFileLinks);

  if (failures.length) {
    console.error('Documentation link check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Documentation link check passed.');
}

main();
