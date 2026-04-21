const fs = require('fs');
const path = require('path');

const {
  applyVersionToConfigText,
  applyVersionToIndexHtml,
  collectBuildVersionLabels,
  collectLocalRuntimeAssetRefs,
  getRepoRoot,
  readPackageVersion
} = require('./static-asset-versioning');

function main() {
  const repoRoot = getRepoRoot();
  const version = readPackageVersion(repoRoot);
  const indexHtmlPath = path.join(repoRoot, 'index.html');
  const configTextPath = path.join(repoRoot, 'src', 'config-text.js');
  const currentHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const currentConfigText = fs.readFileSync(configTextPath, 'utf8');
  const nextHtml = applyVersionToIndexHtml(currentHtml, version);
  const nextConfigText = applyVersionToConfigText(currentConfigText, version);

  if (nextHtml !== currentHtml) {
    fs.writeFileSync(indexHtmlPath, nextHtml, 'utf8');
  }

  if (nextConfigText !== currentConfigText) {
    fs.writeFileSync(configTextPath, nextConfigText, 'utf8');
  }

  const refCount = collectLocalRuntimeAssetRefs(nextHtml).length;
  const labelCount = collectBuildVersionLabels(nextConfigText).length;
  console.log(`Synced ${refCount} local runtime asset references and ${labelCount} build-version labels to version ${version}.`);
}

main();
