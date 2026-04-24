const path = require('path');
const cp = require('child_process');
const { loadChannelRegistry, getChannelById, repoRoot } = require('./channel-registry');

function parseArgs(argv) {
  const args = {
    channel: '',
    allActive: false,
    allowPlanned: false
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--channel' && next) {
      args.channel = next;
      index += 1;
      continue;
    }
    if (token === '--all-active') {
      args.allActive = true;
      continue;
    }
    if (token === '--allow-planned') {
      args.allowPlanned = true;
    }
  }
  return args;
}

function runNodeScript(scriptName, scriptArgs) {
  const result = cp.spawnSync(
    process.execPath,
    [path.join(__dirname, scriptName), ...(scriptArgs || [])],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env
    }
  );
  if (result.status !== 0) {
    throw new Error(`${scriptName} failed.`);
  }
}

function runNpmScript(scriptName, extraArgs) {
  const args = ['run', scriptName];
  if (Array.isArray(extraArgs) && extraArgs.length) {
    args.push('--', ...extraArgs);
  }
  const result = process.platform === 'win32'
    ? cp.spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm', ...args], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env
    })
    : cp.spawnSync('npm', args, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env
    });
  if (result.status !== 0) {
    throw new Error(`npm run ${scriptName} failed.`);
  }
}

function selectChannels(args) {
  if (args.allActive) {
    const registry = loadChannelRegistry();
    return registry.channels.filter((channel) => args.allowPlanned ? true : channel.status === 'active');
  }
  return [getChannelById(args.channel).channel];
}

function verifyChannel(channel, allowPlanned) {
  if (channel.status !== 'active' && !allowPlanned) {
    throw new Error(`Channel ${channel.id} is ${channel.status}. Pass --allow-planned explicitly if you really want to verify it.`);
  }

  const buildArgs = ['--channel', channel.id];
  if (allowPlanned) {
    buildArgs.push('--allow-planned');
  }
  runNodeScript('build-channel-release.js', buildArgs);

  const verification = channel.verification || {};
  if (verification.smokeScript) {
    runNpmScript(verification.smokeScript, verification.smokeArgs || []);
  }

  return {
    channelId: channel.id,
    smokeScript: verification.smokeScript || null,
    outputDir: channel.buildTarget.outputDir
  };
}

function main() {
  const args = parseArgs(process.argv);
  const channels = selectChannels(args);
  if (!channels.length) {
    throw new Error('No channels selected for verification.');
  }

  const results = channels.map((channel) => verifyChannel(channel, args.allowPlanned));
  console.log(JSON.stringify({
    ok: true,
    verifiedAt: new Date().toISOString(),
    channels: results
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
