(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createLoadoutUiTools = function createLoadoutUiTools(options){
    const state = options.state || root.state || (root.state = {});
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const arenas = options.arenas || [];
    const researchTracks = options.researchTracks || [];
    const modifiers = options.modifiers || {};
    const enemyPresets = options.enemyPresets || {};
    const challengeRoad = options.challengeRoad || [];
    const roadRanks = options.roadRanks || [];
    const getSave = typeof options.getSave === 'function'
      ? options.getSave
      : function(){ return { currency:0, unlocks:{ arenas:[], tops:[] }, challenge:{ unlockedNodeIndex:0, checkpointNodeIndex:0 } }; };
    const saveProgress = typeof options.saveProgress === 'function'
      ? options.saveProgress
      : function(mutator){ return mutator(getSave()); };
    const getResearchLevel = typeof options.getResearchLevel === 'function'
      ? options.getResearchLevel
      : function(){ return 0; };
    const getResearchBonuses = typeof options.getResearchBonuses === 'function'
      ? options.getResearchBonuses
      : function(){ return { hpMul:1, maxSpinMul:1, brateMul:1 }; };
    const buyResearchLevel = typeof options.buyResearchLevel === 'function'
      ? options.buyResearchLevel
      : function(){ return { ok:false, reason:'unavailable' }; };
    const getCurrentMode = typeof options.getCurrentMode === 'function' ? options.getCurrentMode : function(){ return 'quick'; };
    const getUiRoute = typeof options.getUiRoute === 'function' ? options.getUiRoute : function(){ return getCurrentMode()==='challenge' ? 'path' : 'quick'; };
    const getUiRouteFrom = typeof options.getUiRouteFrom === 'function' ? options.getUiRouteFrom : function(){ return 'home'; };
    const getCurrentLocale = typeof options.getCurrentLocale === 'function' ? options.getCurrentLocale : function(){ return 'en'; };
    const getMusicEnabled = typeof options.getMusicEnabled === 'function' ? options.getMusicEnabled : function(){ return true; };
    const getSfxEnabled = typeof options.getSfxEnabled === 'function' ? options.getSfxEnabled : function(){ return true; };
    const getActiveChallengeIndex = typeof options.getActiveChallengeIndex === 'function' ? options.getActiveChallengeIndex : function(){ return 0; };
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getHomePreviewTopId = typeof options.getHomePreviewTopId === 'function' ? options.getHomePreviewTopId : function(){ return getPlayerTopId(); };
    const getSessionTrialArenaIds = typeof options.getSessionTrialArenaIds === 'function'
      ? options.getSessionTrialArenaIds
      : function(){ return new Set(); };
    const getUnlockedRoadRankIndex = typeof options.getUnlockedRoadRankIndex === 'function'
      ? options.getUnlockedRoadRankIndex
      : function(){ return 0; };
    const getSelectedRoadRankIndex = typeof options.getSelectedRoadRankIndex === 'function'
      ? options.getSelectedRoadRankIndex
      : function(){ return 0; };
    const setSelectedRoadRankIndex = typeof options.setSelectedRoadRankIndex === 'function'
      ? options.setSelectedRoadRankIndex
      : function(index){ return index; };
    const analyticsService = options.analyticsService || null;
    const setCurrentArena = typeof options.setCurrentArena === 'function' ? options.setCurrentArena : function(){};
    const goPathRoute = typeof options.goPathRoute === 'function' ? options.goPathRoute : function(){};
    const rewardService = options.rewardService || null;
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const refresh = typeof options.refresh === 'function' ? options.refresh : function(){};
    let purchaseDialogBound = false;
    let pendingTopPurchase = null;

    function syncActiveArenaState(index){
      const arena = getArenaConfig(index);
      state.currentArenaIndex = index;
      state.currentArenaId = arena.id || null;
      return arena;
    }

    function setText(id, value){
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    }

    function setHtml(id, value){
      const el = document.getElementById(id);
      if(el) el.innerHTML = value;
    }

    function setVisible(id, visible){
      const el = document.getElementById(id);
      if(!el) return;
      el.classList.toggle('hide', !visible);
    }

    function formatText(template, tokens){
      const source = String(template == null ? '' : template);
      return source.replace(/\{(\w+)\}/g, function(match, key){
        return Object.prototype.hasOwnProperty.call(tokens || {}, key) ? String(tokens[key]) : match;
      });
    }

    function getCurrencyLabel(){
      return uiText.currencyLabel || 'SCRAP';
    }

    function getTopPurchaseCostLine(top, save){
      const currencyLabel = getCurrencyLabel();
      const currentSave = save || getSave();
      const balance = currentSave && typeof currentSave.currency === 'number' ? currentSave.currency : 0;
      const cost = top && typeof top.unlockCost === 'number' ? top.unlockCost : 0;
      return formatText(
        uiText.topPurchaseCostLine || 'PRICE {cost} {currency} - BALANCE {balance} {currency}',
        {
          cost,
          balance,
          currency:currencyLabel
        }
      );
    }

    function getTopPurchaseShortfallLine(top, save){
      const currencyLabel = getCurrencyLabel();
      const currentSave = save || getSave();
      const balance = currentSave && typeof currentSave.currency === 'number' ? currentSave.currency : 0;
      const cost = top && typeof top.unlockCost === 'number' ? top.unlockCost : 0;
      return formatText(
        uiText.topPurchaseShortfallLine || 'PRICE {cost} {currency} - SHORT {shortfall} {currency}',
        {
          cost,
          shortfall:Math.max(0, cost - balance),
          currency:currencyLabel
        }
      );
    }

    function getTopPurchaseEarnCopy(top){
      return formatText(
        uiText.topPurchaseEarnCopy || 'Push deeper into the Championship Path. Node clears, first-clear bonuses, and reruns all feed your SCRAP balance.',
        {
          top:top && top.name ? top.name : (uiText.lockedTop || 'TOP'),
          currency:getCurrencyLabel()
        }
      );
    }

    function getTopPurchaseConfirmCopy(top){
      return formatText(
        uiText.topPurchaseConfirmCopy || 'Spend {cost} {currency} now to unlock {top}. This unlock is permanent in your local save.',
        {
          top:top && top.name ? top.name : (uiText.lockedTop || 'TOP'),
          cost:top && typeof top.unlockCost === 'number' ? top.unlockCost : 0,
          currency:getCurrencyLabel()
        }
      );
    }

    function updateLocaleButtons(){
      const locale = getCurrentLocale();
      const labels = uiText.localeButtons || {};
      const buttons = typeof document.querySelectorAll === 'function'
        ? document.querySelectorAll('[data-locale-target]')
        : [];
      Array.prototype.forEach.call(buttons, function(button){
        const localeId = button && button.dataset ? button.dataset.localeTarget : null;
        if(!localeId) return;
        button.textContent = labels[localeId] || localeId.toUpperCase();
        button.classList.toggle('active', locale === localeId);
      });
    }

    function updateBuildMetaUI(){
      const metaWrap = document.getElementById('title-build-meta');
      const versionText = uiText.titleBuildVersion || '';
      const copyrightText = uiText.titleCopyright || '';
      setText('title-build-version', versionText);
      setText('title-build-copyright', copyrightText);
      if(metaWrap){
        metaWrap.style.display = versionText || copyrightText ? '' : 'none';
      }
    }

    function closeTopPurchaseDialog(granted){
      const backdrop = document.getElementById('purchase-dialog-backdrop');
      if(backdrop){
        backdrop.classList.add('hide');
      }
      if(pendingTopPurchase && typeof pendingTopPurchase.resolve === 'function'){
        pendingTopPurchase.resolve(!!granted);
      }
      pendingTopPurchase = null;
    }

    function completeTopPurchase(index){
      const top = getTopConfig(index);
      const save = getSave();
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
    }

    function confirmTopPurchaseDialog(){
      if(!pendingTopPurchase || pendingTopPurchase.mode !== 'confirm'){
        closeTopPurchaseDialog(false);
        return false;
      }
      const topIndex = pendingTopPurchase.topIndex;
      completeTopPurchase(topIndex);
      closeTopPurchaseDialog(true);
      return true;
    }

    function ensureTopPurchaseDialogBindings(){
      if(purchaseDialogBound) return;
      const backdrop = document.getElementById('purchase-dialog-backdrop');
      const dialog = document.getElementById('purchase-dialog');
      const secondary = document.getElementById('purchase-dialog-secondary');
      const primary = document.getElementById('purchase-dialog-primary');
      if(!backdrop || !dialog || !secondary || !primary) return;
      if(
        typeof backdrop.addEventListener !== 'function'
        || typeof dialog.addEventListener !== 'function'
        || typeof secondary.addEventListener !== 'function'
        || typeof primary.addEventListener !== 'function'
      ){
        return;
      }
      backdrop.addEventListener('click', function(event){
        if(event.target !== backdrop) return;
        closeTopPurchaseDialog(false);
      });
      dialog.addEventListener('click', function(event){
        event.stopPropagation();
      });
      secondary.addEventListener('click', function(){
        if(pendingTopPurchase && typeof pendingTopPurchase.secondaryAction === 'function'){
          pendingTopPurchase.secondaryAction();
        }
        closeTopPurchaseDialog(false);
      });
      primary.addEventListener('click', function(){
        if(pendingTopPurchase && pendingTopPurchase.mode === 'confirm'){
          confirmTopPurchaseDialog();
          return;
        }
        if(pendingTopPurchase && typeof pendingTopPurchase.primaryAction === 'function'){
          pendingTopPurchase.primaryAction();
        }
        closeTopPurchaseDialog(false);
      });
      purchaseDialogBound = true;
    }

    function openTopPurchaseDialog(config){
      ensureTopPurchaseDialogBindings();
      const backdrop = document.getElementById('purchase-dialog-backdrop');
      const primary = document.getElementById('purchase-dialog-primary');
      const secondary = document.getElementById('purchase-dialog-secondary');
      if(!backdrop || !primary || !secondary){
        return false;
      }
      if(pendingTopPurchase && typeof pendingTopPurchase.resolve === 'function'){
        pendingTopPurchase.resolve(false);
      }
      pendingTopPurchase = {
        mode:config.mode,
        topIndex:config.topIndex,
        resolve:config.resolve,
        primaryAction:typeof config.primaryAction === 'function' ? config.primaryAction : null,
        secondaryAction:typeof config.secondaryAction === 'function' ? config.secondaryAction : null
      };
      setText('purchase-dialog-kicker', config.kicker || '');
      setText('purchase-dialog-title', config.title || '');
      setText('purchase-dialog-copy', config.copy || '');
      setText('purchase-dialog-cost', config.cost || '');
      setText('purchase-dialog-primary', config.primaryLabel || '');
      setText('purchase-dialog-secondary', config.secondaryLabel || '');
      primary.classList.toggle('hide', !config.primaryLabel);
      secondary.classList.toggle('hide', !config.secondaryLabel);
      backdrop.classList.remove('hide');
      return true;
    }

    function escapeHtml(value){
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function hexColor(value, fallback){
      const color = typeof value === 'number' ? value : fallback;
      const normalized = Math.max(0, Math.min(0xffffff, Number(color) || 0));
      return '#'+normalized.toString(16).padStart(6,'0');
    }

    function getTopCardContainer(){
      if(typeof document.getElementById === 'function'){
        const byId = document.getElementById('top-card-list');
        if(byId) return byId;
      }
      return typeof document.querySelector === 'function' ? document.querySelector('.cards') : null;
    }

    function buildTopCardMarkup(top, index){
      const colorA = hexColor(top && top.color, 0x666666);
      const colorB = hexColor(top && top.emi, 0x222222);
      return [
        '<div class="card'+(index===0 ? ' sel' : '')+'" data-id="'+index+'" onclick="return window.__spinClashInvoke(\'selectTop\','+index+')">',
        '<div class="card-icon" id="card-icon-'+index+'" style="background:radial-gradient(circle,'+colorA+','+colorB+')"></div>',
        '<h3 id="card-name-'+index+'"></h3><div class="card-type" id="card-type-'+index+'"></div>',
        '<div class="card-stats" id="card-stats-'+index+'"></div>',
        '<div class="card-skill-tag" id="card-skill-'+index+'"></div>',
        '</div>'
      ].join('');
    }

    function ensureTopCards(){
      const container = getTopCardContainer();
      if(!container || typeof container.innerHTML !== 'string') return;
      if(container.dataset && container.dataset.rosterCount === String(tops.length)) return;
      container.innerHTML = tops.map(function(top, index){
        return buildTopCardMarkup(top, index);
      }).join('');
      if(container.dataset){
        container.dataset.rosterCount = String(tops.length);
      }
    }

    function getLoadoutSubtitle(){
      return getCurrentMode()==='challenge' ? uiText.challengeSubtitle : uiText.quickBattleSubtitle;
    }

    function getSignatureSkillId(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const signature = actions && actions.signature ? actions.signature : null;
      return (signature && signature.skillId) || (template ? template.skill : null) || 'Fly Charge';
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
        message = uiText.rewardTrialFail || 'TRIAL NOT GRANTED.';
      }
      showMsg(message, 1.2);
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

    function getTopById(topId){
      return tops.find((top)=>top && top.id === topId) || null;
    }

    function getRoadRankForTop(top){
      if(!top || !Array.isArray(roadRanks)) return null;
      for(let index = 0; index < roadRanks.length; index += 1){
        const rank = roadRanks[index];
        if(rank && rank.rewardTopId === top.id){
          return rank;
        }
      }
      return null;
    }

    function isTopDefaultUnlocked(top){
      if(!top) return false;
      if(top.unlockSource === 'starter') return true;
      return !top.unlockSource && top.unlockCost <= 0;
    }

    function getTopSourceLabel(top){
      if(!top) return '';
      if(top.unlockSource === 'starter'){
        return uiText.topSourceStarter || 'STARTER';
      }
      if(top.unlockSource === 'road'){
        return uiText.topSourceRoadReward || 'ROAD REWARD';
      }
      if(top.unlockSource === 'shop'){
        return uiText.topSourceWorkshop || 'SCRAP UNLOCK';
      }
      if(top.unlockSource === 'road_or_shop'){
        return uiText.topSourceRoadShop || 'ROAD REWARD / SCRAP UNLOCK';
      }
      return '';
    }

    function getRoadUnlockText(top){
      const rank = getRoadRankForTop(top);
      if(rank){
        return formatText(
          uiText.topUnlockRoadRank || 'Clear {rank} to unlock',
          { rank:rank.label || 'RANK' }
        );
      }
      return uiText.homeTopLockedHintRoad || uiText.challengeMode || 'CHAMPIONSHIP PATH';
    }

    function getShopUnlockText(top, currencyLabel){
      return formatText(
        uiText.topUnlockShopCost || 'Unlock for {cost} {currency}',
        {
          cost:top && typeof top.unlockCost === 'number' ? top.unlockCost : 0,
          currency:currencyLabel || (uiText.currencyLabel || 'SCRAP')
        }
      );
    }

    function getTopTypeLine(top, baseType){
      const parts = [baseType];
      const sourceLabel = getTopSourceLabel(top);
      if(sourceLabel){
        parts.push(sourceLabel);
      }
      return parts.filter(Boolean).join(' · ');
    }

    function getLockedTopText(top, currencyLabel){
      if(!top) return uiText.lockedTop || 'LOCKED';
      if(top.unlockSource === 'road'){
        return (uiText.topSourceRoadReward || 'ROAD REWARD')+' · '+getRoadUnlockText(top);
      }
      if(top.unlockSource === 'shop'){
        return (uiText.topSourceWorkshop || 'SCRAP UNLOCK')+' · '+getShopUnlockText(top, currencyLabel);
      }
      if(top.unlockSource === 'road_or_shop'){
        return (uiText.topSourceRoadShop || 'ROAD REWARD / SCRAP UNLOCK')+' · '+(uiText.homeTopLockedHintRoadShop || uiText.lockedTop || 'LOCKED');
      }
      return (uiText.lockedTop || 'LOCKED')+' - '+(top.unlockCost || 0)+' '+currencyLabel;
    }

    function getCardText(index){
      return uiText.cards && uiText.cards[index] ? uiText.cards[index] : null;
    }

    function getEnemyPresetById(id){
      return enemyPresets[id] || null;
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
      return isTopDefaultUnlocked(top) || unlocked.includes(top.id);
    }

    function getUnlockedTopIndexes(){
      const unlockedIndexes = [];
      tops.forEach(function(top, index){
        if(top && isTopUnlocked(index)){
          unlockedIndexes.push(index);
        }
      });
      if(!unlockedIndexes.length && tops.length){
        unlockedIndexes.push(Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0)));
      }
      return unlockedIndexes;
    }

    function getHomePreviewTopIndex(){
      if(!tops.length) return 0;
      return Math.max(0, Math.min(tops.length - 1, parseInt(getHomePreviewTopId(), 10) || 0));
    }

    function getHomeTopLockHint(top){
      if(!top) return uiText.homeTopLockedHint || uiText.homeTopEmpty || 'Preview locked.';
      if(top.unlockSource === 'road_or_shop'){
        return uiText.homeTopLockedHintRoadShop || uiText.homeTopLockedHint || uiText.homeTopEmpty || 'Preview locked.';
      }
      if(top.unlockSource === 'road'){
        return getRoadUnlockText(top);
      }
      if(top.unlockSource === 'shop'){
        return getShopUnlockText(top, uiText.currencyLabel || 'SCRAP');
      }
      return uiText.homeTopLockedHint || uiText.homeTopEmpty || 'Preview locked.';
    }

    function normalizeCompareText(value){
      return String(value || '')
        .replace(/\s+/g, '')
        .replace(/[·・\-_/]/g, '')
        .toLowerCase();
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
      const bar = document.getElementById('currency-bar');
      if(bar){
        bar.style.display = 'none';
      }
      setText('currency-bar', label+': '+save.currency);
      setText('workshop-balance', label+': '+save.currency);
      setText('mt-wallet', (uiText.walletLabel || 'BALANCE')+' '+save.currency+' '+label);
    }

    function getResearchTrack(index){
      return researchTracks[index] || null;
    }

    function getResearchState(index){
      const track = getResearchTrack(index);
      if(!track){
        return null;
      }
      const level = getResearchLevel(track.id);
      const maxLevel = Array.isArray(track.levels) ? track.levels.length : 0;
      const currentLevelConfig = level > 0 && track.levels[level - 1] ? track.levels[level - 1] : null;
      const nextLevelConfig = level < maxLevel ? track.levels[level] : null;
      return {
        track,
        level,
        maxLevel,
        currentLevelConfig,
        nextLevelConfig,
        maxed:level >= maxLevel
      };
    }

    function formatResearchLevel(state){
      return (uiText.workshopLevel || 'LV')+' '+state.level+'/'+state.maxLevel;
    }

    function formatResearchCurrent(state){
      return (uiText.workshopCurrent || 'ACTIVE')+': '+(state.currentLevelConfig ? state.currentLevelConfig.preview : (uiText.noBonus || 'NO BONUS'));
    }

    function formatResearchNext(state){
      return state.maxed
        ? (uiText.workshopMaxed || 'MAXED')
        : (uiText.workshopNext || 'NEXT')+': '+state.nextLevelConfig.preview;
    }

    function getResearchButtonText(state){
      if(state.maxed){
        return uiText.workshopMaxed || 'MAXED';
      }
      return (uiText.workshopBuy || 'UPGRADE')+' '+state.nextLevelConfig.cost;
    }

    function updateWorkshopUI(){
      const panel = document.getElementById('workshop-panel');
      const workshopVisible = getUiRoute() === 'workshop';
      if(panel){
        panel.classList.toggle('hide', !workshopVisible);
      }
      setText('workshop-title', uiText.workshopTitle || 'WORKSHOP RESEARCH');
      setText('workshop-hint', uiText.workshopHint || 'Permanent SCRAP upgrades. Effects apply to every duel.');
      for(let index = 0; index < researchTracks.length; index += 1){
        const state = getResearchState(index);
        const row = document.getElementById('research-track-'+index);
        const buyButton = document.getElementById('research-buy-'+index);
        if(!state){
          if(row) row.style.display = 'none';
          continue;
        }
        if(row){
          row.style.display = '';
          row.classList.toggle('maxed', state.maxed);
          row.classList.toggle('locked', !state.maxed && getSave().currency < state.nextLevelConfig.cost);
        }
        setText('research-name-'+index, state.track.label);
        setText('research-desc-'+index, state.track.description);
        setText('research-level-'+index, formatResearchLevel(state));
        setText('research-bonus-'+index, formatResearchCurrent(state));
        setText('research-next-'+index, formatResearchNext(state));
        if(buyButton){
          buyButton.textContent = getResearchButtonText(state);
          buyButton.disabled = state.maxed || (!state.nextLevelConfig || getSave().currency < state.nextLevelConfig.cost);
        }
      }
    }

    function updateTopCardUI(){
      const currencyLabel = uiText.currencyLabel || 'SCRAP';
      ensureTopCards();
      document.querySelectorAll('.card').forEach((el)=>{
        const topIndex = parseInt(el.dataset.id,10);
        const top = getTopConfig(topIndex);
        const locked = !isTopUnlocked(topIndex);
        const cardText = getCardText(topIndex);
        const baseType = cardText && cardText.type ? cardText.type : (top.family ? String(top.family).toUpperCase() : 'TOP');
        el.classList.toggle('sel', topIndex===getPlayerTopId());
        el.classList.toggle('locked', locked);
        setText('card-name-'+topIndex, top.name || 'TOP');
        if(cardText){
          setText('card-type-'+topIndex, getTopTypeLine(top, baseType));
          setHtml('card-stats-'+topIndex, cardText.stats);
          setText(
            'card-skill-'+topIndex,
            locked
              ? getLockedTopText(top, currencyLabel)
              : cardText.skill
          );
        }
      });
    }

    function updateFeaturedTopUI(){
      const route = getUiRoute();
      const topIndex = getPlayerTopId();
      const top = getTopConfig(topIndex);
      const cardText = getCardText(topIndex) || {};
      const locked = !isTopUnlocked(topIndex);
      const traits = Array.isArray(cardText.traits) ? cardText.traits : [];
      setText(
        'featured-top-title',
        route === 'path'
          ? (uiText.challengeCurrentTopTitle || uiText.featuredTopTitle || 'CURRENT LOADOUT')
          : (uiText.featuredTopTitle || 'SELECTED TOP')
      );
      setText('featured-top-name', top.name || 'TOP');
      setText('featured-top-type', getTopTypeLine(top, cardText.type || (top.family ? String(top.family).toUpperCase() : 'TOP')));
      setText(
        'featured-top-skill',
        locked
          ? getLockedTopText(top, uiText.currencyLabel || 'SCRAP')
          : (cardText.pitch || cardText.skill || top.skill || 'Ready for the next duel.')
      );
      setText(
        'featured-top-traits',
        locked
          ? (uiText.loadoutHintQuick || 'Choose a top to view its strengths.')
          : traits.join(' - ')
      );
    }

    function getArenaDescription(index){
      const arena = getArenaConfig(index);
      const descriptions = uiText.quickArenaDescriptions || {};
      if(arena && descriptions[arena.id]){
        return descriptions[arena.id];
      }
      if(arena && arena.type === 'heart'){
        return 'Heart bowl that exaggerates angle pressure and edge decisions.';
      }
      if(arena && arena.type === 'hex'){
        return 'Hex bowl with harsher rebounds and tighter escape lanes.';
      }
      return 'Balanced circular bowl with the cleanest center-control reads.';
    }

    function getQuickArenaStatus(index){
      const arena = getArenaConfig(index);
      if(!arena) return uiText.quickArenaUnlocked || uiText.homeTopUnlocked || 'UNLOCKED';
      if(getSessionTrialArenaIds().has(arena.id) && arena.unlockCost > 0){
        return uiText.trialArena || 'TRIAL ACTIVE';
      }
      return isArenaUnlocked(index)
        ? (uiText.quickArenaUnlocked || uiText.homeTopUnlocked || 'UNLOCKED')
        : (uiText.quickArenaLocked || uiText.lockedArena || 'LOCKED');
    }

    function getQuickStartState(){
      const arenaIndex = Math.max(0, Math.min(arenas.length - 1, parseInt(getSelectedArenaIndex(), 10) || 0));
      const topIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
      const arena = getArenaConfig(arenaIndex);
      const top = getTopConfig(topIndex);
      const topLocked = !isTopUnlocked(topIndex);
      const arenaUnlocked = isArenaUnlocked(arenaIndex);
      const arenaLocked = !arenaUnlocked;
      const save = getSave();
      const arenaUnlockCost = Math.max(0, arena && typeof arena.unlockCost === 'number' ? arena.unlockCost : 0);
      const canBuyArena = arenaLocked && save.currency >= arenaUnlockCost;
      const shouldOfferTrial = arenaLocked && !canBuyArena;
      let buttonVariant = 'ready';
      let buttonLabel = uiText.fightButton || 'START MATCH';
      let hint = uiText.quickStartReadyHint || 'Arena selected. Start when ready.';
      if(topLocked){
        buttonVariant = 'top-locked';
        buttonLabel = uiText.quickStartBlockedButton || uiText.lockedTop || 'TOP LOCKED';
        hint = uiText.quickStartBlockedHint || uiText.quickTopLockedHint || 'Locked tops cannot enter quick battle.';
      }else if(canBuyArena){
        buttonVariant = 'arena-unlock';
        buttonLabel = uiText.quickStartArenaUnlockButton || 'UNLOCK + START';
        hint = formatText(
          uiText.quickStartArenaUnlockHint || 'Spend {cost} SCRAP to unlock this arena, then begin immediately.',
          { cost:arenaUnlockCost }
        );
      }else if(shouldOfferTrial){
        buttonVariant = 'arena-trial';
        buttonLabel = uiText.quickStartArenaTrialButton || 'WATCH AD TRIAL';
        hint = uiText.quickStartArenaTrialHint || 'SCRAP is short. Watch an ad to activate a temporary arena trial.';
      }
      return {
        arenaIndex,
        arena,
        topIndex,
        top,
        topLocked,
        arenaUnlocked,
        arenaLocked,
        canBuyArena,
        shouldOfferTrial,
        buttonVariant,
        buttonLabel,
        hint
      };
    }

    function getQuickTopRequirement(top, locked){
      if(!top) return '';
      const currencyLabel = uiText.currencyLabel || 'SCRAP';
      if(locked){
        if(top.unlockSource === 'road'){
          return getRoadUnlockText(top);
        }
        if(top.unlockSource === 'shop'){
          return getShopUnlockText(top, currencyLabel);
        }
        return uiText.quickTopLockedHint || uiText.lockedTop || 'LOCKED';
      }
      if(top.unlockSource === 'starter'){
        return uiText.quickTopOwnedStarterHint || uiText.topSourceStarter || 'STARTER';
      }
      if(top.unlockSource === 'road'){
        return uiText.quickTopOwnedRoadHint || uiText.topSourceRoadReward || 'ROAD REWARD';
      }
      if(top.unlockSource === 'shop'){
        return uiText.quickTopOwnedShopHint || uiText.topSourceWorkshop || 'SCRAP UNLOCK';
      }
      return uiText.quickTopOwnedReadyHint || uiText.quickTopReady || 'READY';
    }

    function getQuickTopWalletText(top, locked){
      if(!top || top.unlockSource !== 'shop'){
        return '';
      }
      const currencyLabel = uiText.currencyLabel || 'SCRAP';
      const balance = getSave().currency || 0;
      const cost = typeof top.unlockCost === 'number' ? top.unlockCost : 0;
      return formatText(
        locked
          ? (uiText.quickTopWalletNeedLine || 'BALANCE {balance} {currency} · PRICE {cost} {currency}')
          : (uiText.quickTopWalletOwnedLine || 'BALANCE {balance} {currency}'),
        {
          balance,
          cost,
          currency:currencyLabel
        }
      );
    }

    function getQuickTopActionState(top, locked){
      if(!top || !locked){
        return { label:'', visible:false, kind:'none' };
      }
      const balance = getSave().currency || 0;
      const cost = typeof top.unlockCost === 'number' ? top.unlockCost : 0;
      if(top.unlockSource === 'road'){
        return {
          label:uiText.quickTopPathAction || uiText.challengeMode || 'CHAMPIONSHIP PATH',
          visible:true,
          kind:'path'
        };
      }
      if(top.unlockSource === 'shop' && balance >= cost){
        return {
          label:uiText.topPurchaseConfirmButton || 'BUY NOW',
          visible:true,
          kind:'purchase'
        };
      }
      return {
        label:uiText.quickTopEarnAction || uiText.challengeMode || 'CHAMPIONSHIP PATH',
        visible:true,
        kind:'path'
      };
    }

    function updateQuickBattleUI(){
      const state = getQuickStartState();
      const topLocked = !isTopUnlocked(state.topIndex);
      const topActionState = getQuickTopActionState(state.top, topLocked);
      const topSourceLabel = getTopSourceLabel(state.top) || '';
      const topRequirement = getQuickTopRequirement(state.top, topLocked);
      const topMetaLine = normalizeCompareText(topRequirement) === normalizeCompareText(topSourceLabel)
        ? ''
        : topRequirement;
      const prevButton = document.getElementById('btn-quick-arena-prev');
      const nextButton = document.getElementById('btn-quick-arena-next');
      const fightButton = document.getElementById('btn-fight');
      const arenaStatus = document.getElementById('quick-arena-status');
      const topStatus = document.getElementById('quick-selected-top-status');
      const topActionButton = document.getElementById('btn-quick-top-action');
      const panel = document.getElementById('quick-battle-panel');
      if(panel){
        panel.classList.toggle('top-locked', state.topLocked);
        panel.classList.toggle('arena-locked', state.arenaLocked);
        panel.classList.toggle('arena-purchase-ready', state.buttonVariant === 'arena-unlock');
        panel.classList.toggle('arena-trial-ready', state.buttonVariant === 'arena-trial');
      }

      setText('quick-arena-kicker', uiText.quickArenaTitle || 'SELECTED ARENA');
      setText('quick-arena-name', state.arena.label || 'ARENA');
      setText('quick-arena-status', getQuickArenaStatus(state.arenaIndex));
      setText('quick-arena-desc', getArenaDescription(state.arenaIndex));
      setText('btn-quick-arena-prev', uiText.homeTopPrev || '<');
      setText('btn-quick-arena-next', uiText.homeTopNext || '>');

      setText('quick-selected-top-kicker', uiText.quickTopTitle || 'DEPLOYED TOP');
      setText('quick-selected-top-name', state.top.name || 'TOP');
      setText('quick-selected-top-status', topSourceLabel || (topLocked ? (uiText.lockedTop || 'LOCKED') : (uiText.quickTopReady || 'READY')));
      setText('quick-selected-top-source', topMetaLine);
      setText('quick-selected-top-requirement', topLocked ? state.hint : topRequirement);
      setText('quick-selected-top-wallet', getQuickTopWalletText(state.top, topLocked));
      setText('quick-start-hint', state.hint);
      setText('btn-fight', state.buttonLabel);
      if(topActionButton){
        topActionButton.textContent = topActionState.label;
        topActionButton.classList.toggle('hide', !topActionState.visible);
        topActionButton.classList.toggle('is-path', topActionState.kind === 'path');
        topActionButton.classList.toggle('is-purchase', topActionState.kind === 'purchase');
      }

      if(prevButton) prevButton.disabled = arenas.length <= 1;
      if(nextButton) nextButton.disabled = arenas.length <= 1;
      if(fightButton){
        fightButton.disabled = state.topLocked;
        fightButton.classList.toggle('danger-disabled', state.topLocked);
        fightButton.classList.toggle('arena-locked', !state.topLocked && state.arenaLocked);
        fightButton.classList.toggle('cta-unlock', state.buttonVariant === 'arena-unlock');
        fightButton.classList.toggle('cta-trial', state.buttonVariant === 'arena-trial');
      }
      if(arenaStatus){
        arenaStatus.classList.toggle('locked', !state.arenaUnlocked);
        arenaStatus.classList.toggle('unlocked', state.arenaUnlocked);
      }
      if(topStatus){
        topStatus.classList.toggle('locked', topLocked);
        topStatus.classList.toggle('unlocked', !topLocked);
      }
    }

    function updateHomeTopUI(){
      const currentTopIndex = getHomePreviewTopIndex();
      const top = getTopConfig(currentTopIndex);
      const cardText = getCardText(currentTopIndex) || {};
      const locked = !isTopUnlocked(currentTopIndex);
      const traits = Array.isArray(cardText.traits) ? cardText.traits : [];
      const prevButton = document.getElementById('btn-home-top-prev');
      const nextButton = document.getElementById('btn-home-top-next');
      const statusEl = document.getElementById('home-top-count');
      const stageShellEl = document.querySelector('.home-top-stage-shell');
      const typeEl = document.getElementById('home-top-type');
      const canCycle = tops.length > 1;
      const typeText = getTopTypeLine(top, cardText.type || (top.family ? String(top.family).toUpperCase() : 'TOP'));
      const hideDuplicateType = !locked && normalizeCompareText(typeText) === normalizeCompareText(top.name || 'TOP');

      setText('home-top-kicker', getTopSourceLabel(top) || uiText.homeTopTitle || uiText.featuredTopTitle || 'CURRENT TOP');
      setText('home-top-name', top.name || 'TOP');
      setText('home-top-count', locked ? (uiText.homeTopLocked || uiText.lockedTop || 'LOCKED') : (uiText.homeTopUnlocked || uiText.homeTopCountLabel || 'UNLOCKED'));
      setText('home-top-type', hideDuplicateType ? '' : typeText);
      setText(
        'home-top-skill',
        locked
          ? (uiText.homeTopLockedSkill || 'Silhouette only. Full ability data unlocks later.')
          : (cardText.skill || top.skill || (uiText.homeTopEmpty || 'Choose an unlocked top to preview its strengths.'))
      );
      setText(
        'home-top-traits',
        locked
          ? getHomeTopLockHint(top)
          : (cardText.pitch || (traits.length ? traits.slice(0, 2).join(' - ') : (uiText.homeTopEmpty || 'Choose an unlocked top to preview its strengths.')))
      );
      setText('btn-home-top-prev', uiText.homeTopPrev || '<');
      setText('btn-home-top-next', uiText.homeTopNext || '>');
      if(statusEl){
        statusEl.classList.toggle('locked', locked);
        statusEl.classList.toggle('unlocked', !locked);
      }
      if(stageShellEl){
        stageShellEl.classList.toggle('locked-preview', locked);
        stageShellEl.dataset.lockLabel = locked ? (uiText.homeTopLocked || uiText.lockedTop || 'LOCKED') : '';
      }
      if(typeEl){
        typeEl.classList.toggle('is-hidden', hideDuplicateType);
      }
      if(prevButton) prevButton.disabled = !canCycle;
      if(nextButton) nextButton.disabled = !canCycle;
    }

    function getModifierById(id){
      return modifiers[id] || modifiers.standard || { id:'standard', label:'STANDARD', description:'No special rules.' };
    }

    function getChapterLabel(node){
      if(!node) return uiText.challengeMode || 'CHAMPIONSHIP PATH';
      return node.chapterLabel || (node.chapterId ? String(node.chapterId).replace(/_/g,' ').toUpperCase() : (uiText.challengeMode || 'CHAMPIONSHIP PATH'));
    }

    function getTierLabel(node){
      if(!node || !node.tier) return '';
      if(node.tier === 'boss') return uiText.tierBoss || 'BOSS';
      if(node.tier === 'final') return uiText.tierFinal || 'FINAL';
      return '';
    }

    function formatNodeLabel(number){
      return (uiText.battleIntroNodeLabel || uiText.resultNodeLabel || 'NODE')+' '+number;
    }

    function formatMultiplier(value){
      const normalized = typeof value === 'number' && isFinite(value) ? Math.round(value * 100) / 100 : 1;
      return normalized % 1 === 0 ? normalized.toFixed(0) : String(normalized);
    }

    function getRoadRank(index){
      return roadRanks[index] || null;
    }

    function getSelectedRoadRank(){
      return getRoadRank(getSelectedRoadRankIndex()) || getRoadRank(0) || null;
    }

    function getSettingsToggleLabel(kind, enabled){
      return enabled
        ? (uiText.settingsToggleOn || 'ON')
        : (uiText.settingsToggleOff || 'OFF');
    }

    function getRoadRankButtonText(index){
      const rank = getRoadRank(index);
      if(!rank) return uiText.roadRankTitle || 'ROAD RANK';
      return index > getUnlockedRoadRankIndex()
        ? rank.label+' - '+(uiText.roadRankLocked || 'LOCKED')
        : rank.label;
    }

    function getRoadRankNote(rank){
      if(!rank) return uiText.roadRankHint || '';
      const parts = [rank.label];
      if(rank.description){
        parts.push(rank.description);
      }
      parts.push((uiText.roadRankRewardLabel || 'Reward')+' x'+formatMultiplier(rank.rewardMul));
      if(rank.rewardTopId){
        const rewardTop = getTopById(rank.rewardTopId);
        if(rewardTop){
          parts.push((uiText.roadRankRewardTopLabel || 'Top')+' '+rewardTop.name);
        }
      }
      return parts.join(' · ');
    }

    function updateChallengeRouteUI(){
      const container = document.getElementById('challenge-route-strip');
      if(!container) return;
      const save = getSave();
      const completedNodes = save.challenge && Array.isArray(save.challenge.completedNodes)
        ? save.challenge.completedNodes
        : [];
      const unlockedNodeIndex = save.challenge ? save.challenge.unlockedNodeIndex || 0 : 0;
      const activeIndex = getActiveChallengeIndex();
      container.innerHTML = challengeRoad.map(function(node, index){
        const classes = ['route-node'];
        if(index === activeIndex) classes.push('current');
        if(completedNodes.includes(index)) classes.push('cleared');
        if(index > unlockedNodeIndex) classes.push('locked');
        if(node && node.tier === 'boss') classes.push('boss');
        if(node && node.tier === 'final') classes.push('final');
        if(node && node.checkpointOnClear) classes.push('checkpoint');
        return '<span class="'+classes.join(' ')+'">'+escapeHtml(index + 1)+'</span>';
      }).join('');
    }

    function getTitleProgressText(){
      const save = getSave();
      const challenge = save.challenge || {};
      const rank = getSelectedRoadRank();
      const nextNodeIndex = Math.min(challenge.unlockedNodeIndex || 0, Math.max(0, challengeRoad.length - 1));
      const targetNode = challengeRoad[nextNodeIndex] || null;
      return [
        uiText.challengeMode || 'CHAMPIONSHIP PATH',
        rank ? rank.label : null,
        targetNode ? targetNode.name : (uiText.roadClear || 'ROAD CLEAR')
      ].filter(Boolean).join(' · ');
    }

    function updateTitleSummary(){
      const currentTopIndex = getHomePreviewTopIndex();
      const homePreviewLocked = !isTopUnlocked(currentTopIndex);
      const pathButton = document.getElementById('btn-enter');
      const quickButton = document.getElementById('btn-enter-quick');
      setText('title-progress', getTitleProgressText());
      updateHomeTopUI();
      if(pathButton){
        pathButton.disabled = homePreviewLocked;
        pathButton.classList.toggle('is-disabled', homePreviewLocked);
      }
      if(quickButton){
        quickButton.disabled = homePreviewLocked;
        quickButton.classList.toggle('is-disabled', homePreviewLocked);
      }
    }

    function updateRoadRankUI(){
      const selectedRank = getSelectedRoadRank();
      const unlockedRankIndex = getUnlockedRoadRankIndex();
      setText('challenge-rank-title', uiText.roadRankTitle || 'ROAD RANK');
      setText('challenge-rank-note', getRoadRankNote(selectedRank));
      for(let index = 0; index < 3; index += 1){
        const button = document.getElementById('challenge-rank-'+index);
        const rank = getRoadRank(index);
        if(!button) continue;
        if(!rank){
          button.style.display = 'none';
          continue;
        }
        button.style.display = '';
        button.textContent = getRoadRankButtonText(index);
        button.disabled = index > unlockedRankIndex;
        button.classList.toggle('active', index === getSelectedRoadRankIndex());
        button.classList.toggle('locked', index > unlockedRankIndex);
      }
    }

    function updateModeUI(){
      ensureTopCards();
      ensureTopPurchaseDialogBindings();
      const currentNode = getCurrentChallengeNode();
      const uiRoute = getUiRoute();
      const isPathRoute = uiRoute === 'path';
      const isQuickRoute = uiRoute === 'quick';
      const isSettingsRoute = uiRoute === 'settings';
      setText('btn-route-back', uiText.backButton || 'BACK');
      setText('btn-route-workshop', uiText.titleWorkshop || 'WORKSHOP');
      setText('btn-route-settings', uiText.settingsTitle || 'SETTINGS');
      setText('btn-fight', uiText.fightButton || 'START MATCH');
      setText('btn-path-fight', uiText.challengeButton || 'ENTER PATH');

      const quickTab = document.getElementById('mode-quick');
      const challengeTab = document.getElementById('mode-challenge');
      const modeHint = document.getElementById('mode-hint');
      const challengePanel = document.getElementById('challenge-panel');
      const quickBattlePanel = document.getElementById('quick-battle-panel');
      const routeActions = document.getElementById('shell-route-actions');
      const featuredPanel = document.querySelector('.featured-top-panel');
      const arenaPanel = document.querySelector('.arena-sel');
      const cardsPanel = document.querySelector('.cards');
      const fightButton = document.getElementById('btn-fight');
      const pathFightButton = document.getElementById('btn-path-fight');
      const settingsPanel = document.getElementById('settings-panel');
      const localeSwitcher = document.getElementById('locale-settings-switcher');
      const musicToggle = document.getElementById('btn-settings-music');
      const sfxToggle = document.getElementById('btn-settings-sfx');
      const loadoutOverlay = document.getElementById('ov-loadout');

      if(loadoutOverlay){
        loadoutOverlay.classList.remove('route-home','route-path','route-quick','route-workshop','route-settings');
        loadoutOverlay.classList.add('route-'+uiRoute);
      }
      if(routeActions) routeActions.style.display = isPathRoute || isQuickRoute ? '' : 'none';
      if(quickTab) quickTab.style.display = 'none';
      if(challengeTab) challengeTab.style.display = 'none';
      if(modeHint){
        modeHint.style.display = 'none';
        modeHint.textContent = '';
      }
      if(challengePanel) challengePanel.classList.toggle('hide', !isPathRoute);
      if(quickBattlePanel) quickBattlePanel.classList.toggle('hide', !isQuickRoute);
      if(featuredPanel) featuredPanel.style.display = 'none';
      if(arenaPanel) arenaPanel.style.display = 'none';
      if(cardsPanel) cardsPanel.style.display = isQuickRoute ? '' : 'none';
      if(fightButton) fightButton.style.display = isQuickRoute ? '' : 'none';
      if(pathFightButton) pathFightButton.style.display = isPathRoute ? '' : 'none';
      if(settingsPanel) settingsPanel.classList.toggle('hide', !isSettingsRoute);
      if(localeSwitcher) localeSwitcher.style.display = isSettingsRoute ? '' : 'none';
      setText('settings-language-label', uiText.settingsLanguageLabel || 'LANGUAGE');
      setText('settings-music-label', uiText.settingsMusicLabel || 'MUSIC');
      setText('settings-sfx-label', uiText.settingsSfxLabel || 'SFX');
      setText('btn-settings-music', getSettingsToggleLabel('music', getMusicEnabled()));
      setText('btn-settings-sfx', getSettingsToggleLabel('sfx', getSfxEnabled()));
      if(musicToggle) musicToggle.classList.toggle('off', !getMusicEnabled());
      if(sfxToggle) sfxToggle.classList.toggle('off', !getSfxEnabled());

      document.querySelectorAll('.arena-opt').forEach((el)=>{
        const arenaIndex = parseInt(el.dataset.arena,10);
        el.style.display = 'none';
        el.classList.toggle('sel', arenaIndex===getSelectedArenaIndex());
        el.classList.toggle('locked', !isArenaUnlocked(arenaIndex));
        el.textContent = getArenaButtonText(arenaIndex);
      });

      updateTopCardUI();
      updateFeaturedTopUI();
      updateQuickBattleUI();
      updateCurrencyUI();
      updateWorkshopUI();
      updateRoadRankUI();
      updateChallengeRouteUI();
      updateTitleSummary();
      updateBuildMetaUI();

      if(isPathRoute && currentNode){
        const modifier = getModifierById(currentNode.modifierId);
        const enemyPreset = getEnemyPresetById(currentNode.enemyPresetId);
        const enemyTop = enemyPreset ? getTopById(enemyPreset.topId) : null;
        const activeChallengeIndex = getActiveChallengeIndex();
        const roadRank = getSelectedRoadRank();
        const tierLabel = getTierLabel(currentNode);
        const currentTopIndex = Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
        const currentTop = getTopConfig(currentTopIndex);
        const currentTopCard = getCardText(currentTopIndex) || {};
        const enemyLabel = enemyPreset
          ? (enemyPreset.label || (enemyTop ? enemyTop.name : 'TOP'))
          : (enemyTop ? enemyTop.name : 'TOP');
        const challengeKicker = document.getElementById('challenge-kicker');
        const currentTopKicker = document.getElementById('challenge-current-top-kicker');
        const currentTopName = document.getElementById('challenge-current-top-name');
        const currentTopNote = document.getElementById('challenge-current-top-note');
        const detailBits = [
          formatText(uiText.challengeArenaInfo || 'Arena {value}', { value:getArenaLabel(currentNode.arenaIndex) }),
          formatText(uiText.challengeEnemyInfo || 'Enemy {value}', { value:enemyLabel }),
          modifier && modifier.label
            ? formatText(uiText.challengeRuleInfo || 'Rule {value}', { value:modifier.label })
            : null
        ].filter(Boolean);
        const progressBits = [
          formatText(uiText.challengeRewardInfo || 'Reward {value}', {
            value:currentNode.reward+' '+(uiText.currencyLabel || 'SCRAP')
          }),
          currentNode.firstClearBonus > 0
            ? formatText(uiText.challengeFirstClearInfo || 'First Clear +{value}', {
                value:currentNode.firstClearBonus+' '+(uiText.currencyLabel || 'SCRAP')
              })
            : null,
          roadRank
            ? formatText(uiText.challengeRankInfo || '{rank} x{multiplier}', {
                rank:roadRank.label,
                multiplier:formatMultiplier(roadRank.rewardMul)
              })
            : null,
          currentNode.checkpointOnClear ? (uiText.challengeCheckpointInfo || 'Checkpoint on clear') : null
        ].filter(Boolean);
        setText('challenge-node-name', [
          currentNode.name,
          tierLabel
        ].filter(Boolean).join(' - '));
        setText('challenge-node-detail', detailBits.join(' - '));
        setText('challenge-progress', progressBits.join(' - '));
        setText('challenge-kicker', [
          uiText.challengeMode || 'CHAMPIONSHIP PATH',
          roadRank ? roadRank.label : null,
          formatNodeLabel(activeChallengeIndex + 1)
        ].filter(Boolean).join(' - '));
        setText('challenge-current-top-kicker', uiText.challengeCurrentTopTitle || uiText.featuredTopTitle || 'CURRENT TOP');
        setText('challenge-current-top-name', currentTop.name || 'TOP');
        setText('challenge-current-top-note', [
          currentTopCard.type || (currentTop.family ? String(currentTop.family).toUpperCase() : null),
          getTopSourceLabel(currentTop) || (uiText.homeTopUnlocked || 'UNLOCKED'),
          currentTopCard.skill || currentTop.skill || null
        ].filter(Boolean).join(' - '));
      }
      updateLocaleButtons();
    }

    function applyStaticText(){
      ensureTopCards();
      ensureTopPurchaseDialogBindings();
      setText('title-main', uiText.titleMain);
      setText('title-sub', uiText.titleSub);
      setText('title-tagline', uiText.titleTagline);
      setText('btn-enter', uiText.enterBattle);
      setText('btn-enter-quick', uiText.titleQuickBattle || uiText.quickMode || 'QUICK BATTLE');
      setText('btn-enter-workshop', uiText.titleWorkshop || 'WORKSHOP');
      setText('btn-enter-settings', uiText.settingsTitle || 'SETTINGS');
      setText('loadout-title', uiText.loadoutTitle);
      setText('loadout-subtitle', getLoadoutSubtitle());
      setText('featured-top-title', uiText.featuredTopTitle || 'SELECTED TOP');
      setText('featured-traits-title', uiText.featuredTraitsTitle || 'TRACK TRAITS');
      setText('arena-opt-0', getArenaButtonText(0));
      setText('arena-opt-1', getArenaButtonText(1));
      setText('arena-opt-2', getArenaButtonText(2));
      setText('btn-fight', uiText.fightButton || 'START MATCH');
      setText('btn-path-fight', uiText.challengeButton || 'ENTER PATH');
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
      setText('guard-icon', uiText.guardIcon);
      setText('guard-name', uiText.guardName);
      setText('swap-icon', uiText.swapIcon);
      setText('swap-label', uiText.swapLabel);
      setText('score-label-round', uiText.roundLabel || 'ROUND');
      setText('hint-bar', uiText.hintAim || 'Drag to aim, then release to launch.');
      setText('sk-icon', 'SK');
      const selectedTop = tops[getPlayerTopId()] || tops[0] || null;
      const selectedSkillId = getSignatureSkillId(selectedTop);
      setText('sn', uiText.skillLabels && uiText.skillLabels[selectedSkillId] ? uiText.skillLabels[selectedSkillId] : selectedSkillId);

      (uiText.cards || []).forEach((card,index)=>{
        setText('card-icon-'+index, card.icon);
        setText('card-name-'+index, tops[index] ? tops[index].name : 'TOP');
        setText('card-type-'+index, card.type);
        setHtml('card-stats-'+index, card.stats);
        setText('card-skill-'+index, card.skill);
      });

      updateTopCardUI();
      updateFeaturedTopUI();
      updateCurrencyUI();
      updateWorkshopUI();
      updateRoadRankUI();
      updateChallengeRouteUI();
      updateTitleSummary();
      updateBuildMetaUI();
      updateLocaleButtons();
    }

    function attemptArenaAccess(index){
      const arena = getArenaConfig(index);
      if(isArenaUnlocked(index)){
        syncActiveArenaState(index);
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
        syncActiveArenaState(index);
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

      return rewardService.request('trial_unlock_arena',{ arenaId:arena.id }).then((result)=>{
        if(typeof rewardService.wasGranted === 'function' && !rewardService.wasGranted(result)){
          showRewardFailureFeedback('trial_unlock_arena', result);
          return false;
        }
        getSessionTrialArenaIds().add(arena.id);
        if(analyticsService){
          analyticsService.track('trial_unlock_complete',{
            kind:'arena',
            mode:getCurrentMode(),
            arenaId:arena.id,
            arenaLabel:arena.label
          });
        }
        syncActiveArenaState(index);
        setCurrentArena(index);
        showMsg(arena.label+' '+uiText.trialArena,1.2);
        refresh();
        return true;
      }).catch((error)=>{
        showRewardFailureFeedback('trial_unlock_arena', error);
        refresh();
        return false;
      });
    }

    function attemptTopAccess(index){
      const top = getTopConfig(index);
      if(isTopUnlocked(index)){
        return Promise.resolve(true);
      }
      if(top.unlockSource === 'road'){
        showMsg(
          uiText.homeTopLockedHintRoad
            || uiText.challengeMode
            || uiText.lockedTop
            || 'CHAMPIONSHIP PATH',
          1.2
        );
        refresh();
        return Promise.resolve(false);
      }
      const save = getSave();
      if(save.currency < top.unlockCost){
        if(!openTopPurchaseDialog({
            mode:'insufficient',
            topIndex:index,
            resolve:function(granted){ return granted; },
            kicker:uiText.topPurchaseNeedMoreKicker || 'SCRAP SHORT',
            title:top.name || (uiText.lockedTop || 'TOP'),
            copy:getTopPurchaseEarnCopy(top),
            cost:getTopPurchaseShortfallLine(top, save),
            primaryLabel:uiText.quickTopEarnAction || uiText.challengeMode || 'CHAMPIONSHIP PATH',
            secondaryLabel:uiText.topPurchaseCancelButton || 'NOT YET',
            primaryAction:function(){
              goPathRoute();
            }
          })){
          showMsg(getTopPurchaseShortfallLine(top, save),1.2);
          refresh();
        }
        return Promise.resolve(false);
      }
      return new Promise(function(resolve){
        if(!openTopPurchaseDialog({
          mode:'confirm',
          topIndex:index,
          resolve,
          kicker:uiText.topPurchaseConfirmKicker || 'UNLOCK TOP',
          title:top.name || (uiText.lockedTop || 'TOP'),
          copy:getTopPurchaseConfirmCopy(top),
          cost:getTopPurchaseCostLine(top, save),
          primaryLabel:uiText.topPurchaseConfirmButton || 'BUY NOW',
          secondaryLabel:uiText.topPurchaseCancelButton || 'NOT YET'
        })){
          completeTopPurchase(index);
          resolve(true);
        }
      });
    }

    function toggleWorkshopOpen(){
      updateWorkshopUI();
      return getUiRoute() === 'workshop';
    }

    function setWorkshopOpen(next){
      updateWorkshopUI();
      return !!next;
    }

    function isWorkshopOpen(){
      return getUiRoute() === 'workshop';
    }

    function attemptResearchPurchase(index){
      const state = getResearchState(index);
      if(!state){
        return Promise.resolve(false);
      }
      const result = buyResearchLevel(state.track.id);
      if(!result || result.ok !== true){
        if(result && result.reason === 'maxed'){
          showMsg(state.track.label+' '+(uiText.workshopMaxed || 'MAXED'), 1.2);
        }else if(result && result.reason === 'insufficient'){
          showMsg((uiText.workshopLocked || 'MORE SCRAP NEEDED')+' '+result.cost, 1.2);
        }
        refresh();
        return Promise.resolve(false);
      }
      if(analyticsService){
        analyticsService.track('research_purchase',{
          trackId:result.trackId,
          trackLabel:result.trackLabel,
          levelBefore:result.levelBefore,
          levelAfter:result.levelAfter,
          maxLevel:result.maxLevel,
          remainingLevels:result.remainingLevels,
          cost:result.cost,
          currencyBefore:result.currencyBefore,
          currencyAfter:result.currencyAfter,
          preview:result.preview,
          mode:getCurrentMode()
        });
      }
      showMsg(result.trackLabel+' '+(uiText.workshopUnlocked || 'RESEARCH UPGRADED'), 1.2);
      refresh();
      return Promise.resolve(true);
    }

    function selectRoadRank(index){
      const previousIndex = getSelectedRoadRankIndex();
      const previousRank = getRoadRank(previousIndex);
      const nextIndex = setSelectedRoadRankIndex(index);
      const nextRank = getRoadRank(nextIndex);
      if(
        analyticsService
        && previousIndex !== nextIndex
        && nextRank
      ){
        analyticsService.track('road_rank_select',{
          mode:getCurrentMode(),
          source:'loadout',
          unlockedRankIndex:getUnlockedRoadRankIndex(),
          fromRankIndex:previousIndex,
          fromRankId:previousRank ? previousRank.id : null,
          fromRankLabel:previousRank ? previousRank.label : null,
          toRankIndex:nextIndex,
          toRankId:nextRank.id,
          toRankLabel:nextRank.label
        });
      }
      return nextIndex;
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
      toggleWorkshopOpen,
      isWorkshopOpen,
      attemptResearchPurchase,
      setWorkshopOpen,
      selectRoadRank,
      getArenaButtonText,
      updateCurrencyUI,
      updateTopCardUI,
      updateFeaturedTopUI,
      updateHomeTopUI,
      updateWorkshopUI,
      applyStaticText,
      updateModeUI
    };
  };
})();
