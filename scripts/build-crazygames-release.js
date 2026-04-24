const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { buildRelease } = require('./release-builder');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'dist-crazygames');
const zipPath = path.join(repoRoot, 'spin-clash-dist-crazygames-build.zip');
const crazyGamesLaunchStage = normalizeLaunchStage(process.env.SPIN_CLASH_CRAZYGAMES_LAUNCH_STAGE || 'basic');
const crazyGamesSdkUrl = String(process.env.SPIN_CLASH_CRAZYGAMES_SDK_URL || 'https://sdk.crazygames.com/crazygames-sdk-v3.js').trim();
const runtimeProfile = {
  profile: 'production',
  channelId: `crazygames_${crazyGamesLaunchStage}`,
  debugToolsEnabled: false,
  exposeUiBindings: false
};
const omittedBundleScripts = [
  'src/provider-runtime-tools.js',
  'src/shared-backend-config.js',
  'src/shared-backend-bridge.js',
  'src/shared-backend-status-ui.js'
];

function normalizeLaunchStage(value){
  return String(value || '').trim().toLowerCase() === 'full' ? 'full' : 'basic';
}

function stripGoogleAdsenseMeta(indexHtml){
  return indexHtml.replace(/<meta\s+name="google-adsense-account"\s+content="[^"]*">\s*/i, '');
}

function injectCrazyGamesHead(indexHtml){
  const sanitizedIndexHtml = stripGoogleAdsenseMeta(indexHtml);
  if(sanitizedIndexHtml.includes(crazyGamesSdkUrl)){
    return sanitizedIndexHtml;
  }
  if(!sanitizedIndexHtml.includes('</head>')){
    throw new Error('Unable to inject CrazyGames SDK because </head> is missing.');
  }
  const injection = [
    '<meta name="spin-clash-platform" content="crazygames">',
    `<meta name="spin-clash-crazygames-launch-stage" content="${crazyGamesLaunchStage}">`,
    `<script src="${crazyGamesSdkUrl}"></script>`
  ].join('\n');
  return sanitizedIndexHtml.replace('</head>', injection + '\n</head>');
}

function createZip(){
  if(fs.existsSync(zipPath)){
    fs.rmSync(zipPath, { force:true });
  }
  const command = [
    `$outDir = '${outDir.replace(/'/g, "''")}'`,
    `$zipPath = '${zipPath.replace(/'/g, "''")}'`,
    "Compress-Archive -Path (Join-Path $outDir '*') -DestinationPath $zipPath -Force"
  ].join('; ');
  const result = cp.spawnSync('powershell', ['-NoProfile', '-Command', command], {
    cwd:repoRoot,
    stdio:'inherit'
  });
  if(result.status !== 0){
    throw new Error('Compress-Archive failed.');
  }
}

async function main(){
  await buildRelease({
    repoRoot,
    outputDir: outDir,
    runtimeProfile,
    omittedBundleScripts,
    scriptReplacements: {
      'src/config-providers.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'config-providers-channel-safe.js')
      },
      'src/config-providers-override.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'crazygames-basic-overrides.js')
      },
      'src/analytics-service.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'analytics-service-local-only.js')
      },
      'src/reward-service.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'reward-service-disabled.js')
      },
      'src/startup-tools.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'startup-tools-production.js')
      }
    },
    transformOutputIndexHtml(indexHtml){
      return injectCrazyGamesHead(indexHtml);
    }
  });

  createZip();

  console.log(JSON.stringify({
    ok:true,
    outDir,
    zipPath,
    crazyGamesLaunchStage,
    crazyGamesSdkUrl
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exit(1);
  });
}
