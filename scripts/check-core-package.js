const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist-core-web');
const indexPath = path.join(distRoot, 'index.html');

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

function main(){
  if(!fs.existsSync(indexPath)){
    fail('Missing core build index.html. Run npm run build:core first.');
  }

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const bundleText = readBundleText(indexHtml);
  const failures = [];

  if(/google-adsense-account/i.test(indexHtml)){
    failures.push('Core build should not retain the self-hosted google-adsense-account meta tag.');
  }
  if(/pagead2\.googlesyndication\.com|securepubads\.g\.doubleclick\.net/i.test(indexHtml)){
    failures.push('Core build should not inject external ad scripts.');
  }
  if(/sdk\.crazygames\.com\/crazygames-sdk-v3\.js/i.test(indexHtml)){
    failures.push('Core build should not include the CrazyGames SDK.');
  }
  [
    { label:'PostHog marker', pattern:/posthog/i },
    { label:'AdSense marker', pattern:/pagead2\.googlesyndication\.com|doubleclick/i },
    { label:'shared backend marker', pattern:/\/v1\/projects\/|\/rewards\/claim\b|shared-game-backend-/i },
    { label:'debug hook marker', pattern:/render_game_to_text|advanceTime|__spinClashUI/i }
  ].forEach(({ label, pattern }) => {
    if(pattern.test(bundleText)){
      failures.push(`Core build still contains ${label}.`);
    }
  });

  if(failures.length){
    fail(failures.join('\n'));
  }

  console.log(JSON.stringify({
    ok:true,
    distRoot
  }, null, 2));
}

main();
