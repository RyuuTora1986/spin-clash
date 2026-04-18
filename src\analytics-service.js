(function(){
  const root = window.SpinClash;
  const storage = root.services.storage;
  const providerRuntime = root.services.providerRuntime || null;
  const providerConfig = (root.config && root.config.providers && root.config.providers.analytics) || {};
  const posthogConfig = providerConfig.posthog || {};
  const SCRIPT_LOAD_TIMEOUT_MS = 4000;
  const FORWARD_REASON_LOCAL_ONLY = 'local_only';
  const POSTHOG_REASON_LOADING = 'posthog_loading';
  const POSTHOG_REASON_CONFIG_MISSING = 'posthog_config_missing';
  const POSTHOG_REASON_UNAVAILABLE = 'posthog_unavailable';

  function shouldUsePosthog(){
    return providerConfig.adapter === 'posthog'
      && providerConfig.enableForwarding === true
      && posthogConfig.enabled === true;
  }

  function createLocalForwarder(){
    return {
      name:'local_buffer',
      isReady:()=>false,
      getState(){
        return {
          ready:false,
          loading:false,
          lastForwardReason:FORWARD_REASON_LOCAL_ONLY,
          initialized:false,
          queuedEvents:0
        };
      },
      capture(){
        return { forwarded:false, reason:FORWARD_REASON_LOCAL_ONLY };
      }
    };
  }

  function normalizeForwardingFailureReason(reason){
    if(reason === FORWARD_REASON_LOCAL_ONLY) return FORWARD_REASON_LOCAL_ONLY;
    if(reason === POSTHOG_REASON_LOADING) return POSTHOG_REASON_LOADING;
    if(reason === POSTHOG_REASON_CONFIG_MISSING) return POSTHOG_REASON_CONFIG_MISSING;
    if(reason === POSTHOG_REASON_UNAVAILABLE) return POSTHOG_REASON_UNAVAILABLE;
    return shouldUsePosthog()
      ? POSTHOG_REASON_UNAVAILABLE
      : FORWARD_REASON_LOCAL_ONLY;
  }

  function createPosthogForwarder(){
    const state = {
      initialized:false,
      queue:[],
      lastForwardReason:null,
      readyPromise:null
    };

    function hasUsableConfig(){
      return !!(posthogConfig.projectApiKey && posthogConfig.apiHost);
    }

    function getScriptState(){
      return providerRuntime && typeof providerRuntime.getScriptState === 'function'
        ? providerRuntime.getScriptState('analytics-posthog')
        : null;
    }

    function getSdk(){
      return providerRuntime && typeof providerRuntime.hasPosthogApi === 'function' && providerRuntime.hasPosthogApi()
        ? window.posthog
        : null;
    }

    function isForwardingReady(){
      return !!(hasUsableConfig() && getSdk());
    }

    function clearQueue(){
      state.queue.length = 0;
    }

    function normalizeFailureReason(reason){
      if(reason === POSTHOG_REASON_CONFIG_MISSING){
        return POSTHOG_REASON_CONFIG_MISSING;
      }
      return POSTHOG_REASON_UNAVAILABLE;
    }

    function markUnavailable(reason){
      const normalizedReason = normalizeFailureReason(reason);
      clearQueue();
      state.lastForwardReason = normalizedReason;
      if(providerRuntime && typeof providerRuntime.markScriptFailed === 'function'){
        providerRuntime.markScriptFailed('analytics-posthog', normalizedReason, posthogConfig.scriptUrl);
      }
      return normalizedReason;
    }

    function captureWithSdk(sdk, event){
      try{
        sdk.capture(event.name, event.payload);
        state.lastForwardReason = null;
        return true;
      }catch(error){
        markUnavailable(error && error.message ? error.message : POSTHOG_REASON_UNAVAILABLE);
        return false;
      }
    }

    function flushQueue(){
      const sdk = getSdk();
      if(!sdk) return;
      if(!state.initialized && !initSdkIfPossible()){
        return;
      }
      while(state.queue.length){
        const event = state.queue.shift();
        if(!captureWithSdk(sdk, event)){
          return;
        }
      }
      state.lastForwardReason = null;
    }

    function initSdkIfPossible(){
      const sdk = window.posthog;
      if(!sdk || typeof sdk.init !== 'function' || state.initialized) return false;
      if(!hasUsableConfig()) return false;
      try{
        sdk.init(posthogConfig.projectApiKey, {
          api_host:posthogConfig.apiHost,
          capture_pageview:posthogConfig.capturePageview === true,
          autocapture:posthogConfig.autocapture === true,
          disable_session_recording:posthogConfig.disableSessionRecording !== false
        });
      }catch(error){
        markUnavailable(error && error.message ? error.message : POSTHOG_REASON_UNAVAILABLE);
        return false;
      }
      state.initialized = true;
      flushQueue();
      return true;
    }

    function loadScriptOnce(){
      try{
        const current = getScriptState();
        if((current && current.loading) || !providerRuntime || typeof providerRuntime.loadScriptOnce !== 'function') return;
        const scriptState = providerRuntime.loadScriptOnce('analytics-posthog', posthogConfig.scriptUrl);
        return scriptState;
      }catch(error){
        markUnavailable(error && error.message ? error.message : POSTHOG_REASON_UNAVAILABLE);
        return null;
      }
    }

    function waitForSdkReady(){
      if(state.readyPromise) return state.readyPromise;
      if(!providerRuntime || typeof providerRuntime.waitForScript !== 'function'){
        const reason = markUnavailable(POSTHOG_REASON_UNAVAILABLE);
        return Promise.reject(new Error(reason));
      }
      try{
        state.readyPromise = providerRuntime.waitForScript(
          'analytics-posthog',
          posthogConfig.scriptUrl,
          SCRIPT_LOAD_TIMEOUT_MS
        ).then(function(){
          const sdk = getSdk();
          if(!sdk){
            throw new Error(POSTHOG_REASON_UNAVAILABLE);
          }
          if(!state.initialized && !initSdkIfPossible()){
            throw new Error(state.lastForwardReason || POSTHOG_REASON_UNAVAILABLE);
          }
          flushQueue();
          state.lastForwardReason = null;
          return sdk;
        }).catch(function(error){
          const normalizedReason = normalizeFailureReason(error && error.message ? error.message : POSTHOG_REASON_UNAVAILABLE);
          if(normalizedReason === POSTHOG_REASON_UNAVAILABLE){
            markUnavailable(normalizedReason);
          }else{
            state.lastForwardReason = normalizedReason;
          }
          state.readyPromise = null;
          throw new Error(normalizedReason);
        });
      }catch(error){
        const reason = markUnavailable(error && error.message ? error.message : POSTHOG_REASON_UNAVAILABLE);
        state.readyPromise = null;
        return Promise.reject(new Error(reason));
      }
      return state.readyPromise;
    }

    return {
      name:'posthog',
      isReady(){
        return isForwardingReady();
      },
      getState(){
        const scriptState = getScriptState();
        return {
          ready:isForwardingReady(),
          loading:!!(scriptState && scriptState.loading),
          lastForwardReason:state.lastForwardReason,
          initialized:state.initialized,
          queuedEvents:state.queue.length
        };
      },
      capture(event){
        if(!hasUsableConfig()){
          state.lastForwardReason = POSTHOG_REASON_CONFIG_MISSING;
          clearQueue();
          return { forwarded:false, reason:POSTHOG_REASON_CONFIG_MISSING };
        }
        const sdk = getSdk();
        if(sdk){
          if(!state.initialized && !initSdkIfPossible()){
            return { forwarded:false, reason:state.lastForwardReason || POSTHOG_REASON_CONFIG_MISSING };
          }
          if(captureWithSdk(sdk, event)){
            return { forwarded:true };
          }
          return { forwarded:false, reason:state.lastForwardReason || POSTHOG_REASON_UNAVAILABLE };
        }
        if(initSdkIfPossible()){
          const readySdk = getSdk();
          if(readySdk){
            if(captureWithSdk(readySdk, event)){
              return { forwarded:true };
            }
            return { forwarded:false, reason:state.lastForwardReason || POSTHOG_REASON_UNAVAILABLE };
          }
        }
        if(!posthogConfig.scriptUrl || !providerRuntime || typeof providerRuntime.loadScriptOnce !== 'function' || typeof providerRuntime.waitForScript !== 'function'){
          return { forwarded:false, reason:markUnavailable(POSTHOG_REASON_UNAVAILABLE) };
        }
        state.queue.push(event);
        loadScriptOnce();
        waitForSdkReady().catch(function(){});
        state.lastForwardReason = POSTHOG_REASON_LOADING;
        return { forwarded:false, reason:POSTHOG_REASON_LOADING };
      }
    };
  }

  function createForwarder(){
    if(shouldUsePosthog()){
      return createPosthogForwarder();
    }
    return createLocalForwarder();
  }

  const forwarder = createForwarder();

  const service = {
    track(name, payload){
      const event = {
        name,
        payload: payload || {},
        at: new Date().toISOString()
      };
      storage.transact((save)=>{
        save.analytics = Array.isArray(save.analytics) ? save.analytics : [];
        save.analytics.push(event);
        save.analytics = save.analytics.slice(-200);
        return save;
      });
      try{
        event.forwarding = forwarder.capture(event);
      }catch(error){
        event.forwarding = {
          forwarded:false,
          reason:normalizeForwardingFailureReason(error && error.message ? error.message : null)
        };
        if(root.debug.enabled){
          console.warn('[analytics-forward]', event.forwarding);
        }
      }
      if (root.debug.enabled) {
        console.info('[analytics]', event);
      }
      return event;
    },
    list(){
      return storage.get().analytics || [];
    },
    clear(){
      storage.transact((save)=>{ save.analytics = []; return save; });
    },
    getAdapterInfo(){
      const state = typeof forwarder.getState === 'function'
        ? forwarder.getState()
        : { ready:false, loading:false, lastForwardReason:null };
      return {
        adapter:forwarder.name,
        forwardingEnabled:shouldUsePosthog(),
        ready:state.ready,
        loading:state.loading,
        lastForwardReason:state.lastForwardReason,
        initialized:state.initialized === true,
        queuedEvents:typeof state.queuedEvents === 'number' ? state.queuedEvents : 0
      };
    }
  };

  root.services.analytics = service;
})();
