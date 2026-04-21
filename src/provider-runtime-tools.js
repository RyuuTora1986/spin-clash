(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.services = root.services || {};

  const scriptRegistry = {};
  const adsenseH5State = {
    initialized:false,
    initializing:false,
    configApplied:false,
    ready:false,
    lastError:null,
    clientId:'',
    promise:null
  };

  function getEntry(key){
    return scriptRegistry[key] || null;
  }

  function ensureScriptState(key, url){
    if(!scriptRegistry[key]){
      scriptRegistry[key] = {
        key,
        url: url || '',
        node:null,
        loading:false,
        loaded:false,
        error:false,
        lastError:null,
        promise:null,
        resolve:null,
        reject:null
      };
    }else if(url && !scriptRegistry[key].url){
      scriptRegistry[key].url = url;
    }
    return scriptRegistry[key];
  }

  function ensureDeferred(state){
    if(state.promise) return state.promise;
    state.promise = new Promise(function(resolve, reject){
      state.resolve = resolve;
      state.reject = reject;
    });
    return state.promise;
  }

  function settleLoaded(state){
    state.loading = false;
    state.loaded = true;
    state.error = false;
    state.lastError = null;
    if(state.node){
      state.node.__spinClashLoaded = true;
    }
    if(state.node && state.node.dataset && state.key !== 'reward-adsense-h5'){
      state.node.dataset.spinClashLoaded = '1';
    }
    if(typeof state.resolve === 'function'){
      state.resolve(state);
      state.resolve = null;
      state.reject = null;
    }
  }

  function settleError(state, reason){
    state.loading = false;
    state.loaded = false;
    state.error = true;
    state.lastError = reason || 'script_load_failed';
    if(typeof state.reject === 'function'){
      state.reject(new Error(state.lastError));
      state.resolve = null;
      state.reject = null;
    }
  }

  function findExistingScript(key, url){
    if(!document || !document.head || typeof document.querySelector !== 'function'){
      return null;
    }
    return Array.prototype.find.call(document.scripts || [], function(script){
      return !!script && script.__spinClashProviderKey === key;
    })
      || document.querySelector('script[data-spin-clash-provider-key="'+key+'"]')
      || (url ? document.querySelector('script[src="'+url+'"]') : null);
  }

  function applyScriptOptions(script, options){
    if(!script || !options || !options.attributes) return;
    Object.keys(options.attributes).forEach(function(attrName){
      const value = options.attributes[attrName];
      if(value == null || value === '') return;
      if(attrName === 'crossorigin' || attrName === 'crossOrigin'){
        script.crossOrigin = value;
        if(typeof script.setAttribute === 'function'){
          script.setAttribute('crossorigin', value);
        }
        return;
      }
      if(attrName.indexOf('data-') === 0){
        if(script.dataset){
          const datasetKey = attrName.slice(5).replace(/-([a-z])/g, function(_, chr){
            return chr.toUpperCase();
          });
          script.dataset[datasetKey] = value;
        }
        if(typeof script.setAttribute === 'function'){
          script.setAttribute(attrName, value);
        }
        return;
      }
      if(typeof script.setAttribute === 'function'){
        script.setAttribute(attrName, value);
      }
      if(attrName in script){
        script[attrName] = value;
      }
    });
  }

  function attachScriptLifecycle(script, state){
    if(!script || script.__spinClashLifecycleAttached) return;
    script.__spinClashLifecycleAttached = true;
    const prevLoad = typeof script.onload === 'function' ? script.onload : null;
    const prevError = typeof script.onerror === 'function' ? script.onerror : null;
    script.onload = function(){
      if(prevLoad) prevLoad.apply(this, arguments);
      settleLoaded(state);
    };
    script.onerror = function(){
      if(prevError) prevError.apply(this, arguments);
      settleError(state, 'script_load_failed');
    };
  }

  function loadScriptOnce(key, url, options){
    const state = ensureScriptState(key, url);
    if(state.loaded || state.loading) return state;
    if(!url){
      settleError(state, 'missing_url');
      return state;
    }
    if(!document || !document.head){
      settleError(state, 'document_head_missing');
      return state;
    }

    const existing = findExistingScript(key, url);
    if(existing){
      state.node = existing;
      applyScriptOptions(existing, options);
      const alreadyLoaded = existing.__spinClashLoaded === true
        || (existing.dataset && existing.dataset.spinClashLoaded === '1')
        || existing.readyState === 'complete'
        || existing.readyState === 'loaded';
      const h5AlreadyBootstrapped = key === 'reward-adsense-h5' && hasAdsenseH5Api();
      state.loading = !alreadyLoaded;
      state.loaded = alreadyLoaded || h5AlreadyBootstrapped;
      if(state.loaded){
        settleLoaded(state);
      }else{
        ensureDeferred(state);
        attachScriptLifecycle(existing, state);
      }
      return state;
    }

    state.loading = true;
    state.error = false;
    state.lastError = null;
    ensureDeferred(state);

    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    script.__spinClashProviderKey = key;
    if(key !== 'reward-adsense-h5'){
      script.dataset = script.dataset || {};
      script.dataset.spinClashProviderKey = key;
    }
    applyScriptOptions(script, options);
    state.node = script;
    attachScriptLifecycle(script, state);
    if(key !== 'reward-adsense-h5' && typeof script.setAttribute === 'function'){
      script.setAttribute('data-spin-clash-provider-key', key);
    }
    document.head.appendChild(script);
    return state;
  }

  function waitForScript(key, url, timeoutMs, options){
    const state = loadScriptOnce(key, url, options);
    if(state.loaded) return Promise.resolve(state);
    if(state.error && !state.loading){
      return Promise.reject(new Error(state.lastError || 'script_load_failed'));
    }
    const wait = ensureDeferred(state);
    if(!timeoutMs || timeoutMs <= 0){
      return wait;
    }
    return Promise.race([
      wait,
      new Promise(function(_, reject){
        setTimeout(function(){
          const current = getEntry(key);
          if(current && current.loaded) return;
          reject(new Error('script_load_timeout'));
        }, timeoutMs);
      })
    ]);
  }

  function markScriptFailed(key, reason, url){
    const state = ensureScriptState(key, url);
    settleError(state, reason || 'script_load_failed');
    return state;
  }

  function getAdsenseH5ClientId(config){
    if(!config || typeof config !== 'object') return '';
    return (config.dataAdClient || config.publisherId || '').trim();
  }

  function buildAdsenseH5ScriptUrl(config){
    const baseUrl = config && config.scriptUrl ? String(config.scriptUrl).trim() : '';
    const clientId = getAdsenseH5ClientId(config);
    if(!baseUrl || !clientId) return baseUrl;
    if(/[?&]client=/.test(baseUrl)) return baseUrl;
    return baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + 'client=' + encodeURIComponent(clientId);
  }

  function buildAdsenseH5ScriptOptions(config){
    const clientId = getAdsenseH5ClientId(config);
    const attributes = {
      crossorigin:'anonymous',
      'data-ad-client':clientId
    };
    if(config && config.testMode === true){
      attributes['data-adbreak-test'] = 'on';
    }
    return { attributes };
  }

  function ensureAdsenseH5Globals(){
    window.adsbygoogle = window.adsbygoogle || [];
    if(typeof window.adBreak === 'function' && typeof window.adConfig === 'function'){
      return;
    }
    const dispatcher = function(options){
      window.adsbygoogle.push(options);
    };
    dispatcher.__spinClashGenerated = true;
    window.adBreak = dispatcher;
    window.adConfig = dispatcher;
  }

  function hasAdsenseH5Api(){
    return !!(
      window.adsbygoogle
      && typeof window.adBreak === 'function'
      && typeof window.adConfig === 'function'
    );
  }

  function resetAdsenseH5Error(reason, clientId){
    adsenseH5State.initializing = false;
    adsenseH5State.ready = false;
    adsenseH5State.initialized = false;
    adsenseH5State.configApplied = false;
    adsenseH5State.lastError = reason || 'provider_unavailable';
    adsenseH5State.clientId = clientId || adsenseH5State.clientId || '';
    adsenseH5State.promise = null;
  }

  function markAdsenseH5Configured(clientId){
    adsenseH5State.initializing = false;
    adsenseH5State.initialized = true;
    adsenseH5State.configApplied = true;
    adsenseH5State.lastError = null;
    adsenseH5State.clientId = clientId || adsenseH5State.clientId || '';
    adsenseH5State.promise = null;
  }

  function markAdsenseH5Ready(clientId){
    adsenseH5State.initializing = false;
    adsenseH5State.ready = true;
    adsenseH5State.initialized = true;
    adsenseH5State.configApplied = true;
    adsenseH5State.lastError = null;
    adsenseH5State.clientId = clientId || adsenseH5State.clientId || '';
    adsenseH5State.promise = null;
  }

  function hasAdsenseH5BootstrapPreload(clientId){
    const bootstrap = window.__spinClashAdsenseH5Bootstrap;
    return !!(
      bootstrap
      && bootstrap.preloadConfigured === true
      && (!clientId || !bootstrap.clientId || bootstrap.clientId === clientId)
    );
  }

  function hasAdsenseH5BootstrapReady(clientId){
    const bootstrap = window.__spinClashAdsenseH5Bootstrap;
    return !!(
      bootstrap
      && bootstrap.ready === true
      && (!clientId || !bootstrap.clientId || bootstrap.clientId === clientId)
    );
  }

  function initAdsenseH5(config, timeoutMs){
    const safeConfig = config && typeof config === 'object' ? config : {};
    const clientId = getAdsenseH5ClientId(safeConfig);
    const scriptUrl = buildAdsenseH5ScriptUrl(safeConfig);
    if(safeConfig.enabled !== true){
      resetAdsenseH5Error('provider_disabled', clientId);
      return Promise.reject(new Error('provider_disabled'));
    }
    if(!clientId){
      resetAdsenseH5Error('provider_misconfigured', clientId);
      return Promise.reject(new Error('provider_misconfigured'));
    }
    if(adsenseH5State.ready && adsenseH5State.clientId === clientId){
      return Promise.resolve(getAdsenseH5State());
    }
    if(hasAdsenseH5BootstrapReady(clientId) && hasAdsenseH5Api()){
      markAdsenseH5Ready(clientId);
      return Promise.resolve(getAdsenseH5State());
    }
    if(hasAdsenseH5BootstrapPreload(clientId) && hasAdsenseH5Api()){
      markAdsenseH5Configured(clientId);
      return Promise.resolve(getAdsenseH5State());
    }
    if(
      adsenseH5State.initialized
      && adsenseH5State.configApplied
      && adsenseH5State.clientId === clientId
      && hasAdsenseH5Api()
    ){
      return Promise.resolve(getAdsenseH5State());
    }
    if(adsenseH5State.initializing && adsenseH5State.promise){
      return adsenseH5State.promise;
    }
    if(adsenseH5State.initialized && adsenseH5State.clientId && adsenseH5State.clientId !== clientId){
      resetAdsenseH5Error('provider_misconfigured', clientId);
      return Promise.reject(new Error('provider_misconfigured'));
    }

    adsenseH5State.initializing = true;
    adsenseH5State.lastError = null;
    adsenseH5State.clientId = clientId;
    ensureAdsenseH5Globals();

    adsenseH5State.promise = waitForScript(
      'reward-adsense-h5',
      scriptUrl,
      timeoutMs,
      buildAdsenseH5ScriptOptions(safeConfig)
    ).then(function(){
      if(!hasAdsenseH5Api()){
        throw new Error('provider_unavailable');
      }
      if(adsenseH5State.configApplied && adsenseH5State.clientId === clientId){
        return getAdsenseH5State();
      }
      if(hasAdsenseH5BootstrapReady(clientId)){
        markAdsenseH5Ready(clientId);
        return getAdsenseH5State();
      }
      if(hasAdsenseH5BootstrapPreload(clientId)){
        markAdsenseH5Configured(clientId);
        return getAdsenseH5State();
      }
      try{
        window.adConfig({
          sound:safeConfig.preloadHints && safeConfig.preloadHints.sound ? safeConfig.preloadHints.sound : 'off',
          preloadAdBreaks:safeConfig.preloadHints && safeConfig.preloadHints.preload ? safeConfig.preloadHints.preload : 'auto',
          onReady:function(){
            markAdsenseH5Ready(clientId);
          }
        });
      }catch(error){
        throw new Error('provider_unavailable');
      }
      markAdsenseH5Configured(clientId);
      return getAdsenseH5State();
    }).then(function(){
      return getAdsenseH5State();
    }).catch(function(error){
      const reason = error && error.message ? error.message : 'provider_unavailable';
      resetAdsenseH5Error(reason, clientId);
      throw new Error(reason);
    });

    return adsenseH5State.promise;
  }

  function getAdsenseH5State(){
    const bootstrap = window.__spinClashAdsenseH5Bootstrap;
    return {
      initialized:adsenseH5State.initialized || hasAdsenseH5BootstrapPreload(adsenseH5State.clientId),
      initializing:adsenseH5State.initializing,
      configApplied:adsenseH5State.configApplied || hasAdsenseH5BootstrapPreload(adsenseH5State.clientId),
      ready:adsenseH5State.ready || hasAdsenseH5BootstrapReady(adsenseH5State.clientId),
      lastError:adsenseH5State.lastError,
      clientConfigured:!!(adsenseH5State.clientId || (bootstrap && bootstrap.clientId))
    };
  }

  function ensureGptQueue(){
    window.googletag = window.googletag || {};
    window.googletag.cmd = Array.isArray(window.googletag.cmd) ? window.googletag.cmd : [];
    return window.googletag;
  }

  function hasGptDisplayApi(){
    return !!(window.googletag && typeof window.googletag.display === 'function');
  }

  function hasGptPubAdsApi(){
    return !!(
      window.googletag
      && typeof window.googletag.defineOutOfPageSlot === 'function'
      && typeof window.googletag.pubads === 'function'
      && typeof window.googletag.enableServices === 'function'
    );
  }

  function hasGptRewardedApi(){
    return !!(
      hasGptPubAdsApi()
      && window.googletag.enums
      && window.googletag.enums.OutOfPageFormat
      && window.googletag.enums.OutOfPageFormat.REWARDED
    );
  }

  function hasPosthogApi(){
    return !!(window.posthog && typeof window.posthog.init === 'function' && typeof window.posthog.capture === 'function');
  }

  root.services.providerRuntime = {
    loadScriptOnce,
    waitForScript,
    markScriptFailed,
    getScriptState(key){
      return getEntry(key);
    },
    ensureGptQueue,
    hasGptDisplayApi,
    hasGptPubAdsApi,
    hasGptRewardedApi,
    hasPosthogApi,
    buildAdsenseH5ScriptUrl,
    buildAdsenseH5ScriptOptions,
    ensureAdsenseH5Globals,
    hasAdsenseH5Api,
    initAdsenseH5,
    getAdsenseH5State
  };
})();
