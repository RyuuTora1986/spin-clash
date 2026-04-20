const fs = require('fs');
const path = require('path');

const LOCAL_RUNTIME_ASSET_PATTERN = /(<(?:script|link)\b[^>]+\b(?:src|href)=")(\.\/(?:css\/[^"?]+\.css|src\/[^"?]+\.js))(?:\?([^"#]*))?(")/g;

function getRepoRoot() {
  return path.resolve(__dirname, '..');
}

function readPackageVersion(repoRoot = getRepoRoot()) {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (typeof packageJson.version !== 'string' || !packageJson.version.trim()) {
    throw new Error('package.json version is required for static asset versioning.');
  }
  return packageJson.version.trim();
}

function collectLocalRuntimeAssetRefs(html) {
  const refs = [];
  const pattern = new RegExp(LOCAL_RUNTIME_ASSET_PATTERN.source, LOCAL_RUNTIME_ASSET_PATTERN.flags);
  let match;
  while ((match = pattern.exec(html)) !== null) {
    refs.push({
      assetPath: match[2],
      query: match[3] || ''
    });
  }
  return refs;
}

function applyVersionToIndexHtml(html, version) {
  return html.replace(LOCAL_RUNTIME_ASSET_PATTERN, (fullMatch, prefix, assetPath, query, suffix) => {
    return `${prefix}${assetPath}?v=${version}${suffix}`;
  });
}

function collectVersioningFailures(html, version) {
  const failures = [];
  const refs = collectLocalRuntimeAssetRefs(html);

  if (!refs.length) {
    failures.push('Expected index.html to reference local css/*.css or src/*.js runtime assets.');
    return failures;
  }

  for (const ref of refs) {
    if (ref.query !== `v=${version}`) {
      failures.push(`${ref.assetPath} should use ?v=${version}, got ${ref.query || 'no query string'}.`);
    }
  }

  return failures;
}

module.exports = {
  applyVersionToIndexHtml,
  collectLocalRuntimeAssetRefs,
  collectVersioningFailures,
  getRepoRoot,
  readPackageVersion
};
