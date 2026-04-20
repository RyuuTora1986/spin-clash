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

function createClassList() {
  const classes = new Set();
  return {
    add(name) {
      classes.add(name);
    },
    remove(name) {
      classes.delete(name);
    },
    toggle(name, force) {
      if (typeof force === 'boolean') {
        if (force) classes.add(name);
        else classes.delete(name);
        return force;
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
    contains(name) {
      return classes.has(name);
    }
  };
}

function createElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    disabled: false,
    style: {},
    dataset: {},
    classList: createClassList()
  };
}

function createDocument() {
  const elements = new Map();
  const documentElement = { lang: 'en' };

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, createElement(id));
    }
    return elements.get(id);
  }

  return {
    documentElement,
    body: {
      appendChild() {},
      removeChild() {}
    },
    createElement(tagName) {
      return createElement(tagName);
    },
    getElementById(id) {
      return getElement(id);
    },
    querySelectorAll(selector) {
      if (selector === '[data-locale-target]') {
        return [
          'locale-title-en',
          'locale-title-zh',
          'locale-title-ja',
          'locale-loadout-en',
          'locale-loadout-zh',
          'locale-loadout-ja',
          'locale-settings-en',
          'locale-settings-zh',
          'locale-settings-ja'
        ].map((id) => {
          const element = getElement(id);
          element.dataset.localeTarget = id.split('-').pop();
          return element;
        });
      }
      return [];
    }
  };
}

function createContext() {
  const document = createDocument();
  const trackedPatches = [];
  const context = vm.createContext({
    console,
    window: {},
    document,
    navigator: {
      language: 'ja-JP',
      languages: ['ja-JP', 'en-US']
    },
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {}
  });
  context.window = context;
  context.window.document = document;
  context.window.navigator = context.navigator;
  context.window.SpinClash = {
    config: {},
    services: {
      storage: {
        get() {
          return {
            settings: {
              locale: 'zh'
            }
          };
        },
        patch(patch) {
          trackedPatches.push(patch);
          return patch;
        }
      }
    }
  };
  context.SpinClash = context.window.SpinClash;
  return { context, document, trackedPatches };
}

function walkKeys(value, prefix, output) {
  if (!value || typeof value !== 'object') {
    output.push(prefix);
    return;
  }
  const keys = Object.keys(value).sort();
  for (const key of keys) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    walkKeys(value[key], nextPrefix, output);
  }
}

function flattenKeys(value) {
  const output = [];
  walkKeys(value, '', output);
  return output;
}

function testLocaleTablesAndRuntime() {
  const { context, document, trackedPatches } = createContext();
  loadScript(path.join('src', 'bootstrap-app-globals.js'), context);
  loadScript(path.join('src', 'config-text.js'), context);
  loadScript(path.join('src', 'localization-tools.js'), context);

  const root = context.SpinClash;
  const locales = root.config.textLocales;

  assert(locales, 'Expected config-text.js to define root.config.textLocales.');
  assert(locales.en && locales.zh && locales.ja, 'Expected textLocales to include en, zh, and ja.');

  const enKeys = flattenKeys(locales.en);
  const zhKeys = flattenKeys(locales.zh);
  const jaKeys = flattenKeys(locales.ja);

  assert(
    JSON.stringify(enKeys) === JSON.stringify(zhKeys),
    'Expected Chinese locale keys to match English locale keys exactly.'
  );
  assert(
    JSON.stringify(enKeys) === JSON.stringify(jaKeys),
    'Expected Japanese locale keys to match English locale keys exactly.'
  );

  const jaTopNames = new Set(Object.values(locales.ja.tops || {}).map((entry) => entry && entry.name));
  (locales.ja.cards || []).forEach((card, index) => {
    assert(
      !jaTopNames.has(card.type),
      `Expected Japanese card type ${index} to stay distinct from localized top names so the loadout does not repeat the same label twice.`
    );
  });

  assert(typeof root.createLocalizationTools === 'function', 'Expected localization-tools.js to expose createLocalizationTools.');

  const textReference = root.config.text;
  const tools = root.createLocalizationTools({
    storageService: root.services.storage,
    applyStaticText() {},
    updateModeUI() {},
    ensureStorageNotice() {}
  });

  const initialLocale = tools.initialize();
  assert(initialLocale === 'zh', 'Expected saved locale to override browser language during initialization.');
  assert(root.config.text === textReference, 'Expected localization to preserve the existing root.config.text object reference.');
  assert(document.documentElement.lang === 'zh', 'Expected initialization to update <html lang>.');
  assert(root.config.text.titleQuickBattle !== locales.en.titleQuickBattle, 'Expected initialization to apply non-English localized text.');

  const nextLocale = tools.setLocale('ja-JP');
  assert(nextLocale === 'ja', 'Expected setLocale to normalize browser-style language tags.');
  assert(document.documentElement.lang === 'ja', 'Expected setLocale to update <html lang>.');
  assert(
    trackedPatches.length > 0
      && trackedPatches[trackedPatches.length - 1].settings
      && trackedPatches[trackedPatches.length - 1].settings.locale === 'ja',
    'Expected setLocale to persist normalized locale settings.'
  );
}

try {
  testLocaleTablesAndRuntime();
  console.log('Localization check passed.');
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
