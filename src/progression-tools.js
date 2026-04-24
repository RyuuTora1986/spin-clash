(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createProgressionTools = function createProgressionTools(options){
    const state = options.state || root.state || (root.state = {});
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

    function normalizeRoadRankIndex(index){
      const maxRankIndex = Math.max(0, roadRanks.length - 1);
      const parsed = parseInt(index, 10);
      if(!isFinite(parsed)) return 0;
      return Math.max(0, Math.min(parsed, maxRankIndex));
    }

    function createEmptyRankProgress(){
      return {
        unlockedNodeIndex:0,
        checkpointNodeIndex:0,
        completedNodes:[],
        lastNodeIndex:null
      };
    }

    function normalizeProgressEntry(entry, fallback){
      const source = entry || {};
      const fallbackEntry = fallback || createEmptyRankProgress();
      return {
        unlockedNodeIndex:typeof source.unlockedNodeIndex === 'number' && isFinite(source.unlockedNodeIndex)
          ? Math.max(0, Math.min(Math.floor(source.unlockedNodeIndex), Math.max(0, challengeRoad.length - 1)))
          : Math.max(0, Math.min(fallbackEntry.unlockedNodeIndex || 0, Math.max(0, challengeRoad.length - 1))),
        checkpointNodeIndex:typeof source.checkpointNodeIndex === 'number' && isFinite(source.checkpointNodeIndex)
          ? Math.max(0, Math.min(Math.floor(source.checkpointNodeIndex), Math.max(0, challengeRoad.length - 1)))
          : Math.max(0, Math.min(fallbackEntry.checkpointNodeIndex || 0, Math.max(0, challengeRoad.length - 1))),
        completedNodes:Array.isArray(source.completedNodes)
          ? source.completedNodes.filter(function(value, index, list){
              const nodeIndex = typeof value === 'number' && isFinite(value) ? Math.floor(value) : -1;
              return nodeIndex >= 0 && nodeIndex < challengeRoad.length && list.indexOf(value) === index;
            }).map(function(value){ return Math.floor(value); })
          : (Array.isArray(fallbackEntry.completedNodes) ? fallbackEntry.completedNodes.slice() : []),
        lastNodeIndex:typeof source.lastNodeIndex === 'number' && isFinite(source.lastNodeIndex)
          ? Math.max(0, Math.min(Math.floor(source.lastNodeIndex), Math.max(0, challengeRoad.length - 1)))
          : null
      };
    }

    function getLegacyChallengeProgress(challenge){
      return normalizeProgressEntry({
        unlockedNodeIndex:challenge && typeof challenge.unlockedNodeIndex === 'number' ? challenge.unlockedNodeIndex : 0,
        checkpointNodeIndex:challenge && typeof challenge.checkpointNodeIndex === 'number' ? challenge.checkpointNodeIndex : 0,
        completedNodes:challenge && Array.isArray(challenge.completedNodes) ? challenge.completedNodes : [],
        lastNodeIndex:challenge && typeof challenge.lastNodeIndex === 'number' ? challenge.lastNodeIndex : null
      });
    }

    function ensureRankProgress(save, rankIndex){
      const targetRankIndex = normalizeRoadRankIndex(rankIndex);
      save.challenge = save.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], lastNodeIndex:null, unlockedRankIndex:0, selectedRankIndex:0 };
      save.challenge.rankProgress = save.challenge.rankProgress || {};
      const key = String(targetRankIndex);
      if(!save.challenge.rankProgress[key]){
        save.challenge.rankProgress[key] = targetRankIndex === 0
          ? getLegacyChallengeProgress(save.challenge)
          : createEmptyRankProgress();
      }
      save.challenge.rankProgress[key] = normalizeProgressEntry(
        save.challenge.rankProgress[key],
        targetRankIndex === 0 ? getLegacyChallengeProgress(save.challenge) : null
      );
      return save.challenge.rankProgress[key];
    }

    function mirrorRankProgressToLegacy(challenge, progress){
      if(!challenge || !progress) return;
      challenge.unlockedNodeIndex = progress.unlockedNodeIndex || 0;
      challenge.checkpointNodeIndex = progress.checkpointNodeIndex || 0;
      challenge.completedNodes = Array.isArray(progress.completedNodes) ? progress.completedNodes.slice() : [];
      challenge.lastNodeIndex = typeof progress.lastNodeIndex === 'number' ? progress.lastNodeIndex : null;
    }

    function getRoadRankProgress(index){
      const save = getSave();
      const challenge = save.challenge || {};
      const targetRankIndex = normalizeRoadRankIndex(index);
      const rankProgress = challenge.rankProgress || {};
      const entry = rankProgress[String(targetRankIndex)];
      return normalizeProgressEntry(
        entry,
        targetRankIndex === 0 ? getLegacyChallengeProgress(challenge) : null
      );
    }

    function getRoadRankProgressIndex(index){
      const progress = getRoadRankProgress(index);
      return Math.max(0, Math.min(progress.unlockedNodeIndex || 0, Math.max(0, challengeRoad.length - 1)));
    }

    function getSelectedRoadRankProgress(){
      return getRoadRankProgress(getSelectedRoadRankIndex());
    }

    function setChallengeProgress(unlockedNodeIndex){
      const target = Math.max(0, Math.min(unlockedNodeIndex, challengeRoad.length - 1));
      const checkpointNodeIndex = getCheckpointResumeIndex(target);
      const selectedRankIndex = getSelectedRoadRankIndex();
      saveProgress((save)=>{
        const progress = ensureRankProgress(save, selectedRankIndex);
        progress.unlockedNodeIndex = target;
        progress.checkpointNodeIndex = checkpointNodeIndex;
        progress.lastNodeIndex = target;
        progress.completedNodes = Array.isArray(progress.completedNodes) ? progress.completedNodes : [];
        for(let i=0;i<target;i++){
          if(!progress.completedNodes.includes(i)){
            progress.completedNodes.push(i);
          }
        }
        if(selectedRankIndex === 0){
          mirrorRankProgressToLegacy(save.challenge, progress);
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
      return normalizeRoadRankIndex(unlocked);
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
      const target = Math.max(0, Math.min(normalizeRoadRankIndex(index), getUnlockedRoadRankIndex()));
      saveProgress((save)=>{
        save.challenge = save.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], lastNodeIndex:null, unlockedRankIndex:0, selectedRankIndex:0 };
        save.challenge.unlockedRankIndex = typeof save.challenge.unlockedRankIndex === 'number'
          ? save.challenge.unlockedRankIndex
          : 0;
        save.challenge.selectedRankIndex = Math.min(target, save.challenge.unlockedRankIndex);
        ensureRankProgress(save, save.challenge.selectedRankIndex);
        return save;
      });
      setActiveChallengeIndex(getRoadRankProgressIndex(target));
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
      state.currentArenaIndex = 0;
      state.currentArenaId = 'circle_bowl';
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
      getRoadRankProgress,
      getRoadRankProgressIndex,
      getSelectedRoadRankProgress,
      unlockArenaById,
      unlockTopById,
      resetDebugProgress
    };
  };
})();
