const fs = require('fs');
const path = require('path');
const {
  collectBuildVersionFailures,
  collectVersioningFailures,
  readPackageVersion
} = require('./static-asset-versioning');

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
  const packageVersion = readPackageVersion(repoRoot);
  if (!fs.existsSync(distRoot)) {
    failures.push('dist-static is missing. Run `npm run build:static` first.');
  } else {
    [
      'index.html',
      'ads.txt',
      'css',
      'src',
      path.join('src', 'config-providers-override.js'),
      path.join('src', 'config-providers-runtime.js'),
      path.join('assets', 'vendor', 'three.min.js')
    ].forEach(expectExists);
    ['docs', 'originals', 'scripts', 'package.json', 'README.md', 'progress.md'].forEach(expectMissing);

    const packagedIndexHtml = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');
    const packagedConfigText = fs.readFileSync(path.join(distRoot, 'src', 'config-text.js'), 'utf8');
    for (const failure of collectVersioningFailures(packagedIndexHtml, packageVersion)) {
      failures.push(`Packaged static runtime asset version mismatch: ${failure}`);
    }
    for (const failure of collectBuildVersionFailures(packagedConfigText, packageVersion)) {
      failures.push(`Packaged build version label mismatch: ${failure}`);
    }
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
