const path = require('path');
const { buildRelease } = require('./release-builder');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = process.env.SPIN_CLASH_BUILD_OUTPUT_DIR
  ? path.resolve(process.env.SPIN_CLASH_BUILD_OUTPUT_DIR)
  : path.join(repoRoot, 'dist-core-web');
const runtimeProfile = {
  profile: 'production',
  channelId: 'core_web_vanilla',
  debugToolsEnabled: false,
  exposeUiBindings: false
};
const omittedBundleScripts = [
  'src/provider-runtime-tools.js',
  'src/shared-backend-config.js',
  'src/shared-backend-bridge.js',
  'src/shared-backend-status-ui.js',
  'src/platform-runtime-config.js',
  'src/crazygames-service.js'
];

function stripGoogleAdsenseMeta(indexHtml){
  return indexHtml.replace(/<meta\s+name="google-adsense-account"\s+content="[^"]*">\s*/i, '');
}

async function main() {
  const result = await buildRelease({
    repoRoot,
    outputDir,
    runtimeProfile,
    omittedBundleScripts,
    scriptReplacements: {
      'src/config-providers.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'config-providers-channel-safe.js')
      },
      'src/config-providers-override.js': {
        kind: 'file',
        path: path.join('src', 'channel-runtime', 'provider-overrides-null.js')
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
    transformOutputIndexHtml(indexHtml) {
      return stripGoogleAdsenseMeta(indexHtml);
    }
  });

  console.log(JSON.stringify({
    ok: true,
    outputDir: result.outputDir,
    vendorBundleRelPath: result.vendorBundleRelPath,
    bundleRelPath: result.bundleRelPath
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}
