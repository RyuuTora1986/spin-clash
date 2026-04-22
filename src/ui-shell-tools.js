(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createUiShellTools = function createUiShellTools(options){
    const uiText = options.uiText || {};
    const tops = options.tops || [];
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const getGameState = typeof options.getGameState === 'function' ? options.getGameState : function(){ return 'title'; };
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const signatureSkills = options.signatureSkills || {};
    const skillIcons = options.skillIcons || {};
    let introTimer = null;
    let battleHudRefs = null;

    function getBattleHudRefs(){
      if(battleHudRefs) return battleHudRefs;
      battleHudRefs = {
        hintBar:document.getElementById('hint-bar'),
        playerRole:document.getElementById('p-role'),
        enemyRole:document.getElementById('e-role'),
        pHp:document.getElementById('p-hp'),
        pHpVal:document.getElementById('p-hp-val'),
        eHp:document.getElementById('e-hp'),
        eHpVal:document.getElementById('e-hp-val'),
        pSp:document.getElementById('p-sp'),
        pBu:document.getElementById('p-bu'),
        eSp:document.getElementById('e-sp'),
        eBu:document.getElementById('e-bu'),
        dashBtn:document.getElementById('act-dash'),
        dashCd:document.getElementById('dash-cd'),
        dashCdTxt:document.getElementById('dash-cd-txt'),
        dashState:document.getElementById('dash-state'),
        guardBtn:document.getElementById('act-guard'),
        guardCd:document.getElementById('guard-cd'),
        guardCdTxt:document.getElementById('guard-cd-txt'),
        guardState:document.getElementById('guard-state'),
        skillBtn:document.getElementById('act-skill'),
        skillCd:document.getElementById('skill-cd'),
        skillCdTxt:document.getElementById('skill-cd-txt'),
        skillState:document.getElementById('skill-state'),
        burstCircle:document.querySelector("#burst-ring circle"),
        playerPanel:document.getElementById('p-panel'),
        enemyPanel:document.getElementById('e-panel'),
        hud:document.getElementById('hud'),
        actSwap:document.getElementById('act-swap')
      };
      return battleHudRefs;
    }

    function getLoadoutOverlay(){
      return document.getElementById('ov-loadout');
    }

    function clearOverlayInlineState(overlay){
      if(!overlay) return;
      overlay.style.display='';
      overlay.style.visibility='';
      overlay.style.opacity='';
      overlay.style.pointerEvents='';
      overlay.style.zIndex='';
    }

    function showLoadoutOverlay(){
      const overlay = getLoadoutOverlay();
      clearOverlayInlineState(overlay);
      if(overlay){
        overlay.classList.remove('hide');
        overlay.style.display='flex';
        overlay.style.visibility='visible';
      }
    }

    function hideLoadoutOverlay(){
      const overlay = getLoadoutOverlay();
      clearOverlayInlineState(overlay);
      if(overlay){
        overlay.classList.add('hide');
        overlay.style.display='none';
        overlay.style.visibility='hidden';
      }
    }

    function syncArenaSelectionUI(){
      document.querySelectorAll('.arena-opt').forEach((el)=>{
        el.classList.toggle('sel', parseInt(el.dataset.arena,10)===getSelectedArenaIndex());
      });
    }

    function getSignatureSkillId(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const signature = actions && actions.signature ? actions.signature : null;
      return (signature && signature.skillId) || (template ? template.skill : null) || 'Fly Charge';
    }

    function getGuardEnabled(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const guard = actions && actions.guard ? actions.guard : null;
      return !guard || guard.enabled !== false;
    }

    function getGuardActionConfig(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      return actions && actions.guard ? actions.guard : {};
    }

    function getSignatureSkillMeta(template){
      return getSignatureSkillMetaById(getSignatureSkillId(template));
    }

    function getSignatureSkillMetaById(skillId){
      return skillId && signatureSkills[skillId] ? signatureSkills[skillId] : null;
    }

    function getIntentPresentation(top){
      if(!top || !top.intentType || !(top.intentT>0)) return null;
      if(top.intentType === 'skill'){
        const skillMeta = getSignatureSkillMetaById(top.intentSkillId || getSignatureSkillId(top.template));
        return {
          label: uiText.statusIntentSkill || 'SKILL',
          color: skillMeta && skillMeta.hudAccent && skillMeta.hudAccent.readyHintColor ? skillMeta.hudAccent.readyHintColor : '#ffd257'
        };
      }
      if(top.intentType === 'dash'){
        return {
          label: uiText.statusIntentDash || 'DASH',
          color: '#ffb36a'
        };
      }
      if(top.intentType === 'guard'){
        return {
          label: uiText.statusIntentGuard || uiText.statusGuarding || 'GUARD',
          color: '#9fd8ff'
        };
      }
      return null;
    }

    function updateSkillIcon(){
      const playerTop = tops[getPlayerTopId()];
      if(!playerTop) return;
      const sk = getSignatureSkillId(playerTop);
      const skillMeta = signatureSkills[sk] || null;
      const el = document.getElementById('sk-icon');
      if(el) el.textContent = (skillMeta && skillMeta.icon) || skillIcons[sk] || 'SK';
      const sn = document.getElementById('sn');
      if(sn) sn.textContent = (uiText.skillLabels && uiText.skillLabels[sk]) ? uiText.skillLabels[sk] : sk;
    }

    function updateBattleHint(tp, refs){
      const hintBar = refs.hintBar;
      if(!hintBar) return;
      if(getGameState()!=='active'){
        hintBar.textContent = uiText.hintAim || 'Drag to aim for the first clean hit, then release to launch.';
        hintBar.style.color = '';
        return;
      }
      const skillId = getSignatureSkillId(tp && tp.template ? tp.template : tops[getPlayerTopId()]);
      const skillMeta = signatureSkills[skillId] || null;
      const skillLabel = (uiText.skillLabels && uiText.skillLabels[skillId]) ? uiText.skillLabels[skillId] : skillId;
      if(tp && tp.skillCD<=0 && tp.burst>=100){
        hintBar.textContent = (uiText.hintSkillReady || 'Q READY')+' · '+skillLabel;
        hintBar.style.color = skillMeta && skillMeta.hudAccent && skillMeta.hudAccent.readyHintColor ? skillMeta.hudAccent.readyHintColor : '';
        return;
      }
      hintBar.textContent = uiText.hintActive || 'SPACE to dash | E to guard | Q to use your burst skill.';
      hintBar.style.color = '';
    }

    function updateRoleLabels(tp,te,refs){
      const playerRoleEl = refs.playerRole;
      const enemyRoleEl = refs.enemyRole;
      const playerMeta = getSignatureSkillMeta(tp && tp.template ? tp.template : null);
      const enemyMeta = getSignatureSkillMeta(te && te.template ? te.template : null);
      const guardColor = '#9fd8ff';
      const playerBase = '* '+(uiText.playerRole || 'YOU');
      const enemyBase = '* '+(uiText.enemyRole || 'CPU');
      if(playerRoleEl){
        let playerText = playerBase;
        playerRoleEl.style.color = '';
        const playerIntent = getIntentPresentation(tp);
        if(playerIntent){
          playerText += ' · '+playerIntent.label;
          playerRoleEl.style.color = playerIntent.color;
        }else if(tp && tp.guarding){
          playerText += ' · '+(uiText.statusGuarding || 'GUARD');
          playerRoleEl.style.color = guardColor;
        }else if(tp && tp.skillCD<=0 && tp.burst>=100){
          playerText += ' · '+(uiText.statusReady || 'READY');
          playerRoleEl.style.color = playerMeta && playerMeta.hudAccent && playerMeta.hudAccent.readyHintColor ? playerMeta.hudAccent.readyHintColor : '';
        }
        playerRoleEl.textContent = playerText;
      }
      if(enemyRoleEl){
        let enemyText = enemyBase;
        enemyRoleEl.style.color = '';
        const enemyIntent = getIntentPresentation(te);
        if(enemyIntent){
          enemyText += ' · '+enemyIntent.label;
          enemyRoleEl.style.color = enemyIntent.color;
        }else if(te && te.guarding){
          enemyText += ' · '+(uiText.statusGuarding || 'GUARD');
          enemyRoleEl.style.color = guardColor;
        }else if(te && te.skillCD<=0 && te.burst>=100){
          enemyText += ' · '+(uiText.statusReady || 'READY');
          enemyRoleEl.style.color = enemyMeta && enemyMeta.hudAccent && enemyMeta.hudAccent.readyHintColor ? enemyMeta.hudAccent.readyHintColor : '';
        }
        enemyRoleEl.textContent = enemyText;
      }
    }

    function refreshPips(){
      const score = getScore();
      ['pp1','pp2'].forEach((id,i)=>{
        const el=document.getElementById(id);
        el.className='pip'+(i<score[0]?' p-won':'');
      });
      ['ep1','ep2'].forEach((id,i)=>{
        const el=document.getElementById(id);
        el.className='pip'+(i<score[1]?' e-won':'');
      });
    }

    function updateHUD(){
      const tp = getTp();
      const te = getTe();
      if(!tp || !te) return;
      const refs = getBattleHudRefs();
      if(!refs.pHp || !refs.eHp || !refs.pSp || !refs.pBu || !refs.eSp || !refs.eBu) return;
      const pHpPct=tp.hp/tp.maxHp;
      const eHpPct=te.hp/te.maxHp;
      const pSpinPct=tp.spin/tp.maxSpin;
      const eSpinPct=te.spin/te.maxSpin;
      const hpColor=(p,isP)=>p>0.5
        ?(isP?'linear-gradient(90deg,#00cc55,#00ee77)':'linear-gradient(90deg,#cc2200,#ee4400)')
        :p>0.25?'linear-gradient(90deg,#cc7700,#ffaa00)':'linear-gradient(90deg,#cc1100,#ff3300)';
      const phEl=refs.pHp;
      phEl.style.width=(pHpPct*100)+'%';
      phEl.style.background=hpColor(pHpPct,true);
      phEl.style.animation=pHpPct<0.25?'hpBeat .5s ease-in-out infinite':'none';
      if(refs.pHpVal) refs.pHpVal.textContent=Math.ceil(tp.hp);
      const ehEl=refs.eHp;
      ehEl.style.width=(eHpPct*100)+'%';
      ehEl.style.background=hpColor(eHpPct,false);
      ehEl.style.animation=eHpPct<0.25?'hpBeat .5s ease-in-out infinite':'none';
      if(refs.eHpVal) refs.eHpVal.textContent=Math.ceil(te.hp);
      refs.pSp.style.width=(pSpinPct*100)+'%';
      refs.pBu.style.width=tp.burst+'%';
      refs.eSp.style.width=(eSpinPct*100)+'%';
      refs.eBu.style.width=te.burst+'%';
      const dashBtn=refs.dashBtn;
      const dashCdEl=refs.dashCd;
      const dashCdTxt=refs.dashCdTxt;
      const dashState=refs.dashState;
      if(tp.dashCD>0){
        dashBtn.className='sk-btn dash-cooldown';
        dashCdEl.style.height=(tp.dashCD/tp.DASH_CD*100)+'%';
        dashCdTxt.textContent=tp.dashCD.toFixed(1);
        if(dashState) dashState.textContent='CD '+tp.dashCD.toFixed(1);
      }else{
        dashBtn.className='sk-btn dash-ready';
        dashCdEl.style.height='0%';
        dashCdTxt.textContent='';
        if(dashState) dashState.textContent=uiText.statusReady || 'READY';
      }
      const guardBtn=refs.guardBtn;
      const guardCdEl=refs.guardCd;
      const guardCdTxt=refs.guardCdTxt;
      const guardState=refs.guardState;
      const guardEnabled = getGuardEnabled(tp.template);
      const guardConfig = getGuardActionConfig(tp.template);
      if(guardBtn){
        guardBtn.style.display = guardEnabled ? '' : 'none';
        if(guardEnabled){
          if(tp.guarding){
            guardBtn.className='sk-btn guard-active';
            guardCdEl.style.height=((tp.guardT/(guardConfig.duration||tp.GUARD_T||0.82))*100)+'%';
            guardCdTxt.textContent='';
            if(guardState) guardState.textContent=uiText.statusGuarding || 'ACTIVE';
          }else if(tp.guardCD>0){
            guardBtn.className='sk-btn guard-cooldown';
            guardCdEl.style.height=(tp.guardCD/(guardConfig.cooldown||tp.GUARD_CD||4.0)*100)+'%';
            guardCdTxt.textContent=tp.guardCD.toFixed(1);
            if(guardState) guardState.textContent='CD '+tp.guardCD.toFixed(1);
          }else{
            guardBtn.className='sk-btn guard-ready';
            guardCdEl.style.height='0%';
            guardCdTxt.textContent='';
            if(guardState) guardState.textContent=uiText.statusReady || 'READY';
          }
        }else if(guardState){
          guardState.textContent='';
        }
      }
      const skillBtn=refs.skillBtn;
      const skillCdEl=refs.skillCd;
      const skillCdTxt=refs.skillCdTxt;
      const skillState=refs.skillState;
      const burstCircle=refs.burstCircle;
      const CIRC=157;
      const skillMeta = getSignatureSkillMeta(tp.template);
      const accent = skillMeta && skillMeta.hudAccent ? skillMeta.hudAccent : null;
      const playerPanel = refs.playerPanel;
      const enemyPanel = refs.enemyPanel;
      updateRoleLabels(tp,te,refs);
      if(playerPanel){
        playerPanel.classList.toggle('danger-hp', pHpPct <= 0.25);
        playerPanel.classList.toggle('danger-spin', pSpinPct <= 0.2);
      }
      if(enemyPanel){
        enemyPanel.classList.toggle('danger-hp', eHpPct <= 0.25);
        enemyPanel.classList.toggle('danger-spin', eSpinPct <= 0.2);
      }
      updateBattleHint(tp,refs);
      if(tp.skillCD>0){
        skillBtn.className='sk-btn state-cooldown';
        skillCdEl.style.height=(tp.skillCD/tp.SKILL_CD*100)+'%';
        skillCdTxt.textContent=tp.skillCD.toFixed(1);
        burstCircle.style.strokeDashoffset=CIRC;
        burstCircle.style.stroke='rgba(255,180,0,0.2)';
        if(skillState) skillState.textContent='CD '+tp.skillCD.toFixed(1);
      }else if(tp.burst<100){
        skillBtn.className='sk-btn state-need-energy';
        skillCdEl.style.height='0%';
        skillCdTxt.textContent='';
        burstCircle.style.strokeDashoffset=CIRC*(1-tp.burst/100);
        burstCircle.style.stroke=accent && accent.chargeStroke ? accent.chargeStroke : 'rgba(255,180,0,0.6)';
        if(skillState) skillState.textContent='BURST '+Math.round(tp.burst)+'%';
      }else{
        skillBtn.className='sk-btn state-ready';
        skillCdEl.style.height='0%';
        skillCdTxt.textContent='';
        burstCircle.style.strokeDashoffset=0;
        burstCircle.style.stroke=accent && accent.readyStroke ? accent.readyStroke : 'rgba(255,210,0,0.9)';
        if(skillState) skillState.textContent=uiText.statusReady || 'READY';
      }
    }

    function showBattleIntro(context){
      const overlay = document.getElementById('battle-intro');
      const kicker = document.getElementById('battle-intro-kicker');
      const title = document.getElementById('battle-intro-title');
      const meta = document.getElementById('battle-intro-meta');
      const briefTitle = document.getElementById('battle-intro-brief-title');
      const briefPrimary = document.getElementById('battle-intro-brief-primary');
      const briefSecondary = document.getElementById('battle-intro-brief-secondary');
      if(!overlay || !title || !meta || !briefTitle || !briefPrimary || !briefSecondary) return;
      const parts = [];
      if(kicker){
        kicker.textContent = context.kicker || uiText.battleIntroKicker || 'OPENING PLAN';
      }
      if(context.playerTopLabel || context.enemyTopLabel){
        title.textContent = (context.playerTopLabel || 'TOP')+(uiText.battleIntroVersus || ' VS ')+(context.enemyTopLabel || 'TOP');
      }
      if(context.stageLabel) parts.push(context.stageLabel);
      if(context.arenaLabel) parts.push(context.arenaLabel);
      if(context.roadRankLabel) parts.push(context.roadRankLabel);
      meta.textContent = parts.join(' - ');
      briefTitle.textContent = context.briefTitle || uiText.battleIntroBriefTitle || 'FIRST MOVE';
      briefPrimary.textContent = context.briefPrimary || uiText.battleIntroBriefPrimary || 'Take the first clean line and hold center before spending burst.';
      briefSecondary.textContent = context.briefSecondary || uiText.battleIntroBriefSecondary || 'If the angle feels bad, guard first and re-enter on the next opening.';
      overlay.classList.remove('hide');
      clearTimeout(introTimer);
      introTimer = setTimeout(function(){
        overlay.classList.add('hide');
      }, 1700);
    }

    function showBattleHud(){
      const refs = getBattleHudRefs();
      if(refs.hud) refs.hud.style.display='';
      if(refs.actSwap) refs.actSwap.classList.add('visible');
    }

    function hideBattleHud(){
      const refs = getBattleHudRefs();
      if(refs.hud) refs.hud.style.display='none';
      if(refs.actSwap) refs.actSwap.classList.remove('visible');
    }

    return {
      getLoadoutOverlay,
      clearOverlayInlineState,
      showLoadoutOverlay,
      hideLoadoutOverlay,
      syncArenaSelectionUI,
      getSignatureSkillId,
      updateSkillIcon,
      refreshPips,
      updateHUD,
      showBattleIntro,
      showBattleHud,
      hideBattleHud
    };
  };
})();
