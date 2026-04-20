const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'proxy-visual-flow-capture.js');

function run(args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

const mobile = JSON.parse(run(['--dry-run', '--profile', 'mobile']));
assert.equal(mobile.profile, 'mobile', 'mobile profile should be selected');
assert.deepEqual(
  mobile.viewport,
  { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, touch: true },
  'mobile viewport preset should match the project mobile validation contract'
);

const desktop = JSON.parse(run(['--dry-run', '--profile', 'desktop']));
assert.equal(desktop.profile, 'desktop', 'desktop profile should remain available');
assert.deepEqual(
  desktop.viewport,
  { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false, touch: false },
  'desktop viewport preset should remain stable'
);

console.log('proxy-visual-flow-capture profile contract ok');
