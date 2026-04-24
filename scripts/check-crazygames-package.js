const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist-crazygames');
const indexPath = path.join(distRoot, 'index.html');
const zipPath = path.join(repoRoot, 'spin-clash-dist-crazygames-build.zip');
const expectedLaunchStage = String(process.env.SPIN_CLASH_CRAZYGAMES_LAUNCH_STAGE || 'basic').trim().toLowerCase() === 'full'
  ? 'full'
  : 'basic';

function walkFiles(rootDir){
  const files = [];
  const stack = [rootDir];
  while(stack.length){
    const current = stack.pop();
    for(const entry of fs.readdirSync(current, { withFileTypes:true })){
      const absPath = path.join(current, entry.name);
      if(entry.isDirectory()){
        stack.push(absPath);
        continue;
      }
      files.push(absPath);
    }
  }
  return files;
}

function fail(message){
  console.error(message);
  process.exit(1);
}

function findLocalScripts(indexHtml){
  return [...indexHtml.matchAll(/<script\b[^>]+\bsrc="\.\/*([^"]+)"[^>]*><\/script>/gi)]
    .map((match) => match[1]);
}

function readBundleText(indexHtml){
  const localScripts = findLocalScripts(indexHtml);
  const appBundleRelPath = localScripts.find((ref) => /^assets\/spin-clash-app\.[a-f0-9]{12,}\.js$/i.test(ref));
  if (!appBundleRelPath) {
    return '';
  }
  const appBundlePath = path.join(distRoot, appBundleRelPath);
  return fs.existsSync(appBundlePath) ? fs.readFileSync(appBundlePath, 'utf8') : '';
}

if(!fs.existsSync(indexPath)){
  fail('Missing CrazyGames build index.html. Run npm run build:crazygames first.');
}
if(!fs.existsSync(zipPath)){
  fail('Missing CrazyGames build zip.');
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const bundleText = readBundleText(indexHtml);
const files = walkFiles(distRoot);
const totalBytes = files.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);
const failures = [];

if(!/meta name="spin-clash-platform" content="crazygames"/.test(indexHtml)){
  failures.push('CrazyGames build is missing the platform meta tag.');
}
if(!new RegExp(`meta name="spin-clash-crazygames-launch-stage" content="${expectedLaunchStage}"`).test(indexHtml)){
  failures.push(`CrazyGames build is missing the ${expectedLaunchStage} launch stage meta tag.`);
}
if(!/sdk\.crazygames\.com\/crazygames-sdk-v3\.js|\/sdk\/crazygames-sdk-v3\.js/.test(indexHtml)){
  failures.push('CrazyGames build is missing the v3 SDK script.');
}
if(/pagead2\.googlesyndication\.com|securepubads\.g\.doubleclick\.net/.test(indexHtml)){
  failures.push('CrazyGames build still contains external ad provider script injection.');
}
if(/meta name="google-adsense-account"/.test(indexHtml)){
  failures.push('CrazyGames build should not retain the self-hosted google-adsense-account meta tag.');
}
if(files.length > 1500){
  failures.push(`CrazyGames build file count exceeds limit: ${files.length}`);
}
if(totalBytes > 250 * 1024 * 1024){
  failures.push(`CrazyGames build total size exceeds 250MB: ${totalBytes}`);
}

[
  { label:'AdSense/GPT marker', pattern:/pagead2\.googlesyndication\.com|doubleclick/i },
  { label:'PostHog marker', pattern:/posthog/i },
  { label:'shared backend marker', pattern:/\/v1\/projects\/|\/rewards\/claim\b|shared-game-backend-/i },
  { label:'provider runtime marker', pattern:/script_load_timeout|reward-gpt|reward-adsense-h5|analytics-posthog/i },
  { label:'debug hook marker', pattern:/render_game_to_text|advanceTime|__spinClashUI/i }
].forEach(({ label, pattern }) => {
  if(pattern.test(bundleText)){
    failures.push(`CrazyGames bundle still contains ${label}.`);
  }
});

if(failures.length){
  fail(failures.join('\n'));
}

console.log(JSON.stringify({
  ok:true,
  distRoot,
  zipPath,
  expectedLaunchStage,
  fileCount:files.length,
  totalBytes
}, null, 2));
