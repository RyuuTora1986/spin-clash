const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');

function loadScript(relPath, context) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testResultShareFallbackDownloadsCardAndCopiesText() {
  const analyticsEvents = [];
  const clipboardWrites = [];
  const createdAnchors = [];
  const objectUrls = [];
  const revokedUrls = [];
  const context = vm.createContext({
    console,
    window: {},
    navigator: {
      clipboard: {
        writeText(text) {
          clipboardWrites.push(text);
          return Promise.resolve();
        }
      }
    },
    document: {
      createElement(tag) {
        const element = {
          tagName: String(tag).toUpperCase(),
          href: '',
          download: '',
          clickCalled: false,
          click() {
            this.clickCalled = true;
          }
        };
        createdAnchors.push(element);
        return element;
      },
      body: {
        appendChild() {},
        removeChild() {}
      }
    },
    URL: {
      createObjectURL(blob) {
        objectUrls.push(blob);
        return 'blob:share-card';
      },
      revokeObjectURL(url) {
        revokedUrls.push(url);
      }
    },
    Blob
  });
  context.window = context;
  context.SpinClash = {
    services: {
      analytics: {
        track(name, payload) {
          analyticsEvents.push({ name, payload });
        }
      }
    }
  };

  loadScript(path.join('src', 'share-card-tools.js'), context);
  loadScript(path.join('src', 'share-service.js'), context);

  const shareService = context.SpinClash.services.share;
  assert(shareService && typeof shareService.buildResultCard === 'function', 'Expected ShareService to expose buildResultCard.');

  const artifact = shareService.buildResultCard({
    kind: 'result',
    title: 'Spin Clash',
    moment: 'ring_out',
    mode: 'challenge',
    arenaLabel: 'HEX BOWL',
    playerTopLabel: 'Impact',
    enemyTopLabel: 'Armor',
    challengeNode: 3,
    scorePlayer: 2,
    scoreEnemy: 0,
    result: 'win'
  });

  assert(artifact && typeof artifact.text === 'string', 'Expected result card artifact to contain SVG text.');
  assert(artifact.mimeType === 'image/svg+xml', 'Expected result card artifact to use SVG mime type.');
  assert(artifact.text.includes('HEX BOWL'), 'Expected result card SVG to include the arena label.');
  assert(artifact.text.includes('Impact'), 'Expected result card SVG to include the player top label.');
  assert(artifact.text.includes('RING OUT'), 'Expected result card SVG to include the share moment label.');

  const downloaded = await shareService.downloadResultCard({
    kind: 'result',
    title: 'Spin Clash',
    moment: 'perfect_win',
    mode: 'quick',
    arenaLabel: 'CIRCLE BOWL',
    playerTopLabel: 'Trick',
    enemyTopLabel: 'Armor',
    scorePlayer: 2,
    scoreEnemy: 0,
    result: 'win'
  });
  assert(downloaded === true, 'Expected ShareService to expose a working downloadResultCard helper.');
  assert(createdAnchors.length === 1, 'Expected direct result-card download to create one anchor.');
  assert(createdAnchors[0].clickCalled === true, 'Expected direct result-card download to click the anchor.');
  assert(/\.svg$/i.test(createdAnchors[0].download), 'Expected direct result-card download to use an SVG filename.');
  assert(objectUrls.length === 1, 'Expected direct result-card download to create one object URL.');
  assert(revokedUrls.length === 1 && revokedUrls[0] === 'blob:share-card', 'Expected direct result-card download to revoke its object URL.');

  await shareService.share({
    kind: 'result',
    title: 'Spin Clash',
    text: 'Spin Clash: landed a ring-out finish.',
    moment: 'ring_out',
    mode: 'challenge',
    arenaId: 'hex_bowl',
    arenaLabel: 'HEX BOWL',
    playerTop: 'impact',
    playerTopLabel: 'Impact',
    enemyPreset: 'armor_standard',
    enemyPresetLabel: 'ARMOR STANDARD',
    enemyTop: 'armor',
    enemyTopLabel: 'Armor',
    challengeNode: 3,
    scorePlayer: 2,
    scoreEnemy: 0,
    result: 'win'
  });

  assert(analyticsEvents.length === 2, 'Expected share_click and share_complete analytics events.');
  assert(analyticsEvents[0].name === 'share_click', 'Expected first share analytics event to be share_click.');
  assert(analyticsEvents[1].name === 'share_complete', 'Expected second share analytics event to be share_complete.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.playerTopLabel === 'Impact', 'Expected share_click to preserve playerTopLabel.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.enemyTopLabel === 'Armor', 'Expected share_click to preserve enemyTopLabel.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.enemyPreset === 'armor_standard', 'Expected share_click to preserve enemyPreset.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.enemyPresetLabel === 'ARMOR STANDARD', 'Expected share_click to preserve enemyPresetLabel.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.scorePlayer === 2, 'Expected share_click to preserve scorePlayer.');
  assert(analyticsEvents[0].payload && analyticsEvents[0].payload.scoreEnemy === 0, 'Expected share_click to preserve scoreEnemy.');
  assert(analyticsEvents[1].payload && analyticsEvents[1].payload.method === 'download_and_copy', 'Expected share_complete to preserve the fallback method.');
  assert(analyticsEvents[1].payload && analyticsEvents[1].payload.artifact === 'result_card_svg', 'Expected share_complete to preserve the artifact type.');
  assert(createdAnchors.length === 2, 'Expected result share fallback to create one additional download anchor.');
  assert(createdAnchors[1].clickCalled === true, 'Expected result share fallback to click the download anchor.');
  assert(/\.svg$/i.test(createdAnchors[1].download), 'Expected result share fallback to download an SVG card.');
  assert(objectUrls.length === 2, 'Expected result share fallback to create one additional object URL.');
  assert(revokedUrls.length === 2 && revokedUrls[1] === 'blob:share-card', 'Expected result share fallback to revoke the created object URL.');
  assert(clipboardWrites.length === 1 && clipboardWrites[0].includes('ring-out finish'), 'Expected result share fallback to copy share text.');
}

async function main() {
  await testResultShareFallbackDownloadsCardAndCopiesText();
  console.log('Share service check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
