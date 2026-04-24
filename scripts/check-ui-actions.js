const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(repoRoot, 'index.html');
const uiEntryToolsPath = path.join(repoRoot, 'src', 'ui-entry-tools.js');
const failures = [];

function collectInvokedActions() {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const pattern = /__spinClashInvoke\(\s*['"]([^'"]+)['"]/g;
  const actions = new Set();
  let match;
  while ((match = pattern.exec(html)) !== null) {
    actions.add(match[1]);
  }
  return actions;
}

function collectExposedActions() {
  const text = fs.readFileSync(uiEntryToolsPath, 'utf8');
  const actions = new Set();
  const bindingBlockMatch = text.match(/const actionBindings = \{([\s\S]*?)\n\s*\};/);
  if (!bindingBlockMatch) {
    failures.push('Could not find actionBindings block in src/ui-entry-tools.js');
    return actions;
  }

  const block = bindingBlockMatch[1];
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim().replace(/,$/, '');
    if (!line || line.startsWith('//')) continue;

    const pairMatch = line.match(/^([A-Za-z0-9_]+)\s*:/);
    if (pairMatch) {
      actions.add(pairMatch[1]);
      continue;
    }

    const shorthandMatch = line.match(/^([A-Za-z0-9_]+)$/);
    if (shorthandMatch) {
      actions.add(shorthandMatch[1]);
    }
  }
  return actions;
}

function createTitleOverlayStub() {
  return {
    classList: {
      add() {},
      remove() {}
    },
    style: {}
  };
}

function assertInfoRouteReturnChain() {
  const source = fs.readFileSync(uiEntryToolsPath, 'utf8');
  const sandbox = {
    window: {},
    document: {
      getElementById() {
        return createTitleOverlayStub();
      },
      querySelectorAll() {
        return [];
      }
    },
    console
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'src/ui-entry-tools.js' });

  const createUiEntryTools = sandbox.window.SpinClash && sandbox.window.SpinClash.createUiEntryTools;
  if (typeof createUiEntryTools !== 'function') {
    failures.push('Could not initialize createUiEntryTools for UI action behavior checks.');
    return;
  }

  const state = {
    route: 'settings',
    routeFrom: 'quick',
    infoPage: 'about'
  };

  const tools = createUiEntryTools({
    tops: [{ id: 1, unlockSource: 'starter', unlockCost: 0 }],
    arenas: [{ id: 1 }],
    getUiRoute: () => state.route,
    setUiRoute: (value) => {
      state.route = value;
    },
    getUiRouteFrom: () => state.routeFrom,
    setUiRouteFrom: (value) => {
      state.routeFrom = value;
    },
    getInfoPage: () => state.infoPage,
    setInfoPage: (value) => {
      state.infoPage = value;
    },
    getPlayerTopId: () => 0,
    setPlayerTopId() {},
    getHomePreviewTopId: () => 0,
    setHomePreviewTopId() {},
    getSelectedArenaIndex: () => 0,
    setSelectedArenaIndex() {},
    getCurrentArena: () => 0,
    setCurrentArena() {},
    getSave: () => ({ challenge: { unlockedNodeIndex: 0 }, unlocks: { tops: [1] } }),
    getLoadoutOverlay: () => ({}),
    showLoadoutOverlay() {},
    hideLoadoutOverlay() {},
    setWorkshopOpen() {},
    updateModeUI() {},
    initAudioSafely() {},
    syncDebugPanel() {},
    showRuntimeError(message) {
      failures.push(`UI entry runtime error during behavior check: ${message}`);
    }
  });

  tools.openInfo('privacy');
  if (state.route !== 'info' || state.routeFrom !== 'settings') {
    failures.push('openInfo should route to info and remember the current page as the immediate return route.');
    return;
  }

  tools.closeInfo();
  if (state.route !== 'settings' || state.routeFrom !== 'quick') {
    failures.push('closeInfo should restore the prior page and preserve its original route-from chain.');
    return;
  }

  tools.openInfo('terms');
  tools.goBack();
  if (state.route !== 'settings' || state.routeFrom !== 'quick') {
    failures.push('goBack from info should behave like closeInfo and preserve the prior route chain.');
  }
}

function main() {
  const invoked = collectInvokedActions();
  const exposed = collectExposedActions();
  const requiredActions = new Set(['setLocale', 'guard', 'openInfo', 'closeInfo']);

  for (const action of invoked) {
    if (!exposed.has(action) && action !== 'enterBattle') {
      failures.push(`index.html invokes missing UI action: ${action}`);
    }
  }

  for (const action of requiredActions) {
    if (!exposed.has(action)) {
      failures.push(`Missing required UI action: ${action}`);
    }
  }

  assertInfoRouteReturnChain();

  if (failures.length) {
    console.error('UI action contract check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('UI action contract check passed.');
}

main();
