(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.services = root.services || {};

  const scriptRegistry = {};

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
    if(state.node && state.node.dataset){
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
    return document.querySelector('script[data-spin-clash-provider-key="'+key+'"]')
      || (url ? document.querySelector('script[src="'+url+'"]') : null);
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

  function loadScriptOnce(key, url){
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
      const alreadyLoaded = (existing.dataset && existing.dataset.spinClashLoaded === '1')
        || existing.readyState === 'complete'
        || existing.readyState === 'loaded';
      state.loading = !alreadyLoaded;
      state.loaded = alreadyLoaded;
      if(alreadyLoaded){
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
    script.dataset = script.dataset || {};
    script.dataset.spinClashProviderKey = key;
    state.node = script;
    attachScriptLifecycle(script, state);
    if(typeof script.setAttribute === 'function'){
      script.setAttribute('data-spin-clash-provider-key', key);
    };
    document.head.appendChild(script);
    return state;
  }

  function waitForScript(key, url, timeoutMs){
    const state = loadScriptOnce(key, url);
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
    hasPosthogApi
  };
})();
