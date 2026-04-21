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
    const packagedProviderOverrides = fs.readFileSync(path.join(distRoot, 'src', 'config-providers-override.js'), 'utf8');
    for (const failure of collectVersioningFailures(packagedIndexHtml, packageVersion)) {
      failures.push(`Packaged static runtime asset version mismatch: ${failure}`);
    }
    for (const failure of collectBuildVersionFailures(packagedConfigText, packageVersion)) {
      failures.push(`Packaged build version label mismatch: ${failure}`);
    }

    const h5AdapterEnabled = /"adapter"\s*:\s*"adsense_h5_rewarded"/.test(packagedProviderOverrides)
      && /"enabled"\s*:\s*true/.test(packagedProviderOverrides)
      && /"h5"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/.test(packagedProviderOverrides);
    if (h5AdapterEnabled) {
      if (!/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/.test(packagedIndexHtml)) {
        failures.push('Packaged H5 release is missing the static AdSense H5 script tag in <head>.');
      }
      if (!/window\.adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]/.test(packagedIndexHtml)) {
        failures.push('Packaged H5 release is missing the AdSense H5 bootstrap queue snippet in <head>.');
      }
      if (!/window\.adConfig\(\{[\s\S]*preloadAdBreaks/.test(packagedIndexHtml)) {
        failures.push('Packaged H5 release is missing the initial AdSense H5 adConfig preload call in <head>.');
      }
      if (!/__spinClashAdsenseH5Bootstrap[\s\S]*ready\s*=\s*true/.test(packagedIndexHtml)) {
        failures.push('Packaged H5 release is missing the AdSense H5 onReady bootstrap marker in <head>.');
      }
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
