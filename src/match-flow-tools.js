(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createMatchFlowTools = function createMatchFlowTools(options){
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const challengeRoad = options.challengeRoad || [];
    const rewardService = options.rewardService || null;
    const shareService = options.shareService || null;
    const analyticsService = options.analyticsService || null;
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const getRound = typeof options.getRound === 'function' ? options.getRound : function(){ return 1; };
    const setScore = typeof options.setScore === 'function' ? options.setScore : function(){};
    const setRound = typeof options.setRound === 'function' ? options.setRound : function(){};
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const setActiveChallengeIndex = typeof options.setActiveChallengeIndex === 'function' ? options.setActiveChallengeIndex : function(){};
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getEnemyTopId = typeof options.getEnemyTopId === 'function' ? options.getEnemyTopId : function(){ return 0; };
    const getActiveModifier = typeof options.getActiveModifier === 'function' ? options.getActiveModifier : function(){ return { id:'standard' }; };
    const getCurrentChallengeNode = typeof options.getCurrentChallengeNode === 'function' ? options.getCurrentChallengeNode : function(){ return null; };
    const getArenaLabel = typeof options.getArenaLabel === 'function' ? options.getArenaLabel : function(){ return 'ARENA'; };
    const getArenaConfig = typeof options.getArenaConfig === 'function' ? options.getArenaConfig : function(){ return { id:'unknown_arena' }; };
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return { currency:0, challenge:{ unlockedNodeIndex:0 } }; };
    const saveProgress = typeof options.saveProgress === 'function' ? options.saveProgress : function(mutator){ return mutator(getSave()); };
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

    function getBaseReward(){
      const score = getScore();
      return score[0] >= 2
        ? 20 + (getCurrentMode()==='challenge' && getCurrentChallengeNode() ? getCurrentChallengeNode().reward : 0)
        : 8;
    }

    function grantMatchReward(multiplier){
      if(getRoundRewardGranted()) return;
      const score = getScore();
      const delta = getBaseReward() * (multiplier || 1);
      const currentArena = getArenaConfig(getCurrentArena());
      const saveBefore = getSave();
      const unlockedArenaIdsBefore = saveBefore.unlocks && Array.isArray(saveBefore.unlocks.arenas)
        ? saveBefore.unlocks.arenas
        : [];
      const unlockedTopIdsBefore = saveBefore.unlocks && Array.isArray(saveBefore.unlocks.tops)
        ? saveBefore.unlocks.tops
        : [];
      const currentNode = getCurrentChallengeNode();
      const unlockTopId = currentNode && currentNode.unlockTopId ? currentNode.unlockTopId : null;
      const unlockTop = unlockTopId ? tops.find((top)=>top.id===unlockTopId) : null;
      const shouldTrackArenaUnlock = getCurrentMode()==='challenge'
        && score[0] >= 2
        && currentArena
        && currentArena.id
        && !unlockedArenaIdsBefore.includes(currentArena.id);
      const shouldTrackTopUnlock = getCurrentMode()==='challenge'
        && score[0] >= 2
        && unlockTop
        && !unlockedTopIdsBefore.includes(unlockTop.id);
      const save = saveProgress((draft)=>{
        draft.currency += delta;
        if(getCurrentMode()==='challenge' && score[0] >= 2){
          const activeChallengeIndex = getActiveChallengeIndex();
          draft.challenge = draft.challenge || { unlockedNodeIndex:0, completedNodes:[] };
          draft.challenge.lastNodeIndex = activeChallengeIndex;
          draft.challenge.completedNodes = Array.isArray(draft.challenge.completedNodes) ? draft.challenge.completedNodes : [];
          if(!draft.challenge.completedNodes.includes(activeChallengeIndex)){
            draft.challenge.completedNodes.push(activeChallengeIndex);
          }
          draft.challenge.unlockedNodeIndex = Math.max(draft.challenge.unlockedNodeIndex || 0, Math.min(activeChallengeIndex + 1, challengeRoad.length - 1));
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
          nodeIndex:getActiveChallengeIndex(),
          nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null
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
          nodeIndex:getActiveChallengeIndex(),
          nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null
        });
      }
      setRoundRewardGranted(true);
      updateModeUI();
      showMsg(
        shouldTrackTopUnlock
          ? (unlockTop.name+' '+uiText.unlockTopReward)
          : ('+'+delta+' '+uiText.currencyLabel),
        1.2
      );
      updateCurrencyUI();
      syncDebugPanel();
    }

    function showMatchResult(){
      const score = getScore();
      const currentMode = getCurrentMode();
      const activeChallengeIndex = getActiveChallengeIndex();
      const currentNode = getCurrentChallengeNode();
      const won = score[0] >= 2;
      const hasNextNode = currentMode==='challenge' && won && activeChallengeIndex < challengeRoad.length-1;
      const reward = getBaseReward();
      const matchStartedAt = getMatchStartedAt();
      const durationSec = matchStartedAt ? Math.max(0, Math.round((Date.now() - matchStartedAt) / 1000)) : null;

      document.getElementById('mt-txt').textContent = won ? 'VICTORY' : 'DEFEAT';
      document.getElementById('mt-txt').style.color = won ? '#00ffcc' : '#ff4422';
      document.getElementById('mt-sub').textContent = score[0]+' - '+score[1];
      document.getElementById('mt-meta').textContent = (currentMode==='challenge' ? 'CHALLENGE ROAD' : 'QUICK BATTLE')+' - Reward '+reward+' '+uiText.currencyLabel+(currentMode==='challenge' && currentNode ? ' - Node '+(activeChallengeIndex+1) : '');
      document.getElementById('btn-replay').textContent = currentMode==='challenge'
        ? (won ? (hasNextNode ? uiText.nextNode : uiText.roadClear) : uiText.retryNode)
        : uiText.replay;
      document.getElementById('btn-double-reward').textContent = getDoubleRewardUsed() ? uiText.rewardClaimed : uiText.rewardDouble;
      document.getElementById('btn-double-reward').disabled = getDoubleRewardUsed();
      document.getElementById('btn-double-reward').style.opacity = getDoubleRewardUsed() ? '.5' : '1';
      document.getElementById('btn-continue').style.display = currentMode==='challenge' && !won && !getChallengeContinueUsed() ? '' : 'none';

      grantMatchReward(1);
      document.getElementById('ov-match').classList.remove('hide');
      updateCurrencyUI();

      if(analyticsService){
        analyticsService.track('match_end',{
          mode:currentMode,
          arena:getArenaLabel(getCurrentArena()),
          playerTop:tops[getPlayerTopId()].id,
          enemyTop:tops[getEnemyTopId()].id,
          result:won?'win':'loss',
          endReason:getLastRoundEndReason(),
          roundCount:getRound(),
          durationSec,
          score:{ player:score[0], enemy:score[1] },
          challengeNode:currentMode==='challenge' ? activeChallengeIndex : null,
          modifier:getActiveModifier().id,
          reward
        });
        if(currentMode==='challenge' && !won){
          analyticsService.track('challenge_fail',{
            nodeIndex:activeChallengeIndex,
            nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null
          });
        }else if(currentMode==='challenge' && won){
          analyticsService.track('challenge_clear',{
            nodeIndex:activeChallengeIndex,
            nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
            arena:getArenaLabel(getCurrentArena()),
            reward
          });
        }
      }

      syncDebugPanel();
    }

    function resetMatch(){
      setScore([0,0]);
      setRound(1);
      setChallengeContinueUsed(false);
      setRoundRewardGranted(false);
      setDoubleRewardUsed(false);
      setLastRoundEndReason(null);
      setMatchStartedAt(null);
      document.getElementById('ov-match').classList.add('hide');
      document.getElementById('btn-double-reward').disabled = false;
      document.getElementById('btn-double-reward').style.opacity = '1';
      document.getElementById('btn-double-reward').textContent = uiText.rewardDouble;
      initRound();
    }

    function handleDoubleReward(){
      if(getDoubleRewardUsed() || !rewardService || typeof rewardService.request !== 'function') return;
      rewardService.request('double_reward',{
        mode:getCurrentMode(),
        challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null
      }).then(()=>{
        const delta = getBaseReward();
        saveProgress((save)=>{ save.currency += delta; return save; });
        setDoubleRewardUsed(true);
        document.getElementById('btn-double-reward').disabled = true;
        document.getElementById('btn-double-reward').style.opacity = '.5';
        document.getElementById('btn-double-reward').textContent = uiText.rewardClaimed;
        showMsg('Bonus +'+delta+' '+uiText.currencyLabel,1.2);
        updateCurrencyUI();
        syncDebugPanel();
      });
    }

    function handleContinueReward(){
      const score = getScore();
      if(getCurrentMode()!=='challenge' || getChallengeContinueUsed() || score[0] >= 2 || !rewardService || typeof rewardService.request !== 'function') return;
      rewardService.request('continue_once',{ nodeIndex:getActiveChallengeIndex() }).then(()=>{
        if(analyticsService){
          analyticsService.track('continue_used',{
            nodeIndex:getActiveChallengeIndex(),
            nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null
          });
        }
        setChallengeContinueUsed(true);
        setScore([0,0]);
        setRound(1);
        setLastRoundEndReason(null);
        setMatchStartedAt(null);
        document.getElementById('ov-match').classList.add('hide');
        initRound();
      });
    }

    function handleShare(){
      if(!shareService || typeof shareService.share !== 'function') return;
      const score = getScore();
      const currentArena = getArenaConfig(getCurrentArena());
      shareService.share({
        kind:'result',
        mode:getCurrentMode(),
        result:score[0] >= 2 ? 'win' : 'loss',
        arenaId:currentArena.id || null,
        arenaLabel:getArenaLabel(getCurrentArena()),
        playerTop:tops[getPlayerTopId()] ? tops[getPlayerTopId()].id : null,
        enemyTop:tops[getEnemyTopId()] ? tops[getEnemyTopId()].id : null,
        challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null,
        title:'Spin Clash',
        text:uiText.sharePrefix+': '+(score[0] >= 2 ? 'victory' : 'defeat')+' in '+getArenaLabel(getCurrentArena())+' with '+tops[getPlayerTopId()].name
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

