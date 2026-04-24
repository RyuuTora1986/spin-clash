const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    submissionDir: '',
    sourceDir: '',
    outFile: '',
    ffmpegPath: '',
    ffprobePath: ''
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--submission-dir' && next) {
      args.submissionDir = next;
      index += 1;
      continue;
    }
    if (token === '--source-dir' && next) {
      args.sourceDir = next;
      index += 1;
      continue;
    }
    if (token === '--out-file' && next) {
      args.outFile = next;
      index += 1;
      continue;
    }
    if (token === '--ffmpeg-path' && next) {
      args.ffmpegPath = next;
      index += 1;
      continue;
    }
    if (token === '--ffprobe-path' && next) {
      args.ffprobePath = next;
      index += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getLatestDir(repoRoot, prefix) {
  const outputRoot = path.join(repoRoot, 'output');
  const dirs = fs
    .readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => {
      const fullPath = path.join(outputRoot, entry.name);
      return { fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (dirs.length === 0) {
    throw new Error(`No ${prefix}* directory was found under output/.`);
  }
  return dirs[0].fullPath;
}

function getWingetCandidates(binaryName) {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const candidates = [];
  candidates.push(path.join(localAppData, 'Microsoft', 'WinGet', 'Links', `${binaryName}.exe`));
  const packagesRoot = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(packagesRoot)) {
    for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('Gyan.FFmpeg_')) continue;
      const ffmpegRoot = path.join(packagesRoot, entry.name);
      for (const child of fs.readdirSync(ffmpegRoot, { withFileTypes: true })) {
        if (!child.isDirectory() || !child.name.startsWith('ffmpeg-')) continue;
        candidates.push(path.join(ffmpegRoot, child.name, 'bin', `${binaryName}.exe`));
      }
    }
  }
  return candidates;
}

function resolveBinary(binaryName, explicitPath) {
  if (explicitPath) {
    const absPath = path.resolve(explicitPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Explicit ${binaryName} path does not exist: ${absPath}`);
    }
    return absPath;
  }
  const whereResult = spawnSync('where.exe', [`${binaryName}.exe`], {
    stdio: 'pipe',
    encoding: 'utf8'
  });
  if (whereResult.status === 0) {
    const firstHit = whereResult.stdout.split(/\r?\n/).map((value) => value.trim()).find(Boolean);
    if (firstHit && fs.existsSync(firstHit)) {
      return firstHit;
    }
  }
  for (const candidate of getWingetCandidates(binaryName)) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not resolve ${binaryName}.`);
}

function runProcess(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        result.stdout ? `stdout:\n${result.stdout.trim()}` : '',
        result.stderr ? `stderr:\n${result.stderr.trim()}` : ''
      ]
        .filter(Boolean)
        .join('\n\n')
    );
  }
  return result.stdout.trim();
}

function probeVideo(ffprobePath, targetPath) {
  const output = runProcess(ffprobePath, [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    targetPath
  ]);
  const data = JSON.parse(output);
  const videoStream = (data.streams || []).find((stream) => stream.codec_type === 'video');
  return {
    durationSec: Number.parseFloat(data.format.duration || '0'),
    sizeBytes: Number.parseInt(data.format.size || '0', 10),
    width: videoStream ? videoStream.width : null,
    height: videoStream ? videoStream.height : null,
    codec: videoStream ? videoStream.codec_name : null
  };
}

function ensureFile(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing required file: ${absPath}`);
  }
  return absPath;
}

function createImageClip(ffmpegPath, sourcePath, outputPath, durationSec, filter) {
  runProcess(ffmpegPath, [
    '-y',
    '-loop',
    '1',
    '-i',
    sourcePath,
    '-t',
    durationSec.toFixed(3),
    '-an',
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    outputPath
  ]);
}

function createVideoSubclip(ffmpegPath, sourcePath, outputPath, startSec, durationSec, filter) {
  runProcess(ffmpegPath, [
    '-y',
    '-ss',
    startSec.toFixed(3),
    '-i',
    sourcePath,
    '-t',
    durationSec.toFixed(3),
    '-an',
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    outputPath
  ]);
}

function concatSegments(ffmpegPath, segmentPaths, outputPath) {
  const concatPath = path.join(path.dirname(outputPath), 'recut-concat-list.txt');
  fs.writeFileSync(
    concatPath,
    segmentPaths.map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`).join('\n'),
    'utf8'
  );
  runProcess(ffmpegPath, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatPath,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    outputPath
  ]);
  return concatPath;
}

function extractFrame(ffmpegPath, videoPath, outPath, timestampSec) {
  runProcess(ffmpegPath, [
    '-y',
    '-ss',
    timestampSec.toFixed(3),
    '-i',
    videoPath,
    '-frames:v',
    '1',
    outPath
  ]);
}

function buildReport(report) {
  return [
    '# CrazyGames Preview Video Recut',
    '',
    `- Generated: \`${report.generatedAt}\``,
    `- Output: \`${report.outputPath}\``,
    `- Duration: \`${report.video.durationSec.toFixed(3)}s\``,
    `- Resolution: \`${report.video.width}x${report.video.height}\``,
    `- Size: \`${(report.video.sizeBytes / (1024 * 1024)).toFixed(2)} MB\``,
    '',
    '## Segments',
    '',
    ...report.segments.map((segment) => `- \`${segment.id}\` -> \`${path.basename(segment.outputPath)}\` (${segment.durationSec.toFixed(3)}s)`),
    '',
    '## Strategy',
    '',
    '- intro and ending are rebuilt from cleaner static captures to avoid ugly empty-space footage',
    '- battle core uses the stronger already-recorded combat clips with tighter crop',
    '- final cut prioritizes bigger subjects and stronger collision readability over raw one-take continuity'
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const submissionDir = path.resolve(args.submissionDir || getLatestDir(REPO_ROOT, 'crazygames-submission-'));
  const sourceDir = path.resolve(args.sourceDir || getLatestDir(REPO_ROOT, 'marketing-captures-'));
  const videoDir = path.join(submissionDir, 'video');
  const workDir = path.join(videoDir, 'recut-segments');
  const outputPath = path.resolve(args.outFile || path.join(videoDir, 'spin-clash-preview-1080p.mp4'));
  const ffmpegPath = resolveBinary('ffmpeg', args.ffmpegPath);
  const ffprobePath = resolveBinary('ffprobe', args.ffprobePath);

  ensureDir(videoDir);
  ensureDir(workDir);

  const sources = {
    introStill: ensureFile(path.join(sourceDir, '03-home-top-stage-en.png')),
    finishStill: ensureFile(path.join(sourceDir, '09-battle-finish-en.png')),
    battleActive: ensureFile(path.join(videoDir, 'trimmed-segments', '02-battle-active.mp4')),
    battleFollowthrough: ensureFile(path.join(videoDir, 'trimmed-segments', '03-battle-followthrough-clean.mp4')),
    battleEdge: ensureFile(path.join(videoDir, 'trimmed-segments', '04-battle-edge-pressure-clean.mp4'))
  };

  const battleFilter = 'fps=30,crop=1660:934:130:88,scale=1920:1080,format=yuv420p';
  const introFilter = 'fps=30,scale=1920:1080,format=yuv420p';
  const finishFilter = 'fps=30,crop=1460:821:70:160,scale=1920:1080,format=yuv420p';

  const segments = [
    {
      id: 'intro-top-stage-still',
      durationSec: 1.6,
      outputPath: path.join(workDir, '01-intro-top-stage-still.mp4'),
      build: () => createImageClip(ffmpegPath, sources.introStill, path.join(workDir, '01-intro-top-stage-still.mp4'), 1.6, introFilter)
    },
    {
      id: 'battle-opening',
      durationSec: 3.0,
      outputPath: path.join(workDir, '02-battle-opening.mp4'),
      build: () => createVideoSubclip(ffmpegPath, sources.battleActive, path.join(workDir, '02-battle-opening.mp4'), 0.0, 3.0, battleFilter)
    },
    {
      id: 'battle-pressure',
      durationSec: 2.8,
      outputPath: path.join(workDir, '03-battle-pressure.mp4'),
      build: () => createVideoSubclip(ffmpegPath, sources.battleActive, path.join(workDir, '03-battle-pressure.mp4'), 3.4, 2.8, battleFilter)
    },
    {
      id: 'battle-clean-followthrough',
      durationSec: 3.0,
      outputPath: path.join(workDir, '04-battle-clean-followthrough.mp4'),
      build: () => createVideoSubclip(ffmpegPath, sources.battleFollowthrough, path.join(workDir, '04-battle-clean-followthrough.mp4'), 0.0, 2.95, 'fps=30,scale=1920:1080,format=yuv420p')
    },
    {
      id: 'battle-clean-edge',
      durationSec: 3.0,
      outputPath: path.join(workDir, '05-battle-clean-edge.mp4'),
      build: () => createVideoSubclip(ffmpegPath, sources.battleEdge, path.join(workDir, '05-battle-clean-edge.mp4'), 0.0, 2.95, 'fps=30,scale=1920:1080,format=yuv420p')
    },
    {
      id: 'finish-still',
      durationSec: 2.6,
      outputPath: path.join(workDir, '06-finish-still.mp4'),
      build: () => createImageClip(ffmpegPath, sources.finishStill, path.join(workDir, '06-finish-still.mp4'), 2.6, finishFilter)
    }
  ];

  for (const segment of segments) {
    segment.build();
  }

  const concatPath = concatSegments(ffmpegPath, segments.map((segment) => segment.outputPath), outputPath);
  const video = probeVideo(ffprobePath, outputPath);

  const frames = {
    start: path.join(videoDir, 'spin-clash-preview-start-frame.png'),
    mid: path.join(videoDir, 'spin-clash-preview-mid-frame.png'),
    end: path.join(videoDir, 'spin-clash-preview-end-frame.png')
  };
  extractFrame(ffmpegPath, outputPath, frames.start, 0.15);
  extractFrame(ffmpegPath, outputPath, frames.mid, Math.max(0.15, video.durationSec / 2));
  extractFrame(ffmpegPath, outputPath, frames.end, Math.max(0.15, video.durationSec - 0.25));

  const report = {
    generatedAt: new Date().toISOString(),
    outputPath,
    video,
    segments: segments.map((segment) => ({
      id: segment.id,
      durationSec: segment.durationSec,
      outputPath: segment.outputPath
    })),
    frames
  };
  fs.writeFileSync(path.join(videoDir, 'preview-video-report.json'), JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(path.join(videoDir, 'preview-video-report.md'), buildReport(report), 'utf8');

  if (fs.existsSync(concatPath)) {
    fs.unlinkSync(concatPath);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        durationSec: Number(video.durationSec.toFixed(3)),
        sizeBytes: video.sizeBytes,
        width: video.width,
        height: video.height
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
