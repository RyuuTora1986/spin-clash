(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createLoadoutUiTools = function createLoadoutUiTools(options){
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const arenas = options.arenas || [];
    const modifiers = options.modifiers || {};
    const challengeRoad = options.challengeRoad || [];
    const getSave = typeof options.getSave === 'function'
      ? options.getSave
      : function(){ return { currency:0, unlocks:{ arenas:[], tops:[] }, challenge:{ unlockedNodeIndex:0 } }; };
    const saveProgress = typeof options.saveProgress === 'function'
      ? options.saveProgress
      : function(mutator){ return mutator(getSave()); };
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getSessionTrialArenaIds = typeof options.getSessionTrialArenaIds === 'function'
      ? options.getSessionTrialArenaIds
      : function(){ return new Set(); };
    const analyticsService = options.analyticsService || null;
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const rewardService = options.rewardService || null;
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const refresh = typeof options.refresh === 'function' ? options.refresh : function(){};

    function setText(id, value){
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    }

    function setHtml(id, value){
      const el = document.getElementById(id);
      if(el) el.innerHTML = value;
    }

    function getLoadoutSubtitle(){
      return getCurrentMode()==='challenge' ? uiText.challengeSubtitle : uiText.quickBattleSubtitle;
    }

    function getCurrentChallengeNode(){
      const index = getActiveChallengeIndex();
      return challengeRoad[index] || challengeRoad[challengeRoad.length-1] || null;
    }

    function getArenaLabel(index){
      return arenas[index] ? arenas[index].label : 'ARENA';
    }

    function getArenaConfig(index){
      return arenas[index] || { id:'unknown_arena', label:'ARENA', type:'circle', unlockCost:0 };
    }

    function getTopConfig(index){
      return tops[index] || { id:'unknown_top', name:'TOP', unlockCost:0 };
    }

    function isArenaUnlocked(index){
      const arena = getArenaConfig(index);
      const save = getSave();
      const unlocked = save.unlocks && Array.isArray(save.unlocks.arenas) ? save.unlocks.arenas : [];
      return arena.unlockCost <= 0 || unlocked.includes(arena.id) || getSessionTrialArenaIds().has(arena.id);
    }

    function isTopUnlocked(index){
      const top = getTopConfig(index);
      const save = getSave();
      const unlocked = save.unlocks && Array.isArray(save.unlocks.tops) ? save.unlocks.tops : [];
      return top.unlockCost <= 0 || unlocked.includes(top.id);
    }

    function getArenaButtonText(index){
      const arena = getArenaConfig(index);
      if(isArenaUnlocked(index)){
        if(getSessionTrialArenaIds().has(arena.id) && arena.unlockCost > 0){
          return arena.label+' - '+uiText.trialArena;
        }
        return arena.label;
      }
      return arena.label+' - '+uiText.lockedArena+' '+arena.unlockCost;
    }

    function updateCurrencyUI(){
      const save = getSave();
      const label = uiText.currencyLabel || 'SCRAP';
      setText('currency-bar', label+': '+save.currency);
      setText('mt-wallet', 'BALANCE '+save.currency+' '+label);
    }

    function updateTopCardUI(){
      const currencyLabel = uiText.currencyLabel || 'SCRAP';
      document.querySelectorAll('.card').forEach((el)=>{
        const topIndex = parseInt(el.dataset.id,10);
        const top = getTopConfig(topIndex);
        const locked = !isTopUnlocked(topIndex);
        const cardText = uiText.cards && uiText.cards[topIndex] ? uiText.cards[topIndex] : null;
        el.classList.toggle('sel', topIndex===getPlayerTopId());
        el.classList.toggle('locked', locked);
        setText('card-name-'+topIndex, top.name || 'TOP');
        if(cardText){
          setText('card-type-'+topIndex, cardText.type);
          setHtml('card-stats-'+topIndex, cardText.stats);
          setText(
            'card-skill-'+topIndex,
            locked
              ? (uiText.lockedTop+' - '+top.unlockCost+' '+currencyLabel)
              : cardText.skill
          );
        }
      });
    }

    function getModifierById(id){
      return modifiers[id] || modifiers.standard || { id:'standard', label:'STANDARD', description:'No special rules.' };
    }

    function updateModeUI(){
      const save = getSave();
      const currentNode = getCurrentChallengeNode();
      const unlockedNodeIndex = save.challenge ? save.challenge.unlockedNodeIndex : 0;
      const currentMode = getCurrentMode();

      setText('loadout-subtitle', getLoadoutSubtitle());
      setText('btn-fight', currentMode==='challenge' ? uiText.challengeButton : uiText.fightButton);

      const quickTab = document.getElementById('mode-quick');
      const challengeTab = document.getElementById('mode-challenge');
      const modeHint = document.getElementById('mode-hint');
      const challengePanel = document.getElementById('challenge-panel');

      if(quickTab) quickTab.classList.toggle('active', currentMode==='quick');
      if(challengeTab) challengeTab.classList.toggle('active', currentMode==='challenge');
      if(modeHint) modeHint.textContent = currentMode==='challenge' ? uiText.loadoutHintChallenge : uiText.loadoutHintQuick;
      if(challengePanel) challengePanel.classList.toggle('hide', currentMode!=='challenge');

      document.querySelectorAll('.arena-opt').forEach((el)=>{
        const arenaIndex = parseInt(el.dataset.arena,10);
        el.style.display = currentMode==='challenge' ? 'none' : '';
        el.classList.toggle('sel', arenaIndex===getSelectedArenaIndex());
        el.classList.toggle('locked', !isArenaUnlocked(arenaIndex));
        el.textContent = getArenaButtonText(arenaIndex);
      });

      updateTopCardUI();
      updateCurrencyUI();

      if(currentMode==='challenge' && currentNode){
        const modifier = getModifierById(currentNode.modifierId);
        const activeChallengeIndex = getActiveChallengeIndex();
        const tail = unlockedNodeIndex >= challengeRoad.length-1 && activeChallengeIndex >= challengeRoad.length-1
          ? uiText.challengeComplete
          : (activeChallengeIndex > unlockedNodeIndex ? uiText.challengeLocked : modifier.description);
        setText('challenge-node-name', 'NODE '+(activeChallengeIndex+1)+' - '+currentNode.name);
        setText('challenge-node-detail', getArenaLabel(currentNode.arenaIndex)+' - '+tops[currentNode.enemyTopId].name+' - '+modifier.label);
        setText('challenge-progress', 'Reward '+currentNode.reward+' '+uiText.currencyLabel+' - '+tail);
      }
    }

    function applyStaticText(){
      setText('title-main', uiText.titleMain);
      setText('title-sub', uiText.titleSub);
      setText('title-tagline', uiText.titleTagline);
      setText('btn-enter', uiText.enterBattle);
      setText('loadout-title', uiText.loadoutTitle);
      setText('loadout-subtitle', getLoadoutSubtitle());
      setText('arena-opt-0', getArenaButtonText(0));
      setText('arena-opt-1', getArenaButtonText(1));
      setText('arena-opt-2', getArenaButtonText(2));
      setText('btn-fight', getCurrentMode()==='challenge' ? uiText.challengeButton : uiText.fightButton);
      setText('rd-next', uiText.roundNext);
      setText('btn-replay', uiText.replay);
      setText('btn-swap-rematch', uiText.rematch);
      setText('btn-double-reward', uiText.rewardDouble);
      setText('btn-continue', uiText.rewardContinue);
      setText('btn-share', uiText.shareResult);
      setText('mode-quick', uiText.quickMode);
      setText('mode-challenge', uiText.challengeMode);
      setText('p-role', '* '+uiText.playerRole);
      setText('e-role', '* '+uiText.enemyRole);
      setText('p-hp-lbl', uiText.hp);
      setText('e-hp-lbl', uiText.hp);
      setText('p-spin-lbl', uiText.spin);
      setText('e-spin-lbl', uiText.spin);
      setText('p-burst-lbl', uiText.burst);
      setText('e-burst-lbl', uiText.burst);
      setText('dash-icon', uiText.dashIcon);
      setText('dash-name', uiText.dashName);
      setText('swap-icon', uiText.swapIcon);
      setText('swap-label', uiText.swapLabel);
      setText('hint-bar', 'Drag to aim, then release to launch.');
      setText('sk-icon', 'SK');
      setText('sn', 'Fly Charge');

      (uiText.cards || []).forEach((card,index)=>{
        setText('card-icon-'+index, card.icon);
        setText('card-name-'+index, tops[index] ? tops[index].name : 'TOP');
        setText('card-type-'+index, card.type);
        setHtml('card-stats-'+index, card.stats);
        setText('card-skill-'+index, card.skill);
      });

      updateTopCardUI();
      updateCurrencyUI();
    }

    function attemptArenaAccess(index){
      const arena = getArenaConfig(index);
      if(isArenaUnlocked(index)){
        setCurrentArena(index);
        return Promise.resolve(true);
      }

      const save = getSave();
      if(save.currency >= arena.unlockCost){
        const currencyBefore = save.currency;
        saveProgress((draft)=>{
          draft.currency -= arena.unlockCost;
          draft.unlocks = draft.unlocks || { arenas:[], tops:[] };
          draft.unlocks.arenas = Array.isArray(draft.unlocks.arenas) ? draft.unlocks.arenas : [];
          if(!draft.unlocks.arenas.includes(arena.id)){
            draft.unlocks.arenas.push(arena.id);
          }
          return draft;
        });
        if(analyticsService){
          analyticsService.track('unlock_grant',{
            kind:'arena',
            grantType:'purchase',
            source:'quick_battle_shop',
            mode:getCurrentMode(),
            arenaId:arena.id,
            arenaLabel:arena.label,
            cost:arena.unlockCost,
            currencyBefore,
            currencyAfter:currencyBefore - arena.unlockCost
          });
          analyticsService.track('unlock_purchase',{
            kind:'arena',
            arenaId:arena.id,
            arenaLabel:arena.label,
            cost:arena.unlockCost,
            currencyBefore,
            currencyAfter:currencyBefore - arena.unlockCost
          });
        }
        setCurrentArena(index);
        showMsg(arena.label+' '+uiText.unlockArena,1.2);
        refresh();
        return Promise.resolve(true);
      }

      if(!rewardService || typeof rewardService.request !== 'function'){
        return Promise.resolve(false);
      }

      if(analyticsService){
        analyticsService.track('trial_unlock_start',{
          kind:'arena',
          mode:getCurrentMode(),
          arenaId:arena.id,
          arenaLabel:arena.label
        });
      }

      return rewardService.request('trial_unlock_arena',{ arenaId:arena.id }).then(()=>{
        getSessionTrialArenaIds().add(arena.id);
        if(analyticsService){
          analyticsService.track('trial_unlock_complete',{
            kind:'arena',
            mode:getCurrentMode(),
            arenaId:arena.id,
            arenaLabel:arena.label
          });
        }
        setCurrentArena(index);
        showMsg(arena.label+' '+uiText.trialArena,1.2);
        refresh();
        return true;
      });
    }

    function attemptTopAccess(index){
      const top = getTopConfig(index);
      if(isTopUnlocked(index)){
        return Promise.resolve(true);
      }
      const save = getSave();
      if(save.currency < top.unlockCost){
        showMsg(uiText.lockedTop+' '+top.unlockCost+' '+(uiText.currencyLabel || 'SCRAP'),1.2);
        refresh();
        return Promise.resolve(false);
      }
      const currencyBefore = save.currency;
      saveProgress((draft)=>{
        draft.currency -= top.unlockCost;
        draft.unlocks = draft.unlocks || { arenas:[], tops:[] };
        draft.unlocks.tops = Array.isArray(draft.unlocks.tops) ? draft.unlocks.tops : [];
        if(!draft.unlocks.tops.includes(top.id)){
          draft.unlocks.tops.push(top.id);
        }
        return draft;
      });
      if(analyticsService){
        analyticsService.track('unlock_grant',{
          kind:'top',
          grantType:'purchase',
          source:'loadout_shop',
          mode:getCurrentMode(),
          topId:top.id,
          topLabel:top.name,
          cost:top.unlockCost,
          currencyBefore,
          currencyAfter:currencyBefore - top.unlockCost
        });
        analyticsService.track('unlock_purchase',{
          kind:'top',
          topId:top.id,
          topLabel:top.name,
          cost:top.unlockCost,
          currencyBefore,
          currencyAfter:currencyBefore - top.unlockCost
        });
      }
      showMsg(top.name+' '+uiText.unlockTop,1.2);
      refresh();
      return Promise.resolve(true);
    }

    return {
      getLoadoutSubtitle,
      getCurrentChallengeNode,
      getArenaLabel,
      getArenaConfig,
      getTopConfig,
      isArenaUnlocked,
      isTopUnlocked,
      attemptArenaAccess,
      attemptTopAccess,
      getArenaButtonText,
      updateCurrencyUI,
      updateTopCardUI,
      applyStaticText,
      updateModeUI
    };
  };
})();
