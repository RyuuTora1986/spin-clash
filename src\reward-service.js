(function(){
  const root = window.SpinClash;
  const analytics = () => root.services.analytics;
  const providerRuntime = root.services.providerRuntime || null;
  const providerConfig = (root.config && root.config.providers && root.config.providers.reward) || {};
  const adsenseConfig = providerConfig.adsense || {};
  const SCRIPT_LOAD_TIMEOUT_MS = 4000;
  let mockMode = providerConfig.mockMode === 'deny' || providerConfig.mockMode === 'error'
    ? providerConfig.mockMode
    : 'grant';

  function getResultValue(placement, context){
    const payloadContext = context || {};
    if(placement === 'double_reward'){
      return { kind:'currency_multiplier', multiplier:2 };
    }
    if(placement === 'continue_once'){
      return {
        kind:'continue',
        nodeIndex:payloadContext.nodeIndex != null ? payloadContext.nodeIndex : null
      };
    }
    if(placement === 'trial_unlock_arena'){
      return {
        kind:'trial_unlock',
        targetType:'arena',
        arenaId:payloadContext.arenaId || null
      };
    }
    return { kind:'generic_reward', placement };
  }

  function getFailureInfo(input){
    if(input && input.granted === true){
      return { granted:true, category:'granted', reason:null };
    }
    const reason = input && typeof input === 'object'
      ? (
        input.reason
        || input.message
        || (input.granted === false ? 'not_granted' : 'unknown')
      )
      : 'unknown';

    let category = 'error';
    if(input && input.granted === false){
      category = 'declined';
    }else if(reason === 'provider_loading' || reason === 'script_load_timeout'){
      category = 'loading';
    }else if(reason === 'request_in_flight'){
      category = 'busy';
    }else if(
      reason === 'provider_unavailable'
      || reason === 'provider_disabled'
      || reason === 'ad_unit_missing'
      || reason === 'provider_misconfigured'
      || reason === 'posthog_missing'
      || reason === 'posthog_config_missing'
    ){
      category = 'unavailable';
    }
    return {
      granted:false,
      category,
      reason
    };
  }

  function createMockAdapter(){
    return {
      name:'mock',
      isAvailable(){
        return true;
      },
      request(placement, payloadContext, resultValue){
        if(mockMode === 'deny'){
          return Promise.resolve({
            placement,
            adapter:'mock',
            granted:false,
            context:payloadContext,
            resultValue,
            reason:'mock_decline'
          });
        }
        if(mockMode === 'error'){
          return Promise.reject(new Error('mock_error'));
        }
        return Promise.resolve({
          placement,
          adapter:'mock',
          granted:true,
          context: payloadContext,
          resultValue
        });
      }
    };
  }

  function createAdsenseRewardedAdapter(){
    const state = {
      lastAvailabilityReason:null,
      providerWaitInFlight:false,
      activeRequestInFlight:false,
      activePlacement:null,
      lastRequestReason:null,
      servicesEnabled:false
    };

    function getScriptState(){
      return providerRuntime && typeof providerRuntime.getScriptState === 'function'
        ? providerRuntime.getScriptState('reward-gpt')
        : null;
    }

    function hasRewardedApi(){
      return providerRuntime && typeof providerRuntime.hasGptRewardedApi === 'function'
        ? providerRuntime.hasGptRewardedApi()
        : !!(
          window.googletag
          && typeof window.googletag.defineOutOfPageSlot === 'function'
          && typeof window.googletag.pubads === 'function'
          && typeof window.googletag.enableServices === 'function'
          && window.googletag.enums
          && window.googletag.enums.OutOfPageFormat
          && window.googletag.enums.OutOfPageFormat.REWARDED
        );
    }

    function getPlacementConfig(placement){
      if(placement === 'double_reward' || placement === 'continue_once' || placement === 'trial_unlock_arena'){
        return {
          kind:'rewarded',
          adUnitPath:adsenseConfig.rewardedAdUnitPath || ''
        };
      }
      return {
        kind:'unknown',
        adUnitPath:''
      };
    }

    function loadScriptOnce(){
      const current = getScriptState();
      if((current && (current.loading || current.loaded)) || !providerRuntime || typeof providerRuntime.loadScriptOnce !== 'function'){
        return;
      }
      if(typeof providerRuntime.ensureGptQueue === 'function'){
        providerRuntime.ensureGptQueue();
      }
      providerRuntime.loadScriptOnce('reward-gpt', adsenseConfig.scriptUrl);
    }

    function runGptCommand(fn){
      if(typeof fn !== 'function') return;
      if(providerRuntime && typeof providerRuntime.ensureGptQueue === 'function'){
        const googletag = providerRuntime.ensureGptQueue();
        if(googletag && Array.isArray(googletag.cmd) && !hasRewardedApi()){
          googletag.cmd.push(fn);
          return;
        }
      }
      fn();
    }

    function getAvailability(placement, shouldLoad){
      if(adsenseConfig.enabled !== true){
        state.lastAvailabilityReason = 'provider_disabled';
        return { available:false, reason:'provider_disabled' };
      }
      const placementConfig = getPlacementConfig(placement);
      if(!placementConfig.adUnitPath){
        state.lastAvailabilityReason = 'ad_unit_missing';
        return { available:false, reason:'ad_unit_missing' };
      }
      if(hasRewardedApi()){
        state.lastAvailabilityReason = null;
        return { available:true };
      }
      const scriptState = getScriptState();
      if(shouldLoad !== false && !(scriptState && (scriptState.loading || scriptState.loaded))){
        loadScriptOnce();
      }
      const nextScriptState = getScriptState();
      if(nextScriptState && nextScriptState.loading){
        state.lastAvailabilityReason = 'provider_loading';
        return { available:false, reason:'provider_loading' };
      }
      if(nextScriptState && nextScriptState.error){
        state.lastAvailabilityReason = 'provider_unavailable';
        return { available:false, reason:'provider_unavailable' };
      }
      state.lastAvailabilityReason = 'provider_unavailable';
      return { available:false, reason:'provider_unavailable' };
    }

    function waitForProvider(placement){
      const initialAvailability = getAvailability(placement, true);
      if(initialAvailability.available){
        return Promise.resolve();
      }
      if(
        initialAvailability.reason === 'provider_disabled'
        || initialAvailability.reason === 'ad_unit_missing'
      ){
        return Promise.reject(new Error(initialAvailability.reason));
      }
      if(!providerRuntime || typeof providerRuntime.waitForScript !== 'function'){
        return Promise.reject(new Error(initialAvailability.reason || 'provider_unavailable'));
      }
      state.providerWaitInFlight = true;
      if(typeof providerRuntime.ensureGptQueue === 'function'){
        providerRuntime.ensureGptQueue();
      }
      let waitPromise = null;
      try{
        waitPromise = providerRuntime.waitForScript(
          'reward-gpt',
          adsenseConfig.scriptUrl,
          SCRIPT_LOAD_TIMEOUT_MS
        );
      }catch(error){
        state.providerWaitInFlight = false;
        state.lastAvailabilityReason = 'provider_unavailable';
        if(typeof providerRuntime.markScriptFailed === 'function'){
          providerRuntime.markScriptFailed('reward-gpt', 'provider_unavailable', adsenseConfig.scriptUrl);
        }
        return Promise.reject(new Error('provider_unavailable'));
      }
      return waitPromise.then(function(){
        const finalAvailability = getAvailability(placement, false);
        if(!finalAvailability.available){
          throw new Error(finalAvailability.reason || 'provider_unavailable');
        }
      }).catch(function(error){
        const reason = error && error.message ? error.message : 'provider_unavailable';
        if(reason === 'provider_disabled' || reason === 'ad_unit_missing'){
          throw error;
        }
        state.lastAvailabilityReason = 'provider_unavailable';
        throw new Error('provider_unavailable');
      }).finally(function(){
        state.providerWaitInFlight = false;
      });
    }

    function cleanupRequest(pubads, handlers, slot){
      if(pubads && Array.isArray(handlers) && typeof pubads.removeEventListener === 'function'){
        handlers.forEach(function(entry){
          if(entry && entry.name && typeof entry.handler === 'function'){
            pubads.removeEventListener(entry.name, entry.handler);
          }
        });
      }
      if(slot && window.googletag && typeof window.googletag.destroySlots === 'function'){
        try{
          window.googletag.destroySlots([slot]);
        }catch(error){
          if(root.debug && root.debug.enabled){
            console.warn('[reward-cleanup]', error);
          }
        }
      }
      state.activePlacement = null;
      state.activeRequestInFlight = false;
    }

    function buildRequestResult(placement, payloadContext, resultValue, granted, reason, reward){
      const result = {
        placement,
        adapter:'adsense_rewarded',
        granted:granted === true,
        context:payloadContext,
        resultValue
      };
      if(reason){
        result.reason = reason;
      }
      if(reward){
        result.reward = reward;
      }
      return result;
    }

    function createProviderUnavailableError(){
      return new Error('provider_unavailable');
    }

    function requestRewardedSlot(placement, payloadContext, resultValue){
      const placementConfig = getPlacementConfig(placement);
      const REQUEST_TIMEOUT_MS = 30000;
      state.activePlacement = placement;
      state.activeRequestInFlight = true;
      state.lastRequestReason = 'request_start';

      return new Promise(function(resolve, reject){
        let slot = null;
        let pubads = null;
        let settled = false;
        let granted = false;
        let rewardPayload = null;
        const handlers = [];
        const timeoutId = setTimeout(function(){
          state.lastRequestReason = 'provider_timeout';
          finishError(new Error('provider_timeout'));
        }, REQUEST_TIMEOUT_MS);

        function clearTimer(){
          clearTimeout(timeoutId);
        }

        function finishResult(result){
          if(settled) return;
          settled = true;
          clearTimer();
          cleanupRequest(pubads, handlers, slot);
          resolve(result);
        }

        function finishError(error){
          if(settled) return;
          settled = true;
          clearTimer();
          cleanupRequest(pubads, handlers, slot);
          reject(error);
        }

        function addHandler(name, handler){
          handlers.push({ name, handler });
          pubads.addEventListener(name, handler);
        }

        function failProviderUnavailable(){
          state.lastRequestReason = 'provider_unavailable';
          finishError(createProviderUnavailableError());
        }

        function runSetup(){
          if(!hasRewardedApi()){
            failProviderUnavailable();
            return;
          }

          const googletag = window.googletag;
          pubads = googletag.pubads();
          if(!pubads || typeof pubads.addEventListener !== 'function'){
            failProviderUnavailable();
            return;
          }

          slot = googletag.defineOutOfPageSlot(
            placementConfig.adUnitPath,
            googletag.enums.OutOfPageFormat.REWARDED
          );

          if(!slot || typeof slot.addService !== 'function'){
            failProviderUnavailable();
            return;
          }

          slot.addService(pubads);

          addHandler('rewardedSlotReady', function(event){
            if(!event || event.slot !== slot) return;
            state.lastRequestReason = 'slot_ready';
            if(typeof event.makeRewardedVisible !== 'function'){
              failProviderUnavailable();
              return;
            }
            try{
              event.makeRewardedVisible();
              state.lastRequestReason = 'slot_visible';
            }catch(error){
              state.lastRequestReason = 'provider_unavailable';
              finishError(createProviderUnavailableError());
            }
          });

          addHandler('rewardedSlotGranted', function(event){
            if(!event || event.slot !== slot) return;
            granted = true;
            rewardPayload = event.payload || null;
            state.lastRequestReason = 'reward_granted';
          });

          addHandler('rewardedSlotClosed', function(event){
            if(!event || event.slot !== slot) return;
            if(granted){
              finishResult(buildRequestResult(
                placement,
                payloadContext,
                resultValue,
                true,
                null,
                rewardPayload
              ));
              return;
            }
            state.lastRequestReason = 'slot_closed';
            finishResult(buildRequestResult(
              placement,
              payloadContext,
              resultValue,
              false,
              'slot_closed',
              null
            ));
          });

          if(!state.servicesEnabled){
            googletag.enableServices();
            state.servicesEnabled = true;
          }

          if(typeof googletag.display !== 'function'){
            failProviderUnavailable();
            return;
          }

          state.lastRequestReason = 'slot_requested';
          googletag.display(slot);
        }

        try{
          runGptCommand(function(){
            try{
              runSetup();
            }catch(error){
              failProviderUnavailable();
            }
          });
        }catch(error){
          failProviderUnavailable();
        }
      });
    }

    return {
      name:'adsense_rewarded',
      isAvailable(placement){
        return getAvailability(placement, true);
      },
      request(placement, payloadContext, resultValue){
        state.lastRequestReason = null;
        if(state.activeRequestInFlight || state.providerWaitInFlight){
          state.lastRequestReason = 'request_in_flight';
          return Promise.reject(new Error('request_in_flight'));
        }
        return waitForProvider(placement).then(function(){
          return requestRewardedSlot(placement, payloadContext, resultValue);
        }).catch(function(error){
          state.lastRequestReason = error && error.message ? error.message : 'request_failed';
          throw error;
        });
      },
      getState(){
        const scriptState = getScriptState();
        return {
          ready:hasRewardedApi(),
          loading:!!(scriptState && scriptState.loading) || state.providerWaitInFlight || state.activeRequestInFlight,
          lastAvailabilityReason:state.lastAvailabilityReason,
          lastRequestReason:state.lastRequestReason,
          activePlacement:state.activePlacement
        };
      }
    };
  }

  function createUnavailableAdapter(adapterName, reason){
    const safeAdapterName = typeof adapterName === 'string' && adapterName
      ? adapterName
      : 'unknown';
    const safeReason = typeof reason === 'string' && reason
      ? reason
      : 'provider_unavailable';
    const state = {
      lastAvailabilityReason:safeReason,
      lastRequestReason:null
    };

    return {
      name:safeAdapterName,
      isAvailable(){
        return { available:false, reason:safeReason };
      },
      request(){
        state.lastRequestReason = safeReason;
        return Promise.reject(new Error(safeReason));
      },
      getState(){
        return {
          ready:false,
          loading:false,
          lastAvailabilityReason:state.lastAvailabilityReason,
          lastRequestReason:state.lastRequestReason,
          activePlacement:null,
          rewardEnabled:false
        };
      }
    };
  }

  function createAdapter(){
    const adapterName = providerConfig.adapter || 'mock';
    if(adapterName === 'adsense_rewarded'){
      return createAdsenseRewardedAdapter();
    }
    if(adapterName === 'mock'){
      return createMockAdapter();
    }
    return createUnavailableAdapter(adapterName, 'provider_misconfigured');
  }

  let adapter = createAdapter();

  root.services.reward = {
    wasGranted(result){
      return !!(result && result.granted !== false);
    },
    getFailureInfo,
    getMockMode(){
      return mockMode;
    },
    setMockMode(nextMode){
      const safeMode = nextMode === 'deny' || nextMode === 'error' ? nextMode : 'grant';
      mockMode = safeMode;
      return mockMode;
    },
    isRewardAvailable(placement){
      if(typeof adapter.isAvailable !== 'function'){
        return { available:true };
      }
      return adapter.isAvailable(placement);
    },
    getAdapterInfo(){
      const adapterState = typeof adapter.getState === 'function'
        ? adapter.getState()
        : null;
      return {
        adapter:adapter.name,
        mockMode,
        rewardEnabled:adapter.name === 'mock'
          ? true
          : (adapterState && typeof adapterState.rewardEnabled === 'boolean'
            ? adapterState.rewardEnabled
            : (adsenseConfig.enabled === true)),
        ready:adapter.name === 'mock'
          ? true
          : !!(adapterState && adapterState.ready),
        loading:!!(adapterState && adapterState.loading),
        lastAvailabilityReason:adapter.name === 'mock'
          ? null
          : (adapterState && adapterState.lastAvailabilityReason ? adapterState.lastAvailabilityReason : null),
        lastRequestReason:adapter.name === 'mock'
          ? null
          : (adapterState && adapterState.lastRequestReason ? adapterState.lastRequestReason : null),
        activePlacement:adapter.name === 'mock'
          ? null
          : (adapterState && adapterState.activePlacement ? adapterState.activePlacement : null)
      };
    },
    request(placement, context){
      const payloadContext = context || {};
      const resultValue = getResultValue(placement, payloadContext);
      analytics().track('reward_offer_show', {
        placement,
        context: payloadContext,
        adapter:adapter.name,
        resultValue,
        mockMode
      });
      return adapter.request(placement, payloadContext, resultValue).then((result)=>{
        if(!result || result.granted === false){
          analytics().track('reward_decline', {
            placement,
            context: payloadContext,
            granted:false,
            adapter:result && result.adapter ? result.adapter : adapter.name,
            resultValue:result && result.resultValue ? result.resultValue : resultValue,
            reason: result && result.reason ? result.reason : 'not_granted',
            mockMode
          });
          return result;
        }
        analytics().track('reward_complete', {
          placement,
          context: payloadContext,
          granted:true,
          adapter:result.adapter || adapter.name,
          resultValue:result.resultValue || resultValue,
          mockMode
        });
        return result;
      }).catch((error)=>{
        analytics().track('reward_decline', {
          placement,
          context: payloadContext,
          granted:false,
          adapter:adapter.name,
          resultValue,
          reason:error && error.message ? error.message : 'request_failed',
          mockMode
        });
        throw error;
      });
    }
  };
})();
