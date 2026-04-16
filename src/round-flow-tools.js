(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createRoundFlowTools = function createRoundFlowTools(options){
    const tops = options.tops || [];
    const analyticsService = options.analyticsService || null;
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getCurrentChallengeNode = typeof options.getCurrentChallengeNode === 'function' ? options.getCurrentChallengeNode : function(){ return null; };
    const getModifierById = typeof options.getModifierById === 'function' ? options.getModifierById : function(){ return { id:'standard', player:{}, enemy:{}, rules:{} }; };
    const getArenaLabel = typeof options.getArenaLabel === 'function' ? options.getArenaLabel : function(){ return 'ARENA'; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const getCurrentArena = typeof options.getCurrentArena === 'function' ? options.getCurrentArena : function(){ return 0; };
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const setSelectedArenaIndex = typeof options.setSelectedArenaIndex === 'function' ? options.setSelectedArenaIndex : function(){};
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

    function mkTopData(template,isPlayer){
      const isHeart = typeof options.isHeartArena === 'function' ? options.isHeartArena() : false;
      const sx= isHeart?(isPlayer?-4.5:4.5):0;
      const sz= isHeart?0:(isPlayer?5.0:-5.0);
      return {
        mesh:null,isPlayer,x:sx,z:sz,vx:0,vz:0,
        hp:template.hp,maxHp:template.hp,spin:template.maxSpin,maxSpin:template.maxSpin,burst:0,
        dashCD:0,DASH_CD:2.5,skillCD:0,SKILL_CD:8,
        dashing:false,dashT:0,shielded:false,shieldT:0,phantom:false,phantomT:0,
        tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,
        wallCD:0, alive:true,template
      };
    }

    function applyModifierToTemplate(template, sideConfig){
      const cfg = sideConfig || {};
      return Object.assign({}, template, {
        hp: Math.round(template.hp * (cfg.hpMul || 1)),
        maxSpin: Math.round(template.maxSpin * (cfg.spinMul || 1)),
        spd: template.spd * (cfg.spdMul || 1),
        mass: template.mass * (cfg.massMul || 1),
        brate: template.brate * (cfg.brate || 1)
      });
    }

    function getCurrentRoundTimer(){
      const modifier = getCurrentModifier();
      return modifier && modifier.rules && modifier.rules.roundTimer ? modifier.rules.roundTimer : 30;
    }

    function initRound(){
      setEndLock(false);
      setGameState('prepare');
      const physTick = getPhysTick();
      if(physTick && physTick._orbTimer){
        clearTimeout(physTick._orbTimer);
        physTick._orbTimer = null;
      }
      if(getCurrentMode()==='challenge'){
        const node = getCurrentChallengeNode();
        if(node){
          setCurrentArena(node.arenaIndex);
          setSelectedArenaIndex(node.arenaIndex);
          setEnemyTopId(node.enemyTopId);
          setCurrentModifier(getModifierById(node.modifierId));
        }
      }else{
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
      const pt = applyModifierToTemplate(tops[getPlayerTopId()], currentModifier.player);
      const et = applyModifierToTemplate(tops[getEnemyTopId()], currentModifier.enemy);
      const nextTp = mkTopData(pt,true);
      const nextTe = mkTopData(et,false);
      nextTp.burst=Math.min(100, currentModifier.player && currentModifier.player.startBurst ? currentModifier.player.startBurst : 0);
      nextTe.burst=Math.min(100, currentModifier.enemy && currentModifier.enemy.startBurst ? currentModifier.enemy.startBurst : 0);
      nextTp.mesh=mkTop(pt.color,pt.emi,getPlayerTopId(),true);
      nextTp.mesh.position.set(nextTp.x,.6,nextTp.z);
      scene.add(nextTp.mesh);
      nextTe.mesh=mkTop(et.color,et.emi,getEnemyTopId(),false);
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
      document.getElementById('round-lbl').textContent='ROUND '+getRound();
      document.getElementById('e-name').textContent=et.name;
      updateSkillIcon();
      const timerEl=document.getElementById('timer-txt');
      timerEl.textContent=String(Math.ceil(getCurrentRoundTimer()));
      timerEl.classList.remove('urgent');
      document.getElementById('hint-bar').textContent='Drag to aim, then release to launch.';
      updateHUD();
      refreshPips();
      showMsg('ROUND '+getRound(),1.5);
      if(analyticsService && getCurrentMode()==='challenge' && getRound()===1){
        analyticsService.track('challenge_node_start',{
          nodeIndex:getActiveChallengeIndex(),
          nodeId:getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
          arena:getArenaLabel(getCurrentArena()),
          playerTop:tops[getPlayerTopId()].id,
          enemyTop:tops[getEnemyTopId()].id,
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
      startMusic();
      document.getElementById('hint-bar').textContent='SPACE to dash | Q to use your burst skill.';
      const tp = getTp();
      const te = getTe();
      const dx=tp.x-te.x,dz=tp.z-te.z,d=Math.sqrt(dx*dx+dz*dz)||1;
      const sp=(Math.random()-.5)*.5;
      te.vx=(dx/d+sp)*te.template.spd*(.72+Math.random()*.28);
      te.vz=dz/d*te.template.spd*(.72+Math.random()*.28);
      spawnOrbs();
      showMsg('FIGHT!',1.2);
      if(analyticsService){
        const currentArenaIndex = getCurrentArena();
        const currentArenaConfig = typeof options.getArenaConfig === 'function'
          ? options.getArenaConfig(currentArenaIndex)
          : { id:'unknown_arena' };
        analyticsService.track('match_start',{
          mode:getCurrentMode(),
          arena:getArenaLabel(currentArenaIndex),
          arenaId:currentArenaConfig.id || 'unknown_arena',
          playerTop:tops[getPlayerTopId()].id,
          playerTopLabel:tops[getPlayerTopId()].name,
          enemyTop:tops[getEnemyTopId()].id,
          enemyTopLabel:tops[getEnemyTopId()].name,
          challengeNode:getCurrentMode()==='challenge' ? getActiveChallengeIndex() : null,
          modifier:getCurrentModifier().id
        });
      }
    }

    function endRound(reason){
      setEndLock(true);
      setGameState('roundResult');
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
        why={ringout:'Ring Out',spinout:'Spin Out',hpout:'HP Break'}[reason];
      }else{
        const pr=tp.hp/tp.maxHp,er=te.hp/te.maxHp;
        winner=pr>er?'player':er>pr?'enemy':'draw';
        why='Time Up - HP Check';
      }
      if(winner==='player') score[0]++;
      else if(winner==='enemy') score[1]++;
      setScore(score);
      if(winner==='player') sfxRoundWin(); else sfxRoundLose();
      const rdTxt=document.getElementById('rd-txt');
      const rdDet=document.getElementById('rd-detail');
      const ovRound=document.getElementById('ov-round');
      rdTxt.textContent=winner==='player'?'YOU WIN!':winner==='enemy'?'ENEMY WINS':'DRAW';
      rdTxt.style.color=winner==='player'?'#00ffcc':winner==='enemy'?'#ff4422':'#ffcc00';
      rdDet.textContent='ROUND '+getRound()+' - '+why;
      ovRound.classList.remove('hide');
      if(score[0]>=2||score[1]>=2){
        setTimeout(()=>{ovRound.classList.add('hide');showMatchResult();},2200);
      }else{
        setRound(getRound()+1);
        setTimeout(()=>{ovRound.classList.add('hide');initRound();},2400);
      }
    }

    return {
      mkTopData,
      applyModifierToTemplate,
      getCurrentRoundTimer,
      initRound,
      launch,
      endRound
    };
  };
})();
