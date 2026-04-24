const path = require('path');
const cp = require('child_process');
const { getChannelById, repoRoot } = require('./channel-registry');
const { startLocalServer } = require('./serve-local');
const { startCrazyGamesPreviewServer } = require('./serve-crazygames-preview');

function parseArgs(argv) {
  const args = {
    channel: '',
    allowPlanned: false,
    skipBuild: false,
    host: '',
    port: null
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--channel' && next) {
      args.channel = next;
      index += 1;
      continue;
    }
    if (token === '--host' && next) {
      args.host = next;
      index += 1;
      continue;
    }
    if (token === '--port' && next) {
      args.port = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--allow-planned') {
      args.allowPlanned = true;
      continue;
    }
    if (token === '--skip-build') {
      args.skipBuild = true;
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

function resolvePreviewPort(channel, requestedPort) {
  if (Number.isFinite(requestedPort) && requestedPort > 0) {
    return requestedPort;
  }
  const previewTarget = channel.previewTarget || {};
  if (Number.isFinite(previewTarget.defaultPort) && previewTarget.defaultPort > 0) {
    return previewTarget.defaultPort;
  }
  return channel.runtime && channel.runtime.platformId === 'crazygames' ? 4383 : 4173;
}

async function startPreview(channel, args) {
  const previewTarget = channel.previewTarget || {};
  const host = args.host || '127.0.0.1';
  const port = resolvePreviewPort(channel, args.port);
  const outputDir = path.join(repoRoot, channel.buildTarget.outputDir);

  if (previewTarget.kind === 'crazygames_harness') {
    return startCrazyGamesPreviewServer({
      host,
      port,
      maxPort: port + 50,
      buildDir: outputDir,
      silent: false
    });
  }

  return startLocalServer({
    host,
    port,
    maxPort: port + 50,
    repoRoot: outputDir,
    silent: false
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const { channel } = getChannelById(args.channel);
  if (channel.status !== 'active' && !args.allowPlanned) {
    throw new Error(`Channel ${channel.id} is ${channel.status}. Pass --allow-planned explicitly if you really want to preview it.`);
  }
  if (!args.skipBuild) {
    const buildArgs = ['--channel', channel.id];
    if (args.allowPlanned) {
      buildArgs.push('--allow-planned');
    }
    runNodeScript('build-channel-release.js', buildArgs);
  }

  const server = await startPreview(channel, args);
  const summary = {
    channelId: channel.id,
    label: channel.label,
    previewKind: channel.previewTarget && channel.previewTarget.kind ? channel.previewTarget.kind : 'static_server',
    outputDir: channel.buildTarget.outputDir,
    previewUrl: server.previewUrl || server.indexUrl,
    buildUrl: server.iframeUrl || server.indexUrl
  };
  console.log(JSON.stringify(summary, null, 2));

  const closeServer = () => {
    server.close().finally(() => process.exit(0));
  };
  process.on('SIGINT', closeServer);
  process.on('SIGTERM', closeServer);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  });
}
