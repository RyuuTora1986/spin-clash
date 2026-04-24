const { loadChannelRegistry } = require('./channel-registry');

function formatDocs(docs) {
  return Array.isArray(docs) ? docs.length : 0;
}

function formatValue(value, fallback) {
  return value == null || value === '' ? (fallback || '-') : String(value);
}

function main() {
  const registry = loadChannelRegistry();
  const lines = [];
  lines.push(`project=${registry.projectId}`);
  lines.push(`defaultChannel=${registry.defaultChannelId}`);
  lines.push('');
  registry.channels.forEach((channel) => {
    lines.push(`[${channel.id}] ${channel.label}`);
    lines.push(`  status: ${channel.status}`);
    lines.push(`  type: ${channel.distributionKind}`);
    lines.push(`  build: npm run ${channel.buildTarget.script}`);
    lines.push(`  output: ${channel.buildTarget.outputDir}`);
    lines.push(`  preview: npm run preview:channel -- --channel ${channel.id}`);
    lines.push(`  verify: npm run verify:channel -- --channel ${channel.id}`);
    lines.push(`  runtime: platform=${channel.runtime.platformId}${channel.runtime.launchStage ? ` stage=${channel.runtime.launchStage}` : ''}`);
    lines.push(`  ads: external=${channel.adsPolicy.externalAdsAllowed === true ? 'allowed' : 'blocked'} googleH5=${channel.adsPolicy.googleH5Allowed === true ? 'allowed' : 'blocked'} crazyGamesSdk=${channel.adsPolicy.crazyGamesSdkAdsAllowed === true ? 'allowed' : 'blocked'}`);
    if (channel.economyPolicy) {
      lines.push(`  economy: arenaTrial=${formatValue(channel.economyPolicy.rewardedArenaTrial)} doubleReward=${formatValue(channel.economyPolicy.doubleReward)} continue=${formatValue(channel.economyPolicy.continueAfterLoss)} design=${formatValue(channel.economyPolicy.channelDesignStatus)}`);
    }
    if (channel.commercialPolicy) {
      lines.push(`  revenue: enabled=${channel.commercialPolicy.revenueEnabled === true ? 'yes' : 'no'} source=${formatValue(channel.commercialPolicy.revenueSource)}`);
    }
    if (channel.behaviorContracts) {
      const requiredMarkers = Array.isArray(channel.behaviorContracts.requiredBundleMarkers)
        ? channel.behaviorContracts.requiredBundleMarkers.length
        : 0;
      const smokeExpectations = channel.behaviorContracts.smokeExpectations && typeof channel.behaviorContracts.smokeExpectations === 'object'
        ? Object.keys(channel.behaviorContracts.smokeExpectations).length
        : 0;
      lines.push(`  behaviorContracts: bundleMarkers=${requiredMarkers} smokeExpectations=${smokeExpectations}`);
    }
    lines.push(`  backend: allowed=${channel.backendPolicy.sharedBackendAllowed === true ? 'yes' : 'no'} recommended=${channel.backendPolicy.sharedBackendRecommended === true ? 'yes' : 'no'} hardRequiredAtBoot=${channel.backendPolicy.sharedBackendHardRequiredAtBoot === true ? 'yes' : 'no'}`);
    lines.push(`  docs: ${formatDocs(channel.officialDocs)}`);
    lines.push('');
  });
  console.log(lines.join('\n').trim());
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
