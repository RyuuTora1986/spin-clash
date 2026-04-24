const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.join(repoRoot, 'distribution', 'channel-registry.json');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRequiredEnvRule(rule, channelId, index) {
  assert(rule && typeof rule === 'object', `Channel ${channelId} requiredEnv[${index}] must be an object.`);
  const hasName = typeof rule.name === 'string' && rule.name.trim();
  const hasOneOf = Array.isArray(rule.oneOf) && rule.oneOf.length > 0;
  assert(hasName || hasOneOf, `Channel ${channelId} requiredEnv[${index}] must define "name" or "oneOf".`);
  if (hasName) {
    assert(!rule.oneOf, `Channel ${channelId} requiredEnv[${index}] must not define both "name" and "oneOf".`);
  }
  if (hasOneOf) {
    rule.oneOf.forEach((name, optionIndex) => {
      assert(typeof name === 'string' && name.trim(), `Channel ${channelId} requiredEnv[${index}].oneOf[${optionIndex}] must be a non-empty string.`);
    });
  }
  if (Object.prototype.hasOwnProperty.call(rule, 'equals')) {
    assert(hasName, `Channel ${channelId} requiredEnv[${index}] cannot use "equals" without "name".`);
  }
}

function validateChannel(channel) {
  assert(channel && typeof channel === 'object', 'Each channel entry must be an object.');
  assert(typeof channel.id === 'string' && channel.id.trim(), 'Channel id is required.');
  assert(typeof channel.status === 'string' && channel.status.trim(), `Channel ${channel.id} status is required.`);
  assert(typeof channel.label === 'string' && channel.label.trim(), `Channel ${channel.id} label is required.`);
  assert(channel.buildTarget && typeof channel.buildTarget === 'object', `Channel ${channel.id} buildTarget is required.`);
  assert(typeof channel.buildTarget.outputDir === 'string' && channel.buildTarget.outputDir.trim(), `Channel ${channel.id} buildTarget.outputDir is required.`);
  assert(typeof channel.buildTarget.script === 'string' && channel.buildTarget.script.trim(), `Channel ${channel.id} buildTarget.script is required.`);
  if (channel.buildTarget.env !== undefined) {
    assert(channel.buildTarget.env && typeof channel.buildTarget.env === 'object' && !Array.isArray(channel.buildTarget.env), `Channel ${channel.id} buildTarget.env must be an object when provided.`);
  }
  assert(channel.runtime && typeof channel.runtime === 'object', `Channel ${channel.id} runtime is required.`);
  assert(typeof channel.runtime.platformId === 'string' && channel.runtime.platformId.trim(), `Channel ${channel.id} runtime.platformId is required.`);
  const requiredEnv = channel.operatorRequirements && Array.isArray(channel.operatorRequirements.requiredEnv)
    ? channel.operatorRequirements.requiredEnv
    : [];
  requiredEnv.forEach((rule, index) => validateRequiredEnvRule(rule, channel.id, index));
  if (channel.verification && channel.verification.smokeArgs !== undefined) {
    assert(Array.isArray(channel.verification.smokeArgs), `Channel ${channel.id} verification.smokeArgs must be an array when provided.`);
    channel.verification.smokeArgs.forEach((token, index) => {
      assert(typeof token === 'string', `Channel ${channel.id} verification.smokeArgs[${index}] must be a string.`);
    });
  }
  if (channel.behaviorContracts !== undefined) {
    assert(channel.behaviorContracts && typeof channel.behaviorContracts === 'object' && !Array.isArray(channel.behaviorContracts), `Channel ${channel.id} behaviorContracts must be an object when provided.`);
    if (channel.behaviorContracts.requiredBundleMarkers !== undefined) {
      assert(Array.isArray(channel.behaviorContracts.requiredBundleMarkers), `Channel ${channel.id} behaviorContracts.requiredBundleMarkers must be an array.`);
      channel.behaviorContracts.requiredBundleMarkers.forEach((marker, index) => {
        assert(typeof marker === 'string' && marker.trim(), `Channel ${channel.id} behaviorContracts.requiredBundleMarkers[${index}] must be a non-empty string.`);
      });
    }
  }
}

function loadChannelRegistry() {
  const registry = loadJson(registryPath);
  assert(registry && typeof registry === 'object', 'Channel registry root must be an object.');
  assert(Array.isArray(registry.channels) && registry.channels.length > 0, 'Channel registry must define a non-empty channels array.');
  const seenIds = new Set();
  registry.channels.forEach((channel) => {
    validateChannel(channel);
    assert(!seenIds.has(channel.id), `Duplicate channel id found: ${channel.id}`);
    seenIds.add(channel.id);
  });
  assert(typeof registry.defaultChannelId === 'string' && seenIds.has(registry.defaultChannelId), 'defaultChannelId must reference a known channel.');
  return registry;
}

function getChannelById(channelId) {
  const registry = loadChannelRegistry();
  const requestedId = channelId || registry.defaultChannelId;
  const channel = registry.channels.find((entry) => entry.id === requestedId);
  if (!channel) {
    throw new Error(`Unknown channel id: ${requestedId}`);
  }
  return { registry, channel };
}

module.exports = {
  repoRoot,
  registryPath,
  loadChannelRegistry,
  getChannelById
};
