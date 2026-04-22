const fs = require('fs');
const http = require('http');
const path = require('path');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
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
  }
  return options;
}

function getMimeType(absPath) {
  return MIME_TYPES[path.extname(absPath).toLowerCase()] || 'application/octet-stream';
}

function resolveRequestPath(rootDir, requestUrl) {
  const parsed = new URL(requestUrl, 'http://local.spin-clash');
  const pathname = decodeURIComponent(parsed.pathname);
  const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const absPath = path.resolve(rootDir, relPath);
  const normalizedRoot = path.resolve(rootDir);
  if (absPath !== normalizedRoot && !absPath.startsWith(`${normalizedRoot}${path.sep}`)) {
    return null;
  }
  return absPath;
}

function requestHandler(rootDir) {
  return (req, res) => {
    const absPath = resolveRequestPath(rootDir, req.url || '/');
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

async function startLocalServer(options = {}) {
  const rootDir = path.resolve(options.repoRoot || path.resolve(__dirname, '..'));
  const host = options.host || DEFAULT_HOST;
  const startPort = Number.isFinite(options.port) ? options.port : DEFAULT_PORT;
  const silent = Boolean(options.silent);
  const maxPort = Number.isFinite(options.maxPort) ? options.maxPort : startPort + 100;

  let activePort = startPort;
  while (true) {
    const server = http.createServer(requestHandler(rootDir));
    try {
      await listen(server, host, activePort);
      const info = {
        host,
        port: activePort,
        rootDir,
        indexUrl: `http://${host}:${activePort}/index.html`,
        debugUrl: `http://${host}:${activePort}/index.html?debug=1`
      };

      if (!silent) {
        if (activePort !== startPort) {
          console.log(`Port ${startPort} was busy, using ${activePort} instead.`);
        }
        console.log('Spin Clash local server ready.');
        console.log(`Root: ${rootDir}`);
        console.log(`Open: ${info.indexUrl}`);
        console.log(`Debug: ${info.debugUrl}`);
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
  await startLocalServer({
    host: argOptions.host || process.env.HOST || DEFAULT_HOST,
    port: Number.isFinite(argOptions.port) ? argOptions.port : Number(process.env.PORT) || DEFAULT_PORT
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Failed to start local server: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_HOST,
  DEFAULT_PORT,
  startLocalServer
};
