(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createProgressionTools = function createProgressionTools(options){
    const storageService = options.storageService || null;
    const challengeRoad = options.challengeRoad || [];
    const refresh = typeof options.refresh === 'function' ? options.refresh : function(){};
    const getSessionTrialArenaIds = typeof options.getSessionTrialArenaIds === 'function'
      ? options.getSessionTrialArenaIds
      : function(){ return new Set(); };
    const setMode = typeof options.setMode === 'function' ? options.setMode : function(){};
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const setSelectedArenaIndex = typeof options.setSelectedArenaIndex === 'function' ? options.setSelectedArenaIndex : function(){};
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const resetRuntimeFlags = typeof options.resetRuntimeFlags === 'function' ? options.resetRuntimeFlags : function(){};

    function getSave(){
      return storageService
        ? storageService.get()
        : { currency:0, challenge:{ unlockedNodeIndex:0, completedNodes:[] }, sessions:0, analytics:[] };
    }

    function saveProgress(mutator){
      if(!storageService) return getSave();
      return storageService.transact(mutator);
    }

    function setChallengeProgress(unlockedNodeIndex){
      const target = Math.max(0, Math.min(unlockedNodeIndex, challengeRoad.length - 1));
      saveProgress((save)=>{
        save.challenge = save.challenge || { unlockedNodeIndex:0, completedNodes:[], lastNodeIndex:null };
        save.challenge.unlockedNodeIndex = target;
        save.challenge.lastNodeIndex = target;
        save.challenge.completedNodes = Array.isArray(save.challenge.completedNodes) ? save.challenge.completedNodes : [];
        for(let i=0;i<target;i++){
          if(!save.challenge.completedNodes.includes(i)){
            save.challenge.completedNodes.push(i);
          }
        }
        return save;
      });
      setActiveChallengeIndex(target);
      setMode('challenge');
      refresh();
    }

    function addCurrency(amount){
      saveProgress((save)=>{
        save.currency += amount;
        return save;
      });
      refresh();
    }

    function unlockArenaById(arenaId){
      saveProgress((save)=>{
        save.unlocks = save.unlocks || { arenas:[], tops:[] };
        save.unlocks.arenas = Array.isArray(save.unlocks.arenas) ? save.unlocks.arenas : [];
        if(!save.unlocks.arenas.includes(arenaId)){
          save.unlocks.arenas.push(arenaId);
        }
        return save;
      });
      refresh();
    }

    function unlockTopById(topId){
      saveProgress((save)=>{
        save.unlocks = save.unlocks || { arenas:[], tops:[] };
        save.unlocks.tops = Array.isArray(save.unlocks.tops) ? save.unlocks.tops : [];
        if(!save.unlocks.tops.includes(topId)){
          save.unlocks.tops.push(topId);
        }
        return save;
      });
      refresh();
    }

    function resetDebugProgress(){
      if(storageService && typeof storageService.reset === 'function'){
        storageService.reset();
      }
      getSessionTrialArenaIds().clear();
      setMode('quick');
      setCurrentArena(0);
      setSelectedArenaIndex(0);
      setActiveChallengeIndex(0);
      resetRuntimeFlags();
      refresh();
    }

    return {
      getSave,
      saveProgress,
      setChallengeProgress,
      addCurrency,
      unlockArenaById,
      unlockTopById,
      resetDebugProgress
    };
  };
})();
