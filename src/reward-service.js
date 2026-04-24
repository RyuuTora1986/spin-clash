(function(){
  const root = window.SpinClash;
  const analytics = () => root.services.analytics;
  const providerRuntime = root.services.providerRuntime || null;
  const sharedBackendBridge = root.services.sharedBackendBridge || null;
  const providerConfig = (root.config && root.config.providers && root.config.providers.reward) || {};
  const livePlacements = providerConfig.livePlacements || {};
  const adsenseConfig = providerConfig.adsense || {};
  const adsenseH5Config = adsenseConfig.h5 || {};
  const SCRIPT_LOAD_TIMEOUT_MS = 4000;
  let mockMode = providerConfig.mockMode === 'deny' || providerConfig.mockMode === 'error'
    ? providerConfig.mockMode
    : 'grant';
  let rewardAttemptCounter = 0;

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
      || reason === 'provider_timeout'
      || reason === 'provider_disabled'
      || reason === 'placement_not_enabled'
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

  function createRewardAttemptId(){
    rewardAttemptCounter += 1;
    return 'reward_'+Date.now().toString(36)+'_'+rewardAttemptCounter.toString(36);
  }

  function createMockAdapter(){
    return {
      name:'mock',
      isAvailable(){
        return true;
      },
      request(placement, payloadContext, resultValue, rewardAttemptId){
        if(mockMode === 'deny'){
          return Promise.resolve({
            placement,
            adapter:'mock',
            granted:false,
            context:payloadContext,
            resultValue,
            reward_attempt_id:rewardAttemptId,
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
          resultValue,
          reward_attempt_id:rewardAttemptId
        });
      }
    };
  }

  function getAllowedPlacements(){
    return Object.keys(livePlacements).filter(function(placementId){
      return livePlacements[placementId] === true;
    });
  }

  function getPlacementConfig(placement){
    if(livePlacements[placement] === true){
      return {
        kind:'rewarded',
        enabled:true
      };
    }
    return {
      kind:'unknown',
      enabled:false
    };
  }

  function getAdsenseH5ClientId(){
    return (adsenseH5Config.dataAdClient || adsenseH5Config.publisherId || '').trim();
  }

  function buildAdsenseH5BootstrapConfig(){
    return {
      enabled:adsenseH5Config.enabled === true,
      scriptUrl:adsenseH5Config.scriptUrl || '',
      publisherId:adsenseH5Config.publisherId || '',
      dataAdClient:adsenseH5Config.dataAdClient || '',
      testMode:adsenseH5Config.testMode === true,
      preloadHints:{
        sound:adsenseH5Config.preloadHints && adsenseH5Config.preloadHints.sound ? adsenseH5Config.preloadHints.sound : 'off',
        preload:adsenseH5Config.preloadHints && adsenseH5Config.preloadHints.preload ? adsenseH5Config.preloadHints.preload : 'auto'
      }
    };
  }

  function createAdsenseH5RewardedAdapter(){
    const state = {
      lastAvailabilityReason:null,
      providerWaitInFlight:false,
      activeRequestInFlight:false,
      activePlacement:null,
      lastRequestReason:null
    };

    function hasRewardedApi(){
      return providerRuntime && typeof providerRuntime.hasAdsenseH5Api === 'function'
        ? providerRuntime.hasAdsenseH5Api()
        : !!(
          Array.isArray(window.adsbygoogle)
          && typeof window.adBreak === 'function'
          && typeof window.adConfig === 'function'
        );
    }

    function getRuntimeState(){
      return providerRuntime && typeof providerRuntime.getAdsenseH5State === 'function'
        ? providerRuntime.getAdsenseH5State()
        : null;
    }

    function getAvailability(placement){
      if(adsenseConfig.enabled !== true || adsenseH5Config.enabled !== true){
        state.lastAvailabilityReason = 'provider_disabled';
        return { available:false, reason:'provider_disabled' };
      }
      const placementConfig = getPlacementConfig(placement);
      if(placementConfig.enabled !== true){
        state.lastAvailabilityReason = 'placement_not_enabled';
        return { available:false, reason:'placement_not_enabled' };
      }
      if(!getAdsenseH5ClientId()){
        state.lastAvailabilityReason = 'provider_misconfigured';
        return { available:false, reason:'provider_misconfigured' };
      }
      const runtimeState = getRuntimeState();
      if(hasRewardedApi() && runtimeState && runtimeState.ready === true){
        state.lastAvailabilityReason = null;
        return { available:true };
      }
      if(runtimeState && runtimeState.lastError){
        state.lastAvailabilityReason = runtimeState.lastError;
        return { available:false, reason:runtimeState.lastError };
      }
      state.lastAvailabilityReason = 'provider_loading';
      return { available:false, reason:'provider_loading' };
    }

    function waitForProvider(placement){
      const availability = getAvailability(placement);
      if(availability.available){
        return Promise.resolve();
      }
      if(
        availability.reason === 'provider_disabled'
        || availability.reason === 'placement_not_enabled'
        || availability.reason === 'provider_misconfigured'
      ){
        return Promise.reject(new Error(availability.reason));
      }
      if(!providerRuntime || typeof providerRuntime.initAdsenseH5 !== 'function'){
        return Promise.reject(new Error('provider_unavailable'));
      }
      state.providerWaitInFlight = true;
      let waitPromise = null;
      try{
        waitPromise = providerRuntime.initAdsenseH5(buildAdsenseH5BootstrapConfig(), SCRIPT_LOAD_TIMEOUT_MS);
      }catch(error){
        state.providerWaitInFlight = false;
        state.lastAvailabilityReason = 'provider_unavailable';
        return Promise.reject(new Error('provider_unavailable'));
      }
      return waitPromise.then(function(){
        const finalAvailability = getAvailability(placement);
        if(!finalAvailability.available){
          throw new Error(finalAvailability.reason || 'provider_unavailable');
        }
      }).catch(function(error){
        const reason = error && error.message ? error.message : 'provider_unavailable';
        if(
          reason === 'provider_disabled'
          || reason === 'placement_not_enabled'
          || reason === 'provider_misconfigured'
          || reason === 'provider_timeout'
        ){
          throw error;
        }
        throw new Error('provider_unavailable');
      }).finally(function(){
        state.providerWaitInFlight = false;
      });
    }

    function buildRequestResult(placement, payloadContext, resultValue, rewardAttemptId, granted, reason, reward){
      const result = {
        placement,
        adapter:'adsense_h5_rewarded',
        granted:granted === true,
        context:payloadContext,
        resultValue,
        reward_attempt_id:rewardAttemptId
      };
      if(reason){
        result.reason = reason;
      }
      if(reward){
        result.reward = reward;
      }
      return result;
    }

    function normalizeBreakDoneReason(placementInfo){
      const breakStatus = placementInfo && placementInfo.breakStatus ? placementInfo.breakStatus : 'other';
      if(breakStatus === 'viewed'){
        return null;
      }
      if(breakStatus === 'dismissed' || breakStatus === 'ignored'){
        return 'slot_closed';
      }
      if(breakStatus === 'notReady' || breakStatus === 'noAdPreloaded'){
        return 'provider_loading';
      }
      if(breakStatus === 'timeout'){
        return 'provider_timeout';
      }
      return 'provider_unavailable';
    }

    function requestRewardedPlacement(placement, payloadContext, resultValue, rewardAttemptId){
      const REQUEST_TIMEOUT_MS = 30000;
      state.activePlacement = placement;
      state.activeRequestInFlight = true;
      state.lastRequestReason = 'request_start';

      return new Promise(function(resolve, reject){
        let settled = false;
        let granted = false;
        let dismissed = false;
        const timeoutId = setTimeout(function(){
          state.lastRequestReason = 'provider_timeout';
          finishError(new Error('provider_timeout'));
        }, REQUEST_TIMEOUT_MS);

        function finishResult(result){
          if(settled) return;
          settled = true;
          clearTimeout(timeoutId);
          state.activePlacement = null;
          state.activeRequestInFlight = false;
          resolve(result);
        }

        function finishError(error){
          if(settled) return;
          settled = true;
          clearTimeout(timeoutId);
          state.activePlacement = null;
          state.activeRequestInFlight = false;
          reject(error);
        }

        if(typeof window.adBreak !== 'function'){
          state.lastRequestReason = 'provider_unavailable';
          finishError(new Error('provider_unavailable'));
          return;
        }

        try{
          window.adBreak({
            type:'reward',
            name:placement,
            beforeReward:function(showAdFn){
              state.lastRequestReason = 'reward_prompt';
              if(typeof showAdFn !== 'function'){
                state.lastRequestReason = 'provider_unavailable';
                finishError(new Error('provider_unavailable'));
                return;
              }
              try{
                showAdFn();
                state.lastRequestReason = 'slot_visible';
              }catch(error){
                state.lastRequestReason = 'provider_unavailable';
                finishError(new Error('provider_unavailable'));
              }
            },
            adDismissed:function(){
              dismissed = true;
              state.lastRequestReason = 'slot_closed';
            },
            adViewed:function(){
              granted = true;
              state.lastRequestReason = 'reward_granted';
            },
            adBreakDone:function(placementInfo){
              if(granted){
                finishResult(buildRequestResult(placement, payloadContext, resultValue, rewardAttemptId, true));
                return;
              }
              if(dismissed){
                finishResult(buildRequestResult(placement, payloadContext, resultValue, rewardAttemptId, false, 'slot_closed'));
                return;
              }
              const reason = normalizeBreakDoneReason(placementInfo);
              state.lastRequestReason = reason;
              if(reason === 'slot_closed'){
                finishResult(buildRequestResult(placement, payloadContext, resultValue, false, 'slot_closed'));
                return;
              }
              finishError(new Error(reason || 'provider_unavailable'));
            }
          });
        }catch(error){
          state.lastRequestReason = 'provider_unavailable';
          finishError(new Error('provider_unavailable'));
        }
      });
    }

    return {
      name:'adsense_h5_rewarded',
      isAvailable(placement){
        return getAvailability(placement);
      },
      request(placement, payloadContext, resultValue, rewardAttemptId){
        if(state.activeRequestInFlight || state.providerWaitInFlight){
          state.lastRequestReason = 'request_in_flight';
          return Promise.reject(new Error('request_in_flight'));
        }
        state.lastRequestReason = null;
        const availability = getAvailability(placement);
        if(availability.available){
          return requestRewardedPlacement(placement, payloadContext, resultValue, rewardAttemptId).catch(function(error){
            state.lastRequestReason = error && error.message ? error.message : 'request_failed';
            throw error;
          });
        }
        if(
          availability.reason === 'provider_disabled'
          || availability.reason === 'placement_not_enabled'
          || availability.reason === 'provider_misconfigured'
        ){
          state.lastRequestReason = availability.reason;
          return Promise.reject(new Error(availability.reason));
        }
        if(!state.providerWaitInFlight){
          waitForProvider(placement).catch(function(){
            return null;
          });
        }
        state.lastRequestReason = availability.reason || 'provider_loading';
        return Promise.reject(new Error(availability.reason || 'provider_loading'));
      },
      getState(){
        const runtimeState = getRuntimeState();
        return {
          rewardEnabled:adsenseConfig.enabled === true && adsenseH5Config.enabled === true,
          ready:!!(runtimeState && runtimeState.ready && hasRewardedApi()),
          loading:!!(
            state.providerWaitInFlight
            || state.activeRequestInFlight
            || (runtimeState && runtimeState.initializing)
          ),
          lastAvailabilityReason:state.lastAvailabilityReason,
          lastRequestReason:state.lastRequestReason,
          activePlacement:state.activePlacement,
          allowedPlacements:getAllowedPlacements(),
          rewardedAdUnitConfigured:!!getAdsenseH5ClientId()
        };
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
      if(livePlacements[placement] === true){
        return {
          kind:'rewarded',
          adUnitPath:adsenseConfig.rewardedAdUnitPath || '',
          enabled:true
        };
      }
      return {
        kind:'unknown',
        adUnitPath:'',
        enabled:false
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
      if(placementConfig.enabled !== true){
        state.lastAvailabilityReason = 'placement_not_enabled';
        return { available:false, reason:'placement_not_enabled' };
      }
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
        || initialAvailability.reason === 'placement_not_enabled'
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

    function buildRequestResult(placement, payloadContext, resultValue, rewardAttemptId, granted, reason, reward){
      const result = {
        placement,
        adapter:'adsense_rewarded',
        granted:granted === true,
        context:payloadContext,
        resultValue,
        reward_attempt_id:rewardAttemptId
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

    function requestRewardedSlot(placement, payloadContext, resultValue, rewardAttemptId){
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
                rewardAttemptId,
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
              rewardAttemptId,
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
      request(placement, payloadContext, resultValue, rewardAttemptId){
        state.lastRequestReason = null;
        if(state.activeRequestInFlight || state.providerWaitInFlight){
          state.lastRequestReason = 'request_in_flight';
          return Promise.reject(new Error('request_in_flight'));
        }
        return waitForProvider(placement).then(function(){
          return requestRewardedSlot(placement, payloadContext, resultValue, rewardAttemptId);
        }).catch(function(error){
          state.lastRequestReason = error && error.message ? error.message : 'request_failed';
          throw error;
        });
      },
      getState(){
        const scriptState = getScriptState();
        return {
          rewardEnabled:adsenseConfig.enabled === true,
          ready:hasRewardedApi(),
          loading:!!(scriptState && scriptState.loading) || state.providerWaitInFlight || state.activeRequestInFlight,
          lastAvailabilityReason:state.lastAvailabilityReason,
          lastRequestReason:state.lastRequestReason,
          activePlacement:state.activePlacement,
          allowedPlacements:getAllowedPlacements(),
          rewardedAdUnitConfigured:!!adsenseConfig.rewardedAdUnitPath
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

  function createSharedBackendAdapter(){
    return {
      name:'shared_backend',
      isAvailable(placement){
        const bridgeState = sharedBackendBridge && typeof sharedBackendBridge.getState === 'function'
          ? sharedBackendBridge.getState()
          : null;
        const allowedPlacements = bridgeState && Array.isArray(bridgeState.allowedPlacements)
          ? bridgeState.allowedPlacements
          : [];
        if(!sharedBackendBridge || sharedBackendBridge.enabled !== true){
          return { available:false, reason:'provider_disabled' };
        }
        if(allowedPlacements.length && allowedPlacements.indexOf(placement) === -1){
          return { available:false, reason:'placement_not_enabled' };
        }
        if(bridgeState && bridgeState.loading){
          return { available:false, reason:'provider_loading' };
        }
        return { available:true };
      },
      request(placement, payloadContext, resultValue, rewardAttemptId){
        if(!sharedBackendBridge || typeof sharedBackendBridge.claimReward !== 'function'){
          return Promise.reject(new Error('provider_unavailable'));
        }
        return sharedBackendBridge.claimReward(placement, payloadContext, resultValue, rewardAttemptId);
      },
      getState(){
        return sharedBackendBridge && typeof sharedBackendBridge.getState === 'function'
          ? sharedBackendBridge.getState()
          : {
            rewardEnabled:false,
            ready:false,
            loading:false,
            lastAvailabilityReason:'provider_disabled',
            lastRequestReason:null,
            activePlacement:null,
            allowedPlacements:[]
          };
      }
    };
  }

  function createAdapter(){
    if(sharedBackendBridge && sharedBackendBridge.enabled === true){
      return createSharedBackendAdapter();
    }
    const adapterName = providerConfig.adapter || 'mock';
    if(adapterName === 'adsense_h5_rewarded'){
      return createAdsenseH5RewardedAdapter();
    }
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
      const allowedPlacements = Object.keys(livePlacements).filter(function(placementId){
        return livePlacements[placementId] === true;
      });
      return {
        adapter:adapter.name,
        mockMode,
        rewardEnabled:adapterState && typeof adapterState.rewardEnabled === 'boolean'
          ? adapterState.rewardEnabled
          : false,
        ready:adapter.name === 'mock'
          ? true
          : !!(adapterState && adapterState.ready),
        loading:!!(adapterState && adapterState.loading),
        allowedPlacements:adapterState && Array.isArray(adapterState.allowedPlacements)
          ? adapterState.allowedPlacements.slice()
          : allowedPlacements,
        rewardedAdUnitConfigured:adapterState && typeof adapterState.rewardedAdUnitConfigured === 'boolean'
          ? adapterState.rewardedAdUnitConfigured
          : false,
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
      const rewardAttemptId = createRewardAttemptId();
      const resultContextId = payloadContext.result_context_id || null;
      const trialUnlockContextId = payloadContext.trial_unlock_context_id || null;
      analytics().track('reward_request_start', {
        placement,
        context: payloadContext,
        adapter:adapter.name,
        resultValue,
        mockMode,
        reward_attempt_id:rewardAttemptId,
        result_context_id:resultContextId,
        trial_unlock_context_id:trialUnlockContextId
      });
      return adapter.request(placement, payloadContext, resultValue, rewardAttemptId).then((result)=>{
        if(!result || result.granted === false){
          analytics().track('reward_decline', {
            placement,
            context: payloadContext,
            granted:false,
            adapter:result && result.adapter ? result.adapter : adapter.name,
            resultValue:result && result.resultValue ? result.resultValue : resultValue,
            reason: result && result.reason ? result.reason : 'not_granted',
            mockMode,
            reward_attempt_id:result && result.reward_attempt_id ? result.reward_attempt_id : rewardAttemptId,
            result_context_id:resultContextId,
            trial_unlock_context_id:trialUnlockContextId
          });
          return result;
        }
        analytics().track('reward_complete', {
          placement,
          context: payloadContext,
          granted:true,
          adapter:result.adapter || adapter.name,
          resultValue:result.resultValue || resultValue,
          mockMode,
          reward_attempt_id:result.reward_attempt_id || rewardAttemptId,
          result_context_id:resultContextId,
          trial_unlock_context_id:trialUnlockContextId
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
          mockMode,
          reward_attempt_id:rewardAttemptId,
          result_context_id:resultContextId,
          trial_unlock_context_id:trialUnlockContextId
        });
        throw error;
      });
    }
  };
})();
