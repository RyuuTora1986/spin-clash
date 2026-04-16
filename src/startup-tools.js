(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createStartupTools = function createStartupTools(options){
    const debugRuntimeTools = options.debugRuntimeTools || null;
    const storageService = options.storageService || null;
    const uiText = options.uiText || {};
    const getRenderGameToText = typeof options.getRenderGameToText === 'function' ? options.getRenderGameToText : function(){ return function(){ return '{}'; }; };
    const setAdvanceTime = typeof options.setAdvanceTime === 'function' ? options.setAdvanceTime : function(){};
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const maxChallengeIndex = typeof options.maxChallengeIndex === 'number' ? options.maxChallengeIndex : 0;
    const updateModeUI = typeof options.updateModeUI === 'function' ? options.updateModeUI : function(){};
    const syncDebugPanel = typeof options.syncDebugPanel === 'function' ? options.syncDebugPanel : function(){};
    const startAnimationLoop = typeof options.startAnimationLoop === 'function' ? options.startAnimationLoop : function(){};

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
      window.render_game_to_text = getRenderGameToText();
      setAdvanceTime(function(ms){
        if(debugRuntimeTools) debugRuntimeTools.advanceTime(ms);
      });
      const initialUnlockedNodeIndex = debugRuntimeTools ? debugRuntimeTools.initRuntimeDebug() : 0;
      setActiveChallengeIndex(Math.min(initialUnlockedNodeIndex || 0, Math.max(0, maxChallengeIndex)));
      updateModeUI();
      syncDebugPanel();
      ensureStorageNotice();
      startAnimationLoop();
    }

    return {
      initialize
    };
  };
})();
