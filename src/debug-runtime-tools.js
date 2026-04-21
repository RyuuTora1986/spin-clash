(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createDebugRuntimeTools = function createDebugRuntimeTools(options){
    const storageService = options.storageService || null;
    const analyticsService = options.analyticsService || null;
    const debugService = options.debugService || null;
    const rewardService = options.rewardService || null;
    const shareService = options.shareService || null;
    const economy = options.economy || {};
    const tops = options.tops || [];
    const arenas = options.arenas || [];
    const researchTracks = options.researchTracks || [];
    const roadRanks = options.roadRanks || [];
    const challengeRoad = options.challengeRoad || [];
    const enemyPresets = options.enemyPresets || {};
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return {}; };
    const saveProgress = typeof options.saveProgress === 'function' ? options.saveProgress : function(mutator){ return mutator(getSave()); };
    const addCurrency = typeof options.addCurrency === 'function' ? options.addCurrency : function(){};
    const getResearchBonuses = typeof options.getResearchBonuses === 'function'
      ? options.getResearchBonuses
      : function(){ return { hpMul:1, maxSpinMul:1, brateMul:1 }; };
    const getUnlockedRoadRankIndex = typeof options.getUnlockedRoadRankIndex === 'function'
      ? options.getUnlockedRoadRankIndex
      : function(){ return 0; };
    const getSelectedRoadRankIndex = typeof options.getSelectedRoadRankIndex === 'function'
      ? options.getSelectedRoadRankIndex
      : function(){ return 0; };
    const getCurrentRoadRank = typeof options.getCurrentRoadRank === 'function'
      ? options.getCurrentRoadRank
      : function(){ return roadRanks[getSelectedRoadRankIndex()] || roadRanks[0] || null; };
    const unlockArenaById = typeof options.unlockArenaById === 'function' ? options.unlockArenaById : function(){};
    const unlockTopById = typeof options.unlockTopById === 'function' ? options.unlockTopById : function(){};
    const setChallengeProgress = typeof options.setChallengeProgress === 'function' ? options.setChallengeProgress : function(){};
    const resetDebugProgress = typeof options.resetDebugProgress === 'function' ? options.resetDebugProgress : function(){};
    const getArenaLabel = typeof options.getArenaLabel === 'function' ? options.getArenaLabel : function(){ return 'ARENA'; };
    const getCurrentChallengeNode = typeof options.getCurrentChallengeNode === 'function' ? options.getCurrentChallengeNode : function(){ return null; };
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getEnemyTopId = typeof options.getEnemyTopId === 'function' ? options.getEnemyTopId : function(){ return 0; };
    const getCurrentEnemyPresetId = typeof options.getCurrentEnemyPresetId === 'function' ? options.getCurrentEnemyPresetId : function(){ return null; };
    const getCurrentEnemyPresetLabel = typeof options.getCurrentEnemyPresetLabel === 'function' ? options.getCurrentEnemyPresetLabel : function(){ return null; };
    const getCurrentEnemyAiConfig = typeof options.getCurrentEnemyAiConfig === 'function' ? options.getCurrentEnemyAiConfig : function(){ return null; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const getChallengeContinueUsed = typeof options.getChallengeContinueUsed === 'function' ? options.getChallengeContinueUsed : function(){ return false; };
    const getActiveModifier = typeof options.getActiveModifier === 'function' ? options.getActiveModifier : function(){ return { id:'standard' }; };
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const getRound = typeof options.getRound === 'function' ? options.getRound : function(){ return 1; };
    const getRoundTimer = typeof options.getRoundTimer === 'function' ? options.getRoundTimer : function(){ return 0; };
    const getGameState = typeof options.getGameState === 'function' ? options.getGameState : function(){ return 'title'; };
    const getTimeScale = typeof options.getTimeScale === 'function' ? options.getTimeScale : function(){ return 1; };
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const getOrbObjects = typeof options.getOrbObjects === 'function' ? options.getOrbObjects : function(){ return []; };
    const getSessionTrialArenaIds = typeof options.getSessionTrialArenaIds === 'function' ? options.getSessionTrialArenaIds : function(){ return new Set(); };
    const getHintText = typeof options.getHintText === 'function' ? options.getHintText : function(){ return ''; };
    const getMessageText = typeof options.getMessageText === 'function' ? options.getMessageText : function(){ return ''; };
    const getBattlePerfMetrics = typeof options.getBattlePerfMetrics === 'function' ? options.getBattlePerfMetrics : function(){ return null; };
    const getBattlePerformanceMode = typeof options.getBattlePerformanceMode === 'function' ? options.getBattlePerformanceMode : function(){ return null; };
    const physTick = typeof options.physTick === 'function' ? options.physTick : function(){};
    const renderer = options.renderer || null;
    const scene = options.scene || null;
    const camera = options.camera || null;
    const syncAfterReset = typeof options.syncAfterReset === 'function' ? options.syncAfterReset : function(){};

    let debugPanelHandle = null;
    let sessionStartedAt = Date.now();
    let sessionEndTracked = false;
    const baselineTuning = {
      economy:cloneValue(economy),
      enemyPresets:cloneValue(enemyPresets),
      arenas:cloneValue(arenas),
      tops:cloneValue(tops),
      research:cloneValue(researchTracks),
      roadRanks:cloneValue(roadRanks),
      challengeRoad:cloneValue(challengeRoad)
    };

    function syncDebugPanel(){
      if(debugPanelHandle && typeof debugPanelHandle.render === 'function'){
        debugPanelHandle.render();
      }
    }

    function copyText(text){
      if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
        return navigator.clipboard.writeText(text);
      }
      window.prompt('Copy debug text', text);
      return Promise.resolve();
    }

    function promptImportText(label){
      const raw = window.prompt(label || 'Paste JSON');
      if(raw == null) return null;
      return raw.trim();
    }

    function isPlainObject(value){
      return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneValue(value){
      if(Array.isArray(value)){
        return value.map(cloneValue);
      }
      if(isPlainObject(value)){
        const next = {};
        Object.keys(value).forEach(function(key){
          next[key] = cloneValue(value[key]);
        });
        return next;
      }
      return value;
    }

    function replaceObject(target, source){
      Object.keys(target).forEach(function(key){
        delete target[key];
      });
      const next = cloneValue(source);
      Object.keys(next).forEach(function(key){
        target[key] = next[key];
      });
    }

    function replaceArray(target, source){
      target.length = 0;
      (source || []).forEach(function(entry){
        target.push(cloneValue(entry));
      });
    }

    function mergeInto(target, patch){
      if(!isPlainObject(target) || !isPlainObject(patch)) return;
      Object.keys(patch).forEach(function(key){
        const patchValue = patch[key];
        if(isPlainObject(patchValue)){
          if(!isPlainObject(target[key])){
            target[key] = {};
          }
          mergeInto(target[key], patchValue);
          return;
        }
        target[key] = cloneValue(patchValue);
      });
    }

    function buildTuningSnapshot(){
      return {
        economy:cloneValue(economy),
        enemyPresets:cloneValue(enemyPresets),
        arenas:cloneValue(arenas),
        tops:cloneValue(tops),
        research:cloneValue(researchTracks),
        roadRanks:cloneValue(roadRanks),
        challengeRoad:cloneValue(challengeRoad)
      };
    }

    function sumLevelCosts(track){
      if(!track || !Array.isArray(track.levels)) return 0;
      return track.levels.reduce(function(total, level){
        const cost = level && typeof level.cost === 'number' && isFinite(level.cost) ? level.cost : 0;
        return total + cost;
      }, 0);
    }

    function getTopUnlockCost(topId){
      const top = tops.find(function(entry){
        return entry && entry.id === topId;
      });
      return top && typeof top.unlockCost === 'number' ? top.unlockCost : null;
    }

    function getArenaUnlockCost(arenaId){
      const arena = arenas.find(function(entry){
        return entry && entry.id === arenaId;
      });
      return arena && typeof arena.unlockCost === 'number' ? arena.unlockCost : null;
    }

    function buildTuningSummary(){
      const challengeWinBase = economy.rewards && typeof economy.rewards.challengeWinBase === 'number'
        ? economy.rewards.challengeWinBase
        : (economy.rewards ? economy.rewards.winBase : null);
      const challengeRankFirstClearTotals = roadRanks.map(function(rank){
        const rewardMul = rank && typeof rank.rewardMul === 'number' && isFinite(rank.rewardMul) ? rank.rewardMul : 1;
        const firstClearTotal = challengeRoad.reduce(function(total, node){
          const reward = node && typeof node.reward === 'number' && isFinite(node.reward) ? node.reward : 0;
          const bonus = node && typeof node.firstClearBonus === 'number' && isFinite(node.firstClearBonus) ? node.firstClearBonus : 0;
          return total + Math.round((challengeWinBase + reward + bonus) * rewardMul);
        }, 0);
        return {
          id:rank && rank.id ? rank.id : null,
          rewardMul,
          firstClearTotal
        };
      });
      return {
        quickWinBase:economy.rewards ? economy.rewards.winBase : null,
        quickLossBase:economy.rewards ? economy.rewards.lossBase : null,
        challengeWinBase,
        challengeLossBase:economy.rewards && typeof economy.rewards.challengeLossBase === 'number'
          ? economy.rewards.challengeLossBase
          : (economy.rewards ? economy.rewards.lossBase : null),
        roundTimer:economy.runtime ? economy.runtime.defaultRoundTimer : null,
        hexUnlockCost:getArenaUnlockCost('hex_bowl'),
        trickUnlockCost:getTopUnlockCost('trick'),
        breakerUnlockCost:getTopUnlockCost('impact_breaker'),
        raiderUnlockCost:getTopUnlockCost('trick_raider'),
        fullResearchSpend:researchTracks.reduce(function(total, track){
          return total + sumLevelCosts(track);
        }, 0),
        challengeRewardTotal:challengeRoad.reduce(function(total, node){
          const reward = node && typeof node.reward === 'number' && isFinite(node.reward) ? node.reward : 0;
          return total + reward;
        }, 0),
        challengeFirstClearTotal:challengeRoad.reduce(function(total, node){
          const bonus = node && typeof node.firstClearBonus === 'number' && isFinite(node.firstClearBonus) ? node.firstClearBonus : 0;
          return total + bonus;
        }, 0),
        roadRankRewardMultipliers:roadRanks.map(function(rank){
          return {
            id:rank && rank.id ? rank.id : null,
            rewardMul:rank && typeof rank.rewardMul === 'number' ? rank.rewardMul : null
          };
        }),
        challengeRankFirstClearTotals
      };
    }

    function buildProgressionSnapshot(){
      const snapshot = getSave() || {};
      const challenge = snapshot.challenge || {};
      const unlocks = snapshot.unlocks || {};
      return {
        currency:snapshot.currency || 0,
        challengeUnlockedNodeIndex:challenge.unlockedNodeIndex || 0,
        challengeCheckpointNodeIndex:challenge.checkpointNodeIndex || 0,
        challengeUnlockedRankIndex:challenge.unlockedRankIndex || 0,
        challengeSelectedRankIndex:challenge.selectedRankIndex || 0,
        challengeSelectedRankLabel:getCurrentRoadRank() ? getCurrentRoadRank().label : null,
        activeChallengeIndex:getActiveChallengeIndex(),
        challengeNodeId:getCurrentMode()==='challenge' && getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
        challengeContinueUsed:getChallengeContinueUsed(),
        researchLevels:snapshot.research && snapshot.research.levels ? snapshot.research.levels : {},
        researchBonuses:getResearchBonuses(),
        unlockedArenas:Array.isArray(unlocks.arenas) ? unlocks.arenas : [],
        unlockedTops:Array.isArray(unlocks.tops) ? unlocks.tops : [],
        trialArenas:Array.from(getSessionTrialArenaIds())
      };
    }

    function buildRuntimeSnapshot(){
      const currentArena = getCurrentArena();
      const score = getScore();
      const playerTop = tops[getPlayerTopId()] || { id:null, name:null };
      const enemyTop = tops[getEnemyTopId()] || { id:null, name:null };
      return {
        mode:getCurrentMode(),
        gameState:getGameState(),
        tuningActive:isTuningActive(),
        arenaIndex:currentArena,
        arenaId:(arenas[currentArena] && arenas[currentArena].id) || null,
        arenaLabel:getArenaLabel(currentArena),
        playerTopId:playerTop.id,
        playerTopLabel:playerTop.name,
        enemyTopId:enemyTop.id,
        enemyTopLabel:enemyTop.name,
        enemyPresetId:getCurrentEnemyPresetId(),
        enemyPresetLabel:getCurrentEnemyPresetLabel(),
        modifierId:getActiveModifier().id,
        round:getRound(),
        score:{ player:score[0], enemy:score[1] },
        timer:getRoundTimer(),
        timeScale:getTimeScale(),
        hint:getHintText(),
        message:getMessageText(),
        enemyAi:getCurrentEnemyAiConfig(),
        battlePerf:getBattlePerfMetrics(),
        battlePerformanceMode:getBattlePerformanceMode()
      };
    }

    function isTuningActive(){
      return JSON.stringify(buildTuningSnapshot()) !== JSON.stringify(baselineTuning);
    }

    function parseTuningPatch(input){
      const raw = typeof input === 'string' ? input.trim() : input;
      if(!raw){
        throw new Error('tuning_patch_empty');
      }
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if(!isPlainObject(parsed)){
        throw new Error('tuning_patch_invalid');
      }
      const patch = {};
      if(isPlainObject(parsed.economy)){
        patch.economy = parsed.economy;
      }
      if(isPlainObject(parsed.enemyPresets)){
        patch.enemyPresets = parsed.enemyPresets;
      }
      if(Array.isArray(parsed.arenas)){
        patch.arenas = parsed.arenas;
      }
      if(Array.isArray(parsed.tops)){
        patch.tops = parsed.tops;
      }
      if(Array.isArray(parsed.research)){
        patch.research = parsed.research;
      }
      if(Array.isArray(parsed.roadRanks)){
        patch.roadRanks = parsed.roadRanks;
      }
      if(Array.isArray(parsed.challengeRoad)){
        patch.challengeRoad = parsed.challengeRoad;
      }
      if(!Object.keys(patch).length){
        throw new Error('tuning_patch_empty');
      }
      return patch;
    }

    function applyTuningPatch(input){
      const patch = parseTuningPatch(input);
      if(patch.economy){
        mergeInto(economy, patch.economy);
      }
      if(patch.enemyPresets){
        mergeInto(enemyPresets, patch.enemyPresets);
      }
      if(patch.arenas){
        replaceArray(arenas, patch.arenas);
      }
      if(patch.tops){
        replaceArray(tops, patch.tops);
      }
      if(patch.research){
        replaceArray(researchTracks, patch.research);
      }
      if(patch.roadRanks){
        replaceArray(roadRanks, patch.roadRanks);
      }
      if(patch.challengeRoad){
        replaceArray(challengeRoad, patch.challengeRoad);
      }
      syncDebugPanel();
      return buildTuningSnapshot();
    }

    function resetTuning(){
      replaceObject(economy, baselineTuning.economy);
      replaceObject(enemyPresets, baselineTuning.enemyPresets);
      replaceArray(arenas, baselineTuning.arenas);
      replaceArray(tops, baselineTuning.tops);
      replaceArray(researchTracks, baselineTuning.research);
      replaceArray(roadRanks, baselineTuning.roadRanks);
      replaceArray(challengeRoad, baselineTuning.challengeRoad);
      syncDebugPanel();
      return buildTuningSnapshot();
    }

    function buildDebugResultSharePayload(){
      const currentArena = getCurrentArena();
      const score = getScore();
      const playerTop = tops[getPlayerTopId()] || { id:'unknown_top', name:'TOP' };
      const enemyTop = tops[getEnemyTopId()] || { id:'unknown_top', name:'TOP' };
      const result = score[0] >= score[1] ? 'win' : 'loss';
      const moment = getCurrentMode()==='challenge'
        ? (result === 'win' ? 'challenge_clear' : 'close_loss')
        : (result === 'win' ? 'victory' : 'defeat');
      return {
        kind:'result',
        mode:getCurrentMode(),
        result,
        moment,
        arenaId:(arenas[currentArena] && arenas[currentArena].id) || null,
        arenaLabel:getArenaLabel(currentArena),
        playerTop:playerTop.id,
        playerTopLabel:playerTop.name,
        enemyTop:enemyTop.id,
        enemyTopLabel:enemyTop.name,
        enemyPreset:getCurrentEnemyPresetId(),
        enemyPresetLabel:getCurrentEnemyPresetLabel(),
        challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null,
        scorePlayer:score[0],
        scoreEnemy:score[1],
        title:'Spin Clash',
        text:'Spin Clash debug result card'
      };
    }

    function getSignatureSkillId(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const signature = actions && actions.signature ? actions.signature : null;
      return (signature && signature.skillId) || (template ? template.skill : null) || null;
    }

    function getIntentSnapshot(top){
      if(!top || !top.intentType || !(top.intentT>0)) return null;
      return {
        type:top.intentType,
        remaining:top.intentT,
        lead:top.intentLead || 0,
        skillId:top.intentSkillId || null
      };
    }

    function prepareRoadRank(index){
      const maxIndex = Math.max(0, roadRanks.length - 1);
      const target = Math.max(0, Math.min(index, maxIndex));
      if(!roadRanks[target]){
        return 'ROAD RANK UNAVAILABLE';
      }
      saveProgress((save)=>{
        save.challenge = save.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], lastNodeIndex:null, unlockedRankIndex:0, selectedRankIndex:0 };
        save.challenge.unlockedRankIndex = Math.max(save.challenge.unlockedRankIndex || 0, target);
        save.challenge.selectedRankIndex = target;
        return save;
      });
      syncAfterReset();
      return roadRanks[target].label+' READY';
    }

    function renderGameToText(){
      const runtimeSnapshot = buildRuntimeSnapshot();
      const tp = getTp();
      const te = getTe();
      const payload = {
        mode:runtimeSnapshot.gameState,
        selectedMode:runtimeSnapshot.mode,
        tuningActive:runtimeSnapshot.tuningActive,
        arena:runtimeSnapshot.arenaId || 'unknown_arena',
        arenaLabel:runtimeSnapshot.arenaLabel,
        enemyPreset:runtimeSnapshot.enemyPresetId,
        enemyPresetLabel:runtimeSnapshot.enemyPresetLabel,
        modifier:runtimeSnapshot.modifierId,
        round:runtimeSnapshot.round,
        score:runtimeSnapshot.score,
        timer:runtimeSnapshot.timer,
        player:tp ? {
          x:tp.x,z:tp.z,vx:tp.vx,vz:tp.vz,
          hp:tp.hp,spin:tp.spin,burst:tp.burst,
          dashCD:tp.dashCD,guardCD:tp.guardCD,guarding:!!tp.guarding,skillCD:tp.skillCD,
          alive:tp.alive,top:tp.template.name,skill:getSignatureSkillId(tp.template),
          intent:getIntentSnapshot(tp)
        } : null,
        enemy:te ? {
          x:te.x,z:te.z,vx:te.vx,vz:te.vz,
          hp:te.hp,spin:te.spin,burst:te.burst,
          dashCD:te.dashCD,guardCD:te.guardCD,guarding:!!te.guarding,skillCD:te.skillCD,
          alive:te.alive,top:te.template.name,skill:getSignatureSkillId(te.template),
          intent:getIntentSnapshot(te)
        } : null,
        orbs:getOrbObjects().filter((o)=>o.alive).map((o)=>({ x:o.x, z:o.z })),
        overlays:{
          title:!document.getElementById('ov-title').classList.contains('hide'),
          loadout:!document.getElementById('ov-loadout').classList.contains('hide'),
          roundResult:!document.getElementById('ov-round').classList.contains('hide'),
          matchResult:!document.getElementById('ov-match').classList.contains('hide')
        },
        progression:buildProgressionSnapshot(),
        economy:{
          winBase:economy.rewards ? economy.rewards.winBase : null,
          lossBase:economy.rewards ? economy.rewards.lossBase : null,
          challengeWinBase:economy.rewards ? economy.rewards.challengeWinBase : null,
          challengeLossBase:economy.rewards ? economy.rewards.challengeLossBase : null,
          doubleRewardMultiplier:economy.rewards ? economy.rewards.doubleRewardMultiplier : null,
          defaultRoundTimer:economy.runtime ? economy.runtime.defaultRoundTimer : null,
          challengeContinueEnabled:economy.runtime ? economy.runtime.challengeContinueEnabled : null,
          challengeContinueLimit:economy.runtime ? economy.runtime.challengeContinueLimit : null
        },
        enemyAi:runtimeSnapshot.enemyAi,
        battlePerf:runtimeSnapshot.battlePerf,
        battlePerformanceMode:runtimeSnapshot.battlePerformanceMode,
        hint:runtimeSnapshot.hint,
        message:runtimeSnapshot.message,
        coordinateSystem:'arena plane uses x right, z down-screen from the default camera view'
      };
      return JSON.stringify(payload);
    }

    function advanceTime(ms){
      if(!renderer || !scene || !camera) return;
      const steps=Math.max(1,Math.round(ms/(1000/60)));
      for(let i=0;i<steps;i++) physTick((1/60)*getTimeScale());
      renderer.render(scene, camera);
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
      if(sessionEndTracked || !analyticsService) return;
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
      window.addEventListener('pagehide', function(){
        emitSessionEnd('pagehide');
      });
      window.addEventListener('beforeunload', function(){
        emitSessionEnd('beforeunload');
      });
    }

    function initRuntimeDebug(){
      sessionStartedAt = Date.now();
      sessionEndTracked = false;
      const initialSave = getSave() || {};
      const initialSnapshot = cloneValue(initialSave);
      const startingSessions = initialSnapshot && typeof initialSnapshot.sessions === 'number'
        ? initialSnapshot.sessions
        : 0;
      const unlockedNodeIndex = initialSnapshot.challenge ? initialSnapshot.challenge.unlockedNodeIndex || 0 : 0;
      saveProgress((save)=>{
        save.sessions = (save.sessions || 0) + 1;
        return save;
      });
      if(analyticsService){
        analyticsService.track(
          startingSessions > 0 ? 'return_session' : 'session_start',
          buildSessionAnalyticsPayload(initialSnapshot)
        );
      }
      if(debugService && debugService.enabled){
        debugPanelHandle = debugService.mount(function(){
          const rewardInfo = rewardService && typeof rewardService.getAdapterInfo === 'function'
            ? rewardService.getAdapterInfo()
            : null;
          const analyticsInfo = analyticsService && typeof analyticsService.getAdapterInfo === 'function'
            ? analyticsService.getAdapterInfo()
            : null;
          return {
          saveVersion:storageService ? storageService.version : null,
          storagePersistent:storageService ? storageService.isPersistent() : null,
          persistenceMode:storageService && typeof storageService.getPersistenceMode === 'function'
            ? storageService.getPersistenceMode()
            : null,
          persistenceDiagnostic:storageService && typeof storageService.getDiagnostics === 'function'
            ? storageService.getDiagnostics()
            : null,
          tuningActive:isTuningActive(),
          mode:getCurrentMode(),
          arena:getArenaLabel(getCurrentArena()),
          playerTop:tops[getPlayerTopId()] ? tops[getPlayerTopId()].id : null,
          enemyTop:tops[getEnemyTopId()] ? tops[getEnemyTopId()].id : null,
          enemyPreset:getCurrentEnemyPresetId(),
          enemyPresetLabel:getCurrentEnemyPresetLabel(),
          challengeNode:getCurrentMode()==='challenge' && getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
          battlePerf:getBattlePerfMetrics(),
          battlePerformanceMode:getBattlePerformanceMode(),
          challengeUnlockedNodeIndex:getSave().challenge ? getSave().challenge.unlockedNodeIndex : 0,
          challengeCheckpointNodeIndex:getSave().challenge ? (getSave().challenge.checkpointNodeIndex || 0) : 0,
          challengeUnlockedRankIndex:getUnlockedRoadRankIndex(),
          challengeSelectedRankIndex:getSelectedRoadRankIndex(),
          challengeSelectedRankLabel:getCurrentRoadRank() ? getCurrentRoadRank().label : null,
          researchLevels:getSave().research && getSave().research.levels ? getSave().research.levels : {},
          researchBonuses:getResearchBonuses(),
          unlockedArenas:getSave().unlocks ? getSave().unlocks.arenas : [],
          unlockedTops:getSave().unlocks ? getSave().unlocks.tops : [],
          trialArenas:Array.from(getSessionTrialArenaIds()),
          currency:getSave().currency,
          tuningSummary:buildTuningSummary(),
          economyWinBase:economy.rewards ? economy.rewards.winBase : null,
          economyLossBase:economy.rewards ? economy.rewards.lossBase : null,
          economyChallengeWinBase:economy.rewards ? economy.rewards.challengeWinBase : null,
          economyChallengeLossBase:economy.rewards ? economy.rewards.challengeLossBase : null,
          economyDoubleRewardMultiplier:economy.rewards ? economy.rewards.doubleRewardMultiplier : null,
          economyDefaultRoundTimer:economy.runtime ? economy.runtime.defaultRoundTimer : null,
          economyChallengeContinueEnabled:economy.runtime ? economy.runtime.challengeContinueEnabled : null,
          economyChallengeContinueLimit:economy.runtime ? economy.runtime.challengeContinueLimit : null,
          rewardMockMode:rewardService && typeof rewardService.getMockMode === 'function'
            ? rewardService.getMockMode()
            : null,
          rewardAdapter:rewardInfo
            ? rewardInfo.adapter
            : null,
          rewardEnabled:rewardInfo
            ? rewardInfo.rewardEnabled
            : null,
          rewardReady:rewardInfo
            ? rewardInfo.ready
            : null,
          rewardLoading:rewardInfo
            ? rewardInfo.loading
            : null,
          rewardAvailabilityReason:rewardInfo
            ? rewardInfo.lastAvailabilityReason
            : null,
          rewardAllowedPlacements:rewardInfo && Array.isArray(rewardInfo.allowedPlacements)
            ? rewardInfo.allowedPlacements.slice()
            : [],
          rewardedAdUnitConfigured:rewardInfo
            ? rewardInfo.rewardedAdUnitConfigured
            : null,
          analyticsAdapter:analyticsInfo
            ? analyticsInfo.adapter
            : null,
          analyticsForwardingEnabled:analyticsInfo
            ? analyticsInfo.forwardingEnabled
            : null,
          analyticsReady:analyticsInfo
            ? analyticsInfo.ready
            : null,
          analyticsLoading:analyticsInfo
            ? analyticsInfo.loading
            : null,
          analyticsForwardReason:analyticsInfo
            ? analyticsInfo.lastForwardReason
            : null,
          analyticsInitialized:analyticsInfo
            ? analyticsInfo.initialized
            : null,
          analyticsQueuedEvents:analyticsInfo
            ? analyticsInfo.queuedEvents
            : null,
          rewardRequestReason:rewardInfo
            ? rewardInfo.lastRequestReason
            : null,
          rewardActivePlacement:rewardInfo
            ? rewardInfo.activePlacement
            : null,
          analyticsCount:analyticsService ? analyticsService.list().length : 0,
          lastAnalyticsEvent:analyticsService && analyticsService.list().length
            ? analyticsService.list()[analyticsService.list().length - 1].name
            : null
        };
        },[
          { label:'+200 SCRAP', run(){ addCurrency(200); return 'SCRAP ADDED'; } },
          { label:'UNLOCK HEX', run(){ unlockArenaById('hex_bowl'); return 'HEX UNLOCKED'; } },
          { label:'UNLOCK TRICK', run(){ unlockTopById('trick'); return 'TRICK UNLOCKED'; } },
          { label:'UNLOCK BREAKER', run(){ unlockTopById('impact_breaker'); return 'BREAKER UNLOCKED'; } },
          { label:'UNLOCK RAIDER', run(){ unlockTopById('trick_raider'); return 'RAIDER UNLOCKED'; } },
          { label:'RANK II', run(){ return prepareRoadRank(1); } },
          { label:'RANK III', run(){ return prepareRoadRank(2); } },
          { label:'NODE 4', run(){ setChallengeProgress(3); return 'SET TO NODE 4'; } },
          { label:'FINAL NODE', run(){ setChallengeProgress(9); return 'SET TO FINAL NODE'; } },
          { label:'COPY PROGRESSION', run(){
            return copyText(JSON.stringify(buildProgressionSnapshot(), null, 2)).then(()=> 'PROGRESSION COPIED');
          } },
          { label:'COPY RUNTIME', run(){
            return copyText(JSON.stringify(buildRuntimeSnapshot(), null, 2)).then(()=> 'RUNTIME COPIED');
          } },
          { label:'COPY SAVE', run(){ return copyText(storageService ? storageService.export() : JSON.stringify(getSave(), null, 2)).then(()=> 'SAVE COPIED'); } },
          { label:'IMPORT SAVE', run(){
            if(!storageService || typeof storageService.import !== 'function'){
              return 'IMPORT UNAVAILABLE';
            }
            const raw = promptImportText();
            if(!raw){
              return 'IMPORT CANCELLED';
            }
            storageService.import(raw);
            syncAfterReset();
            return 'SAVE IMPORTED';
          } },
          { label:'COPY EVENTS', run(){
            const events = analyticsService && typeof analyticsService.list === 'function'
              ? analyticsService.list()
              : [];
            return copyText(JSON.stringify(events, null, 2)).then(()=> 'EVENTS COPIED');
          } },
          { label:'COPY TUNING', run(){
            return copyText(JSON.stringify(buildTuningSnapshot(), null, 2)).then(()=> 'TUNING COPIED');
          } },
          { label:'IMPORT TUNING', run(){
            const raw = promptImportText('Paste tuning JSON');
            if(!raw){
              return 'IMPORT CANCELLED';
            }
            applyTuningPatch(raw);
            return 'TUNING APPLIED';
          } },
          { label:'RESET TUNING', run(){
            resetTuning();
            return 'TUNING RESET';
          } },
          { label:'COPY PROVIDERS', run(){
            const providerSnapshot = {
              reward:rewardService && typeof rewardService.getAdapterInfo === 'function'
                ? rewardService.getAdapterInfo()
                : null,
              analytics:analyticsService && typeof analyticsService.getAdapterInfo === 'function'
                ? analyticsService.getAdapterInfo()
                : null
            };
            return copyText(JSON.stringify(providerSnapshot, null, 2)).then(()=> 'PROVIDERS COPIED');
          } },
          { label:'REWARD GRANT', run(){
            if(!rewardService || typeof rewardService.setMockMode !== 'function'){
              return 'REWARD MODE UNAVAILABLE';
            }
            rewardService.setMockMode('grant');
            return 'REWARD MODE: GRANT';
          } },
          { label:'REWARD DENY', run(){
            if(!rewardService || typeof rewardService.setMockMode !== 'function'){
              return 'REWARD MODE UNAVAILABLE';
            }
            rewardService.setMockMode('deny');
            return 'REWARD MODE: DENY';
          } },
          { label:'REWARD ERROR', run(){
            if(!rewardService || typeof rewardService.setMockMode !== 'function'){
              return 'REWARD MODE UNAVAILABLE';
            }
            rewardService.setMockMode('error');
            return 'REWARD MODE: ERROR';
          } },
          { label:'CLEAR EVENTS', run(){
            if(analyticsService && typeof analyticsService.clear === 'function'){
              analyticsService.clear();
            }
            return 'ANALYTICS CLEARED';
          } },
          { label:'MOCK SHARE', run(){
            if(!shareService || typeof shareService.share !== 'function'){
              return Promise.resolve('SHARE UNAVAILABLE');
            }
            return shareService.share({
              kind:'debug',
              mode:getCurrentMode(),
              result:'debug',
              arenaId:(arenas[getCurrentArena()] && arenas[getCurrentArena()].id) || null,
              arenaLabel:getArenaLabel(getCurrentArena()),
              playerTop:tops[getPlayerTopId()] ? tops[getPlayerTopId()].id : null,
              enemyTop:tops[getEnemyTopId()] ? tops[getEnemyTopId()].id : null,
              challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null,
              title:'Spin Clash Debug Share',
              text:'Spin Clash debug share surface'
            }).then(()=> 'MOCK SHARE TRIGGERED');
          } },
          { label:'COPY SHARE SVG', run(){
            if(!shareService || typeof shareService.buildResultCard !== 'function'){
              return Promise.resolve('SHARE SVG UNAVAILABLE');
            }
            const artifact = shareService.buildResultCard(buildDebugResultSharePayload());
            if(!artifact || !artifact.text){
              return Promise.resolve('SHARE SVG UNAVAILABLE');
            }
            return copyText(artifact.text).then(()=> 'SHARE SVG COPIED');
          } },
          { label:'DOWNLOAD SHARE SVG', run(){
            if(!shareService || typeof shareService.downloadResultCard !== 'function'){
              return Promise.resolve('SHARE SVG DOWNLOAD UNAVAILABLE');
            }
            return shareService.downloadResultCard(buildDebugResultSharePayload()).then((downloaded)=>{
              return downloaded ? 'SHARE SVG DOWNLOADED' : 'SHARE SVG DOWNLOAD FAILED';
            });
          } },
          { label:'MOCK REWARD', run(){
            if(!rewardService || typeof rewardService.request !== 'function'){
              return Promise.resolve('REWARD UNAVAILABLE');
            }
            return rewardService.request('double_reward',{
              source:'debug_panel',
              mode:getCurrentMode()
            }).then((result)=>{
              if(typeof rewardService.wasGranted === 'function' && !rewardService.wasGranted(result)){
                return 'MOCK REWARD DECLINED';
              }
              return 'MOCK REWARD COMPLETE';
            });
          } },
          { label:'RESET SAVE', run(){ resetDebugProgress(); syncAfterReset(); return 'SAVE RESET'; } }
        ]);
      }
      installSessionLifecycle();
      return unlockedNodeIndex;
    }

    return {
      syncDebugPanel,
      renderGameToText,
      advanceTime,
      buildProgressionSnapshot,
      buildRuntimeSnapshot,
      buildTuningSnapshot,
      applyTuningPatch,
      resetTuning,
      initRuntimeDebug
    };
  };
})();
