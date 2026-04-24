(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.services = root.services || {};
  const runtime = root.runtime && root.runtime.sharedBackend ? root.runtime.sharedBackend : { enabled:false };
  const baseStorageService = root.services.storage || null;
  const logger = console;
  const bridgeState = {
    hydrating:false,
    syncing:false,
    lastHydrationError:null,
    lastSyncError:null,
    lastRequestReason:null,
    activePlacement:null
  };
  const hydrationListeners = [];
  let currentSession = readStoredSession(runtime.sessionStorageKey);
  let remoteProgression = null;
  let pendingSave = null;
  let pendingSignature = null;
  let lastCommittedSignature = null;
  let syncChain = Promise.resolve();
  let suppressSync = false;

  function clone(value){
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function createRequestError(status, error){
    const details = error || {};
    const requestError = new Error(details.message || 'Shared backend request failed.');
    requestError.status = status;
    requestError.code = details.code || 'shared_backend_request_failed';
    requestError.details = details.details;
    return requestError;
  }

  function readStoredSession(storageKey){
    try{
      const raw = window.localStorage ? window.localStorage.getItem(storageKey) : null;
      return raw ? JSON.parse(raw) : null;
    }catch(error){
      return null;
    }
  }

  function writeStoredSession(storageKey, session){
    try{
      if(!window.localStorage) return;
      if(!session){
        window.localStorage.removeItem(storageKey);
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }catch(error){
      logger.warn('Shared backend session persistence failed.', error);
    }
  }

  function createCommitId(){
    if(window.crypto && typeof window.crypto.randomUUID === 'function'){
      return 'commit_' + window.crypto.randomUUID().replace(/-/g,'');
    }
    return 'commit_' + Date.now().toString(36) + '_' + Math.random().toString(16).slice(2);
  }

  function shouldRefreshSession(session){
    if(!session || !session.refreshAfter) return false;
    const refreshAt = Date.parse(session.refreshAfter);
    return Number.isFinite(refreshAt) && refreshAt <= Date.now();
  }

  function pickNonNegativeInteger(value, fallback){
    return typeof value === 'number' && isFinite(value) && value >= 0
      ? Math.floor(value)
      : fallback;
  }

  function normalizeStringList(list){
    const source = Array.isArray(list) ? list : [];
    const seen = new Set();
    const normalized = [];
    source.forEach(function(item){
      if(typeof item !== 'string' || !item || seen.has(item)) return;
      seen.add(item);
      normalized.push(item);
    });
    return normalized;
  }

  function normalizeIntegerList(list){
    const source = Array.isArray(list) ? list : [];
    const seen = new Set();
    const normalized = [];
    source.forEach(function(item){
      const value = pickNonNegativeInteger(item, null);
      if(value == null || seen.has(value)) return;
      seen.add(value);
      normalized.push(value);
    });
    return normalized;
  }

  function buildProgressionFromSave(save){
    const source = save || {};
    const challenge = source.challenge || {};
    const unlocks = source.unlocks || {};
    const research = source.research || {};
    const settings = source.settings || {};
    const completedNodes = normalizeIntegerList(challenge.completedNodes);
    return {
      level: Math.max(1, pickNonNegativeInteger(challenge.unlockedRankIndex, 0) + 1),
      xp: Math.max(
        0,
        completedNodes.length * 100 + pickNonNegativeInteger(challenge.unlockedNodeIndex, 0) * 50
      ),
      softCurrency: Math.max(0, Number(source.currency) || 0),
      state: {
        challenge: {
          unlockedNodeIndex: pickNonNegativeInteger(challenge.unlockedNodeIndex, 0),
          checkpointNodeIndex: pickNonNegativeInteger(challenge.checkpointNodeIndex, 0),
          completedNodes: completedNodes,
          lastNodeIndex: pickNonNegativeInteger(challenge.lastNodeIndex, null),
          unlockedRankIndex: pickNonNegativeInteger(challenge.unlockedRankIndex, 0),
          selectedRankIndex: pickNonNegativeInteger(challenge.selectedRankIndex, 0)
        },
        unlocks: {
          arenas: normalizeStringList(unlocks.arenas),
          tops: normalizeStringList(unlocks.tops)
        },
        research: {
          levels: Object.assign({}, research.levels || {})
        },
        settings: {
          locale: typeof settings.locale === 'string' && settings.locale ? settings.locale : 'en',
          musicEnabled: settings.musicEnabled !== false,
          sfxEnabled: settings.sfxEnabled !== false
        },
        sessions: pickNonNegativeInteger(source.sessions, 0),
        selectedArenaIndex: pickNonNegativeInteger(source.selectedArenaIndex, 0),
        selectedTopIndex: pickNonNegativeInteger(source.selectedTopIndex, 0),
        homePreviewTopIndex: pickNonNegativeInteger(source.homePreviewTopIndex, pickNonNegativeInteger(source.selectedTopIndex, 0))
      }
    };
  }

  function mergeRemoteSave(localSave, payloads){
    const base = clone(localSave || {}) || {};
    const progression = payloads && payloads.progression && payloads.progression.progression
      ? payloads.progression.progression
      : {};
    const defaults = payloads
      && payloads.bootstrap
      && payloads.bootstrap.bootstrap
      && payloads.bootstrap.bootstrap.defaultProgression
      && payloads.bootstrap.bootstrap.defaultProgression.state
      ? payloads.bootstrap.bootstrap.defaultProgression.state
      : {};
    const remoteState = progression.state || {};
    const mergedState = Object.assign({}, clone(defaults || {}), clone(remoteState || {}));
    const challenge = mergedState.challenge || {};
    const unlocks = mergedState.unlocks || {};
    const research = mergedState.research || {};
    const settings = mergedState.settings || {};

    base.challenge = {
      unlockedNodeIndex: pickNonNegativeInteger(challenge.unlockedNodeIndex, 0),
      checkpointNodeIndex: pickNonNegativeInteger(challenge.checkpointNodeIndex, 0),
      completedNodes: normalizeIntegerList(challenge.completedNodes),
      lastNodeIndex: pickNonNegativeInteger(challenge.lastNodeIndex, null),
      unlockedRankIndex: pickNonNegativeInteger(challenge.unlockedRankIndex, 0),
      selectedRankIndex: pickNonNegativeInteger(challenge.selectedRankIndex, 0)
    };
    base.unlocks = {
      arenas: normalizeStringList(unlocks.arenas),
      tops: normalizeStringList(unlocks.tops)
    };
    base.research = {
      levels: Object.assign({}, research.levels || {})
    };
    base.settings = {
      locale: typeof settings.locale === 'string' && settings.locale ? settings.locale : 'en',
      musicEnabled: settings.musicEnabled !== false,
      sfxEnabled: settings.sfxEnabled !== false
    };
    base.currency = Math.max(0, Number(progression.softCurrency) || 0);
    base.sessions = pickNonNegativeInteger(mergedState.sessions, pickNonNegativeInteger(base.sessions, 0));
    base.selectedArenaIndex = pickNonNegativeInteger(mergedState.selectedArenaIndex, pickNonNegativeInteger(base.selectedArenaIndex, 0));
    base.selectedTopIndex = pickNonNegativeInteger(mergedState.selectedTopIndex, pickNonNegativeInteger(base.selectedTopIndex, 0));
    base.homePreviewTopIndex = pickNonNegativeInteger(
      mergedState.homePreviewTopIndex,
      pickNonNegativeInteger(base.homePreviewTopIndex, base.selectedTopIndex || 0)
    );
    return base;
  }

  function buildProgressionSignature(save){
    return JSON.stringify(buildProgressionFromSave(save));
  }

  async function requestJson(path, options){
    const response = await fetch(runtime.baseUrl + path, options || {});
    const payload = await response.json();
    if(!response.ok){
      throw createRequestError(response.status, payload && payload.error ? payload.error : null);
    }
    return payload.data;
  }

  async function registerInstall(){
    const session = await requestJson('/v1/install/register', {
      method:'POST',
      headers:{
        'content-type':'application/json'
      },
      body:JSON.stringify({
        projectKey:runtime.projectKey,
        platform:'web',
        clientBuild:runtime.clientBuild
      })
    });
    currentSession = session;
    writeStoredSession(runtime.sessionStorageKey, session);
    return session;
  }

  async function ensureSession(){
    if(!runtime.enabled || !runtime.baseUrl){
      return null;
    }
    if(!currentSession){
      return registerInstall();
    }
    if(!shouldRefreshSession(currentSession)){
      return currentSession;
    }
    try{
      const refreshed = await requestJson('/v1/session/refresh', {
        method:'POST',
        headers:{
          authorization:'Bearer ' + currentSession.sessionToken
        }
      });
      currentSession = refreshed;
      writeStoredSession(runtime.sessionStorageKey, refreshed);
      return refreshed;
    }catch(error){
      logger.warn('Shared backend session refresh failed, re-registering.', error);
      return registerInstall();
    }
  }

  async function requestWithSession(method, path, body){
    const session = await ensureSession();
    try{
      return await requestJson(path, {
        method:method,
        headers:Object.assign(
          {},
          body !== undefined ? { 'content-type':'application/json' } : null,
          session && session.sessionToken ? { authorization:'Bearer ' + session.sessionToken } : null
        ),
        body:body === undefined ? undefined : JSON.stringify(body)
      });
    }catch(error){
      if(!error || error.status !== 401){
        throw error;
      }
      currentSession = null;
      writeStoredSession(runtime.sessionStorageKey, null);
      const retriedSession = await ensureSession();
      return requestJson(path, {
        method:method,
        headers:Object.assign(
          {},
          body !== undefined ? { 'content-type':'application/json' } : null,
          retriedSession && retriedSession.sessionToken ? { authorization:'Bearer ' + retriedSession.sessionToken } : null
        ),
        body:body === undefined ? undefined : JSON.stringify(body)
      });
    }
  }

  async function loadRemoteProgression(){
    const payload = await requestWithSession('GET', '/v1/projects/' + runtime.projectKey + '/progression');
    remoteProgression = payload.progression || null;
    return remoteProgression;
  }

  async function syncProgression(save){
    if(!runtime.enabled || !runtime.baseUrl){
      return null;
    }
    if(!remoteProgression){
      await loadRemoteProgression();
    }
    const progression = buildProgressionFromSave(save);
    const body = {
      commitId:createCommitId(),
      baseRevision:remoteProgression && typeof remoteProgression.revision === 'number' ? remoteProgression.revision : 0,
      progression:progression
    };
    try{
      const committed = await requestWithSession('POST', '/v1/projects/' + runtime.projectKey + '/progression/commit', body);
      remoteProgression = committed.progression || remoteProgression;
      lastCommittedSignature = buildProgressionSignature(save);
      pendingSignature = null;
      bridgeState.lastSyncError = null;
      return committed;
    }catch(error){
      if(!error || error.code !== 'revision_conflict'){
        bridgeState.lastSyncError = error && error.message ? error.message : 'sync_failed';
        throw error;
      }
      await loadRemoteProgression();
      const retriedBody = Object.assign({}, body, {
        baseRevision:remoteProgression && typeof remoteProgression.revision === 'number' ? remoteProgression.revision : 0
      });
      const committed = await requestWithSession('POST', '/v1/projects/' + runtime.projectKey + '/progression/commit', retriedBody);
      remoteProgression = committed.progression || remoteProgression;
      lastCommittedSignature = buildProgressionSignature(save);
      pendingSignature = null;
      bridgeState.lastSyncError = null;
      return committed;
    }
  }

  async function flushPendingSync(){
    const snapshot = pendingSave;
    pendingSave = null;
    if(!snapshot){
      return null;
    }
    bridgeState.syncing = true;
    try{
      return await syncProgression(snapshot);
    }finally{
      bridgeState.syncing = false;
    }
  }

  function queueSync(save){
    if(!runtime.enabled || !runtime.baseUrl || suppressSync){
      return save;
    }
    const signature = buildProgressionSignature(save);
    if(signature === lastCommittedSignature || signature === pendingSignature){
      return save;
    }
    pendingSave = clone(save);
    pendingSignature = signature;
    syncChain = syncChain.then(function(){
      return flushPendingSync();
    }).catch(function(error){
      bridgeState.lastSyncError = error && error.message ? error.message : 'sync_failed';
      logger.warn('Shared backend progression sync failed.', error);
      return null;
    });
    return save;
  }

  function wrapStorageService(base){
    if(!base) return null;
    return {
      key:base.key,
      version:base.version,
      isPersistent:function(){ return typeof base.isPersistent === 'function' ? base.isPersistent() : true; },
      getPersistenceMode:function(){ return typeof base.getPersistenceMode === 'function' ? base.getPersistenceMode() : 'local'; },
      getDiagnostics:function(){ return typeof base.getDiagnostics === 'function' ? base.getDiagnostics() : {}; },
      get:function(){ return typeof base.get === 'function' ? base.get() : null; },
      reload:function(){ return typeof base.reload === 'function' ? base.reload() : null; },
      save:function(next){ return queueSync(base.save(next)); },
      import:function(raw){ return queueSync(base.import(raw)); },
      patch:function(patch){ return queueSync(base.patch(patch)); },
      transact:function(mutator){ return queueSync(base.transact(mutator)); },
      reset:function(){ return queueSync(base.reset()); },
      export:function(){ return typeof base.export === 'function' ? base.export() : '{}'; },
      flushRemoteSync:function(){ return syncChain; }
    };
  }

  const wrappedStorageService = baseStorageService ? wrapStorageService(baseStorageService) : null;
  if(wrappedStorageService){
    root.services.storage = wrappedStorageService;
  }

  function notifyHydration(payload){
    hydrationListeners.forEach(function(listener){
      try{
        listener(payload);
      }catch(error){
        logger.warn('Shared backend hydration listener failed.', error);
      }
    });
  }

  async function hydrate(){
    if(!runtime.enabled || !runtime.baseUrl || !wrappedStorageService){
      return null;
    }
    bridgeState.hydrating = true;
    bridgeState.lastHydrationError = null;
    try{
      const [bootstrap, daily, progression] = await Promise.all([
        requestJson('/v1/projects/' + runtime.projectKey + '/bootstrap'),
        requestJson('/v1/projects/' + runtime.projectKey + '/daily'),
        requestWithSession('GET', '/v1/projects/' + runtime.projectKey + '/progression')
      ]);
      remoteProgression = progression.progression || null;
      const mergedSave = mergeRemoteSave(
        typeof wrappedStorageService.get === 'function' ? wrappedStorageService.get() : null,
        { bootstrap:bootstrap, daily:daily, progression:progression }
      );
      suppressSync = true;
      const saved = baseStorageService && typeof baseStorageService.import === 'function'
        ? baseStorageService.import(mergedSave)
        : mergedSave;
      suppressSync = false;
      lastCommittedSignature = buildProgressionSignature(saved);
      pendingSignature = null;
      notifyHydration({
        save:saved,
        bootstrap:bootstrap,
        daily:daily,
        progression:progression
      });
      return {
        save:saved,
        bootstrap:bootstrap,
        daily:daily,
        progression:progression
      };
    }catch(error){
      suppressSync = false;
      bridgeState.lastHydrationError = error && error.message ? error.message : 'hydrate_failed';
      throw error;
    }finally{
      bridgeState.hydrating = false;
    }
  }

  async function claimReward(placement, payloadContext, resultValue, rewardAttemptId){
    if(!runtime.enabled || !runtime.baseUrl){
      throw new Error('provider_disabled');
    }
    bridgeState.activePlacement = placement;
    bridgeState.lastRequestReason = null;
    try{
      const claim = await requestWithSession('POST', '/v1/projects/' + runtime.projectKey + '/rewards/claim', {
        claimId:rewardAttemptId,
        rewardKey:placement,
        claimNonce:rewardAttemptId,
        source:'ad',
        metadata:{
          context:clone(payloadContext || {}),
          resultValue:clone(resultValue || null)
        }
      });
      return {
        placement:placement,
        adapter:'shared_backend',
        granted:true,
        context:payloadContext || {},
        resultValue:resultValue,
        reward_attempt_id:rewardAttemptId,
        claim_id:claim.claim && claim.claim.claimId ? claim.claim.claimId : rewardAttemptId,
        reward_key:claim.claim && claim.claim.rewardKey ? claim.claim.rewardKey : placement,
        grant_currency:claim.claim && claim.claim.grantCurrency ? claim.claim.grantCurrency : null,
        grant_amount:claim.claim && typeof claim.claim.grantAmount === 'number' ? claim.claim.grantAmount : 0
      };
    }catch(error){
      bridgeState.lastRequestReason = error && error.code ? error.code : (error && error.message ? error.message : 'request_failed');
      throw error;
    }finally{
      bridgeState.activePlacement = null;
    }
  }

  root.services.sharedBackendBridge = {
    enabled:runtime.enabled,
    getState:function(){
      return {
        rewardEnabled:runtime.enabled,
        ready:runtime.enabled && !!runtime.baseUrl,
        loading:bridgeState.hydrating || bridgeState.syncing,
        lastAvailabilityReason:runtime.enabled ? null : 'provider_disabled',
        lastRequestReason:bridgeState.lastRequestReason,
        activePlacement:bridgeState.activePlacement,
        allowedPlacements:Array.isArray(runtime.allowedRewards) ? runtime.allowedRewards.slice() : [],
        rewardedAdUnitConfigured:runtime.enabled,
        lastHydrationError:bridgeState.lastHydrationError,
        lastSyncError:bridgeState.lastSyncError
      };
    },
    hydrate:hydrate,
    claimReward:claimReward,
    onHydrated:function(listener){
      if(typeof listener === 'function'){
        hydrationListeners.push(listener);
      }
    },
    flushRemoteSync:function(){
      return syncChain;
    }
  };
})();
