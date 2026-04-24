const fs = require('fs');
const path = require('path');

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function loadJsonIfExists(filePath) {
  if (!fileExists(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pickObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function mergeEnvMaps(...maps) {
  return Object.assign({}, ...maps.map((entry) => pickObject(entry)));
}

function getChannelEnvPaths(projectRoot) {
  const distributionRoot = path.join(projectRoot, 'distribution');
  return {
    defaultsPath: path.join(distributionRoot, 'channel-env.defaults.json'),
    localPath: path.join(distributionRoot, 'channel-env.local.json'),
    examplePath: path.join(distributionRoot, 'channel-env.example.json')
  };
}

function resolveChannelEnvironment(projectRoot, channelId, processEnv) {
  const { defaultsPath, localPath } = getChannelEnvPaths(projectRoot);
  const defaultsJson = loadJsonIfExists(defaultsPath) || {};
  const localJson = loadJsonIfExists(localPath) || {};
  const env = mergeEnvMaps(
    defaultsJson.common,
    defaultsJson.channels && defaultsJson.channels[channelId],
    localJson.common,
    localJson.channels && localJson.channels[channelId],
    processEnv || {}
  );
  return {
    env,
    sources: {
      defaultsPath: fileExists(defaultsPath) ? defaultsPath : null,
      localPath: fileExists(localPath) ? localPath : null
    }
  };
}

module.exports = {
  getChannelEnvPaths,
  resolveChannelEnvironment
};
