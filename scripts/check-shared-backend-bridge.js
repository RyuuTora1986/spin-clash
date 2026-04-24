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

function createStorage(seedMap) {
  const store = new Map(Object.entries(seedMap || {}));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

function createFetchStub() {
  const calls = [];
  let commitRevision = 0;
  const responders = {
    '/v1/install/register': () => ({
      data: {
        playerId: 'player_test',
        installationId: 'install_test',
        sessionToken: 'token_test',
        refreshAfter: '2099-01-01T00:00:00.000Z'
      }
    }),
    '/v1/projects/spin-clash/bootstrap': () => ({
      data: {
        projectKey: 'spin-clash',
        bootstrap: {
          defaultProgression: {
            state: {
              challenge: {
                unlockedNodeIndex: 0,
                checkpointNodeIndex: 0,
                completedNodes: [],
                lastNodeIndex: null,
                unlockedRankIndex: 0,
                selectedRankIndex: 0
              }
            }
          }
        }
      }
    }),
    '/v1/projects/spin-clash/daily': () => ({
      data: {
        projectKey: 'spin-clash',
        daily: {
          payload: {
            featuredArenaId: 'circle_bowl'
          }
        }
      }
    }),
    '/v1/projects/spin-clash/progression': () => ({
      data: {
        projectKey: 'spin-clash',
        progression: {
          revision: commitRevision,
          level: 1,
          xp: 100,
          softCurrency: 120,
          state: {
            challenge: {
              unlockedNodeIndex: 2,
              checkpointNodeIndex: 0,
              completedNodes: [0, 1],
              lastNodeIndex: 2,
              unlockedRankIndex: 0,
              selectedRankIndex: 0
            },
            unlocks: {
              arenas: ['circle_bowl', 'heart_bowl'],
              tops: ['impact', 'armor']
            },
            research: {
              levels: {
                spin_core: 1,
                guard_frame: 0,
                burst_relay: 0
              }
            },
            settings: {
              locale: 'zh',
              musicEnabled: true,
              sfxEnabled: false
            },
            sessions: 3,
            selectedArenaIndex: 1,
            selectedTopIndex: 1,
            homePreviewTopIndex: 1
          }
        }
      }
    }),
    '/v1/projects/spin-clash/rewards/claim': (body) => ({
      data: {
        idempotent: false,
        claim: {
          claimId: body.claimId,
          rewardKey: body.rewardKey,
          grantCurrency: 'scrap',
          grantAmount: 0
        }
      }
    }),
    '/v1/projects/spin-clash/progression/commit': (body) => {
      commitRevision += 1;
      return {
        data: {
          idempotent: false,
          progression: Object.assign({}, body.progression, { revision: commitRevision })
        }
      };
    }
  };

  async function fetch(url, options) {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const body = options && options.body ? JSON.parse(options.body) : null;
    calls.push({
      pathname,
      method: options && options.method ? options.method : 'GET',
      body
    });
    const responder = responders[pathname];
    if (!responder) {
      return {
        ok: false,
        status: 404,
        async json() {
          return { error: { message: 'not found', code: 'not_found' } };
        }
      };
    }
    const payload = responder(body || {});
    return {
      ok: true,
      status: 200,
      async json() {
        return payload;
      }
    };
  }

  return { fetch, calls };
}

function createContext() {
  const localStorage = createStorage({
    'spin-clash-save': JSON.stringify({
      version: 1,
      currency: 10,
      challenge: {
        unlockedNodeIndex: 0,
        checkpointNodeIndex: 0,
        completedNodes: []
      },
      unlocks: {
        arenas: ['circle_bowl', 'heart_bowl'],
        tops: ['impact', 'armor']
      },
      research: {
        levels: {
          spin_core: 0,
          guard_frame: 0,
          burst_relay: 0
        }
      },
      settings: {
        locale: 'en',
        musicEnabled: true,
        sfxEnabled: true
      },
      analytics: []
    })
  });
  const sessionStorage = createStorage();
  const fetchStub = createFetchStub();
  const context = vm.createContext({
    console,
    Date,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    fetch: fetchStub.fetch,
    document: {
      querySelector() {
        return null;
      }
    },
    window: {
      localStorage,
      sessionStorage,
      location: {
        search: '?backend=shared&backendBaseUrl=https://backend.example.test'
      },
      crypto: {
        randomUUID() {
          return 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        }
      }
    }
  });
  context.window.window = context.window;
  context.window.fetch = context.fetch;
  context.window.document = context.document;
  context.window.SpinClash = {
    config: {},
    services: {}
  };
  context.SpinClash = context.window.SpinClash;
  return { context, fetchCalls: fetchStub.calls };
}

async function main() {
  const { context, fetchCalls } = createContext();

  loadScript(path.join('src', 'bootstrap-app-globals.js'), context);
  loadScript(path.join('src', 'config-providers.js'), context);
  loadScript(path.join('src', 'storage-service.js'), context);
  loadScript(path.join('src', 'shared-backend-config.js'), context);
  loadScript(path.join('src', 'shared-backend-bridge.js'), context);
  loadScript(path.join('src', 'analytics-service.js'), context);
  loadScript(path.join('src', 'reward-service.js'), context);

  const bridge = context.SpinClash.services.sharedBackendBridge;
  const storage = context.SpinClash.services.storage;
  const reward = context.SpinClash.services.reward;

  assert(bridge && bridge.enabled === true, 'Expected shared backend bridge to enable from query params.');
  assert(reward.getAdapterInfo().adapter === 'shared_backend', 'Expected reward service to switch to shared_backend adapter.');

  const hydrated = await bridge.hydrate();
  const hydratedSave = storage.get();
  assert(hydrated && hydrated.save, 'Expected hydrate to return a save payload.');
  assert(hydratedSave.currency === 120, 'Expected hydrate to import remote soft currency into local save.');
  assert(hydratedSave.settings && hydratedSave.settings.locale === 'zh', 'Expected hydrate to import remote locale.');
  assert(hydratedSave.selectedArenaIndex === 1, 'Expected hydrate to import selected arena snapshot.');

  const rewardResult = await reward.request('double_reward', { source: 'bridge-check' });
  assert(rewardResult && rewardResult.adapter === 'shared_backend', 'Expected reward requests to use shared backend adapter.');
  assert(rewardResult.granted === true, 'Expected shared backend reward request to grant in the bridge check.');

  storage.patch({
    currency: 180,
    selectedTopIndex: 2,
    homePreviewTopIndex: 2
  });
  await storage.flushRemoteSync();

  const commitCalls = fetchCalls.filter((call) => call.pathname === '/v1/projects/spin-clash/progression/commit');
  const commitCall = commitCalls[commitCalls.length - 1];
  assert(commitCall, 'Expected storage patch to trigger a remote progression commit.');
  assert(commitCall.body && commitCall.body.progression && commitCall.body.progression.softCurrency === 180, 'Expected progression commit to carry updated soft currency.');
  assert(commitCall.body && commitCall.body.progression && commitCall.body.progression.state && commitCall.body.progression.state.selectedTopIndex === 2, 'Expected progression commit to carry selected top snapshot.');

  console.log('Shared backend bridge check passed.');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
