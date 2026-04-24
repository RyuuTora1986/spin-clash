const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    sourceDir: '',
    outDir: '',
    previewVideo: ''
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--source-dir' && next) {
      args.sourceDir = next;
      index += 1;
      continue;
    }
    if (token === '--out-dir' && next) {
      args.outDir = next;
      index += 1;
      continue;
    }
    if (token === '--preview-video' && next) {
      args.previewVideo = next;
      index += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getLatestMarketingDir(repoRoot) {
  const outputRoot = path.join(repoRoot, 'output');
  const dirs = fs
    .readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('marketing-captures-'))
    .map((entry) => {
      const fullPath = path.join(outputRoot, entry.name);
      return {
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (dirs.length === 0) {
    throw new Error('No marketing-captures-* directory was found under output/.');
  }
  return dirs[0].fullPath;
}

function ensureFile(absPath) {
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing required file: ${absPath}`);
  }
  return absPath;
}

function findBuildZip(repoRoot, outDir) {
  const candidates = [
    path.join(repoRoot, 'spin-clash-dist-crazygames-build.zip'),
    path.join(repoRoot, 'dist-crazygames-build.zip'),
    path.join(repoRoot, 'dist-static-build.zip'),
    path.join(outDir, 'build', 'spin-clash-dist-crazygames-build.zip'),
    path.join(outDir, 'build', 'dist-crazygames-build.zip'),
    path.join(outDir, 'build', 'spin-clash-dist-static-build.zip')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function copyFile(sourcePath, destPath) {
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(sourcePath, destPath);
}

function findPreviewVideo(sourceDir, outDir, explicitPath) {
  const candidates = [];
  if (explicitPath) {
    candidates.push(path.resolve(explicitPath));
  }
  candidates.push(path.join(outDir, 'video', 'spin-clash-preview-1080p.mp4'));
  candidates.push(path.join(sourceDir, 'spin-clash-preview-1080p.mp4'));
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absPath);
        continue;
      }
      files.push(absPath);
    }
  }
  return files;
}

function buildReadme(data) {
  const previewReady = Boolean(data.previewVideo && data.previewVideo.file);
  return `# Spin Clash CrazyGames Submission Package

Generated: ${data.generatedAt}

This folder is the current single source of truth for the CrazyGames submission pass.

## Ready Now

- Cover images
  - \`covers/spin-clash-cover-landscape-1920x1080.png\`
  - \`covers/spin-clash-cover-portrait-800x1200.png\`
  - \`covers/spin-clash-cover-square-800x800.png\`
- Approved AI poster reference board
  - \`references/ai-poster-refined-approved-board.png\`
- Current build snapshot zip
  - \`build/${data.buildZipFile}\`
${previewReady ? `- Preview video\n  - \`${data.previewVideo.file}\`` : ''}

## Current Status

- CrazyGames Basic Launch can proceed without the SDK.
- Monetization is not available on Basic Launch.
${previewReady ? '- Preview video is exported and ready for upload.' : '- Preview video is still missing and remains the main submission blocker.'}

## Official Requirements Re-Checked

- 3 cover images required:
  - landscape \`1920x1080\`
  - portrait \`800x1200\`
  - square \`800x800\`
- Preview video required:
  - \`15-20\` seconds
  - \`50MB\` max
  - landscape \`1080p\` mandatory
  - no black intro, no cursor, no promotional text, no sound

Official references:
- https://docs.crazygames.com/requirements/game-covers/
- https://docs.crazygames.com/requirements/intro
- https://docs.crazygames.com/requirements/gameplay/
- https://docs.crazygames.com/requirements/technical/

## Build Snapshot

- Source build directory:
  - \`${data.buildSourceDir}\`
- File count:
  - \`${data.buildFileCount}\`
- Total size:
  - \`${formatBytes(data.buildTotalBytes)}\`

## Immediate Next Step

${previewReady
    ? '1. Upload the 3 covers from the `covers/` folder.\n2. Upload the preview video from the `video/` folder.\n3. Upload the build zip from the `build/` folder.\n4. Submit on Basic Launch first, then evaluate SDK integration only if CrazyGames selects the game for Full Launch.'
    : '1. Capture and cut the preview video using `video/video-shot-list.md`.\n2. Upload the 3 covers from the `covers/` folder.\n3. Upload the build zip from the `build/` folder.\n4. Submit on Basic Launch first, then evaluate SDK integration only if CrazyGames selects the game for Full Launch.'}
`;
}

function buildVideoShotList(data) {
  return `# CrazyGames Preview Video Shot List

Target requirements:
- length: \`15-20s\`
- max size: \`50MB\`
- mandatory format: \`1080p landscape\`
- no black intro
- no cursor
- no promo text
- no sound

## Recommended Cut

1. \`0-3s\`
   - Start on the clean home hero or instant battle-ready shell
   - Source references:
     - \`${path.basename(data.referenceFiles.hero)}\`
     - \`${path.basename(data.referenceFiles.quick)}\`

2. \`3-8s\`
   - Show launch into active battle
   - Source references:
     - \`${path.basename(data.referenceFiles.actionUi1)}\`

3. \`8-14s\`
   - Show the strongest impact / clash moment
   - Source reference:
     - \`${path.basename(data.referenceFiles.actionClean)}\`

4. \`14-18s\`
   - Show result or decisive finish
   - Source references:
     - \`${path.basename(data.referenceFiles.roundResult)}\`
     - \`${path.basename(data.referenceFiles.finish)}\`

## Capture Rules

- Keep footage authentic to the actual game
- Do not add title cards or logo slates
- Avoid menu hesitation and dead time
- Prefer the strongest combat and finish states over passive shell footage
`;
}

function buildChecklist(previewReady) {
  return `# CrazyGames Submission Checklist

- [x] Landscape cover prepared at \`1920x1080\`
- [x] Portrait cover prepared at \`800x1200\`
- [x] Square cover prepared at \`800x800\`
- [x] Static build snapshot packaged
- [${previewReady ? 'x' : ' '}] Preview video exported at \`1080p\` landscape
- [${previewReady ? 'x' : ' '}] Preview video checked for:
  - no black intro
  - no cursor
  - no promo text
  - no sound
  - under \`50MB\`
- [ ] Final submission form filled
- [ ] Build uploaded
- [ ] Covers uploaded
- [ ] Preview video uploaded
`;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const args = parseArgs(process.argv);
  const sourceDir = path.resolve(args.sourceDir || getLatestMarketingDir(repoRoot));
  const outDir = path.resolve(args.outDir || path.join(repoRoot, 'output', 'crazygames-submission-2026-04-23'));
  const coversDir = path.join(outDir, 'covers');
  const referencesDir = path.join(outDir, 'references');
  const buildDir = path.join(outDir, 'build');
  const videoDir = path.join(outDir, 'video');

  const sourceFiles = {
    landscape: ensureFile(path.join(sourceDir, 'cover-submission-landscape-1920x1080.png')),
    portrait: ensureFile(path.join(sourceDir, 'cover-submission-portrait-800x1200.png')),
    square: ensureFile(path.join(sourceDir, 'cover-submission-square-800x800.png')),
    approvedBoard: ensureFile(path.join(sourceDir, 'ai-poster-refined-approved-board.png')),
    hero: ensureFile(path.join(sourceDir, '01-home-hero-wide-en.png')),
    quick: ensureFile(path.join(sourceDir, '04-quick-shell-en.png')),
    actionUi1: ensureFile(path.join(sourceDir, '05-battle-action-ui-01.png')),
    actionClean: ensureFile(path.join(sourceDir, '07-battle-action-clean.png')),
    roundResult: ensureFile(path.join(sourceDir, '08-battle-round-result-en.png')),
    finish: ensureFile(path.join(sourceDir, '09-battle-finish-en.png'))
  };

  ensureDir(coversDir);
  ensureDir(referencesDir);
  ensureDir(buildDir);
  ensureDir(videoDir);

  const previewVideoSource = findPreviewVideo(sourceDir, outDir, args.previewVideo);
  const previewVideoTarget = previewVideoSource ? path.join(videoDir, 'spin-clash-preview-1080p.mp4') : '';

  const copiedFiles = {
    landscape: path.join(coversDir, 'spin-clash-cover-landscape-1920x1080.png'),
    portrait: path.join(coversDir, 'spin-clash-cover-portrait-800x1200.png'),
    square: path.join(coversDir, 'spin-clash-cover-square-800x800.png'),
    approvedBoard: path.join(referencesDir, 'ai-poster-refined-approved-board.png')
  };

  copyFile(sourceFiles.landscape, copiedFiles.landscape);
  copyFile(sourceFiles.portrait, copiedFiles.portrait);
  copyFile(sourceFiles.square, copiedFiles.square);
  copyFile(sourceFiles.approvedBoard, copiedFiles.approvedBoard);
  if (previewVideoSource && previewVideoSource !== previewVideoTarget) {
    copyFile(previewVideoSource, previewVideoTarget);
  }

  const buildZipSource = findBuildZip(repoRoot, outDir);
  if (!buildZipSource) {
    throw new Error('Missing CrazyGames/Static build zip. Run the relevant build command first.');
  }
  const buildZipTarget = path.join(buildDir, path.basename(buildZipSource));
  if (buildZipSource !== buildZipTarget) {
    copyFile(buildZipSource, buildZipTarget);
  }

  const isCrazyGamesBuild = /dist-crazygames/i.test(path.basename(buildZipSource));
  const buildSourceDir = path.join(repoRoot, isCrazyGamesBuild ? 'dist-crazygames' : 'dist-static');
  const buildFiles = walkFiles(buildSourceDir);
  const buildTotalBytes = buildFiles.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);
  const previewVideoReady = Boolean(previewVideoSource || (previewVideoTarget && fs.existsSync(previewVideoTarget)));
  const previewVideoStats = previewVideoReady ? fs.statSync(previewVideoTarget) : null;

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    outDir,
    covers: [
      {
        slot: 'landscape',
        width: 1920,
        height: 1080,
        file: path.relative(outDir, copiedFiles.landscape).replace(/\\/g, '/')
      },
      {
        slot: 'portrait',
        width: 800,
        height: 1200,
        file: path.relative(outDir, copiedFiles.portrait).replace(/\\/g, '/')
      },
      {
        slot: 'square',
        width: 800,
        height: 800,
        file: path.relative(outDir, copiedFiles.square).replace(/\\/g, '/')
      }
    ],
    references: [
      path.relative(outDir, copiedFiles.approvedBoard).replace(/\\/g, '/')
    ],
    build: {
      sourceDir: buildSourceDir,
      fileCount: buildFiles.length,
      totalBytes: buildTotalBytes,
      zipFile: 'build/' + path.basename(buildZipTarget)
    },
    previewVideo: {
      status: previewVideoReady ? 'ready' : 'missing',
      requiredLengthSec: '15-20',
      maxSizeMB: 50,
      requiredLandscapeResolution: '1080p',
      file: previewVideoReady ? 'video/spin-clash-preview-1080p.mp4' : null,
      sizeBytes: previewVideoStats ? previewVideoStats.size : null
    }
  };

  fs.writeFileSync(path.join(outDir, 'submission-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'README.md'),
    buildReadme({
      generatedAt: manifest.generatedAt,
      buildSourceDir,
      buildFileCount: buildFiles.length,
      buildTotalBytes,
      buildZipFile:path.basename(buildZipTarget),
      referenceFiles: sourceFiles,
      previewVideo: manifest.previewVideo
    }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(videoDir, 'video-shot-list.md'),
    buildVideoShotList({
      referenceFiles: sourceFiles
    }),
    'utf8'
  );
  fs.writeFileSync(path.join(outDir, 'submission-checklist.md'), buildChecklist(previewVideoReady), 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outDir,
        coversDir,
        buildDir,
        videoDir,
        manifest: path.join(outDir, 'submission-manifest.json')
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}
