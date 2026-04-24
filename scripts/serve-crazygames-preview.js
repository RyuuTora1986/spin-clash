const fs = require('fs');
const http = require('http');
const path = require('path');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4383;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--host') {
      options.host = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--port') {
      options.port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--build-dir') {
      options.buildDir = argv[index + 1];
      index += 1;
      continue;
    }
  }
  return options;
}

function getMimeType(absPath) {
  return MIME_TYPES[path.extname(absPath).toLowerCase()] || 'application/octet-stream';
}

function resolveBuildPath(buildDir, requestUrl) {
  const parsed = new URL(requestUrl, 'http://local.spin-clash');
  const pathname = decodeURIComponent(parsed.pathname);
  const relPath = pathname.replace(/^\/build\/?/, '') || 'index.html';
  const absPath = path.resolve(buildDir, relPath);
  const normalizedRoot = path.resolve(buildDir);
  if (absPath !== normalizedRoot && !absPath.startsWith(`${normalizedRoot}${path.sep}`)) {
    return null;
  }
  return absPath;
}

function patchBuildIndexHtml(indexHtml) {
  return indexHtml.replace(
    /https:\/\/sdk\.crazygames\.com\/crazygames-sdk-v3\.js/g,
    '/sdk/crazygames-sdk-v3.js'
  );
}

function buildHarnessHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spin Clash CrazyGames Local Preview</title>
<style>
  :root {
    --bg: #09111f;
    --panel: rgba(12, 21, 38, 0.86);
    --line: rgba(120, 212, 255, 0.18);
    --text: #d8f7ff;
    --muted: rgba(216, 247, 255, 0.64);
    --accent: #40e7ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 340px 1fr;
    background:
      radial-gradient(circle at top left, rgba(64,231,255,0.08), transparent 30%),
      linear-gradient(180deg, #060b14, var(--bg));
    color: var(--text);
    font: 14px/1.5 "Segoe UI", sans-serif;
  }
  .sidebar {
    padding: 22px 20px;
    border-right: 1px solid var(--line);
    background: var(--panel);
    backdrop-filter: blur(10px);
  }
  .stage {
    padding: 18px;
  }
  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .muted {
    color: var(--muted);
  }
  .card {
    margin-top: 18px;
    padding: 14px 14px 12px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(4, 10, 20, 0.74);
  }
  .card h2 {
    margin: 0 0 8px;
    font-size: 13px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .events {
    max-height: 48vh;
    overflow: auto;
    padding-right: 6px;
    font: 12px/1.45 Consolas, monospace;
  }
  .events div + div {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(120, 212, 255, 0.12);
  }
  .frame-shell {
    width: 100%;
    height: calc(100vh - 36px);
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    background: #020617;
    box-shadow: 0 18px 60px rgba(0,0,0,0.28);
  }
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: #020617;
  }
</style>
</head>
<body>
  <aside class="sidebar">
    <h1>CrazyGames Preview</h1>
    <div class="muted">本地 iframe 预览壳。这里模拟 CrazyGames SDK，并把加载/玩法生命周期事件实时打出来。</div>
    <div class="card">
      <h2>Checks</h2>
      <div class="muted">1. 构建是否能在 iframe 启动</div>
      <div class="muted">2. SDK loading/gameplay 事件是否正常</div>
      <div class="muted">3. Basic Launch 下是否没有外部广告残留</div>
    </div>
    <div class="card">
      <h2>Mock Events</h2>
      <div class="events" id="cg-events"><div>Waiting for iframe…</div></div>
    </div>
  </aside>
  <main class="stage">
    <div class="frame-shell">
      <iframe id="cg-preview-frame" name="cg-preview-frame" src="/build/index.html"></iframe>
    </div>
  </main>
  <script>
    (function(){
      const eventsEl = document.getElementById('cg-events');
      function render(snapshot){
        const events = snapshot && Array.isArray(snapshot.events) ? snapshot.events : [];
        if(!events.length){
          eventsEl.innerHTML = '<div>Waiting for CrazyGames mock events…</div>';
          return;
        }
        eventsEl.innerHTML = events.slice(-24).map(function(entry){
          const payload = entry && entry.payload != null ? JSON.stringify(entry.payload) : '';
          return '<div><strong>' + entry.event + '</strong><br><span class="muted">' + entry.at + '</span>' + (payload ? '<br>' + payload.replace(/</g, '&lt;') : '') + '</div>';
        }).join('');
      }
      window.addEventListener('message', function(event){
        if(!event.data || event.data.source !== 'spin-clash-cg-mock'){
          return;
        }
        render(event.data.snapshot || null);
      });
    })();
  </script>
</body>
</html>`;
}

function buildMockSdkScript() {
  return `(function(){
  const state = {
    initCalls:0,
    events:[],
    settings:{ disableChat:false, muteAudio:false },
    settingsListeners:[]
  };

  function clone(value){
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function snapshot(){
    return {
      initCalls:state.initCalls,
      settings:clone(state.settings),
      events:state.events.slice()
    };
  }

  function publish(){
    if(window.parent && window.parent !== window){
      try{
        window.parent.postMessage({
          source:'spin-clash-cg-mock',
          snapshot:snapshot()
        }, '*');
      }catch(error){}
    }
  }

  function record(event, payload){
    state.events.push({
      event:event,
      payload:payload == null ? null : clone(payload),
      at:new Date().toISOString()
    });
    publish();
  }

  function resolveTrue(){
    return Promise.resolve(true);
  }

  window.__spinClashCrazyGamesMock = {
    getSnapshot:snapshot,
    setMuteAudio:function(nextValue){
      state.settings.muteAudio = nextValue === true;
      record('settingsChange', state.settings);
      state.settingsListeners.forEach(function(listener){
        try{ listener(clone(state.settings)); }catch(error){}
      });
    },
    reset:function(){
      state.initCalls = 0;
      state.events = [];
      state.settings = { disableChat:false, muteAudio:false };
      record('reset', null);
    }
  };

  window.CrazyGames = {
    SDK: {
      init:function(){
        state.initCalls += 1;
        record('init', { calls: state.initCalls });
        return resolveTrue();
      },
      getEnvironment:function(){
        record('getEnvironment', 'local');
        return Promise.resolve('local');
      },
      user:{
        systemInfo:{
          channel:'local-preview',
          device:'desktop',
          language:navigator.language || 'en'
        }
      },
      game:{
        settings:state.settings,
        addSettingsChangeListener:function(listener){
          if(typeof listener === 'function'){
            state.settingsListeners.push(listener);
          }
          record('addSettingsChangeListener', null);
        },
        loadingStart:function(){
          record('loadingStart', null);
          return resolveTrue();
        },
        loadingStop:function(){
          record('loadingStop', null);
          return resolveTrue();
        },
        gameplayStart:function(){
          record('gameplayStart', null);
          return resolveTrue();
        },
        gameplayStop:function(){
          record('gameplayStop', null);
          return resolveTrue();
        },
        setGameContext:function(context){
          record('setGameContext', context);
          return resolveTrue();
        },
        clearGameContext:function(){
          record('clearGameContext', null);
          return resolveTrue();
        },
        happytime:function(){
          record('happytime', null);
          return resolveTrue();
        }
      }
    }
  };

  record('sdkReady', null);
})();`;
}

function createRequestHandler(buildDir) {
  return (req, res) => {
    const parsed = new URL(req.url || '/', 'http://local.spin-clash');
    const pathname = parsed.pathname;

    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildHarnessHtml());
      return;
    }

    if (pathname === '/sdk/crazygames-sdk-v3.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      res.end(buildMockSdkScript());
      return;
    }

    if (pathname === '/build' || pathname === '/build/') {
      res.writeHead(302, { Location: '/build/index.html' });
      res.end();
      return;
    }

    if (!pathname.startsWith('/build/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const absPath = resolveBuildPath(buildDir, req.url || '/build/index.html');
    if (!absPath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.stat(absPath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      if (path.basename(absPath).toLowerCase() === 'index.html') {
        const patched = patchBuildIndexHtml(fs.readFileSync(absPath, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(patched);
        return;
      }

      res.writeHead(200, { 'Content-Type': getMimeType(absPath) });
      const stream = fs.createReadStream(absPath);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal Server Error');
      });
      stream.pipe(res);
    });
  };
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
}

async function startCrazyGamesPreviewServer(options = {}) {
  const buildDir = path.resolve(options.buildDir || path.join(__dirname, '..', 'dist-crazygames'));
  const host = options.host || DEFAULT_HOST;
  const startPort = Number.isFinite(options.port) ? options.port : DEFAULT_PORT;
  const maxPort = Number.isFinite(options.maxPort) ? options.maxPort : startPort + 50;
  const silent = Boolean(options.silent);

  if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
    throw new Error(`CrazyGames build is missing at ${buildDir}. Run npm run build:crazygames first.`);
  }

  let activePort = startPort;
  while (true) {
    const server = http.createServer(createRequestHandler(buildDir));
    try {
      await listen(server, host, activePort);
      const info = {
        host,
        port: activePort,
        buildDir,
        previewUrl: `http://${host}:${activePort}/index.html`,
        iframeUrl: `http://${host}:${activePort}/build/index.html`
      };
      if (!silent) {
        console.log('CrazyGames local preview ready.');
        console.log(`Build: ${buildDir}`);
        console.log(`Open: ${info.previewUrl}`);
      }
      return {
        ...info,
        server,
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close((closeError) => {
              if (closeError) {
                rejectClose(closeError);
                return;
              }
              resolveClose();
            });
          })
      };
    } catch (error) {
      server.close();
      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        if (activePort >= maxPort) {
          throw new Error(`Could not find a usable port between ${startPort} and ${maxPort}. Last error: ${error.message}`);
        }
        activePort += 1;
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  const argOptions = parseArgs(process.argv.slice(2));
  await startCrazyGamesPreviewServer({
    host: argOptions.host || process.env.HOST || DEFAULT_HOST,
    port: Number.isFinite(argOptions.port) ? argOptions.port : Number(process.env.PORT) || DEFAULT_PORT,
    buildDir: argOptions.buildDir || path.join(__dirname, '..', 'dist-crazygames')
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to start CrazyGames preview server: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_PORT,
  startCrazyGamesPreviewServer
};
