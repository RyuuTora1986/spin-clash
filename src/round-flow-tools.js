(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createRoundFlowTools = function createRoundFlowTools(options){
    const state = options.state || root.state || (root.state = {});
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const economy = options.economy || {};
    const analyticsService = options.analyticsService || null;
    const getResearchBonuses = typeof options.getResearchBonuses === 'function'
      ? options.getResearchBonuses
      : function(){ return { hpMul:1, maxSpinMul:1, brateMul:1 }; };
    const getCurrentRoadRank = typeof options.getCurrentRoadRank === 'function'
      ? options.getCurrentRoadRank
      : function(){ return { enemy:{ hpMul:1, spinMul:1, spdMul:1, massMul:1, brate:1 } }; };
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getCurrentChallengeNode = typeof options.getCurrentChallengeNode === 'function' ? options.getCurrentChallengeNode : function(){ return null; };
    const getModifierById = typeof options.getModifierById === 'function' ? options.getModifierById : function(){ return { id:'standard', player:{}, enemy:{}, rules:{} }; };
    const getArenaLabel = typeof options.getArenaLabel === 'function' ? options.getArenaLabel : function(){ return 'ARENA'; };
    const getArenaConfig = typeof options.getArenaConfig === 'function' ? options.getArenaConfig : function(index){
      return { id:index === 0 ? 'circle_bowl' : 'unknown_arena' };
    };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const setSelectedArenaIndex = typeof options.setSelectedArenaIndex === 'function' ? options.setSelectedArenaIndex : function(){};
    const getEnemyPresetById = typeof options.getEnemyPresetById === 'function' ? options.getEnemyPresetById : function(){ return null; };
    const getCurrentEnemyPresetId = typeof options.getCurrentEnemyPresetId === 'function' ? options.getCurrentEnemyPresetId : function(){ return null; };
    const getCurrentEnemyPresetLabel = typeof options.getCurrentEnemyPresetLabel === 'function' ? options.getCurrentEnemyPresetLabel : function(){ return null; };
    const setCurrentEnemyPresetId = typeof options.setCurrentEnemyPresetId === 'function' ? options.setCurrentEnemyPresetId : function(){};
    const getEnemyTopId = typeof options.getEnemyTopId === 'function' ? options.getEnemyTopId : function(){ return 1; };
    const setEnemyTopId = typeof options.setEnemyTopId === 'function' ? options.setEnemyTopId : function(){};
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getRound = typeof options.getRound === 'function' ? options.getRound : function(){ return 1; };
    const setRound = typeof options.setRound === 'function' ? options.setRound : function(){};
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const setScore = typeof options.setScore === 'function' ? options.setScore : function(){};
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const setTp = typeof options.setTp === 'function' ? options.setTp : function(){};
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const setTe = typeof options.setTe === 'function' ? options.setTe : function(){};
    const getOrbObjects = typeof options.getOrbObjects === 'function' ? options.getOrbObjects : function(){ return []; };
    const getPartPool = typeof options.getPartPool === 'function' ? options.getPartPool : function(){ return []; };
    const getPTrailPos = typeof options.getPTrailPos === 'function' ? options.getPTrailPos : function(){ return []; };
    const getETrailPos = typeof options.getETrailPos === 'function' ? options.getETrailPos : function(){ return []; };
    const setupArena = typeof options.setupArena === 'function' ? options.setupArena : function(){};
    const mkTop = typeof options.mkTop === 'function' ? options.mkTop : function(){ return null; };
    const scene = options.scene || null;
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const updateSkillIcon = typeof options.updateSkillIcon === 'function' ? options.updateSkillIcon : function(){};
    const updateHUD = typeof options.updateHUD === 'function' ? options.updateHUD : function(){};
    const refreshPips = typeof options.refreshPips === 'function' ? options.refreshPips : function(){};
    const syncDebugPanel = typeof options.syncDebugPanel === 'function' ? options.syncDebugPanel : function(){};
    const showMatchResult = typeof options.showMatchResult === 'function' ? options.showMatchResult : function(){};
    const spawnOrbs = typeof options.spawnOrbs === 'function' ? options.spawnOrbs : function(){};
    const sfxLaunch = typeof options.sfxLaunch === 'function' ? options.sfxLaunch : function(){};
    const startMusic = typeof options.startMusic === 'function' ? options.startMusic : function(){};
    const sfxRoundWin = typeof options.sfxRoundWin === 'function' ? options.sfxRoundWin : function(){};
    const sfxRoundLose = typeof options.sfxRoundLose === 'function' ? options.sfxRoundLose : function(){};
    const setGameState = typeof options.setGameState === 'function' ? options.setGameState : function(){};
    const setEndLock = typeof options.setEndLock === 'function' ? options.setEndLock : function(){};
    const getPhysTick = typeof options.getPhysTick === 'function' ? options.getPhysTick : function(){ return null; };
    const getTimeScale = typeof options.getTimeScale === 'function' ? options.getTimeScale : function(){ return 1; };
    const setTimeScale = typeof options.setTimeScale === 'function' ? options.setTimeScale : function(){};
    const getAimLine = typeof options.getAimLine === 'function' ? options.getAimLine : function(){ return null; };
    const getCurrentModifier = typeof options.getCurrentModifier === 'function' ? options.getCurrentModifier : function(){ return { id:'standard', player:{}, enemy:{}, rules:{} }; };
    const setCurrentModifier = typeof options.setCurrentModifier === 'function' ? options.setCurrentModifier : function(){};
    const setRoundTimer = typeof options.setRoundTimer === 'function' ? options.setRoundTimer : function(){};
    const setRoundRewardGranted = typeof options.setRoundRewardGranted === 'function' ? options.setRoundRewardGranted : function(){};
    const setDoubleRewardUsed = typeof options.setDoubleRewardUsed === 'function' ? options.setDoubleRewardUsed : function(){};
    const setPendingContinue = typeof options.setPendingContinue === 'function' ? options.setPendingContinue : function(){};
    const setLastRoundEndReason = typeof options.setLastRoundEndReason === 'function' ? options.setLastRoundEndReason : function(){};
    const getMatchStartedAt = typeof options.getMatchStartedAt === 'function' ? options.getMatchStartedAt : function(){ return null; };
    const setMatchStartedAt = typeof options.setMatchStartedAt === 'function' ? options.setMatchStartedAt : function(){};
    let roundOutroTakeoverTimer = null;
    let roundOutroFinishTimer = null;
    const DEFAULT_COMBAT_BY_FAMILY = {
      impact:{ collision:{ roleBias:1.08 }, attrition:{ hpDecayPerSec:0.08 } },
      armor:{ collision:{ roleBias:0.95 }, attrition:{ hpDecayPerSec:0.05 } },
      trick:{ collision:{ roleBias:1.02 }, attrition:{ hpDecayPerSec:0.11 } }
    };

    function formatNodeLabel(number){
      return (uiText.battleIntroNodeLabel || uiText.resultNodeLabel || 'NODE')+' '+number;
    }

    function normalizeCombatTemplate(template){
      const baseTemplate = template || {};
      const family = baseTemplate.family || 'impact';
      const familyDefaults = DEFAULT_COMBAT_BY_FAMILY[family] || DEFAULT_COMBAT_BY_FAMILY.impact;
      const combat = baseTemplate.combat || {};
      const actions = combat.actions || {};
      const signatureSkillId = (
        actions.signature && actions.signature.skillId
      ) || baseTemplate.signatureSkill || baseTemplate.skill || 'Fly Charge';
      return Object.assign({}, baseTemplate, {
        combat:{
          actions:{
            dash:Object.assign({ id:'dash', key:'Space', universal:true }, actions.dash || {}),
            guard:Object.assign({ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 }, actions.guard || {}),
            signature:Object.assign({ id:'signature', key:'KeyQ', skillId:signatureSkillId }, actions.signature || {})
          },
          collision:Object.assign({}, familyDefaults.collision, combat.collision || {}),
          attrition:Object.assign({}, familyDefaults.attrition, combat.attrition || {})
        }
      });
    }

    function mkTopData(template,isPlayer){
      const normalizedTemplate = normalizeCombatTemplate(template);
      const guardAction = normalizedTemplate.combat && normalizedTemplate.combat.actions
        ? (normalizedTemplate.combat.actions.guard || {})
        : {};
      const arenaConfig = getArenaConfig(getCurrentArena());
      const isHeart = arenaConfig && arenaConfig.type === 'heart';
      const launchSlots = arenaConfig && arenaConfig.launchSlots ? arenaConfig.launchSlots : null;
      const defaultSpawn = isHeart
        ? { x:isPlayer ? -3.92 : 3.92, z:0 }
        : { x:0, z:isPlayer ? 5.0 : -5.0 };
      const slot = launchSlots
        ? (isPlayer ? launchSlots.player : launchSlots.enemy)
        : null;
      const sx = slot && typeof slot.x === 'number' && isFinite(slot.x) ? slot.x : defaultSpawn.x;
      const sz = slot && typeof slot.z === 'number' && isFinite(slot.z) ? slot.z : defaultSpawn.z;
      return {
        mesh:null,isPlayer,x:sx,z:sz,vx:0,vz:0,
        hp:normalizedTemplate.hp,maxHp:normalizedTemplate.hp,spin:normalizedTemplate.maxSpin,maxSpin:normalizedTemplate.maxSpin,burst:0,
        dashCD:0,DASH_CD:2.5,guardCD:0,GUARD_CD:guardAction.cooldown || 4.0,guardT:0,GUARD_T:guardAction.duration || 0.82,skillCD:0,SKILL_CD:8,
        dashing:false,dashT:0,guarding:false,shielded:false,shieldT:0,phantom:false,phantomT:0,
        intentType:null,intentT:0,intentLead:0,intentSkillId:null,
        roleBiasBoost:0,roleBiasBoostT:0,
        tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,
        joltX:0,joltY:0,joltZ:0,spinVisualBoost:0,
        openingGraceT:0,openingGraceBase:0,
        wallCD:0, alive:true,template:normalizedTemplate
      };
    }

    function applyModifierToTemplate(template, sideConfig){
      const cfg = sideConfig || {};
      const baseTemplate = normalizeCombatTemplate(template);
      return normalizeCombatTemplate(Object.assign({}, baseTemplate, {
        hp: Math.round(baseTemplate.hp * (cfg.hpMul || 1)),
        maxSpin: Math.round(baseTemplate.maxSpin * (cfg.spinMul || 1)),
        spd: baseTemplate.spd * (cfg.spdMul || 1),
        mass: baseTemplate.mass * (cfg.massMul || 1),
        brate: baseTemplate.brate * (cfg.brate || 1)
      }));
    }

    function applyResearchToTemplate(template, researchBonuses){
      const bonuses = researchBonuses || {};
      const baseTemplate = normalizeCombatTemplate(template);
      return normalizeCombatTemplate(Object.assign({}, baseTemplate, {
        hp: Math.round(baseTemplate.hp * (bonuses.hpMul || 1)),
        maxSpin: Math.round(baseTemplate.maxSpin * (bonuses.maxSpinMul || 1)),
        brate: baseTemplate.brate * (bonuses.brateMul || 1)
      }));
    }

    function applyRankToSideConfig(sideConfig, rankEnemyConfig){
      const base = sideConfig || {};
      const rank = rankEnemyConfig || {};
      return {
        hpMul:(base.hpMul || 1) * (rank.hpMul || 1),
        spinMul:(base.spinMul || 1) * (rank.spinMul || 1),
        spdMul:(base.spdMul || 1) * (rank.spdMul || 1),
        massMul:(base.massMul || 1) * (rank.massMul || 1),
        brate:(base.brate || 1) * (rank.brate || 1)
      };
    }

    function getCurrentRoundTimer(){
      const modifier = getCurrentModifier();
      const runtime = economy.runtime || {};
      return modifier && modifier.rules && modifier.rules.roundTimer
        ? modifier.rules.roundTimer
        : (typeof runtime.defaultRoundTimer === 'number' ? runtime.defaultRoundTimer : 30);
    }

    function findTopIndexById(topId){
      for(let index = 0; index < tops.length; index += 1){
        if(tops[index] && tops[index].id === topId){
          return index;
        }
      }
      return -1;
    }

    function setRoundResultTakeover(active){
      if(!document || !document.body || !document.body.classList) return;
      document.body.classList.toggle('round-result-takeover', !!active);
    }

    function getRoundResultCause(winner, reason){
      if(winner === 'draw'){
        return uiText.roundResultCauseDraw || 'Both tops stalled into the same finish state. The next round will come down to cleaner first contact.';
      }
      if(reason === 'ringout'){
        return winner === 'player'
          ? (uiText.roundResultCauseRingoutWin || 'You won the edge fight and pushed the rival cleanly out of the bowl.')
          : (uiText.roundResultCauseRingoutLose || 'You lost the edge fight and got pushed out before recovering your lane.');
      }
      if(reason === 'spinout'){
        return winner === 'player'
          ? (uiText.roundResultCauseSpinoutWin || 'The rival ran out of spin first after losing the sustained contact battle.')
          : (uiText.roundResultCauseSpinoutLose || 'Your spin drained first, so the round slipped away before the final clash.');
      }
      if(reason === 'hpout'){
        return winner === 'player'
          ? (uiText.roundResultCauseHpWin || 'Your pressure held up longer, so the rival broke first under repeated collisions.')
          : (uiText.roundResultCauseHpLose || 'You took too much collision damage and your frame broke first this round.');
      }
      return winner === 'player'
        ? (uiText.roundResultCauseTimeWin || 'Time expired with your top in the healthier state, so the decision went your way.')
        : (uiText.roundResultCauseTimeLose || 'Time expired while your top was in the weaker state, so the decision went against you.');
    }

    function getRoundResultAdjustment(winner, reason){
      if(winner === 'player'){
        if(reason === 'ringout'){
          return uiText.roundResultAdjustWinRingout || 'Keep the center longer and look for the same outward angle before you spend burst.';
        }
        if(reason === 'time'){
          return uiText.roundResultAdjustWinTime || 'You are ahead on attrition. Do not rush the next exchange unless a clean line opens.';
        }
        return uiText.roundResultAdjustWin || 'Your pressure worked. Repeat the clean opener first, then spend burst only when the lane is stable.';
      }
      if(reason === 'ringout'){
        return uiText.roundResultAdjustLoseRingout || 'Next round, protect the outer lane first. Guard the bad angle, then re-enter toward center.';
      }
      if(reason === 'time'){
        return uiText.roundResultAdjustLoseTime || 'You fell behind on endurance. Stay in cleaner contact and avoid wasting burst from a weak angle.';
      }
      return uiText.roundResultAdjustLose || 'Next round, fight for the first clean angle before committing to burst. If the entry is messy, guard and reset.';
    }

    function clearRoundOutroTimers(){
      if(roundOutroTakeoverTimer){
        clearTimeout(roundOutroTakeoverTimer);
        roundOutroTakeoverTimer = null;
      }
      if(roundOutroFinishTimer){
        clearTimeout(roundOutroFinishTimer);
        roundOutroFinishTimer = null;
      }
    }

    function hideRoundResultOverlay(){
      const ovRound = document.getElementById('ov-round');
      if(ovRound){
        ovRound.classList.add('hide');
      }
      setRoundResultTakeover(false);
    }

    function getRoundOutroTiming(reason, isMatchPoint){
      if(reason === 'ringout'){
        return {
          takeoverDelayMs:isMatchPoint ? 980 : 920,
          overlayDurationMs:isMatchPoint ? 1950 : 2050
        };
      }
      if(reason === 'hpout'){
        return {
          takeoverDelayMs:360,
          overlayDurationMs:isMatchPoint ? 1880 : 1980
        };
      }
      if(reason === 'spinout'){
        return {
          takeoverDelayMs:320,
          overlayDurationMs:isMatchPoint ? 1820 : 1920
        };
      }
      return {
        takeoverDelayMs:260,
        overlayDurationMs:isMatchPoint ? 1780 : 1880
      };
    }

    function initRound(){
      let currentEnemyPreset = null;
      clearRoundOutroTimers();
      setEndLock(false);
      hideRoundResultOverlay();
      setGameState('prepare');
      const physTick = getPhysTick();
      if(physTick && physTick._orbTimer){
        clearTimeout(physTick._orbTimer);
        physTick._orbTimer = null;
      }
      if(getCurrentMode()==='challenge'){
        const node = getCurrentChallengeNode();
        if(node){
          currentEnemyPreset = getEnemyPresetById(node.enemyPresetId);
          const enemyTopIndex = currentEnemyPreset ? findTopIndexById(currentEnemyPreset.topId) : -1;
          const arenaConfig = getArenaConfig(node.arenaIndex);
          state.currentArenaIndex = node.arenaIndex;
          state.currentArenaId = arenaConfig && arenaConfig.id ? arenaConfig.id : null;
          setCurrentArena(node.arenaIndex);
          setSelectedArenaIndex(node.arenaIndex);
          setCurrentEnemyPresetId(currentEnemyPreset ? currentEnemyPreset.id : null);
          if(enemyTopIndex >= 0){
            setEnemyTopId(enemyTopIndex);
          }
          setCurrentModifier(getModifierById(node.modifierId));
        }
      }else{
        setCurrentEnemyPresetId(null);
        setCurrentModifier(getModifierById('standard'));
      }
      setupArena();
      getPTrailPos().length=0;
      getETrailPos().length=0;
      setTimeScale(1);
      const tp = getTp();
      const te = getTe();
      if(tp && tp.mesh){ scene.remove(tp.mesh); tp.mesh=null; }
      if(te && te.mesh){ scene.remove(te.mesh); te.mesh=null; }
      getPartPool().forEach((p)=>scene.remove(p.mesh));
      getPartPool().length=0;
      getOrbObjects().forEach((o)=>{ if(o.alive) scene.remove(o.mesh); });
      getOrbObjects().length=0;
      const currentModifier = getCurrentModifier();
      const currentRoadRank = getCurrentRoadRank();
      const pt = applyResearchToTemplate(
        applyModifierToTemplate(normalizeCombatTemplate(tops[getPlayerTopId()]), currentModifier.player),
        getResearchBonuses()
      );
      const et = applyModifierToTemplate(
        normalizeCombatTemplate(tops[getEnemyTopId()]),
        getCurrentMode()==='challenge'
          ? applyRankToSideConfig(currentModifier.enemy, currentRoadRank.enemy)
          : currentModifier.enemy
      );
      const currentEnemyPresetId = getCurrentEnemyPresetId();
      const resolvedEnemyPreset = currentEnemyPresetId ? (currentEnemyPreset || getEnemyPresetById(currentEnemyPresetId)) : null;
      const currentEnemyPresetLabel = resolvedEnemyPreset
        ? (resolvedEnemyPreset.label || resolvedEnemyPreset.id || null)
        : getCurrentEnemyPresetLabel();
      const nextTp = mkTopData(pt,true);
      const nextTe = mkTopData(et,false);
      if(typeof options.isHeartArena === 'function' && options.isHeartArena()){
        const activeArenaConfig = getArenaConfig(getCurrentArena());
        const openingGrace = activeArenaConfig && activeArenaConfig.physics && typeof activeArenaConfig.physics.openingGrace === 'number'
          ? activeArenaConfig.physics.openingGrace
          : 0.9;
        nextTp.openingGraceT = openingGrace;
        nextTp.openingGraceBase = openingGrace;
        nextTe.openingGraceT = openingGrace;
        nextTe.openingGraceBase = openingGrace;
      }
      nextTp.burst=Math.min(100, currentModifier.player && currentModifier.player.startBurst ? currentModifier.player.startBurst : 0);
      nextTe.burst=Math.min(100, currentModifier.enemy && currentModifier.enemy.startBurst ? currentModifier.enemy.startBurst : 0);
      nextTp.mesh=mkTop(pt.color,pt.emi,pt.meshFamily || getPlayerTopId(),true);
      nextTp.mesh.position.set(nextTp.x,.6,nextTp.z);
      scene.add(nextTp.mesh);
      nextTe.mesh=mkTop(et.color,et.emi,et.meshFamily || getEnemyTopId(),false);
      nextTe.mesh.position.set(nextTe.x,.6,nextTe.z);
      scene.add(nextTe.mesh);
      setTp(nextTp);
      setTe(nextTe);
      setRoundTimer(getCurrentRoundTimer());
      setRoundRewardGranted(false);
      setDoubleRewardUsed(false);
      setPendingContinue(false);
      setLastRoundEndReason(null);
      document.getElementById('p-name').textContent=pt.name;
      document.getElementById('round-lbl').textContent=(uiText.roundLabel || 'ROUND')+' '+getRound();
      document.getElementById('e-name').textContent=et.name;
      updateSkillIcon();
      const timerEl=document.getElementById('timer-txt');
      timerEl.textContent=String(Math.ceil(getCurrentRoundTimer()));
      timerEl.classList.remove('urgent');
      document.getElementById('hint-bar').textContent=uiText.hintAim || 'Drag to aim, then release to launch.';
      updateHUD();
      refreshPips();
      showMsg((uiText.roundLabel || 'ROUND')+' '+getRound(),1.5,'round');
      if(analyticsService && getCurrentMode()==='challenge' && getRound()===1){
        const challengeNode = getCurrentChallengeNode();
        analyticsService.track('challenge_node_start',{
          nodeIndex:getActiveChallengeIndex(),
          nodeId:challengeNode ? challengeNode.id : null,
          chapterId:challengeNode ? challengeNode.chapterId || null : null,
          chapterLabel:challengeNode ? challengeNode.chapterLabel || null : null,
          tier:challengeNode ? challengeNode.tier || null : null,
          checkpointOnClear:!!(challengeNode && challengeNode.checkpointOnClear),
          reward:challengeNode && typeof challengeNode.reward === 'number' ? challengeNode.reward : 0,
          roadRankId:currentRoadRank ? currentRoadRank.id || null : null,
          roadRankLabel:currentRoadRank ? currentRoadRank.label || null : null,
          arena:getArenaLabel(getCurrentArena()),
          playerTop:tops[getPlayerTopId()].id,
          enemyTop:tops[getEnemyTopId()].id,
          enemyPresetId:currentEnemyPresetId,
          enemyPresetLabel:currentEnemyPresetLabel,
          modifier:getCurrentModifier().id
        });
      }
      syncDebugPanel();
    }

    function launch(){
      setGameState('active');
      if(getRound() === 1 && !getMatchStartedAt()){
        setMatchStartedAt(Date.now());
      }
      sfxLaunch();
      startMusic({
        scene:'battle',
        round:getRound(),
        mode:getCurrentMode(),
        restart:true,
        fadeMs:getRound() > 1 ? 180 : 240
      });
      document.getElementById('hint-bar').textContent=uiText.hintActive || 'SPACE to dash | Q to use your burst skill.';
      const tp = getTp();
      const te = getTe();
      const dx=tp.x-te.x,dz=tp.z-te.z,d=Math.sqrt(dx*dx+dz*dz)||1;
      const sp=(Math.random()-.5)*.5;
      const isHeartOpening = typeof options.isHeartArena === 'function' && options.isHeartArena();
      const openingSpeedBase = isHeartOpening ? 0.58 : 0.72;
      const openingSpeedSpread = isHeartOpening ? 0.16 : 0.28;
      te.vx=(dx/d+sp)*te.template.spd*(openingSpeedBase+Math.random()*openingSpeedSpread);
      te.vz=dz/d*te.template.spd*(openingSpeedBase+Math.random()*openingSpeedSpread);
      spawnOrbs();
      showMsg(uiText.fightCallout || 'FIGHT!',1.2,'impact');
      if(analyticsService){
        const currentArenaIndex = getCurrentArena();
        const currentArenaConfig = typeof options.getArenaConfig === 'function'
          ? options.getArenaConfig(currentArenaIndex)
          : { id:'unknown_arena' };
        const currentEnemyPresetId = getCurrentEnemyPresetId();
        const currentEnemyPreset = currentEnemyPresetId ? getEnemyPresetById(currentEnemyPresetId) : null;
        analyticsService.track('match_start',{
          mode:getCurrentMode(),
          arena:getArenaLabel(currentArenaIndex),
          arenaId:currentArenaConfig.id || 'unknown_arena',
          playerTop:tops[getPlayerTopId()].id,
          playerTopLabel:tops[getPlayerTopId()].name,
          enemyTop:tops[getEnemyTopId()].id,
          enemyTopLabel:tops[getEnemyTopId()].name,
          enemyPresetId:currentEnemyPresetId,
          enemyPresetLabel:currentEnemyPreset
            ? (currentEnemyPreset.label || currentEnemyPreset.id || null)
            : getCurrentEnemyPresetLabel(),
          challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null,
          modifier:getCurrentModifier().id
        });
      }
    }

    function endRound(reason){
      clearRoundOutroTimers();
      setEndLock(true);
      setGameState('roundOutro');
      setLastRoundEndReason(reason);
      const aimLine = getAimLine();
      if(aimLine) aimLine.visible=false;
      getOrbObjects().forEach((o)=>{ if(o.alive){ scene.remove(o.mesh); o.alive=false; } });
      const tp = getTp();
      const te = getTe();
      const score = getScore().slice();
      let winner,why;
      if(reason==='ringout'||reason==='spinout'||reason==='hpout'){
        winner=tp.alive?'player':'enemy';
        why={
          ringout:uiText.roundReasonRingOut || 'Ring Out',
          spinout:uiText.roundReasonSpinOut || 'Spin Out',
          hpout:uiText.roundReasonHpBreak || 'HP Break'
        }[reason];
      }else{
        const pr=tp.hp/tp.maxHp,er=te.hp/te.maxHp;
        winner=pr>er?'player':er>pr?'enemy':'draw';
        why=uiText.roundReasonTimeUp || 'Time Up - HP Check';
      }
      if(winner==='player') score[0]++;
      else if(winner==='enemy') score[1]++;
      setScore(score);
      const isMatchPoint = score[0]>=2||score[1]>=2;
      const outroTiming = getRoundOutroTiming(reason, isMatchPoint);
      const rdTxt=document.getElementById('rd-txt');
      const rdDet=document.getElementById('rd-detail');
      const rdCause=document.getElementById('rd-cause');
      const rdKicker=document.getElementById('rd-kicker');
      const rdAdjust=document.getElementById('rd-adjust');
      const ovRound=document.getElementById('ov-round');
      const msgTxt=document.getElementById('msg-txt');
      hideRoundResultOverlay();
      if(rdKicker){
        rdKicker.textContent=(uiText.roundLabel || 'ROUND')+' RESULT';
      }
      rdTxt.textContent=winner==='player'
        ? (uiText.roundWinPlayer || 'YOU WIN!')
        : winner==='enemy'
        ? (uiText.roundWinEnemy || 'ENEMY WINS')
        : (uiText.roundWinDraw || 'DRAW');
      rdTxt.style.color=winner==='player'?'#00ffcc':winner==='enemy'?'#ff4422':'#ffcc00';
      rdDet.textContent=(uiText.roundLabel || 'ROUND')+' '+getRound()+' - '+why;
      if(rdCause){
        rdCause.textContent = getRoundResultCause(winner, reason);
      }
      if(rdAdjust){
        rdAdjust.textContent = getRoundResultAdjustment(winner, reason);
      }
      roundOutroTakeoverTimer = setTimeout(()=>{
        roundOutroTakeoverTimer = null;
        if(msgTxt){
          msgTxt.style.opacity='0';
          msgTxt.textContent='';
        }
        if(winner==='player') sfxRoundWin(); else sfxRoundLose();
        setGameState('roundResult');
        setRoundResultTakeover(true);
        ovRound.classList.remove('hide');
        roundOutroFinishTimer = setTimeout(()=>{
          roundOutroFinishTimer = null;
          hideRoundResultOverlay();
          if(isMatchPoint){
            showMatchResult();
            return;
          }
          setRound(getRound()+1);
          initRound();
        },outroTiming.overlayDurationMs);
      },outroTiming.takeoverDelayMs);
    }

    return {
      normalizeCombatTemplate,
      mkTopData,
      applyModifierToTemplate,
      applyRankToSideConfig,
      getCurrentRoundTimer,
      initRound,
      launch,
      endRound
    };
  };
})();
