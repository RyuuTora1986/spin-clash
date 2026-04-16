(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createDebugRuntimeTools = function createDebugRuntimeTools(options){
    const storageService = options.storageService || null;
    const analyticsService = options.analyticsService || null;
    const debugService = options.debugService || null;
    const rewardService = options.rewardService || null;
    const shareService = options.shareService || null;
    const tops = options.tops || [];
    const arenas = options.arenas || [];
    const getSave = typeof options.getSave === 'function' ? options.getSave : function(){ return {}; };
    const saveProgress = typeof options.saveProgress === 'function' ? options.saveProgress : function(mutator){ return mutator(getSave()); };
    const addCurrency = typeof options.addCurrency === 'function' ? options.addCurrency : function(){};
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
    const physTick = typeof options.physTick === 'function' ? options.physTick : function(){};
    const renderer = options.renderer || null;
    const scene = options.scene || null;
    const camera = options.camera || null;
    const syncAfterReset = typeof options.syncAfterReset === 'function' ? options.syncAfterReset : function(){};

    let debugPanelHandle = null;
    let sessionStartedAt = Date.now();
    let sessionEndTracked = false;

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

    function promptImportText(){
      const raw = window.prompt('Paste save JSON');
      if(raw == null) return null;
      return raw.trim();
    }

    function renderGameToText(){
      const save = getSave();
      const score = getScore();
      const tp = getTp();
      const te = getTe();
      const currentArena = getCurrentArena();
      const payload = {
        mode:getGameState(),
        selectedMode:getCurrentMode(),
        arena:(arenas[currentArena] && arenas[currentArena].id) || 'unknown_arena',
        arenaLabel:getArenaLabel(currentArena),
        modifier:getActiveModifier().id,
        round:getRound(),
        score:{ player:score[0], enemy:score[1] },
        timer:getRoundTimer(),
        player:tp ? {
          x:tp.x,z:tp.z,vx:tp.vx,vz:tp.vz,
          hp:tp.hp,spin:tp.spin,burst:tp.burst,
          dashCD:tp.dashCD,skillCD:tp.skillCD,
          alive:tp.alive,top:tp.template.name,skill:tp.template.skill
        } : null,
        enemy:te ? {
          x:te.x,z:te.z,vx:te.vx,vz:te.vz,
          hp:te.hp,spin:te.spin,burst:te.burst,
          dashCD:te.dashCD,skillCD:te.skillCD,
          alive:te.alive,top:te.template.name,skill:te.template.skill
        } : null,
        orbs:getOrbObjects().filter((o)=>o.alive).map((o)=>({ x:o.x, z:o.z })),
        overlays:{
          title:!document.getElementById('ov-title').classList.contains('hide'),
          loadout:!document.getElementById('ov-loadout').classList.contains('hide'),
          roundResult:!document.getElementById('ov-round').classList.contains('hide'),
          matchResult:!document.getElementById('ov-match').classList.contains('hide')
        },
        progression:{
          currency:save.currency,
          challengeUnlockedNodeIndex:save.challenge ? save.challenge.unlockedNodeIndex : 0,
          activeChallengeIndex:getActiveChallengeIndex(),
          challengeContinueUsed:getChallengeContinueUsed()
        },
        hint:getHintText(),
        message:getMessageText(),
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
      const initialSave = getSave();
      const unlockedNodeIndex = initialSave.challenge ? initialSave.challenge.unlockedNodeIndex || 0 : 0;
      saveProgress((save)=>{
        save.sessions = (save.sessions || 0) + 1;
        return save;
      });
      if(analyticsService){
        analyticsService.track(
          initialSave.sessions > 0 ? 'return_session' : 'session_start',
          buildSessionAnalyticsPayload(initialSave)
        );
      }
      if(debugService && debugService.enabled){
        debugPanelHandle = debugService.mount(()=>({
          saveVersion:storageService ? storageService.version : null,
          storagePersistent:storageService ? storageService.isPersistent() : null,
          persistenceMode:storageService && typeof storageService.getPersistenceMode === 'function'
            ? storageService.getPersistenceMode()
            : null,
          persistenceDiagnostic:storageService && typeof storageService.getDiagnostics === 'function'
            ? storageService.getDiagnostics()
            : null,
          mode:getCurrentMode(),
          arena:getArenaLabel(getCurrentArena()),
          playerTop:tops[getPlayerTopId()] ? tops[getPlayerTopId()].id : null,
          enemyTop:tops[getEnemyTopId()] ? tops[getEnemyTopId()].id : null,
          challengeNode:getCurrentMode()==='challenge' && getCurrentChallengeNode() ? getCurrentChallengeNode().id : null,
          challengeUnlockedNodeIndex:getSave().challenge ? getSave().challenge.unlockedNodeIndex : 0,
          unlockedArenas:getSave().unlocks ? getSave().unlocks.arenas : [],
          unlockedTops:getSave().unlocks ? getSave().unlocks.tops : [],
          trialArenas:Array.from(getSessionTrialArenaIds()),
          currency:getSave().currency,
          rewardMockMode:rewardService && typeof rewardService.getMockMode === 'function'
            ? rewardService.getMockMode()
            : null,
          analyticsCount:analyticsService ? analyticsService.list().length : 0,
          lastAnalyticsEvent:analyticsService && analyticsService.list().length
            ? analyticsService.list()[analyticsService.list().length - 1].name
            : null
        }),[
          { label:'+200 SCRAP', run(){ addCurrency(200); return 'SCRAP ADDED'; } },
          { label:'UNLOCK HEX', run(){ unlockArenaById('hex_bowl'); return 'HEX UNLOCKED'; } },
          { label:'UNLOCK TRICK', run(){ unlockTopById('trick'); return 'TRICK UNLOCKED'; } },
          { label:'NODE 4', run(){ setChallengeProgress(3); return 'SET TO NODE 4'; } },
          { label:'FINAL NODE', run(){ setChallengeProgress(5); return 'SET TO FINAL NODE'; } },
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
          { label:'MOCK REWARD', run(){
            if(!rewardService || typeof rewardService.request !== 'function'){
              return Promise.resolve('REWARD UNAVAILABLE');
            }
            return rewardService.request('double_reward',{
              source:'debug_panel',
              mode:getCurrentMode()
            }).then(()=> 'MOCK REWARD COMPLETE');
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
      initRuntimeDebug
    };
  };
})();
