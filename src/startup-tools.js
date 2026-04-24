(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createStartupTools = function createStartupTools(options){
    const debugRuntimeTools = options.debugRuntimeTools || null;
    const storageService = options.storageService || null;
    const analyticsService = options.analyticsService || null;
    const arenas = Array.isArray(options.arenas) ? options.arenas : [];
    const uiText = options.uiText || {};
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return {}; };
    const saveProgress = typeof options.saveProgress === 'function' ? options.saveProgress : function(mutator){
      const snapshot = getSave() || {};
      return typeof mutator === 'function' ? (mutator(snapshot) || snapshot) : snapshot;
    };
    const getInitialChallengeIndex = typeof options.getInitialChallengeIndex === 'function'
      ? options.getInitialChallengeIndex
      : function(){
        const save = getSave() || {};
        return save.challenge ? save.challenge.unlockedNodeIndex || 0 : 0;
      };
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const getRenderGameToText = typeof options.getRenderGameToText === 'function' ? options.getRenderGameToText : function(){ return function(){ return '{}'; }; };
    const setTimeAdvanceHook = typeof options.setTimeAdvanceHook === 'function' ? options.setTimeAdvanceHook : function(){};
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const maxChallengeIndex = typeof options.maxChallengeIndex === 'number' ? options.maxChallengeIndex : 0;
    const updateModeUI = typeof options.updateModeUI === 'function' ? options.updateModeUI : function(){};
    const syncDebugPanel = typeof options.syncDebugPanel === 'function' ? options.syncDebugPanel : function(){};
    const startAnimationLoop = typeof options.startAnimationLoop === 'function' ? options.startAnimationLoop : function(){};
    const renderToTextGlobalKey = ['render', 'game', 'to', 'text'].join('_');
    const advanceTimeGlobalKey = ['advance', 'Time'].join('');
    let sessionStartedAt = 0;
    let sessionEndTracked = false;
    let sessionLifecycleInstalled = false;

    function isDebugToolsEnabled(){
      const buildRuntime = root.runtime && root.runtime.build ? root.runtime.build : {};
      return buildRuntime.debugToolsEnabled !== false;
    }

    function clearDebugGlobals(){
      try{
        delete window[renderToTextGlobalKey];
      }catch(error){
        window[renderToTextGlobalKey] = undefined;
      }
      setTimeAdvanceHook(null);
      try{
        delete window[advanceTimeGlobalKey];
      }catch(error){
        window[advanceTimeGlobalKey] = undefined;
      }
    }

    function buildSessionAnalyticsPayload(save){
      const snapshot = save || getSave() || {};
      const challenge = snapshot.challenge || {};
      const unlocks = snapshot.unlocks || {};
      const unlockedArenas = Array.isArray(unlocks.arenas) ? unlocks.arenas : [];
      const unlockedTops = Array.isArray(unlocks.tops) ? unlocks.tops : [];
      const hasProgress = (snapshot.currency || 0) > 0
        || (challenge.unlockedNodeIndex || 0) > 0
        || unlockedArenas.length > 2
        || unlockedTops.length > 2
        || ((snapshot.sessions || 0) > 0);
      return {
        sessions:(snapshot.sessions || 0) + 1,
        saveVersion:storageService ? storageService.version : (snapshot.version || null),
        hasProgress,
        currency:snapshot.currency || 0,
        challengeUnlockedNodeIndex:challenge.unlockedNodeIndex || 0,
        challengeCheckpointNodeIndex:challenge.checkpointNodeIndex || 0,
        unlockedArenaCount:unlockedArenas.length,
        unlockedTopCount:unlockedTops.length
      };
    }

    function emitSessionEnd(reason){
      if(sessionEndTracked || !analyticsService || typeof analyticsService.track !== 'function') return;
      sessionEndTracked = true;
      const snapshot = getSave() || {};
      const challenge = snapshot.challenge || {};
      const unlocks = snapshot.unlocks || {};
      const unlockedArenas = Array.isArray(unlocks.arenas) ? unlocks.arenas : [];
      const unlockedTops = Array.isArray(unlocks.tops) ? unlocks.tops : [];
      analyticsService.track('session_end',{
        reason:reason || 'unknown',
        durationSec:Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000)),
        saveVersion:storageService ? storageService.version : (snapshot.version || null),
        persistenceMode:storageService && typeof storageService.getPersistenceMode === 'function'
          ? storageService.getPersistenceMode()
          : null,
        currency:snapshot.currency || 0,
        challengeUnlockedNodeIndex:challenge.unlockedNodeIndex || 0,
        challengeCheckpointNodeIndex:challenge.checkpointNodeIndex || 0,
        unlockedArenaCount:unlockedArenas.length,
        unlockedTopCount:unlockedTops.length,
        lastMode:getCurrentMode(),
        lastArenaId:(arenas[getCurrentArena()] && arenas[getCurrentArena()].id) || null
      });
    }

    function installSessionLifecycle(){
      if(sessionLifecycleInstalled) return;
      sessionLifecycleInstalled = true;
      window.addEventListener('pagehide', function(){
        emitSessionEnd('pagehide');
      });
      window.addEventListener('beforeunload', function(){
        emitSessionEnd('beforeunload');
      });
    }

    function initializeRuntimeSession(){
      sessionStartedAt = Date.now();
      sessionEndTracked = false;
      const initialSave = getSave() || {};
      const startingSessions = initialSave && typeof initialSave.sessions === 'number'
        ? initialSave.sessions
        : 0;
      const unlockedNodeIndex = getInitialChallengeIndex();
      saveProgress(function(save){
        save.sessions = (save.sessions || 0) + 1;
        return save;
      });
      if(analyticsService && typeof analyticsService.track === 'function'){
        analyticsService.track(
          startingSessions > 0 ? 'return_session' : 'session_start',
          buildSessionAnalyticsPayload(initialSave)
        );
      }
      installSessionLifecycle();
      return unlockedNodeIndex;
    }

    function ensureStorageNotice(){
      if(!storageService || typeof storageService.getPersistenceMode !== 'function'){
        return;
      }
      const mode = storageService.getPersistenceMode();
      let message = '';
      if(mode === 'session'){
        message = uiText.storageNoticeSession || 'SAVE MODE: SESSION ONLY.';
      }else if(mode === 'window_name'){
        message = uiText.storageNoticeWindowName || 'SAVE MODE: THIS TAB ONLY.';
      }else if(mode === 'memory'){
        message = uiText.storageNoticeMemory || 'SAVE MODE: TEMPORARY ONLY.';
      }

      let notice = document.getElementById('storage-notice');
      if(!message){
        if(notice) notice.remove();
        return;
      }
      if(!notice){
        notice = document.createElement('div');
        notice.id = 'storage-notice';
        document.body.appendChild(notice);
      }
      notice.textContent = message;
    }

    function initialize(){
      const debugToolsEnabled = isDebugToolsEnabled();
      let initialUnlockedNodeIndex = 0;

      if(debugToolsEnabled){
        window[renderToTextGlobalKey] = getRenderGameToText();
        setTimeAdvanceHook(function(ms){
          if(debugRuntimeTools) debugRuntimeTools.advanceTime(ms);
        });
      }else{
        clearDebugGlobals();
      }

      if(debugRuntimeTools && debugToolsEnabled && typeof debugRuntimeTools.initRuntimeDebug === 'function'){
        initialUnlockedNodeIndex = debugRuntimeTools.initRuntimeDebug();
      }else{
        initialUnlockedNodeIndex = initializeRuntimeSession();
      }

      setActiveChallengeIndex(Math.min(initialUnlockedNodeIndex || 0, Math.max(0, maxChallengeIndex)));
      updateModeUI();
      syncDebugPanel();
      ensureStorageNotice();
      startAnimationLoop();
    }

    return {
      ensureStorageNotice,
      initialize
    };
  };
})();
