(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createUiEntryTools = function createUiEntryTools(options){
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const arenas = options.arenas || [];
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const setCurrentMode = typeof options.setCurrentMode === 'function' ? options.setCurrentMode : function(){};
    const getUiRoute = typeof options.getUiRoute === 'function' ? options.getUiRoute : function(){ return 'home'; };
    const setUiRoute = typeof options.setUiRoute === 'function' ? options.setUiRoute : function(){};
    const getUiRouteFrom = typeof options.getUiRouteFrom === 'function' ? options.getUiRouteFrom : function(){ return 'home'; };
    const setUiRouteFrom = typeof options.setUiRouteFrom === 'function' ? options.setUiRouteFrom : function(){};
    const getBattleReturnRoute = typeof options.getBattleReturnRoute === 'function' ? options.getBattleReturnRoute : function(){ return 'home'; };
    const setBattleReturnRoute = typeof options.setBattleReturnRoute === 'function' ? options.setBattleReturnRoute : function(){};
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const setSelectedArenaIndex = typeof options.setSelectedArenaIndex === 'function' ? options.setSelectedArenaIndex : function(){};
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const setPlayerTopId = typeof options.setPlayerTopId === 'function' ? options.setPlayerTopId : function(){};
    const getHomePreviewTopId = typeof options.getHomePreviewTopId === 'function' ? options.getHomePreviewTopId : function(){ return getPlayerTopId(); };
    const setHomePreviewTopId = typeof options.setHomePreviewTopId === 'function' ? options.setHomePreviewTopId : function(){};
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
    const isTopUnlocked = typeof options.isTopUnlocked === 'function' ? options.isTopUnlocked : function(){ return true; };
    const selectRoadRank = typeof options.selectRoadRank === 'function' ? options.selectRoadRank : function(index){ return index; };
    const setLocale = typeof options.setLocale === 'function' ? options.setLocale : function(locale){ return locale; };
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const beginFight = typeof options.beginFight === 'function' ? options.beginFight : function(){};
    const toggleWorkshop = typeof options.toggleWorkshop === 'function' ? options.toggleWorkshop : function(){};
    const setWorkshopOpen = typeof options.setWorkshopOpen === 'function' ? options.setWorkshopOpen : function(){ return false; };
    const attemptResearchPurchase = typeof options.attemptResearchPurchase === 'function' ? options.attemptResearchPurchase : function(){ return Promise.resolve(false); };
    const doSwap = typeof options.doSwap === 'function' ? options.doSwap : function(){};
    const doPlayerDash = typeof options.doPlayerDash === 'function' ? options.doPlayerDash : function(){};
    const doPlayerGuard = typeof options.doPlayerGuard === 'function' ? options.doPlayerGuard : function(){};
    const doPlayerSkill = typeof options.doPlayerSkill === 'function' ? options.doPlayerSkill : function(){};
    const resetMatch = typeof options.resetMatch === 'function' ? options.resetMatch : function(){};
    const handleDoubleReward = typeof options.handleDoubleReward === 'function' ? options.handleDoubleReward : function(){};
    const handleContinueReward = typeof options.handleContinueReward === 'function' ? options.handleContinueReward : function(){};
    const handleShare = typeof options.handleShare === 'function' ? options.handleShare : function(){};
    const toggleMusicPreference = typeof options.toggleMusicPreference === 'function' ? options.toggleMusicPreference : function(){ return true; };
    const toggleSfxPreference = typeof options.toggleSfxPreference === 'function' ? options.toggleSfxPreference : function(){ return true; };

    function showTitleOverlay(){
      const titleOverlay = document.getElementById('ov-title');
      if(titleOverlay){
        titleOverlay.classList.remove('hide');
        titleOverlay.style.display = 'flex';
        titleOverlay.style.visibility = 'visible';
      }
    }

    function hideTitleOverlay(){
      const titleOverlay = document.getElementById('ov-title');
      if(titleOverlay){
        titleOverlay.classList.add('hide');
        titleOverlay.style.display = 'none';
        titleOverlay.style.visibility = 'hidden';
      }
    }

    function setBattleMode(mode){
      const currentMode = mode === 'challenge' ? 'challenge' : 'quick';
      setCurrentMode(currentMode);
      if(currentMode === 'challenge'){
        setActiveChallengeIndex(getSave().challenge ? getSave().challenge.unlockedNodeIndex || 0 : 0);
      }else{
        setSelectedArenaIndex(getCurrentArena());
      }
    }

    function isTopDefaultUnlocked(top){
      if(!top) return false;
      if(top.unlockSource === 'starter') return true;
      return !top.unlockSource && top.unlockCost <= 0;
    }

    function getUnlockedTopIndexes(){
      const save = getSave();
      const unlockedTopIds = save && save.unlocks && Array.isArray(save.unlocks.tops)
        ? save.unlocks.tops
        : [];
      const unlockedIndexes = [];
      tops.forEach(function(top, index){
        if(!top) return;
        if(isTopDefaultUnlocked(top) || unlockedTopIds.includes(top.id)){
          unlockedIndexes.push(index);
        }
      });
      if(!unlockedIndexes.length && tops.length){
        unlockedIndexes.push(Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0)));
      }
      return unlockedIndexes;
    }

    function normalizeSelectedTopToUnlocked(){
      const unlockedIndexes = getUnlockedTopIndexes();
      if(!unlockedIndexes.length){
        return Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
      }
      const currentTopIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
      if(unlockedIndexes.includes(currentTopIndex)){
        return currentTopIndex;
      }
      const normalizedIndex = unlockedIndexes[0];
      setPlayerTopId(normalizedIndex);
      return normalizedIndex;
    }

    function applyRoute(route, options){
      try{
        const loadoutOverlay = getLoadoutOverlay();
        if(!loadoutOverlay){
          throw new Error('Enter flow overlays missing');
        }
        const nextRoute = route || 'home';
        const routeOptions = options || {};
        normalizeSelectedTopToUnlocked();
        if(routeOptions.origin){
          setUiRouteFrom(routeOptions.origin);
        }
        if(nextRoute === 'path'){
          setBattleMode('challenge');
        }else if(nextRoute === 'quick'){
          setBattleMode('quick');
        }
        setUiRoute(nextRoute);
        if(nextRoute === 'home'){
          setWorkshopOpen(false);
          showTitleOverlay();
          hideLoadoutOverlay();
        }else{
          setWorkshopOpen(nextRoute === 'workshop');
          hideTitleOverlay();
          showLoadoutOverlay();
        }
        updateModeUI();
        initAudioSafely();
      }catch(error){
        const message = error instanceof Error ? error.message : String(error);
        showRuntimeError(message);
        console.error('Shell route change failed', error);
      }
    }

    function canLeaveHomeForBattleRoute(){
      if(getUiRoute() !== 'home'){
        return true;
      }
      const previewTopIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getHomePreviewTopId(), 10) || 0));
      if(isTopUnlocked(previewTopIndex)){
        return true;
      }
      showMsg(
        uiText.homeRouteLockedHint
          || uiText.quickStartBlockedHint
          || 'The previewed top is locked. Switch to an unlocked top first.',
        1.2
      );
      updateModeUI();
      syncDebugPanel();
      return false;
    }

    function handleEnterBattle(){
      if(!canLeaveHomeForBattleRoute()) return;
      applyRoute('path', { origin:'home' });
    }

    function enterQuickBattle(){
      if(!canLeaveHomeForBattleRoute()) return;
      applyRoute('quick', { origin:'home' });
    }

    function enterWorkshop(){
      const currentRoute = getUiRoute();
      const origin = currentRoute && currentRoute !== 'workshop' && currentRoute !== 'settings'
        ? currentRoute
        : 'home';
      applyRoute('workshop', { origin });
    }

    function enterSettings(){
      const currentRoute = getUiRoute();
      const origin = currentRoute && currentRoute !== 'workshop' && currentRoute !== 'settings'
        ? currentRoute
        : 'home';
      applyRoute('settings', { origin });
    }

    function goHome(){
      applyRoute('home', { origin:'home' });
    }

    function goPath(){
      if(!canLeaveHomeForBattleRoute()) return;
      applyRoute('path', { origin:'home' });
    }

    function goQuick(){
      if(!canLeaveHomeForBattleRoute()) return;
      applyRoute('quick', { origin:'home' });
    }

    function goWorkshop(){
      enterWorkshop();
    }

    function goSettings(){
      enterSettings();
    }

    function goBack(){
      const currentRoute = getUiRoute();
      if(currentRoute === 'workshop' || currentRoute === 'settings'){
        applyRoute(getUiRouteFrom() || 'home', { origin:'home' });
        return;
      }
      goHome();
    }

    function selectPlayerTopById(topId){
      const safeTopId = Math.max(0, Math.min(tops.length - 1, parseInt(topId, 10) || 0));
      attemptTopAccess(safeTopId).then((granted)=>{
        if(!granted) return;
        setPlayerTopId(safeTopId);
        setHomePreviewTopId(safeTopId);
        document.querySelectorAll('.card').forEach((x)=>{
          x.classList.toggle('sel', parseInt(x.dataset.id, 10) === safeTopId);
        });
        updateModeUI();
        updateSkillIcon();
        syncDebugPanel();
      });
    }

    function cycleHomeTop(step){
      if(tops.length <= 1){
        updateModeUI();
        updateSkillIcon();
        syncDebugPanel();
        return Math.max(0, Math.min(tops.length - 1, parseInt(getHomePreviewTopId(), 10) || 0));
      }
      const currentTopIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getHomePreviewTopId(), 10) || normalizeSelectedTopToUnlocked() || 0));
      const nextTopIndex = (currentTopIndex + (step < 0 ? -1 : 1) + tops.length) % tops.length;
      setHomePreviewTopId(nextTopIndex);
      updateModeUI();
      updateSkillIcon();
      syncDebugPanel();
      return nextTopIndex;
    }

    function prevHomeTop(){
      return cycleHomeTop(-1);
    }

    function nextHomeTop(){
      return cycleHomeTop(1);
    }

    function cycleQuickArena(step){
      if(arenas.length <= 1){
        updateModeUI();
        syncDebugPanel();
        return Math.max(0, Math.min(Math.max(0, arenas.length - 1), parseInt(getSelectedArenaIndex(), 10) || 0));
      }
      const currentArenaIndex = Math.max(0, Math.min(arenas.length - 1, parseInt(getSelectedArenaIndex(), 10) || 0));
      const nextArenaIndex = (currentArenaIndex + (step < 0 ? -1 : 1) + arenas.length) % arenas.length;
      setSelectedArenaIndex(nextArenaIndex);
      syncArenaSelectionUI();
      updateModeUI();
      syncDebugPanel();
      return nextArenaIndex;
    }

    function prevQuickArena(){
      return cycleQuickArena(-1);
    }

    function nextQuickArena(){
      return cycleQuickArena(1);
    }

    function startFight(){
      setBattleReturnRoute(getUiRoute());
      if(getCurrentMode() === 'challenge'){
        const save = getSave();
        if(getActiveChallengeIndex() > (save.challenge ? save.challenge.unlockedNodeIndex : 0)){
          showMsg(uiText.nodeLocked || 'Node locked.', 1);
          return;
        }
        beginFight();
        return;
      }
      if(!isTopUnlocked(parseInt(getPlayerTopId(), 10) || 0)){
        showMsg(
          uiText.quickStartBlockedHint
            || uiText.quickTopLockedHint
            || 'Locked tops cannot enter quick battle.',
          1.2
        );
        updateModeUI();
        syncDebugPanel();
        return;
      }
      attemptArenaAccess(getSelectedArenaIndex()).then((granted)=>{
        if(!granted) return;
        beginFight();
      });
    }

    function quickTopAction(){
      const currentTopIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
      if(isTopUnlocked(currentTopIndex)){
        updateModeUI();
        syncDebugPanel();
        return true;
      }
      const top = tops[currentTopIndex] || null;
      if(top && top.unlockSource === 'road'){
        goPath();
        return true;
      }
      attemptTopAccess(currentTopIndex).then(function(granted){
        if(!granted) return;
        updateModeUI();
        syncDebugPanel();
      });
      return true;
    }

    function handleSwapRematch(){
      resetMatch({ skipInitRound:true });
      applyRoute(getBattleReturnRoute() || (getCurrentMode() === 'challenge' ? 'path' : 'quick'), {
        origin:'home'
      });
    }

    function handleResultReturn(){
      resetMatch({ skipInitRound:true });
      applyRoute(getBattleReturnRoute() || (getCurrentMode() === 'challenge' ? 'path' : 'quick'), {
        origin:'home'
      });
    }

    function setMode(mode){
      if(mode === 'challenge'){
        applyRoute('path', { origin:'home' });
        return;
      }
      applyRoute('quick', { origin:'home' });
    }

    function selectArenaByIndex(index){
      const targetArena = parseInt(index, 10);
      if(Number.isNaN(targetArena) || arenas.length <= 0) return;
      setSelectedArenaIndex(Math.max(0, Math.min(arenas.length - 1, targetArena)));
      syncArenaSelectionUI();
      updateModeUI();
      syncDebugPanel();
    }

    function handleToggleWorkshop(){
      toggleWorkshop();
      updateModeUI();
      syncDebugPanel();
    }

    function setRoadRank(index){
      selectRoadRank(parseInt(index, 10) || 0);
      updateModeUI();
      syncDebugPanel();
    }

    function buyResearchByIndex(index){
      attemptResearchPurchase(index).then(function(){
        updateModeUI();
        syncDebugPanel();
      });
    }

    function applyLocale(locale){
      setLocale(locale);
      updateModeUI();
      syncDebugPanel();
      return true;
    }

    function handleToggleMusic(){
      const enabled = toggleMusicPreference();
      updateModeUI();
      syncDebugPanel();
      return enabled;
    }

    function handleToggleSfx(){
      const enabled = toggleSfxPreference();
      updateModeUI();
      syncDebugPanel();
      return enabled;
    }

    function installWindowBindings(){
      window.__spinClashUI = {
        goHome,
        goPath,
        goQuick,
        goWorkshop,
        goSettings,
        goBack,
        prevHomeTop,
        nextHomeTop,
        prevQuickArena,
        nextQuickArena,
        enterBattle:handleEnterBattle,
        enterQuickBattle,
        enterWorkshop,
        enterSettings,
        selectTop:selectPlayerTopById,
        quickTopAction,
        startFight,
        replay:handleResultReturn,
        swapRematch:handleSwapRematch,
        doubleReward:handleDoubleReward,
        continueReward:handleContinueReward,
        share:handleShare,
        setMode,
        setLocale:applyLocale,
        toggleMusic:handleToggleMusic,
        toggleSfx:handleToggleSfx,
        setRoadRank,
        selectArena:selectArenaByIndex,
        toggleWorkshop:handleToggleWorkshop,
        buyResearch:buyResearchByIndex,
        swap:doSwap,
        dash:doPlayerDash,
        guard:doPlayerGuard,
        skill:doPlayerSkill
      };
      window.__spinClashEnterBattle = handleEnterBattle;
    }

    return {
      handleEnterBattle,
      enterQuickBattle,
      enterWorkshop,
      enterSettings,
      goHome,
      goPath,
      goQuick,
      goWorkshop,
      goSettings,
      goBack,
      prevHomeTop,
      nextHomeTop,
      prevQuickArena,
      nextQuickArena,
      selectPlayerTopById,
      quickTopAction,
      startFight,
      handleSwapRematch,
      setMode,
      setRoadRank,
      selectArenaByIndex,
      installWindowBindings
    };
  };
})();
