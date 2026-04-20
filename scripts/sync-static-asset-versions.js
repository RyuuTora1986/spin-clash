const fs = require('fs');
const path = require('path');

const {
  applyVersionToIndexHtml,
  collectLocalRuntimeAssetRefs,
  getRepoRoot,
  readPackageVersion
} = require('./static-asset-versioning');

function main() {
  const repoRoot = getRepoRoot();
  const version = readPackageVersion(repoRoot);
  const indexHtmlPath = path.join(repoRoot, 'index.html');
  const currentHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const nextHtml = applyVersionToIndexHtml(currentHtml, version);

  if (nextHtml !== currentHtml) {
    fs.writeFileSync(indexHtmlPath, nextHtml, 'utf8');
  }

  const refCount = collectLocalRuntimeAssetRefs(nextHtml).length;
  console.log(`Synced ${refCount} local runtime asset references in index.html to version ${version}.`);
}

main();
