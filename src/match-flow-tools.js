(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createMatchFlowTools = function createMatchFlowTools(options){
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const challengeRoad = options.challengeRoad || [];
    const roadRanks = options.roadRanks || [];
    const economy = options.economy || {};
    const rewardService = options.rewardService || null;
    const shareService = options.shareService || null;
    const analyticsService = options.analyticsService || null;
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const getRound = typeof options.getRound === 'function' ? options.getRound : function(){ return 1; };
    const setScore = typeof options.setScore === 'function' ? options.setScore : function(){};
    const setRound = typeof options.setRound === 'function' ? options.setRound : function(){};
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getBattleReturnRoute = typeof options.getBattleReturnRoute === 'function' ? options.getBattleReturnRoute : function(){ return 'home'; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getEnemyTopId = typeof options.getEnemyTopId === 'function' ? options.getEnemyTopId : function(){ return 0; };
    const getCurrentEnemyPresetId = typeof options.getCurrentEnemyPresetId === 'function' ? options.getCurrentEnemyPresetId : function(){ return null; };
    const getCurrentEnemyPresetLabel = typeof options.getCurrentEnemyPresetLabel === 'function' ? options.getCurrentEnemyPresetLabel : function(){ return null; };
    const getActiveModifier = typeof options.getActiveModifier === 'function' ? options.getActiveModifier : function(){ return { id:'standard' }; };
    const getCurrentChallengeNode = typeof options.getCurrentChallengeNode === 'function' ? options.getCurrentChallengeNode : function(){ return null; };
    const getArenaLabel = typeof options.getArenaLabel === 'function' ? options.getArenaLabel : function(){ return 'ARENA'; };
    const getArenaConfig = typeof options.getArenaConfig === 'function' ? options.getArenaConfig : function(){ return { id:'unknown_arena' }; };
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return { currency:0, challenge:{ unlockedNodeIndex:0, checkpointNodeIndex:0 } }; };
    const saveProgress = typeof options.saveProgress === 'function' ? options.saveProgress : function(mutator){ return mutator(getSave()); };
    const getSelectedRoadRankIndex = typeof options.getSelectedRoadRankIndex === 'function' ? options.getSelectedRoadRankIndex : function(){ return 0; };
    const getCurrentRoadRank = typeof options.getCurrentRoadRank === 'function'
      ? options.getCurrentRoadRank
      : function(){ return roadRanks[getSelectedRoadRankIndex()] || roadRanks[0] || { id:'rank_i', label:'RANK I', rewardMul:1, enemy:{} }; };
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const updateCurrencyUI = typeof options.updateCurrencyUI === 'function' ? options.updateCurrencyUI : function(){};
    const updateModeUI = typeof options.updateModeUI === 'function' ? options.updateModeUI : function(){};
    const syncDebugPanel = typeof options.syncDebugPanel === 'function' ? options.syncDebugPanel : function(){};
    const initRound = typeof options.initRound === 'function' ? options.initRound : function(){};
    const getChallengeContinueUsed = typeof options.getChallengeContinueUsed === 'function' ? options.getChallengeContinueUsed : function(){ return false; };
    const setChallengeContinueUsed = typeof options.setChallengeContinueUsed === 'function' ? options.setChallengeContinueUsed : function(){};
    const getRoundRewardGranted = typeof options.getRoundRewardGranted === 'function' ? options.getRoundRewardGranted : function(){ return false; };
    const setRoundRewardGranted = typeof options.setRoundRewardGranted === 'function' ? options.setRoundRewardGranted : function(){};
    const getDoubleRewardUsed = typeof options.getDoubleRewardUsed === 'function' ? options.getDoubleRewardUsed : function(){ return false; };
    const setDoubleRewardUsed = typeof options.setDoubleRewardUsed === 'function' ? options.setDoubleRewardUsed : function(){};
    const getLastRoundEndReason = typeof options.getLastRoundEndReason === 'function' ? options.getLastRoundEndReason : function(){ return null; };
    const setLastRoundEndReason = typeof options.setLastRoundEndReason === 'function' ? options.setLastRoundEndReason : function(){};
    const getMatchStartedAt = typeof options.getMatchStartedAt === 'function' ? options.getMatchStartedAt : function(){ return null; };
    const setMatchStartedAt = typeof options.setMatchStartedAt === 'function' ? options.setMatchStartedAt : function(){};
    let lastResultContext = null;
    let resultContextCounter = 0;

    function formatNodeLabel(number){
      return (uiText.battleIntroNodeLabel || uiText.resultNodeLabel || 'NODE')+' '+number;
    }

    function getRewardConfig(){
      return economy.rewards || {};
    }

    function getRuntimeConfig(){
      return economy.runtime || {};
    }

    function getWinBaseReward(){
      const rewards = getRewardConfig();
      return typeof rewards.winBase === 'number' ? rewards.winBase : 20;
    }

    function getLossBaseReward(){
      const rewards = getRewardConfig();
      return typeof rewards.lossBase === 'number' ? rewards.lossBase : 8;
    }

    function getChallengeWinBaseReward(){
      const rewards = getRewardConfig();
      return typeof rewards.challengeWinBase === 'number' ? rewards.challengeWinBase : getWinBaseReward();
    }

    function getChallengeLossBaseReward(){
      const rewards = getRewardConfig();
      return typeof rewards.challengeLossBase === 'number' ? rewards.challengeLossBase : getLossBaseReward();
    }

    function getDoubleRewardMultiplier(){
      const rewards = getRewardConfig();
      return typeof rewards.doubleRewardMultiplier === 'number' ? rewards.doubleRewardMultiplier : 2;
    }

    function isChallengeContinueEnabled(){
      const runtime = getRuntimeConfig();
      return runtime.challengeContinueEnabled !== false && (runtime.challengeContinueLimit || 0) > 0;
    }

    function getChallengeRewardMultiplier(){
      const rank = getCurrentRoadRank();
      return rank && typeof rank.rewardMul === 'number' && isFinite(rank.rewardMul) ? rank.rewardMul : 1;
    }

    function getRewardParts(){
      const score = getScore();
      const currentNode = getCurrentChallengeNode();
      const save = getSave();
      const isChallengeMode = getCurrentMode()==='challenge';
      const completedNodes = save && save.challenge && Array.isArray(save.challenge.completedNodes)
        ? save.challenge.completedNodes
        : [];
      const activeChallengeIndex = getActiveChallengeIndex();
      const won = score[0] >= 2;
      const firstClear = isChallengeMode
        && won
        && currentNode
        && !completedNodes.includes(activeChallengeIndex);
      const base = won
        ? (isChallengeMode ? getChallengeWinBaseReward() : getWinBaseReward())
        : (isChallengeMode ? getChallengeLossBaseReward() : getLossBaseReward());
      const nodeReward = won && isChallengeMode && currentNode ? currentNode.reward : 0;
      const firstClearBonus = (
        firstClear
        && currentNode
        && typeof currentNode.firstClearBonus === 'number'
        && currentNode.firstClearBonus > 0
      ) ? currentNode.firstClearBonus : 0;
      const subtotal = base + nodeReward + firstClearBonus;
      const rewardMul = isChallengeMode ? getChallengeRewardMultiplier() : 1;
      const total = isChallengeMode ? Math.round(subtotal * rewardMul) : subtotal;
      return {
        base,
        nodeReward,
        firstClearBonus,
        firstClear,
        rewardMul,
        subtotal,
        total,
        rankBonusAmount:Math.max(0, total - subtotal)
      };
    }

    function getBaseReward(){
      return getRewardParts().total;
    }

    function createResultContextId(mode){
      resultContextCounter += 1;
      return 'result_'+String(mode || 'match')+'_'+Date.now().toString(36)+'_'+resultContextCounter.toString(36);
    }

    function buildResultContext(){
      const score = getScore();
      const currentMode = getCurrentMode();
      const challengeNodeIndex = currentMode==='challenge' ? getActiveChallengeIndex() : null;
      const currentNode = currentMode==='challenge' ? getCurrentChallengeNode() : null;
      const currentArenaIndex = getCurrentArena();
      const currentArena = getArenaConfig(currentArenaIndex);
      const playerTop = tops[getPlayerTopId()] || { id:null, name:'TOP' };
      const enemyTop = tops[getEnemyTopId()] || { id:null, name:'TOP' };
      const won = score[0] >= 2;
      const save = getSave();
      const challenge = save.challenge || {};
      const rewardParts = getRewardParts();
      const checkpointResumeNodeIndex = currentMode==='challenge'
        && won
        && currentNode
        && currentNode.checkpointOnClear
        ? Math.min(challengeNodeIndex + 1, challengeRoad.length - 1)
        : null;
      const checkpointReached = checkpointResumeNodeIndex != null
        && (challenge.checkpointNodeIndex || 0) < checkpointResumeNodeIndex;
      return {
        resultContextId:createResultContextId(currentMode),
        mode:currentMode,
        result:won ? 'win' : 'loss',
        arenaIndex:currentArenaIndex,
        arenaId:currentArena.id || null,
        arenaLabel:getArenaLabel(currentArenaIndex),
        playerTopId:playerTop.id || null,
        playerTopLabel:playerTop.name || 'TOP',
        enemyTopId:enemyTop.id || null,
        enemyTopLabel:enemyTop.name || 'TOP',
        enemyPresetId:getCurrentEnemyPresetId(),
        enemyPresetLabel:getCurrentEnemyPresetLabel(),
        roadRankIndex:currentMode==='challenge' ? getSelectedRoadRankIndex() : 0,
        roadRankId:currentMode==='challenge' ? getCurrentRoadRank().id : null,
        roadRankLabel:currentMode==='challenge' ? getCurrentRoadRank().label : null,
        roadRankRewardMul:currentMode==='challenge' ? getChallengeRewardMultiplier() : 1,
        challengeNodeIndex,
        challengeNodeId:currentNode ? currentNode.id : null,
        challengeNodeName:currentNode ? currentNode.name : null,
        chapterId:currentNode ? currentNode.chapterId || null : null,
        chapterLabel:currentNode ? currentNode.chapterLabel || null : null,
        tier:currentNode ? currentNode.tier || null : null,
        checkpointOnClear:!!(currentNode && currentNode.checkpointOnClear),
        checkpointReached,
        resumeNodeIndex:checkpointReached ? checkpointResumeNodeIndex : null,
        modifierId:getActiveModifier().id,
        endReason:getLastRoundEndReason(),
        roundCount:getRound(),
        score:{ player:score[0], enemy:score[1] },
        reward:rewardParts.total,
        rewardParts,
        firstClear:rewardParts.firstClear === true,
        hasNextNode:currentMode==='challenge' && won && challengeNodeIndex < challengeRoad.length-1
      };
    }

    function getResultContext(){
      return lastResultContext || buildResultContext();
    }

    function getShareMoment(context){
      if(context.mode==='challenge' && context.result==='win' && context.challengeNodeIndex === challengeRoad.length-1){
        return 'road_clear';
      }
      if(context.result==='win' && context.endReason==='ringout'){
        return 'ring_out';
      }
      if(context.result==='win' && context.score.enemy === 0){
        return 'perfect_win';
      }
      if(context.mode==='challenge' && context.result==='win'){
        return 'challenge_clear';
      }
      if(context.result==='loss' && context.score.player > 0){
        return 'close_loss';
      }
      return context.result==='win' ? 'victory' : 'defeat';
    }

    function formatTemplate(template, values){
      return String(template || '').replace(/\{(\w+)\}/g, function(_, key){
        return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : '';
      });
    }

    function buildShareTitle(moment){
      const shareTitle = uiText.shareTitle || 'Spin Clash';
      const shareMoments = uiText.shareMoments || {};
      return shareMoments[moment] ? (shareTitle+' - '+shareMoments[moment]) : shareTitle;
    }

    function buildShareText(context, moment){
      const templates = uiText.shareTemplates || {};
      const defaults = {
        road_clear:'{title}: cleared the full Challenge Road in {arena} with {top}.',
        challenge_clear:'{title}: cleared Node {node} in {arena} with {top}.',
        ring_out:'{title}: landed a ring-out finish in {arena} with {top}.',
        perfect_win:'{title}: won {scorePlayer}-{scoreEnemy} in {arena} with {top}.',
        close_loss:'{title}: lost {scorePlayer}-{scoreEnemy} in {arena}. Rematch time.',
        victory:'{title}: won in {arena} with {top}.',
        defeat:'{title}: battled in {arena} with {top}.'
      };
      return formatTemplate(templates[moment] || defaults[moment] || defaults.victory, {
        title:uiText.shareTitle || 'Spin Clash',
        arena:context.arenaLabel || 'ARENA',
        top:context.playerTopLabel || 'TOP',
        enemyTop:context.enemyTopLabel || 'TOP',
        node:context.challengeNodeIndex != null ? context.challengeNodeIndex + 1 : '',
        scorePlayer:context.score.player,
        scoreEnemy:context.score.enemy
      });
    }

    function showRewardFailureFeedback(placement, input){
      if(!rewardService || typeof rewardService.getFailureInfo !== 'function'){
        showMsg(uiText.rewardError || 'REWARD FLOW FAILED.', 1.2);
        return;
      }
      const info = rewardService.getFailureInfo(input);
      let message = uiText.rewardError || 'REWARD FLOW FAILED.';
      if(info.category === 'busy'){
        message = uiText.rewardBusy || 'REWARD ALREADY IN PROGRESS.';
      }else if(info.category === 'loading'){
        message = uiText.rewardLoading || 'AD IS LOADING. TRY AGAIN.';
      }else if(info.category === 'unavailable'){
        message = uiText.rewardUnavailable || 'REWARD NOT AVAILABLE RIGHT NOW.';
      }else if(info.category === 'declined'){
        if(placement === 'double_reward'){
          message = uiText.rewardDoubleFail || 'DOUBLE REWARD NOT GRANTED.';
        }else if(placement === 'continue_once'){
          message = uiText.rewardContinueFail || 'CONTINUE NOT GRANTED.';
        }else{
          message = uiText.rewardDeclined || 'NO REWARD WAS GRANTED.';
        }
      }
      showMsg(message, 1.2);
    }

    function getEndReasonLabel(reason){
      if(reason === 'ringout') return uiText.roundReasonRingOut || 'RING OUT';
      if(reason === 'spinout') return uiText.roundReasonSpinOut || 'SPIN OUT';
      if(reason === 'hpout') return uiText.roundReasonHpBreak || 'HP BREAK';
      if(reason === 'time') return uiText.roundReasonTimeUp || 'TIME UP';
      return String(reason || 'STANDARD').replace(/_/g, ' ').toUpperCase();
    }

    function buildBreakdownText(context){
      const parts = [];
      const rewardParts = context.rewardParts || {};
      parts.push((uiText.resultBreakdownBase || 'BASE')+' '+(rewardParts.base || 0));
      if(context.mode === 'challenge'){
        parts.push((uiText.resultBreakdownNode || 'NODE')+' '+(rewardParts.nodeReward || 0));
        if((rewardParts.firstClearBonus || 0) > 0){
          parts.push((uiText.resultBreakdownFirstClear || 'FIRST CLEAR')+' '+rewardParts.firstClearBonus);
        }
        if((rewardParts.rankBonusAmount || 0) > 0){
          parts.push((uiText.resultBreakdownRank || 'RANK BONUS')+' +'+rewardParts.rankBonusAmount);
        }
      }
      return parts.join(' - ');
    }

    function buildNextText(context){
      if(context.mode === 'challenge'){
        if(context.result === 'win'){
          if(context.hasNextNode){
            return (uiText.resultNextNodeLabel || 'Next')+': '+formatNodeLabel(context.challengeNodeIndex + 2);
          }
          return (uiText.resultRoadLabel || 'Road')+': '+(uiText.roadClear || 'ROAD CLEAR');
        }
        return (uiText.resultRetryLabel || 'Retry')+': '+formatNodeLabel(context.challengeNodeIndex + 1);
      }
      return (uiText.resultArenaLabel || 'Arena')+': '+(context.arenaLabel || 'ARENA');
    }

    function getResultReturnLabel(){
      const route = getBattleReturnRoute();
      if(route === 'path'){
        return uiText.resultReturnToPath || 'RETURN TO PATH';
      }
      if(route === 'quick'){
        return uiText.resultReturnToQuick || 'RETURN TO QUICK';
      }
      return uiText.resultReturnToHome || 'RETURN HOME';
    }

    function getResultAdjustLabel(){
      const route = getBattleReturnRoute();
      if(route === 'path'){
        return uiText.resultAdjustPath || uiText.rematch || 'CHANGE TOP';
      }
      if(route === 'quick'){
        return uiText.resultAdjustQuick || uiText.rematch || 'CHANGE TOP';
      }
      return uiText.resultAdjustHome || uiText.rematch || 'CHANGE TOP';
    }

    function grantMatchReward(multiplier){
      if(getRoundRewardGranted()) return;
      const score = getScore();
      const delta = getBaseReward() * (multiplier || 1);
      const clearedChallengeIndex = getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null;
      const currentArena = getArenaConfig(getCurrentArena());
      const saveBefore = getSave();
      const unlockedArenaIdsBefore = saveBefore.unlocks && Array.isArray(saveBefore.unlocks.arenas)
        ? saveBefore.unlocks.arenas
        : [];
      const unlockedTopIdsBefore = saveBefore.unlocks && Array.isArray(saveBefore.unlocks.tops)
        ? saveBefore.unlocks.tops
        : [];
      const currentNode = getCurrentChallengeNode();
      const checkpointNodeIndex = currentNode && currentNode.checkpointOnClear
        ? Math.min(clearedChallengeIndex + 1, challengeRoad.length - 1)
        : null;
      const selectedRoadRankIndex = getSelectedRoadRankIndex();
      const currentRoadRank = getCurrentRoadRank();
      const nextRoadRank = roadRanks[selectedRoadRankIndex + 1] || null;
      const rewardTopId = currentRoadRank && currentRoadRank.rewardTopId ? currentRoadRank.rewardTopId : null;
      const rewardTop = rewardTopId ? tops.find((top)=>top.id===rewardTopId) : null;
      const unlockTopId = currentNode && currentNode.unlockTopId ? currentNode.unlockTopId : null;
      const unlockTop = unlockTopId ? tops.find((top)=>top.id===unlockTopId) : null;
      const previousCheckpointNodeIndex = saveBefore.challenge && typeof saveBefore.challenge.checkpointNodeIndex === 'number'
        ? saveBefore.challenge.checkpointNodeIndex
        : 0;
      const shouldTrackArenaUnlock = getCurrentMode()==='challenge'
        && score[0] >= 2
        && currentArena
        && currentArena.id
        && !unlockedArenaIdsBefore.includes(currentArena.id);
      const shouldTrackTopUnlock = getCurrentMode()==='challenge'
        && score[0] >= 2
        && unlockTop
        && !unlockedTopIdsBefore.includes(unlockTop.id);
      const shouldTrackRankRewardTopUnlock = getCurrentMode()==='challenge'
        && score[0] >= 2
        && clearedChallengeIndex === challengeRoad.length - 1
        && rewardTop
        && !unlockedTopIdsBefore.includes(rewardTop.id);
      const shouldTrackCheckpoint = getCurrentMode()==='challenge'
        && score[0] >= 2
        && checkpointNodeIndex != null
        && previousCheckpointNodeIndex < checkpointNodeIndex;
      const shouldUnlockNextRoadRank = getCurrentMode()==='challenge'
        && score[0] >= 2
        && clearedChallengeIndex === challengeRoad.length - 1
        && nextRoadRank
        && ((saveBefore.challenge && saveBefore.challenge.unlockedRankIndex) || 0) <= selectedRoadRankIndex;
      const save = saveProgress((draft)=>{
        draft.currency += delta;
        if(getCurrentMode()==='challenge' && score[0] >= 2){
          draft.challenge = draft.challenge || { unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], unlockedRankIndex:0, selectedRankIndex:0 };
          draft.challenge.lastNodeIndex = clearedChallengeIndex;
          draft.challenge.completedNodes = Array.isArray(draft.challenge.completedNodes) ? draft.challenge.completedNodes : [];
          if(!draft.challenge.completedNodes.includes(clearedChallengeIndex)){
            draft.challenge.completedNodes.push(clearedChallengeIndex);
          }
          draft.challenge.unlockedNodeIndex = Math.max(draft.challenge.unlockedNodeIndex || 0, Math.min(clearedChallengeIndex + 1, challengeRoad.length - 1));
          draft.challenge.checkpointNodeIndex = typeof draft.challenge.checkpointNodeIndex === 'number'
            ? draft.challenge.checkpointNodeIndex
            : 0;
          draft.challenge.unlockedRankIndex = typeof draft.challenge.unlockedRankIndex === 'number'
            ? draft.challenge.unlockedRankIndex
            : 0;
          draft.challenge.selectedRankIndex = typeof draft.challenge.selectedRankIndex === 'number'
            ? draft.challenge.selectedRankIndex
            : 0;
          if(checkpointNodeIndex != null){
            draft.challenge.checkpointNodeIndex = Math.max(draft.challenge.checkpointNodeIndex, checkpointNodeIndex);
          }
          if(shouldUnlockNextRoadRank){
            draft.challenge.unlockedRankIndex = Math.max(draft.challenge.unlockedRankIndex, selectedRoadRankIndex + 1);
          }
          draft.unlocks = draft.unlocks || { arenas:[], tops:[] };
          draft.unlocks.arenas = Array.isArray(draft.unlocks.arenas) ? draft.unlocks.arenas : [];
          draft.unlocks.tops = Array.isArray(draft.unlocks.tops) ? draft.unlocks.tops : [];
          const currentArenaId = getArenaConfig(getCurrentArena()).id;
          if(!draft.unlocks.arenas.includes(currentArenaId)){
            draft.unlocks.arenas.push(currentArenaId);
          }
          if(unlockTop && !draft.unlocks.tops.includes(unlockTop.id)){
            draft.unlocks.tops.push(unlockTop.id);
          }
          if(shouldTrackRankRewardTopUnlock && rewardTop && !draft.unlocks.tops.includes(rewardTop.id)){
            draft.unlocks.tops.push(rewardTop.id);
          }
        }
        return draft;
      });
      if(getCurrentMode()==='challenge' && score[0] >= 2 && save.challenge){
        setActiveChallengeIndex(save.challenge.unlockedNodeIndex || getActiveChallengeIndex());
      }
      if(analyticsService && shouldTrackArenaUnlock){
        analyticsService.track('unlock_grant',{
          kind:'arena',
          grantType:'challenge_clear',
          source:'challenge_road',
          mode:getCurrentMode(),
          arenaId:currentArena.id,
          arenaLabel:currentArena.label || getArenaLabel(getCurrentArena()),
          nodeIndex:clearedChallengeIndex,
          nodeId:currentNode ? currentNode.id : null
        });
      }
      if(analyticsService && shouldTrackTopUnlock){
        analyticsService.track('unlock_grant',{
          kind:'top',
          grantType:'challenge_clear',
          source:'challenge_road',
          mode:getCurrentMode(),
          topId:unlockTop.id,
          topLabel:unlockTop.name,
          nodeIndex:clearedChallengeIndex,
          nodeId:currentNode ? currentNode.id : null
        });
      }
      if(analyticsService && shouldTrackRankRewardTopUnlock){
        analyticsService.track('unlock_grant',{
          kind:'top',
          grantType:'challenge_clear',
          source:'challenge_road_rank',
          mode:getCurrentMode(),
          topId:rewardTop.id,
          topLabel:rewardTop.name,
          roadRankIndex:selectedRoadRankIndex,
          roadRankId:currentRoadRank ? currentRoadRank.id || null : null,
          roadRankLabel:currentRoadRank ? currentRoadRank.label || null : null,
          nodeIndex:clearedChallengeIndex,
          nodeId:currentNode ? currentNode.id : null
        });
      }
      if(analyticsService && shouldTrackCheckpoint){
        analyticsService.track('championship_checkpoint',{
          nodeIndex:clearedChallengeIndex,
          nodeId:currentNode ? currentNode.id : null,
          chapterId:currentNode ? currentNode.chapterId || null : null,
          chapterLabel:currentNode ? currentNode.chapterLabel || null : null,
          tier:currentNode ? currentNode.tier || null : null,
          resumeNodeIndex:checkpointNodeIndex,
          roadRankIndex:selectedRoadRankIndex,
          roadRankId:currentRoadRank ? currentRoadRank.id || null : null,
          roadRankLabel:currentRoadRank ? currentRoadRank.label || null : null
        });
      }
      if(analyticsService && shouldUnlockNextRoadRank){
        analyticsService.track('road_rank_unlock',{
          mode:getCurrentMode(),
          fromRankIndex:selectedRoadRankIndex,
          fromRankId:currentRoadRank ? currentRoadRank.id || null : null,
          fromRankLabel:currentRoadRank ? currentRoadRank.label || null : null,
          toRankIndex:selectedRoadRankIndex + 1,
          toRankId:nextRoadRank.id,
          toRankLabel:nextRoadRank.label,
          challengeNode:clearedChallengeIndex,
          challengeNodeId:currentNode ? currentNode.id : null
        });
      }
      setRoundRewardGranted(true);
      updateModeUI();
      showMsg(
        shouldTrackRankRewardTopUnlock
          ? (rewardTop.name+' '+uiText.unlockTopReward)
          : (shouldTrackTopUnlock
            ? (unlockTop.name+' '+uiText.unlockTopReward)
            : (shouldUnlockNextRoadRank
              ? (nextRoadRank.label+' '+(uiText.roadRankUnlocked || 'UNLOCKED'))
              : ('+'+delta+' '+uiText.currencyLabel))),
        1.2
      );
      updateCurrencyUI();
      syncDebugPanel();
    }

    function showMatchResult(){
      const resultContext = buildResultContext();
      lastResultContext = resultContext;
      const currentMode = resultContext.mode;
      const activeChallengeIndex = resultContext.challengeNodeIndex;
      const won = resultContext.result === 'win';
      const hasNextNode = resultContext.hasNextNode;
      const reward = resultContext.reward;
      const matchStartedAt = getMatchStartedAt();
      const durationSec = matchStartedAt ? Math.max(0, Math.round((Date.now() - matchStartedAt) / 1000)) : null;
      const msgTxt = document.getElementById('msg-txt');
      const roundOverlay = document.getElementById('ov-round');
      if(roundOverlay){
        roundOverlay.classList.add('hide');
      }
      if(msgTxt){
        msgTxt.style.opacity = '0';
        msgTxt.textContent = '';
      }

      const matchKicker = document.getElementById('mt-kicker');
      if(matchKicker){
        matchKicker.textContent = won
          ? (uiText.shareMoments && uiText.shareMoments.victory) || 'VICTORY'
          : (uiText.shareMoments && uiText.shareMoments.defeat) || 'DEFEAT';
      }
      document.getElementById('mt-txt').textContent = won
        ? (uiText.shareCardVictory || 'VICTORY')
        : (uiText.shareCardDefeat || 'DEFEAT');
      document.getElementById('mt-txt').style.color = won ? '#00ffcc' : '#ff4422';
      document.getElementById('mt-sub').textContent = resultContext.score.player+' - '+resultContext.score.enemy;
      document.getElementById('mt-meta').textContent = (currentMode==='challenge'
        ? (uiText.challengeMode || 'CHAMPIONSHIP PATH')
        : (uiText.quickMode || 'QUICK BATTLE'))
        +(currentMode==='challenge' && resultContext.roadRankLabel ? ' - '+resultContext.roadRankLabel : '')
        +' - '+(uiText.resultArenaLabel || 'Arena')+' '+resultContext.arenaLabel
        +(currentMode==='challenge' && resultContext.challengeNodeId ? ' - '+formatNodeLabel(activeChallengeIndex+1) : '')
        +' - '+(uiText.resultReasonLabel || 'Finish')+' '+getEndReasonLabel(resultContext.endReason);
      document.getElementById('mt-breakdown').textContent = buildBreakdownText(resultContext)+' - '+(uiText.resultRewardLabel || 'Reward')+' '+reward+' '+uiText.currencyLabel;
      document.getElementById('mt-next').textContent = buildNextText(resultContext);
      grantMatchReward(1);
      if(msgTxt){
        msgTxt.style.opacity = '0';
        msgTxt.textContent = '';
      }
      document.getElementById('btn-replay').textContent = getResultReturnLabel();
      document.getElementById('btn-swap-rematch').textContent = getResultAdjustLabel();
      document.getElementById('btn-double-reward').textContent = getDoubleRewardUsed() ? uiText.rewardClaimed : uiText.rewardDouble;
      document.getElementById('btn-double-reward').disabled = getDoubleRewardUsed();
      document.getElementById('btn-double-reward').style.opacity = getDoubleRewardUsed() ? '.5' : '1';
      const continueVisible = currentMode==='challenge' && !won && isChallengeContinueEnabled() && !getChallengeContinueUsed();
      document.getElementById('btn-continue').style.display = continueVisible ? '' : 'none';
      document.getElementById('ov-match').classList.remove('hide');
      updateCurrencyUI();

      if(analyticsService){
        analyticsService.track('match_end',{
          result_context_id:resultContext.resultContextId,
          mode:resultContext.mode,
          arena:resultContext.arenaLabel,
          arenaId:resultContext.arenaId,
          playerTop:resultContext.playerTopId,
          playerTopLabel:resultContext.playerTopLabel,
          enemyTop:resultContext.enemyTopId,
          enemyTopLabel:resultContext.enemyTopLabel,
          enemyPresetId:resultContext.enemyPresetId,
          enemyPresetLabel:resultContext.enemyPresetLabel,
          roadRankId:resultContext.roadRankId,
          roadRankLabel:resultContext.roadRankLabel,
          chapterId:resultContext.chapterId,
          chapterLabel:resultContext.chapterLabel,
          tier:resultContext.tier,
          checkpointOnClear:resultContext.checkpointOnClear,
          result:resultContext.result,
          endReason:resultContext.endReason,
          roundCount:resultContext.roundCount,
          durationSec,
          score:resultContext.score,
          challengeNode:resultContext.mode==='challenge' ? resultContext.challengeNodeIndex : null,
          challengeNodeId:resultContext.mode==='challenge' ? resultContext.challengeNodeId : null,
          modifier:resultContext.modifierId,
          reward
        });
        if(currentMode==='challenge' && !won){
          analyticsService.track('challenge_fail',{
            result_context_id:resultContext.resultContextId,
            nodeIndex:resultContext.challengeNodeIndex,
            nodeId:resultContext.challengeNodeId
          });
        }else if(currentMode==='challenge' && won){
          analyticsService.track('challenge_clear',{
            result_context_id:resultContext.resultContextId,
            nodeIndex:resultContext.challengeNodeIndex,
            nodeId:resultContext.challengeNodeId,
            chapterId:resultContext.chapterId,
            chapterLabel:resultContext.chapterLabel,
            tier:resultContext.tier,
            arena:resultContext.arenaLabel,
            roadRankId:resultContext.roadRankId,
            roadRankLabel:resultContext.roadRankLabel,
            checkpointReached:resultContext.checkpointReached,
            resumeNodeIndex:resultContext.resumeNodeIndex,
            firstClear:resultContext.firstClear,
            reward,
            rewardBase:resultContext.rewardParts.base,
            rewardNode:resultContext.rewardParts.nodeReward,
            rewardFirstClearBonus:resultContext.rewardParts.firstClearBonus,
            rewardRankBonus:resultContext.rewardParts.rankBonusAmount
          });
        }
        if(!getDoubleRewardUsed()){
          analyticsService.track('reward_offer_show',{
            placement:'double_reward',
            source:'match_result',
            mode:resultContext.mode,
            arenaId:resultContext.arenaId,
            challengeNode:resultContext.mode==='challenge' ? resultContext.challengeNodeIndex : null,
            challengeNodeId:resultContext.mode==='challenge' ? resultContext.challengeNodeId : null,
            result_context_id:resultContext.resultContextId
          });
        }
        if(continueVisible){
          analyticsService.track('reward_offer_show',{
            placement:'continue_once',
            source:'match_result',
            mode:resultContext.mode,
            arenaId:resultContext.arenaId,
            challengeNode:resultContext.challengeNodeIndex,
            challengeNodeId:resultContext.challengeNodeId,
            result_context_id:resultContext.resultContextId
          });
        }
      }

      syncDebugPanel();
    }

    function resetMatch(options){
      const resetOptions = options || {};
      setScore([0,0]);
      setRound(1);
      setChallengeContinueUsed(false);
      setRoundRewardGranted(false);
      setDoubleRewardUsed(false);
      setLastRoundEndReason(null);
      setMatchStartedAt(null);
      lastResultContext = null;
      document.getElementById('ov-match').classList.add('hide');
      document.getElementById('btn-double-reward').disabled = false;
      document.getElementById('btn-double-reward').style.opacity = '1';
      document.getElementById('btn-double-reward').textContent = uiText.rewardDouble;
      if(resetOptions.skipInitRound !== true){
        initRound();
      }
    }

    function handleDoubleReward(){
      if(getDoubleRewardUsed() || !rewardService || typeof rewardService.request !== 'function') return;
      const resultContext = getResultContext();
      rewardService.request('double_reward',{
        mode:resultContext.mode,
        challengeNode:resultContext.mode==='challenge' ? resultContext.challengeNodeIndex : null,
        result_context_id:resultContext.resultContextId
      }).then((result)=>{
        if(typeof rewardService.wasGranted === 'function' && !rewardService.wasGranted(result)){
          showRewardFailureFeedback('double_reward', result);
          return;
        }
        const delta = Math.max(0, Math.round(resultContext.reward * (getDoubleRewardMultiplier() - 1)));
        saveProgress((save)=>{ save.currency += delta; return save; });
        setDoubleRewardUsed(true);
        document.getElementById('btn-double-reward').disabled = true;
        document.getElementById('btn-double-reward').style.opacity = '.5';
        document.getElementById('btn-double-reward').textContent = uiText.rewardClaimed;
        showMsg('+'+delta+' '+uiText.currencyLabel,1.2);
        updateCurrencyUI();
        syncDebugPanel();
      }).catch((error)=>{
        showRewardFailureFeedback('double_reward', error);
        syncDebugPanel();
      });
    }

    function handleContinueReward(){
      const score = getScore();
      if(getCurrentMode()!=='challenge' || !isChallengeContinueEnabled() || getChallengeContinueUsed() || score[0] >= 2 || !rewardService || typeof rewardService.request !== 'function') return;
      const resultContext = getResultContext();
      rewardService.request('continue_once',{
        nodeIndex:getActiveChallengeIndex(),
        mode:resultContext.mode,
        challengeNode:resultContext.challengeNodeIndex,
        result_context_id:resultContext.resultContextId
      }).then((result)=>{
        if(typeof rewardService.wasGranted === 'function' && !rewardService.wasGranted(result)){
          showRewardFailureFeedback('continue_once', result);
          return;
        }
        if(analyticsService){
          analyticsService.track('continue_used',{
            nodeIndex:getActiveChallengeIndex(),
            nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
            reward_attempt_id:result && result.reward_attempt_id ? result.reward_attempt_id : null,
            result_context_id:resultContext.resultContextId
          });
        }
        setChallengeContinueUsed(true);
        setScore([0,0]);
        setRound(1);
        setLastRoundEndReason(null);
        setMatchStartedAt(null);
        lastResultContext = null;
        document.getElementById('ov-match').classList.add('hide');
        initRound();
      }).catch((error)=>{
        showRewardFailureFeedback('continue_once', error);
        syncDebugPanel();
      });
    }

    function handleShare(){
      if(!shareService || typeof shareService.share !== 'function') return;
      const resultContext = getResultContext();
      const moment = getShareMoment(resultContext);
      shareService.share({
        kind:'result',
        mode:resultContext.mode,
        result:resultContext.result,
        moment,
        arenaId:resultContext.arenaId,
        arenaLabel:resultContext.arenaLabel,
        playerTop:resultContext.playerTopId,
        playerTopLabel:resultContext.playerTopLabel,
        enemyTop:resultContext.enemyTopId,
        enemyTopLabel:resultContext.enemyTopLabel,
        enemyPreset:resultContext.enemyPresetId,
        enemyPresetLabel:resultContext.enemyPresetLabel,
        challengeNode:resultContext.mode==='challenge' ? resultContext.challengeNodeIndex : null,
        scorePlayer:resultContext.score.player,
        scoreEnemy:resultContext.score.enemy,
        title:buildShareTitle(moment),
        text:buildShareText(resultContext, moment)
      });
    }

    return {
      showMatchResult,
      resetMatch,
      getBaseReward,
      grantMatchReward,
      handleDoubleReward,
      handleContinueReward,
      handleShare
    };
  };
})();

