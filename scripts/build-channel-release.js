const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { getChannelById, repoRoot } = require('./channel-registry');
const { resolveChannelEnvironment, getChannelEnvPaths } = require('./channel-env');

function parseArgs(argv) {
  const args = {
    channel: '',
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
    if (token === '--allow-planned') {
      args.allowPlanned = true;
    }
  }
  return args;
}

function runNpmScript(scriptName, extraEnv) {
  const env = Object.assign({}, process.env, extraEnv || {});
  const result = process.platform === 'win32'
    ? cp.spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm', 'run', scriptName], {
      cwd: repoRoot,
      stdio: 'inherit',
      env
    })
    : cp.spawnSync('npm', ['run', scriptName], {
      cwd: repoRoot,
      stdio: 'inherit',
      env
    });
  if (result.status !== 0) {
    throw new Error(`npm run ${scriptName} failed.`);
  }
}

function describeEnvRule(rule) {
  if (rule.name) {
    return rule.equals !== undefined
      ? `${rule.name}=${rule.equals}`
      : rule.name;
  }
  return rule.oneOf.join(' or ');
}

function validateOperatorRequirements(channel, env) {
  const requirements = channel.operatorRequirements && Array.isArray(channel.operatorRequirements.requiredEnv)
    ? channel.operatorRequirements.requiredEnv
    : [];
  const failures = [];
  requirements.forEach((rule) => {
    if (rule.name) {
      const raw = env[rule.name];
      if (typeof raw !== 'string' || !raw.trim()) {
        failures.push(`Missing env: ${describeEnvRule(rule)}`);
        return;
      }
      if (rule.equals !== undefined && raw.trim() !== String(rule.equals)) {
        failures.push(`Env mismatch: expected ${describeEnvRule(rule)}, got ${rule.name}=${raw.trim()}`);
      }
      return;
    }
    if (rule.oneOf) {
      const matched = rule.oneOf.some((name) => typeof env[name] === 'string' && env[name].trim());
      if (!matched) {
        failures.push(`Missing one-of env: ${describeEnvRule(rule)}`);
      }
    }
  });
  if (failures.length) {
    const envPaths = getChannelEnvPaths(repoRoot);
    throw new Error(`Operator requirements failed for ${channel.id}:\n- ${failures.join('\n- ')}\nUse process env or channel env files:\n- ${envPaths.defaultsPath}\n- ${envPaths.localPath}`);
  }
}

function writeReleaseManifest(channel) {
  const outputDir = path.join(repoRoot, channel.buildTarget.outputDir);
  const manifestPath = path.join(outputDir, 'channel-release-manifest.json');
  const manifest = {
    generatedAt: new Date().toISOString(),
    channelId: channel.id,
    label: channel.label,
    status: channel.status,
    distributionKind: channel.distributionKind,
    runtime: channel.runtime,
    adsPolicy: channel.adsPolicy,
    accountPolicy: channel.accountPolicy,
    backendPolicy: channel.backendPolicy,
    buildTarget: channel.buildTarget,
    officialDocs: channel.officialDocs || []
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  return manifestPath;
}

function main() {
  const args = parseArgs(process.argv);
  const { channel } = getChannelById(args.channel);
  if (channel.status !== 'active' && !args.allowPlanned) {
    throw new Error(`Channel ${channel.id} is ${channel.status}. Use an active channel or pass --allow-planned explicitly.`);
  }
  const resolvedChannelEnv = resolveChannelEnvironment(repoRoot, channel.id, process.env);
  validateOperatorRequirements(channel, resolvedChannelEnv.env);
  const runtimeEnv = Object.assign({}, resolvedChannelEnv.env, channel.buildTarget && channel.buildTarget.env ? channel.buildTarget.env : null);

  runNpmScript(channel.buildTarget.script, runtimeEnv);
  if (channel.buildTarget.checkScript) {
    runNpmScript(channel.buildTarget.checkScript, runtimeEnv);
  }
  runNpmScript('check:channel', Object.assign({}, runtimeEnv, {
    SPIN_CLASH_CHANNEL_RELEASE_ID: channel.id
  }));

  const manifestPath = writeReleaseManifest(channel);
  console.log(JSON.stringify({
    ok: true,
    channelId: channel.id,
    outputDir: channel.buildTarget.outputDir,
    manifestPath,
    envSources: resolvedChannelEnv.sources
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}
