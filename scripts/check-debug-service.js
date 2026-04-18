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

function createNode(tagName) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    style: {},
    children: [],
    listeners: {},
    textContent: '',
    id: '',
    disabled: false,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(name, handler) {
      this.listeners[name] = handler;
    },
    trigger(name) {
      if (typeof this.listeners[name] === 'function') {
        this.listeners[name]();
      }
    }
  };
}

function testDebugActionSyncErrorIsCaptured() {
  const body = createNode('body');
  const context = vm.createContext({
    console,
    window: {
      location: {
        search: '?debug=1'
      }
    },
    document: {
      body,
      createElement(tagName) {
        return createNode(tagName);
      }
    },
    URLSearchParams
  });
  context.window = context.window;
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.SpinClash = {
    services: {},
    debug: {}
  };
  context.SpinClash = context.window.SpinClash;

  loadScript(path.join('src', 'debug-service.js'), context);

  const debugService = context.SpinClash.services.debug;
  assert(debugService && debugService.enabled === true, 'Expected debug service to enable itself for ?debug=1.');

  const panelHandle = debugService.mount(
    function infoProvider() {
      return { ok: true };
    },
    [
      {
        label: 'BROKEN ACTION',
        run() {
          throw new Error('bad_json');
        }
      }
    ]
  );

  assert(panelHandle && panelHandle.wrap, 'Expected debug panel mount to return a handle.');
  const actionRow = panelHandle.wrap.children[2];
  const button = actionRow && actionRow.children ? actionRow.children[0] : null;
  const status = panelHandle.wrap.children[1];

  assert(button, 'Expected mounted debug panel to render the action button.');

  let threw = false;
  try {
    button.trigger('click');
  } catch (error) {
    threw = true;
  }

  assert(threw === false, 'Expected sync debug action failure to be captured instead of thrown.');
  assert(
    typeof status.textContent === 'string' && status.textContent.indexOf('BROKEN ACTION FAILED: bad_json') >= 0,
    'Expected debug panel status to show the sync failure reason.'
  );
}

try {
  testDebugActionSyncErrorIsCaptured();
  console.log('Debug service check passed.');
} catch (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
