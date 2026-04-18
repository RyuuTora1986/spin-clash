(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createProgressionTools = function createProgressionTools(options){
    const storageService = options.storageService || null;
    const challengeRoad = options.challengeRoad || [];
    const researchTracks = options.researchTracks || [];
    const roadRanks = options.roadRanks || [];
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
        : { currency:0, challenge:{ unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[] }, sessions:0, analytics:[] };
    }

    function saveProgress(mutator){
      if(!storageService) return getSave();
      return storageService.transact(mutator);
    }

    function getCheckpointResumeIndex(target){
      let checkpointNodeIndex = 0;
      for(let index = 0; index < challengeRoad.length; index += 1){
        const node = challengeRoad[index];
        if(!node || !node.checkpointOnClear) continue;
        const resumeIndex = Math.min(index + 1, challengeRoad.length - 1);
        if(resumeIndex <= target){
          checkpointNodeIndex = resumeIndex;
        }
      }
      return checkpointNodeIndex;
    }

    function setChallengeProgress(unlockedNodeIndex){
      const target = Math.max(0, Math.min(unlockedNodeIndex, challengeRoad.length - 1));
      const checkpointNodeIndex = getCheckpointResumeIndex(target);
      saveProgress((save)=>{
        save.challenge = save.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], lastNodeIndex:null };
        save.challenge.unlockedNodeIndex = target;
        save.challenge.checkpointNodeIndex = checkpointNodeIndex;
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

    function getResearchTrack(trackId){
      for(let index = 0; index < researchTracks.length; index += 1){
        if(researchTracks[index] && researchTracks[index].id === trackId){
          return researchTracks[index];
        }
      }
      return null;
    }

    function getResearchLevel(trackId){
      const save = getSave();
      const research = save.research || {};
      const levels = research.levels || {};
      const level = levels[trackId];
      return typeof level === 'number' && isFinite(level) && level >= 0 ? Math.floor(level) : 0;
    }

    function getResearchBonuses(){
      const totals = {
        hpMul:1,
        maxSpinMul:1,
        brateMul:1
      };
      researchTracks.forEach(function(track){
        if(!track || !Array.isArray(track.levels) || !track.levels.length) return;
        const level = getResearchLevel(track.id);
        if(level <= 0) return;
        const levelConfig = track.levels[Math.min(level, track.levels.length) - 1];
        const effect = levelConfig && levelConfig.effect ? levelConfig.effect : {};
        if(typeof effect.hpMul === 'number' && isFinite(effect.hpMul)){
          totals.hpMul *= effect.hpMul;
        }
        if(typeof effect.maxSpinMul === 'number' && isFinite(effect.maxSpinMul)){
          totals.maxSpinMul *= effect.maxSpinMul;
        }
        if(typeof effect.brateMul === 'number' && isFinite(effect.brateMul)){
          totals.brateMul *= effect.brateMul;
        }
      });
      return totals;
    }

    function buyResearchLevel(trackId){
      const track = getResearchTrack(trackId);
      if(!track || !Array.isArray(track.levels)){
        return { ok:false, reason:'unknown_track', trackId };
      }
      const levelBefore = getResearchLevel(trackId);
      const maxLevel = track.levels.length;
      if(levelBefore >= track.levels.length){
        return {
          ok:false,
          reason:'maxed',
          trackId,
          trackLabel:track.label,
          levelBefore,
          levelAfter:levelBefore,
          maxLevel,
          remainingLevels:0
        };
      }
      const nextLevelConfig = track.levels[levelBefore];
      const cost = nextLevelConfig && typeof nextLevelConfig.cost === 'number' ? nextLevelConfig.cost : 0;
      const save = getSave();
      const currencyBefore = save.currency || 0;
      if(currencyBefore < cost){
        return {
          ok:false,
          reason:'insufficient',
          trackId,
          trackLabel:track.label,
          levelBefore,
          levelAfter:levelBefore,
          cost,
          maxLevel,
          remainingLevels:Math.max(0, maxLevel - levelBefore),
          currencyBefore,
          currencyAfter:currencyBefore
        };
      }
      saveProgress((draft)=>{
        draft.currency -= cost;
        draft.research = draft.research || { levels:{} };
        draft.research.levels = draft.research.levels || {};
        draft.research.levels[trackId] = levelBefore + 1;
        return draft;
      });
      return {
        ok:true,
        reason:'purchased',
        trackId,
        trackLabel:track.label,
        levelBefore,
        levelAfter:levelBefore + 1,
        maxLevel,
        remainingLevels:Math.max(0, maxLevel - (levelBefore + 1)),
        cost,
        currencyBefore,
        currencyAfter:currencyBefore - cost,
        preview:nextLevelConfig.preview
      };
    }

    function getUnlockedRoadRankIndex(){
      const save = getSave();
      const challenge = save.challenge || {};
      const unlocked = typeof challenge.unlockedRankIndex === 'number' && isFinite(challenge.unlockedRankIndex)
        ? Math.floor(challenge.unlockedRankIndex)
        : 0;
      return Math.max(0, Math.min(unlocked, Math.max(0, roadRanks.length - 1)));
    }

    function getSelectedRoadRankIndex(){
      const save = getSave();
      const challenge = save.challenge || {};
      const selected = typeof challenge.selectedRankIndex === 'number' && isFinite(challenge.selectedRankIndex)
        ? Math.floor(challenge.selectedRankIndex)
        : 0;
      return Math.max(0, Math.min(selected, getUnlockedRoadRankIndex()));
    }

    function setSelectedRoadRankIndex(index){
      const target = Math.max(0, Math.min(parseInt(index,10) || 0, getUnlockedRoadRankIndex()));
      saveProgress((save)=>{
        save.challenge = save.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], lastNodeIndex:null, unlockedRankIndex:0, selectedRankIndex:0 };
        save.challenge.unlockedRankIndex = typeof save.challenge.unlockedRankIndex === 'number'
          ? save.challenge.unlockedRankIndex
          : 0;
        save.challenge.selectedRankIndex = Math.min(target, save.challenge.unlockedRankIndex);
        return save;
      });
      refresh();
      return target;
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
      getCheckpointResumeIndex,
      addCurrency,
      getResearchLevel,
      getResearchBonuses,
      buyResearchLevel,
      getUnlockedRoadRankIndex,
      getSelectedRoadRankIndex,
      setSelectedRoadRankIndex,
      unlockArenaById,
      unlockTopById,
      resetDebugProgress
    };
  };
})();
