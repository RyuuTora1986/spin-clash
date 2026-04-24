const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { readPackageVersion } = require('./static-asset-versioning');

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
      path.join('assets', 'fx', 'impact-burst-v1.png'),
      path.join('assets', 'fx', 'ringout-flash-v1.png'),
      path.join('assets', 'audio', 'music', 'home_neon_grind_01.mp3'),
      path.join('assets', 'audio', 'music', 'battle_redline_01.mp3'),
      path.join('assets', 'audio', 'music', 'battle_redline_02.mp3'),
      path.join('assets', 'audio', 'music', 'battle_redline_03.mp3')
    ].forEach(expectExists);
    ['src', path.join('assets', 'vendor'), 'docs', 'originals', 'scripts', 'package.json', 'README.md', 'progress.md'].forEach(expectMissing);

    const packagedIndexHtml = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');
    if (!new RegExp(`<link rel="stylesheet" href="\\./css/game\\.css\\?v=${packageVersion.replace(/\./g, '\\.')}"`).test(packagedIndexHtml)) {
      failures.push(`Expected packaged index.html to keep the versioned CSS href for ${packageVersion}.`);
    }
    if (/<script\b[^>]+\bsrc="\.\/*src\//i.test(packagedIndexHtml)) {
      failures.push('Packaged index.html should not reference ./src/*.js assets.');
    }

    const localScriptRefs = [...packagedIndexHtml.matchAll(/<script\b[^>]+\bsrc="\.\/*([^"]+)"[^>]*><\/script>/gi)]
      .map((match) => match[1]);
    if (localScriptRefs.length !== 2) {
      failures.push(`Expected exactly two packaged local script bundles, found ${localScriptRefs.length}.`);
    }

    const vendorBundleRelPath = localScriptRefs.find((ref) => /^assets\/three\.[a-f0-9]{12,}\.js$/i.test(ref)) || '';
    const appBundleRelPath = localScriptRefs.find((ref) => /^assets\/spin-clash-app\.[a-f0-9]{12,}\.js$/i.test(ref)) || '';

    if (!vendorBundleRelPath) {
      failures.push(`Expected packaged vendor bundle to use a hashed filename, got ${localScriptRefs.join(', ') || 'none'}.`);
    }
    if (!appBundleRelPath) {
      failures.push(`Expected packaged app bundle to use a hashed filename, got ${localScriptRefs.join(', ') || 'none'}.`);
    }

    [vendorBundleRelPath, appBundleRelPath].filter(Boolean).forEach((bundleRelPath) => {
      const hashMatch = bundleRelPath.match(/\.([a-f0-9]{12,})\.js$/i);
      const bundleAbsPath = path.join(distRoot, bundleRelPath);
      if (!hashMatch) {
        failures.push(`Hashed asset name is malformed: ${bundleRelPath}`);
        return;
      }
      if (!fs.existsSync(bundleAbsPath)) {
        failures.push(`Packaged bundle is missing: ${bundleRelPath}`);
        return;
      }
      const bundleBytes = fs.readFileSync(bundleAbsPath);
      const actualHash = crypto.createHash('sha256').update(bundleBytes).digest('hex').slice(0, hashMatch[1].length);
      if (actualHash !== hashMatch[1].toLowerCase()) {
        failures.push(`Bundled asset hash mismatch: filename has ${hashMatch[1]}, content hashes to ${actualHash}.`);
      }
      if (bundleRelPath === appBundleRelPath && bundleBytes.toString('utf8').split(/\r?\n/).length > 5) {
        failures.push('Packaged app bundle should be minified to only a handful of lines.');
      }
    });

    if (appBundleRelPath) {
      const appBundleText = fs.readFileSync(path.join(distRoot, appBundleRelPath), 'utf8');
      [
        { label: 'debug runtime tool source', pattern: /debug-runtime-tools/i },
        { label: 'debug query flag', pattern: /\?debug=1/ },
        { label: 'legacy render_game_to_text hook', pattern: /render_game_to_text/ },
        { label: 'legacy advanceTime global hook', pattern: /window\.advanceTime/ },
        { label: 'legacy __spinClashUI global', pattern: /__spinClashUI/ }
      ].forEach(({ label, pattern }) => {
        if (pattern.test(appBundleText) || pattern.test(packagedIndexHtml)) {
          failures.push(`Packaged bundle still exposes banned production debug surface: ${label}.`);
        }
      });

      [
        { label: 'shared backend daily path', pattern: /\/daily\b/ },
        { label: 'shared backend progression path', pattern: /\/progression\b/ },
        { label: 'shared backend reward claim path', pattern: /\/rewards\/claim\b/ }
      ].forEach(({ label, pattern }) => {
        if (!pattern.test(appBundleText)) {
          failures.push(`Packaged bundle is missing shared backend marker: ${label}.`);
        }
      });
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
