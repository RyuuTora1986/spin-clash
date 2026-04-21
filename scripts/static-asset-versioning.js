const fs = require('fs');
const path = require('path');

const LOCAL_RUNTIME_ASSET_PATTERN = /(<(?:script|link)\b[^>]+\b(?:src|href)=")(\.\/(?:css\/[^"?]+\.css|src\/[^"?]+\.js))(?:\?([^"#]*))?(")/g;
const BUILD_VERSION_LABEL_PATTERN = /(titleBuildVersion:\s*')([^']*)(')/g;

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

function collectBuildVersionLabels(sourceText) {
  const labels = [];
  const pattern = new RegExp(BUILD_VERSION_LABEL_PATTERN.source, BUILD_VERSION_LABEL_PATTERN.flags);
  let match;
  while ((match = pattern.exec(sourceText)) !== null) {
    labels.push(match[2]);
  }
  return labels;
}

function getExpectedBuildVersionLabel(currentLabel, version) {
  return currentLabel.trim().startsWith('\u7248\u672c')
    ? `\u7248\u672c ${version}`
    : `Version ${version}`;
}

function applyVersionToIndexHtml(html, version) {
  return html.replace(LOCAL_RUNTIME_ASSET_PATTERN, (fullMatch, prefix, assetPath, query, suffix) => {
    return `${prefix}${assetPath}?v=${version}${suffix}`;
  });
}

function applyVersionToConfigText(sourceText, version) {
  return sourceText.replace(BUILD_VERSION_LABEL_PATTERN, (fullMatch, prefix, currentLabel, suffix) => {
    return `${prefix}${getExpectedBuildVersionLabel(currentLabel, version)}${suffix}`;
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

function collectBuildVersionFailures(sourceText, version) {
  const failures = [];
  const labels = collectBuildVersionLabels(sourceText);

  if (!labels.length) {
    failures.push('Expected src/config-text.js to define at least one titleBuildVersion label.');
    return failures;
  }

  for (const label of labels) {
    const expected = getExpectedBuildVersionLabel(label, version);
    if (label !== expected) {
      failures.push(`titleBuildVersion should be ${expected}, got ${label}.`);
    }
  }

  return failures;
}

module.exports = {
  applyVersionToConfigText,
  applyVersionToIndexHtml,
  collectBuildVersionFailures,
  collectBuildVersionLabels,
  collectLocalRuntimeAssetRefs,
  collectVersioningFailures,
  getRepoRoot,
  readPackageVersion
};
