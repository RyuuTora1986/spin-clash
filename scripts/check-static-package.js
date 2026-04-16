const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist-static');
const failures = [];

function expectExists(relPath) {
  const absPath = path.join(distRoot, relPath);
  if (!fs.existsSync(absPath)) {
    failures.push(`Missing packaged path: ${relPath}`);
  }
}

function expectMissing(relPath) {
  const absPath = path.join(distRoot, relPath);
  if (fs.existsSync(absPath)) {
    failures.push(`Unexpected packaged path: ${relPath}`);
  }
}

function main() {
  if (!fs.existsSync(distRoot)) {
    failures.push('dist-static is missing. Run `npm run build:static` first.');
  } else {
    ['index.html', 'css', 'src', path.join('assets', 'vendor', 'three.min.js')].forEach(expectExists);
    ['docs', 'originals', 'scripts', 'package.json', 'README.md', 'progress.md'].forEach(expectMissing);
  }

  if (failures.length) {
    console.error('Static package check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Static package check passed.');
}

main();
