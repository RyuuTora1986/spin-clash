const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');
const {
  applyVersionToConfigText,
  applyVersionToIndexHtml,
  readPackageVersion
} = require('./static-asset-versioning');

const DEFAULT_INCLUDED_PATHS = [
  'index.html',
  'ads.txt',
  'robots.txt',
  'css',
  path.join('assets', 'fx'),
  path.join('assets', 'audio')
];

const DEFAULT_RUNTIME_PROFILE = {
  profile: 'production',
  debugToolsEnabled: false,
  exposeUiBindings: false
};

const DEFAULT_OMITTED_BUNDLE_SCRIPTS = [
  'src/debug-service.js',
  'src/debug-runtime-tools.js',
  'assets/vendor/three.min.js'
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

function toPosixPath(targetPath) {
  return targetPath.split(path.sep).join('/');
}

function collectRuntimeScripts(indexHtml) {
  const scripts = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(indexHtml)) !== null) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    const srcMatch = attrs.match(/\bsrc="([^"]+)"/i);
    scripts.push({
      src: srcMatch ? srcMatch[1] : null,
      body,
      attrs
    });
  }
  return scripts;
}

function normalizeScriptSrc(src) {
  return String(src || '')
    .replace(/^\.\//, '')
    .replace(/\?.*$/, '');
}

function wrapBundleSegment(sourceText, label) {
  return [
    `(function(){/* ${label} */`,
    sourceText,
    '',
    '})();'
  ].join('\n');
}

function writeHashedAsset(repoRoot, outputDir, sourceRelPath, assetStem) {
  const sourcePath = path.join(repoRoot, sourceRelPath);
  const content = fs.readFileSync(sourcePath);
  const assetHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const assetRelPath = path.join('assets', `${assetStem}.${assetHash}.js`);
  const assetOutputPath = path.join(outputDir, assetRelPath);
  ensureDir(path.dirname(assetOutputPath));
  fs.writeFileSync(assetOutputPath, content);
  return assetRelPath;
}

function buildRuntimeProfileScript(runtimeProfile) {
  return [
    '(function(){',
    '  const root = window.SpinClash || (window.SpinClash = {});',
    '  root.runtime = root.runtime || {};',
    `  root.runtime.build = ${JSON.stringify(runtimeProfile || DEFAULT_RUNTIME_PROFILE)};`,
    '})();',
    ''
  ].join('\n');
}

function resolveReplacementSource(repoRoot, normalizedSrc, scriptReplacements) {
  const replacement = scriptReplacements[normalizedSrc];
  if (!replacement) {
    return null;
  }
  if (replacement.kind === 'inline') {
    return String(replacement.content || '');
  }
  if (replacement.kind === 'file') {
    return fs.readFileSync(path.resolve(repoRoot, replacement.path), 'utf8');
  }
  throw new Error(`Unsupported script replacement kind for ${normalizedSrc}: ${replacement.kind}`);
}

function buildRuntimeBundleSource(options) {
  const {
    repoRoot,
    indexHtml,
    version,
    runtimeProfile,
    scriptReplacements,
    omittedBundleScripts
  } = options;
  const scripts = collectRuntimeScripts(indexHtml);
  const bundleSegments = [];

  scripts.forEach((script, index) => {
    if (!script.src) {
      return;
    }

    const normalizedSrc = normalizeScriptSrc(script.src);
    if (!normalizedSrc || omittedBundleScripts.has(normalizedSrc)) {
      return;
    }

    let sourceText = resolveReplacementSource(repoRoot, normalizedSrc, scriptReplacements);
    if (sourceText == null) {
      const sourcePath = path.join(repoRoot, normalizedSrc);
      sourceText = fs.readFileSync(sourcePath, 'utf8');
    }

    if (normalizedSrc === 'src/config-text.js') {
      sourceText = applyVersionToConfigText(sourceText, version);
    }

    bundleSegments.push(wrapBundleSegment(sourceText, normalizedSrc));
    if (normalizedSrc === 'src/bootstrap-app-globals.js') {
      bundleSegments.push(wrapBundleSegment(buildRuntimeProfileScript(runtimeProfile), `virtual-build-runtime-${index}`));
    }
  });

  if (!bundleSegments.length) {
    throw new Error('No runtime scripts were collected for the production bundle.');
  }

  return bundleSegments.join('\n');
}

async function createMinifiedBundle(options) {
  const bundleSource = buildRuntimeBundleSource(options);
  const minified = await minify(bundleSource, {
    compress: true,
    mangle: true,
    format: {
      comments: false
    }
  });
  if (!minified || typeof minified.code !== 'string' || !minified.code.trim()) {
    throw new Error('Failed to produce a minified production bundle.');
  }
  return minified.code.trim();
}

function buildBundledIndexHtml(indexHtml, scriptRelPaths, version) {
  const versionedIndexHtml = applyVersionToIndexHtml(indexHtml, version);
  const runtimeBlockPattern = /<script\s+src="\.\/*src\/bootstrap-app-globals\.js[^"]*"><\/script>[\s\S]*<\/body>/i;
  const scriptTags = scriptRelPaths
    .map((scriptRelPath) => `<script defer src="./${toPosixPath(scriptRelPath)}"></script>`)
    .join('\n');
  const bundledHtml = versionedIndexHtml.replace(runtimeBlockPattern, `${scriptTags}\n</body>`);
  if (bundledHtml === versionedIndexHtml) {
    throw new Error('Unable to rewrite index.html to the bundled production script.');
  }
  return bundledHtml;
}

async function buildRelease(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '..'));
  const outputDir = path.resolve(options.outputDir || path.join(repoRoot, 'dist-static'));
  const includedPaths = Array.isArray(options.includedPaths) && options.includedPaths.length
    ? options.includedPaths
    : DEFAULT_INCLUDED_PATHS;
  const runtimeProfile = Object.assign({}, DEFAULT_RUNTIME_PROFILE, options.runtimeProfile || {});
  const omittedBundleScripts = new Set([
    ...DEFAULT_OMITTED_BUNDLE_SCRIPTS,
    ...((Array.isArray(options.omittedBundleScripts) ? options.omittedBundleScripts : []))
  ]);
  const scriptReplacements = options.scriptReplacements || {};
  const transformOutputIndexHtml = typeof options.transformOutputIndexHtml === 'function'
    ? options.transformOutputIndexHtml
    : (value) => value;
  const version = readPackageVersion(repoRoot);

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

  const sourceIndexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  const vendorBundleRelPath = writeHashedAsset(repoRoot, outputDir, path.join('assets', 'vendor', 'three.min.js'), 'three');
  const minifiedBundle = await createMinifiedBundle({
    repoRoot,
    indexHtml: sourceIndexHtml,
    version,
    runtimeProfile,
    scriptReplacements,
    omittedBundleScripts
  });
  const bundleHash = crypto.createHash('sha256').update(minifiedBundle).digest('hex').slice(0, 12);
  const bundleRelPath = path.join('assets', `spin-clash-app.${bundleHash}.js`);
  const bundleOutputPath = path.join(outputDir, bundleRelPath);
  ensureDir(path.dirname(bundleOutputPath));
  fs.writeFileSync(bundleOutputPath, minifiedBundle, 'utf8');

  const outputIndexHtmlPath = path.join(outputDir, 'index.html');
  const bundledIndexHtml = buildBundledIndexHtml(sourceIndexHtml, [vendorBundleRelPath, bundleRelPath], version);
  fs.writeFileSync(outputIndexHtmlPath, transformOutputIndexHtml(bundledIndexHtml), 'utf8');

  return {
    repoRoot,
    outputDir,
    version,
    vendorBundleRelPath,
    bundleRelPath
  };
}

module.exports = {
  DEFAULT_INCLUDED_PATHS,
  DEFAULT_OMITTED_BUNDLE_SCRIPTS,
  DEFAULT_RUNTIME_PROFILE,
  buildRelease,
  ensureDir,
  normalizeScriptSrc,
  toPosixPath
};
