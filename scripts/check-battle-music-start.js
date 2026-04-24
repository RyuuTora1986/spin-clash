const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { startLocalServer } = require('./serve-local');

async function waitForPageReady(page) {
  await page.waitForFunction(() => {
    return typeof window.__spinClashInvoke === 'function'
      && !!document.querySelector('#gc canvas')
      && !!window.SpinClash
      && !!window.SpinClash.debug
      && !!window.SpinClash.debug.runtimeAudioTools;
  }, { timeout: 60000 });
}

async function enterQuickBattle(page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await waitForPageReady(page);
  await page.evaluate(() => {
    window.__spinClashInvoke('setLocale', 'en');
  });
  await page.click('#btn-enter-quick');
  await page.click('#btn-fight');
  await page.waitForFunction(() => {
    const hud = document.getElementById('hud');
    return hud && window.getComputedStyle(hud).display !== 'none';
  }, { timeout: 20000 });
}

async function dragLaunch(page) {
  const box = await page.locator('#gc canvas').boundingBox();
  assert(box, 'Expected battle canvas to be available.');
  const start = {
    x: box.x + box.width * 0.50,
    y: box.y + box.height * 0.82
  };
  const end = {
    x: box.x + box.width * 0.50,
    y: box.y + box.height * 0.62
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const primedState = await page.evaluate(() => window.SpinClash.debug.runtimeAudioTools.getMusicDebugState());
  assert(
    primedState.primedTrack === 'battle_a'
      || primedState.currentKey === 'battle_a'
      || (primedState.lastPlayAttempt && primedState.lastPlayAttempt.trackId === 'battle_a'),
    `Expected drag start to attempt battle_a priming, got ${JSON.stringify(primedState)}`
  );
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(650);
}

async function getRuntimeState(page) {
  return page.evaluate(() => {
    const music = window.SpinClash.debug.runtimeAudioTools.getMusicDebugState();
    const state = JSON.parse(window.render_game_to_text());
    return { music, state, playCalls: window.__spinClashPlayCalls || [] };
  });
}

async function assertChallengeNodeMusicPolicy(serverUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  try {
    await page.goto(serverUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageReady(page);
    const policy = await page.evaluate(() => {
      const audioTools = window.SpinClash.debug.runtimeAudioTools;
      const sameNode = [1, 2, 3].map((round) => {
        const track = audioTools.resolveMusicDebugTrack({
          scene: 'battle',
          mode: 'challenge',
          challengeNodeIndex: 7,
          challengeNodeId: 'node-8',
          round
        });
        return track ? track.id : null;
      });
      const nextNode = audioTools.resolveMusicDebugTrack({
        scene: 'battle',
        mode: 'challenge',
        challengeNodeIndex: 8,
        challengeNodeId: 'node-9',
        round: 1
      });
      const quick = audioTools.resolveMusicDebugTrack({
        scene: 'battle',
        mode: 'quick',
        round: 3
      });
      return {
        sameNode,
        nextNode: nextNode ? nextNode.id : null,
        quick: quick ? quick.id : null
      };
    });
    assert.strictEqual(new Set(policy.sameNode).size, 1, `Expected one challenge node to keep one battle track, got ${JSON.stringify(policy)}`);
    assert.notStrictEqual(policy.sameNode[0], policy.nextNode, `Expected adjacent challenge nodes to be allowed different tracks, got ${JSON.stringify(policy)}`);
    assert.strictEqual(policy.quick, 'battle_a', `Expected quick battle default track to remain battle_a, got ${JSON.stringify(policy)}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

function assertBattleMusicStarted(payload, label) {
  assert(payload.state.mode === 'active', `${label}: expected active battle state, got ${payload.state.mode}.`);
  const music = payload.music;
  const externalStarted = music.currentKey === 'battle_a' && music.usingExternal === true && music.currentMode === 'battle';
  const fallbackStarted = music.proceduralActive === true;
  assert(
    externalStarted || fallbackStarted,
    `${label}: expected battle music external track or procedural fallback, got ${JSON.stringify(music)}`
  );
}

async function runScenario(serverUrl, patchPlay) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  if (patchPlay) {
    await context.addInitScript(() => {
      const originalPlay = window.HTMLMediaElement && window.HTMLMediaElement.prototype.play;
      window.__spinClashPlayCalls = [];
      if (!originalPlay) return;
      window.HTMLMediaElement.prototype.play = function patchedPlay() {
        const src = this.currentSrc || this.src || '';
        window.__spinClashPlayCalls.push(src);
        if (src.includes('battle_redline')) {
          const error = new DOMException('Simulated blocked battle media playback.', 'NotAllowedError');
          return Promise.reject(error);
        }
        return originalPlay.apply(this, arguments);
      };
    });
  }
  const page = await context.newPage();
  try {
    await page.goto(serverUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageReady(page);
    await enterQuickBattle(page);
    await dragLaunch(page);
    return await getRuntimeState(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const server = await startLocalServer({
    host: '127.0.0.1',
    port: 4477,
    maxPort: 4577,
    silent: true,
    repoRoot: path.resolve(__dirname, '..')
  });

  try {
    const normal = await runScenario(server.debugUrl, false);
    assertBattleMusicStarted(normal, 'normal first launch');

    const blocked = await runScenario(server.debugUrl, true);
    assertBattleMusicStarted(blocked, 'blocked external first launch');
    assert(
      blocked.music.proceduralActive === true,
      `Expected blocked external playback to fall back to procedural battle music, got ${JSON.stringify(blocked.music)}`
    );

    await assertChallengeNodeMusicPolicy(server.debugUrl);
  } finally {
    await server.close();
  }

  console.log('battle music start check ok');
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
