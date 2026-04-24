const fs = require('fs');
const path = require('path');
const { getChannelById, repoRoot } = require('./channel-registry');

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--channel' && next) {
      args.channel = next;
      index += 1;
    }
  }
  return args;
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function findLocalScripts(indexHtml) {
  return [...indexHtml.matchAll(/<script\b[^>]+\bsrc="\.\/*([^"]+)"[^>]*><\/script>/gi)]
    .map((match) => match[1]);
}

function readBundleText(outputDir, indexHtml) {
  const localScripts = findLocalScripts(indexHtml);
  const appBundleRelPath = localScripts.find((ref) => /^assets\/spin-clash-app\.[a-f0-9]{12,}\.js$/i.test(ref));
  if (!appBundleRelPath) {
    return '';
  }
  const appBundlePath = path.join(outputDir, appBundleRelPath);
  return fileExists(appBundlePath) ? readFile(appBundlePath) : '';
}

function readMeta(indexHtml, name) {
  const pattern = new RegExp(`<meta\\s+name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)">`, 'i');
  const match = indexHtml.match(pattern);
  return match ? match[1] : null;
}

function ensure(condition, failures, message) {
  if (!condition) {
    failures.push(message);
  }
}

function runChecks(channel) {
  const failures = [];
  const outputDir = path.join(repoRoot, channel.buildTarget.outputDir);
  const indexPath = path.join(outputDir, 'index.html');
  ensure(fileExists(outputDir), failures, `Missing output directory for ${channel.id}: ${channel.buildTarget.outputDir}`);
  ensure(fileExists(indexPath), failures, `Missing index.html for ${channel.id}: ${channel.buildTarget.outputDir}/index.html`);
  if (failures.length) {
    return { failures, outputDir, summary: null };
  }

  const indexHtml = readFile(indexPath);
  const bundleText = readBundleText(outputDir, indexHtml);
  const buildChecks = channel.buildChecks || {};
  const behaviorContracts = channel.behaviorContracts || {};

  if (buildChecks.mustNotContainCrazyGamesSdk) {
    ensure(!/sdk\.crazygames\.com\/crazygames-sdk-v3\.js/i.test(indexHtml), failures, `${channel.id} must not include the CrazyGames SDK.`);
  }
  if (buildChecks.mustContainCrazyGamesSdk) {
    ensure(/sdk\.crazygames\.com\/crazygames-sdk-v3\.js/i.test(indexHtml), failures, `${channel.id} must include the CrazyGames SDK.`);
  }
  if (buildChecks.mustNotContainCrazyGamesMeta) {
    ensure(readMeta(indexHtml, 'spin-clash-platform') !== 'crazygames', failures, `${channel.id} must not carry CrazyGames platform meta.`);
    ensure(readMeta(indexHtml, 'spin-clash-crazygames-launch-stage') == null, failures, `${channel.id} must not carry CrazyGames launch-stage meta.`);
  }
  if (buildChecks.mustContainCrazyGamesMeta) {
    ensure(readMeta(indexHtml, 'spin-clash-platform') === 'crazygames', failures, `${channel.id} must set spin-clash-platform=crazygames.`);
  }
  if (buildChecks.mustSetLaunchStage) {
    ensure(readMeta(indexHtml, 'spin-clash-crazygames-launch-stage') === buildChecks.mustSetLaunchStage, failures, `${channel.id} must set CrazyGames launch stage to ${buildChecks.mustSetLaunchStage}.`);
  }
  if (buildChecks.mustContainAdsenseH5Bootstrap) {
    ensure(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/i.test(indexHtml), failures, `${channel.id} must inject the AdSense H5 bootstrap script.`);
    ensure(/data-ad-client="/i.test(indexHtml), failures, `${channel.id} must inject data-ad-client into the AdSense H5 bootstrap script.`);
  }
  if (buildChecks.mustDisableExternalAds) {
    ensure(!/pagead2\.googlesyndication\.com|securepubads\.g\.doubleclick\.net/i.test(indexHtml), failures, `${channel.id} must not inject external ad provider scripts into index.html.`);
    ensure(!/meta name="google-adsense-account"/i.test(indexHtml), failures, `${channel.id} must not retain the self-hosted google-adsense-account meta tag.`);
  }
  if (buildChecks.mustContainSharedBackendBridgeMarkers) {
    ensure(/\/v1\/projects\//.test(bundleText), failures, `${channel.id} bundle must keep the shared-backend bridge markers.`);
    ensure(/\/rewards\/claim\b/.test(bundleText), failures, `${channel.id} bundle must keep shared-backend reward claim support.`);
  }
  if (Array.isArray(behaviorContracts.requiredBundleMarkers)) {
    behaviorContracts.requiredBundleMarkers.forEach((marker) => {
      ensure(bundleText.includes(marker), failures, `${channel.id} bundle must retain channel behavior marker: ${marker}`);
    });
  }

  return {
    failures,
    outputDir,
    summary: {
      channelId: channel.id,
      outputDir,
      platformMeta: readMeta(indexHtml, 'spin-clash-platform'),
      launchStageMeta: readMeta(indexHtml, 'spin-clash-crazygames-launch-stage'),
      localScriptCount: findLocalScripts(indexHtml).length
    }
  };
}

function main() {
  const args = parseArgs(process.argv);
  const { channel } = getChannelById(args.channel || process.env.SPIN_CLASH_CHANNEL_RELEASE_ID || '');
  const result = runChecks(channel);
  if (result.failures.length) {
    console.error(`Channel release check failed for ${channel.id}:`);
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log(JSON.stringify({
    ok: true,
    channelId: channel.id,
    summary: result.summary
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
