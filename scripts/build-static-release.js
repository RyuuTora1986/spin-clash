const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'dist-static');
const includedPaths = [
  'index.html',
  'css',
  'src',
  path.join('assets', 'vendor')
];

function removeDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyPath(srcPath, destPath) {
  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    ensureDir(destPath);
    for (const name of fs.readdirSync(srcPath)) {
      copyPath(path.join(srcPath, name), path.join(destPath, name));
    }
    return;
  }
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
}

function main() {
  removeDir(outputDir);
  ensureDir(outputDir);

  for (const relPath of includedPaths) {
    const srcPath = path.join(repoRoot, relPath);
    const destPath = path.join(outputDir, relPath);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing release path: ${relPath}`);
    }
    copyPath(srcPath, destPath);
  }

  console.log(`Static release package created at ${outputDir}`);
}

main();
