(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.runtime = root.runtime || {};

  function readMetaValue(name){
    const node = document && typeof document.querySelector === 'function'
      ? document.querySelector('meta[name="' + name + '"]')
      : null;
    return node && typeof node.getAttribute === 'function'
      ? node.getAttribute('content')
      : '';
  }

  function normalizePlatformId(value){
    const normalized = String(value || '').trim().toLowerCase();
    if(normalized === 'crazygames') return 'crazygames';
    return 'web';
  }

  function normalizeLaunchStage(value){
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'full' ? 'full' : 'basic';
  }

  function isCrazyGamesHost(hostname){
    return /(^|\.)crazygames\./i.test(String(hostname || ''));
  }

  const params = new URLSearchParams(window.location.search || '');
  const requestedPlatform = normalizePlatformId(
    params.get('platform')
    || readMetaValue('spin-clash-platform')
    || (isCrazyGamesHost(window.location && window.location.hostname) ? 'crazygames' : 'web')
  );
  const crazyGamesLaunchStage = normalizeLaunchStage(
    params.get('cgLaunchStage')
    || readMetaValue('spin-clash-crazygames-launch-stage')
    || 'basic'
  );

  const runtimeConfig = {
    id:requestedPlatform,
    isCrazyGames:requestedPlatform === 'crazygames',
    crazyGamesLaunchStage:crazyGamesLaunchStage,
    externalRewardAdsAllowed:requestedPlatform !== 'crazygames',
    queryForcedPlatform:params.has('platform'),
    hostDetectedCrazyGames:isCrazyGamesHost(window.location && window.location.hostname)
  };

  root.runtime.platform = runtimeConfig;
  window.__spinClashPlatformRuntime = runtimeConfig;
})();
