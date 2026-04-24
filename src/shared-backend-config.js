(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.runtime = root.runtime || {};
  const PRESET_BACKENDS = {
    'shared-dev': {
      environmentName:'dev',
      environmentLabel:'DEV',
      baseUrl:'https://shared-game-backend-dev.liuyinzg.workers.dev'
    },
    'shared-prod': {
      environmentName:'prod',
      environmentLabel:'PROD',
      baseUrl:'https://shared-game-backend-prod.liuyinzg.workers.dev'
    }
  };

  function readMetaValue(name){
    const node = document && typeof document.querySelector === 'function'
      ? document.querySelector('meta[name="' + name + '"]')
      : null;
    return node && typeof node.getAttribute === 'function'
      ? node.getAttribute('content')
      : null;
  }

  const params = new URLSearchParams(window.location.search || '');
  const requestedMode = params.get('backend') || readMetaValue('spin-clash-backend-mode') || 'local';
  const requestedTarget = params.get('backendTarget') || readMetaValue('spin-clash-backend-target') || '';
  const presetBackend = PRESET_BACKENDS[requestedMode] || PRESET_BACKENDS['shared-' + requestedTarget] || null;
  const requestedBaseUrl = params.get('backendBaseUrl') || readMetaValue('spin-clash-backend-base-url') || (presetBackend ? presetBackend.baseUrl : '');
  const normalizedBaseUrl = requestedBaseUrl.replace(/\/+$/,'');
  const enabled = (requestedMode === 'shared' || !!presetBackend) && !!normalizedBaseUrl;
  const environmentName = enabled
    ? (presetBackend ? presetBackend.environmentName : 'custom')
    : 'local';
  const environmentLabel = enabled
    ? (presetBackend ? presetBackend.environmentLabel : 'CUSTOM')
    : 'LOCAL';

  const runtimeConfig = {
    mode: enabled ? 'shared' : 'local',
    enabled: enabled,
    baseUrl: enabled ? normalizedBaseUrl : null,
    environmentName: environmentName,
    environmentLabel: environmentLabel,
    projectKey: 'spin-clash',
    clientBuild: 'spin-clash-web',
    sessionStorageKey: 'spin-clash.shared-backend.session',
    allowedRewards: ['double_reward', 'continue_once', 'trial_unlock_arena']
  };

  root.runtime.sharedBackend = runtimeConfig;
  window.__spinClashSharedBackendRuntime = runtimeConfig;
})();
