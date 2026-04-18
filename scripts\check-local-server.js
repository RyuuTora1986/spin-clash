const http = require('http');
const net = require('net');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const serverModulePath = path.join(repoRoot, 'scripts', 'serve-local.js');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : null;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        if (!port) {
          reject(new Error('Could not determine a free port.'));
          return;
        }
        resolve(port);
      });
    });
  });
}

function requestText(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, body });
        });
      }
    );
    req.on('error', reject);
  });
}

async function main() {
  const localServer = require(serverModulePath);
  if (!localServer || typeof localServer.startLocalServer !== 'function') {
    fail('Expected scripts/serve-local.js to export startLocalServer(...).');
  }
  const explicitPort = await getFreePort();
  const runningServer = await localServer.startLocalServer({
    host: '127.0.0.1',
    port: explicitPort,
    repoRoot,
    silent: true
  });

  try {
    const indexResponse = await requestText(explicitPort, '/index.html');
    const rootResponse = await requestText(explicitPort, '/');
    const missingResponse = await requestText(explicitPort, '/definitely-missing.txt');

    if (indexResponse.statusCode !== 200) {
      fail(`Expected /index.html to return 200, got ${indexResponse.statusCode}.`);
    }
    if (!indexResponse.body.includes('<title>Spin Clash</title>')) {
      fail('Expected /index.html response to contain the game entry HTML.');
    }
    if (rootResponse.statusCode !== 200) {
      fail(`Expected / to return 200, got ${rootResponse.statusCode}.`);
    }
    if (!rootResponse.body.includes('<title>Spin Clash</title>')) {
      fail('Expected / to resolve to the game entry HTML.');
    }
    if (missingResponse.statusCode !== 404) {
      fail(`Expected missing file response 404, got ${missingResponse.statusCode}.`);
    }

    console.log('Local server check passed.');
  } finally {
    await runningServer.close();
  }

  const defaultPortServer = await localServer.startLocalServer({
    host: '127.0.0.1',
    port: localServer.DEFAULT_PORT,
    repoRoot,
    silent: true
  });

  try {
    if (!Number.isInteger(defaultPortServer.port) || defaultPortServer.port < localServer.DEFAULT_PORT) {
      fail(`Expected fallback server to choose a valid port at or above ${localServer.DEFAULT_PORT}.`);
    }
    const fallbackResponse = await requestText(defaultPortServer.port, '/index.html');
    if (fallbackResponse.statusCode !== 200) {
      fail(`Expected fallback server /index.html to return 200, got ${fallbackResponse.statusCode}.`);
    }
  } finally {
    await defaultPortServer.close();
  }
}

main().catch((error) => {
  fail(`Local server check failed: ${error.message}`);
});
