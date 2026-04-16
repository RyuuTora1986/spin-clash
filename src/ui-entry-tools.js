(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createUiEntryTools = function createUiEntryTools(options){
    const tops = options.tops || [];
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const setCurrentMode = typeof options.setCurrentMode === 'function' ? options.setCurrentMode : function(){};
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const setSelectedArenaIndex = typeof options.setSelectedArenaIndex === 'function' ? options.setSelectedArenaIndex : function(){};
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const setPlayerTopId = typeof options.setPlayerTopId === 'function' ? options.setPlayerTopId : function(){};
    const resetScoreRound = typeof options.resetScoreRound === 'function' ? options.resetScoreRound : function(){};
    const setChallengeContinueUsed = typeof options.setChallengeContinueUsed === 'function' ? options.setChallengeContinueUsed : function(){};
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return { challenge:{ unlockedNodeIndex:0 } }; };
    const getLoadoutOverlay = typeof options.getLoadoutOverlay === 'function' ? options.getLoadoutOverlay : function(){ return null; };
    const showLoadoutOverlay = typeof options.showLoadoutOverlay === 'function' ? options.showLoadoutOverlay : function(){};
    const hideLoadoutOverlay = typeof options.hideLoadoutOverlay === 'function' ? options.hideLoadoutOverlay : function(){};
    const syncArenaSelectionUI = typeof options.syncArenaSelectionUI === 'function' ? options.syncArenaSelectionUI : function(){};
    const updateModeUI = typeof options.updateModeUI === 'function' ? options.updateModeUI : function(){};
    const syncDebugPanel = typeof options.syncDebugPanel === 'function' ? options.syncDebugPanel : function(){};
    const initAudioSafely = typeof options.initAudioSafely === 'function' ? options.initAudioSafely : function(){};
    const showRuntimeError = typeof options.showRuntimeError === 'function' ? options.showRuntimeError : function(){};
    const updateSkillIcon = typeof options.updateSkillIcon === 'function' ? options.updateSkillIcon : function(){};
    const attemptArenaAccess = typeof options.attemptArenaAccess === 'function' ? options.attemptArenaAccess : function(){ return Promise.resolve(true); };
    const attemptTopAccess = typeof options.attemptTopAccess === 'function' ? options.attemptTopAccess : function(){ return Promise.resolve(true); };
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const beginFight = typeof options.beginFight === 'function' ? options.beginFight : function(){};
    const doSwap = typeof options.doSwap === 'function' ? options.doSwap : function(){};
    const doPlayerDash = typeof options.doPlayerDash === 'function' ? options.doPlayerDash : function(){};
    const doPlayerSkill = typeof options.doPlayerSkill === 'function' ? options.doPlayerSkill : function(){};
    const resetMatch = typeof options.resetMatch === 'function' ? options.resetMatch : function(){};
    const handleDoubleReward = typeof options.handleDoubleReward === 'function' ? options.handleDoubleReward : function(){};
    const handleContinueReward = typeof options.handleContinueReward === 'function' ? options.handleContinueReward : function(){};
    const handleShare = typeof options.handleShare === 'function' ? options.handleShare : function(){};

    function handleEnterBattle(){
      try{
        const titleOverlay = document.getElementById('ov-title');
        const loadoutOverlay = getLoadoutOverlay();
        if(!titleOverlay || !loadoutOverlay){
          throw new Error('Enter flow overlays missing');
        }
        titleOverlay.classList.add('hide');
        showLoadoutOverlay();
        updateModeUI();
        initAudioSafely();
      }catch(error){
        const message = error instanceof Error ? error.message : String(error);
        showRuntimeError(message);
        console.error('Enter battle failed', error);
      }
    }

    function selectPlayerTopById(topId){
      const safeTopId = Math.max(0, Math.min(tops.length-1, parseInt(topId,10) || 0));
      attemptTopAccess(safeTopId).then((granted)=>{
        if(!granted) return;
        setPlayerTopId(safeTopId);
        document.querySelectorAll('.card').forEach((x)=>{
          x.classList.toggle('sel', parseInt(x.dataset.id,10)===safeTopId);
        });
        updateModeUI();
        updateSkillIcon();
        syncDebugPanel();
      });
    }

    function startFight(){
      if(getCurrentMode()==='challenge'){
        const save = getSave();
        if(getActiveChallengeIndex() > (save.challenge ? save.challenge.unlockedNodeIndex : 0)){
          showMsg('Node locked.',1);
          return;
        }
        beginFight();
        return;
      }
      attemptArenaAccess(getSelectedArenaIndex()).then((granted)=>{
        if(!granted) return;
        beginFight();
      });
    }

    function handleSwapRematch(){
      resetScoreRound();
      setChallengeContinueUsed(false);
      document.getElementById('ov-match').classList.add('hide');
      document.getElementById('hud').style.display='none';
      showLoadoutOverlay();
      updateModeUI();
    }

    function setMode(mode){
      const currentMode = mode === 'challenge' ? 'challenge' : 'quick';
      setCurrentMode(currentMode);
      if(currentMode==='challenge'){
        setActiveChallengeIndex(getSave().challenge ? getSave().challenge.unlockedNodeIndex || 0 : 0);
      }else{
        setSelectedArenaIndex(getCurrentArena());
      }
      updateModeUI();
    }

    function selectArenaByIndex(index){
      const targetArena = parseInt(index,10);
      if(Number.isNaN(targetArena)) return;
      setSelectedArenaIndex(targetArena);
      syncArenaSelectionUI();
      attemptArenaAccess(targetArena).then((granted)=>{
        if(!granted) return;
        setSelectedArenaIndex(getCurrentArena());
        syncArenaSelectionUI();
        updateModeUI();
        syncDebugPanel();
      }).catch(()=>{
        setSelectedArenaIndex(getCurrentArena());
        syncArenaSelectionUI();
        syncDebugPanel();
      });
    }

    function installWindowBindings(){
      window.__spinClashUI = {
        enterBattle:handleEnterBattle,
        selectTop:selectPlayerTopById,
        startFight,
        replay:resetMatch,
        swapRematch:handleSwapRematch,
        doubleReward:handleDoubleReward,
        continueReward:handleContinueReward,
        share:handleShare,
        setMode,
        selectArena:selectArenaByIndex,
        swap:doSwap,
        dash:doPlayerDash,
        skill:doPlayerSkill
      };
      window.__spinClashEnterBattle = handleEnterBattle;
    }

    return {
      handleEnterBattle,
      selectPlayerTopById,
      startFight,
      handleSwapRematch,
      setMode,
      selectArenaByIndex,
      installWindowBindings
    };
  };
})();
