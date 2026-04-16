(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createUiShellTools = function createUiShellTools(options){
    const tops = options.tops || [];
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const getScore = typeof options.getScore === 'function' ? options.getScore : function(){ return [0,0]; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const skillIcons = options.skillIcons || {};

    function getLoadoutOverlay(){
      return document.getElementById('ov-loadout');
    }

    function clearOverlayInlineState(overlay){
      if(!overlay) return;
      overlay.style.opacity='';
      overlay.style.pointerEvents='';
      overlay.style.zIndex='';
    }

    function showLoadoutOverlay(){
      const overlay = getLoadoutOverlay();
      clearOverlayInlineState(overlay);
      if(overlay) overlay.classList.remove('hide');
    }

    function hideLoadoutOverlay(){
      const overlay = getLoadoutOverlay();
      clearOverlayInlineState(overlay);
      if(overlay) overlay.classList.add('hide');
    }

    function syncArenaSelectionUI(){
      document.querySelectorAll('.arena-opt').forEach((el)=>{
        el.classList.toggle('sel', parseInt(el.dataset.arena,10)===getSelectedArenaIndex());
      });
    }

    function updateSkillIcon(){
      const playerTop = tops[getPlayerTopId()];
      if(!playerTop) return;
      const sk = playerTop.skill;
      const el = document.getElementById('sk-icon');
      if(el) el.textContent = skillIcons[sk] || 'SK';
      const sn = document.getElementById('sn');
      if(sn) sn.textContent = sk;
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
      const pHpPct=tp.hp/tp.maxHp;
      const eHpPct=te.hp/te.maxHp;
      const hpColor=(p,isP)=>p>0.5
        ?(isP?'linear-gradient(90deg,#00cc55,#00ee77)':'linear-gradient(90deg,#cc2200,#ee4400)')
        :p>0.25?'linear-gradient(90deg,#cc7700,#ffaa00)':'linear-gradient(90deg,#cc1100,#ff3300)';
      const phEl=document.getElementById('p-hp');
      phEl.style.width=(pHpPct*100)+'%';
      phEl.style.background=hpColor(pHpPct,true);
      phEl.style.animation=pHpPct<0.25?'hpBeat .5s ease-in-out infinite':'none';
      document.getElementById('p-hp-val').textContent=Math.ceil(tp.hp);
      const ehEl=document.getElementById('e-hp');
      ehEl.style.width=(eHpPct*100)+'%';
      ehEl.style.background=hpColor(eHpPct,false);
      ehEl.style.animation=eHpPct<0.25?'hpBeat .5s ease-in-out infinite':'none';
      document.getElementById('e-hp-val').textContent=Math.ceil(te.hp);
      document.getElementById('p-sp').style.width=(tp.spin/tp.maxSpin*100)+'%';
      document.getElementById('p-bu').style.width=tp.burst+'%';
      document.getElementById('e-sp').style.width=(te.spin/te.maxSpin*100)+'%';
      document.getElementById('e-bu').style.width=te.burst+'%';
      const dashBtn=document.getElementById('act-dash');
      const dashCdEl=document.getElementById('dash-cd');
      const dashCdTxt=document.getElementById('dash-cd-txt');
      if(tp.dashCD>0){
        dashBtn.className='sk-btn dash-cooldown';
        dashCdEl.style.height=(tp.dashCD/tp.DASH_CD*100)+'%';
        dashCdTxt.textContent=tp.dashCD.toFixed(1);
      }else{
        dashBtn.className='sk-btn dash-ready';
        dashCdEl.style.height='0%';
        dashCdTxt.textContent='';
      }
      const skillBtn=document.getElementById('act-skill');
      const skillCdEl=document.getElementById('skill-cd');
      const skillCdTxt=document.getElementById('skill-cd-txt');
      const burstCircle=document.querySelector('#burst-ring circle');
      const CIRC=157;
      if(tp.skillCD>0){
        skillBtn.className='sk-btn state-cooldown';
        skillCdEl.style.height=(tp.skillCD/tp.SKILL_CD*100)+'%';
        skillCdTxt.textContent=tp.skillCD.toFixed(1);
        burstCircle.style.strokeDashoffset=CIRC;
        burstCircle.style.stroke='rgba(255,180,0,0.2)';
      }else if(tp.burst<100){
        skillBtn.className='sk-btn state-need-energy';
        skillCdEl.style.height='0%';
        skillCdTxt.textContent='';
        burstCircle.style.strokeDashoffset=CIRC*(1-tp.burst/100);
        burstCircle.style.stroke='rgba(255,180,0,0.6)';
      }else{
        skillBtn.className='sk-btn state-ready';
        skillCdEl.style.height='0%';
        skillCdTxt.textContent='';
        burstCircle.style.strokeDashoffset=0;
        burstCircle.style.stroke='rgba(255,210,0,0.9)';
      }
    }

    function showBattleHud(){
      document.getElementById('hud').style.display='';
      document.getElementById('act-swap').classList.add('visible');
    }

    function hideBattleHud(){
      document.getElementById('hud').style.display='none';
      document.getElementById('act-swap').classList.remove('visible');
    }

    return {
      getLoadoutOverlay,
      clearOverlayInlineState,
      showLoadoutOverlay,
      hideLoadoutOverlay,
      syncArenaSelectionUI,
      updateSkillIcon,
      refreshPips,
      updateHUD,
      showBattleHud,
      hideBattleHud
    };
  };
})();
