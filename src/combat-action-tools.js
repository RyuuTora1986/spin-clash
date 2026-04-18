(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createCombatActionTools = function createCombatActionTools(options){
    const uiText = options.uiText || {};
    const signatureSkills = options.signatureSkills || {};
    const renderer = options.renderer || null;
    const getGameState = typeof options.getGameState === 'function' ? options.getGameState : function(){ return 'title'; };
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const sfxDash = typeof options.sfxDash === 'function' ? options.sfxDash : function(){};
    const sfxGuard = typeof options.sfxGuard === 'function' ? options.sfxGuard : function(){};
    const sfxSkill = typeof options.sfxSkill === 'function' ? options.sfxSkill : function(){};
    const spawnParts = typeof options.spawnParts === 'function' ? options.spawnParts : function(){};
    const launch = typeof options.launch === 'function' ? options.launch : function(){};
    const onDragStart = typeof options.onDragStart === 'function' ? options.onDragStart : function(){};
    const onDragMove = typeof options.onDragMove === 'function' ? options.onDragMove : function(){};
    const onDragEnd = typeof options.onDragEnd === 'function' ? options.onDragEnd : function(){};

    function getSkillMessage(owner, skill){
      const messages = uiText.skillMessages && uiText.skillMessages[owner] ? uiText.skillMessages[owner] : {};
      if(messages[skill]) return messages[skill];
      if(owner === 'player') return skill+'!';
      return 'Enemy used '+skill+'!';
    }

    function flashScreen(type){
      const el=document.getElementById('skill-flash');
      el.className='';
      void el.offsetWidth;
      el.style.opacity='1';
      el.className=type;
      if(type==='instant'){
        setTimeout(()=>{el.style.transition='opacity .35s';el.style.opacity='0';},120);
      }else{
        setTimeout(()=>{el.style.transition='opacity .6s';el.style.opacity='0';},700);
      }
    }

    function getSignatureSkillId(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const signature = actions && actions.signature ? actions.signature : null;
      return (signature && signature.skillId) || (template ? template.skill : null) || 'Fly Charge';
    }

    function hasGuardAction(template){
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

    function getSignatureSkillMeta(skillId){
      return skillId && signatureSkills[skillId] ? signatureSkills[skillId] : null;
    }

    function getTopVariantId(template){
      if(!template) return null;
      if(template.variant && template.variant !== 'core') return template.variant;
      if(template.id === 'impact_breaker') return 'breaker';
      if(template.id === 'trick_raider') return 'raider';
      return null;
    }

    function getSignatureSkillTuning(template, skillId){
      const signatureMeta = getSignatureSkillMeta(skillId) || {};
      const baseTuning = signatureMeta.tuning || {};
      const variantId = getTopVariantId(template);
      const variants = signatureMeta.variants || {};
      const variantTuning = variantId && variants[variantId] ? variants[variantId] : null;
      return Object.assign({}, baseTuning, variantTuning || {});
    }

    function announceSignatureSkill(user, skillId){
      const signatureMeta = getSignatureSkillMeta(skillId);
      const telegraph = signatureMeta && signatureMeta.telegraph ? signatureMeta.telegraph : {};
      const tone = telegraph.tone || 'impact';
      const duration = user && user.isPlayer
        ? (typeof telegraph.playerDuration === 'number' ? telegraph.playerDuration : 1)
        : (typeof telegraph.enemyDuration === 'number' ? telegraph.enemyDuration : 0.9);
      if(user && user.isPlayer && telegraph.flashType){
        flashScreen(telegraph.flashType);
      }
      showMsg(getSkillMessage(user && user.isPlayer ? 'player' : 'enemy', skillId), duration, tone);
    }

    function fireSkill(user,target){
      const sk=getSignatureSkillId(user.template);
      const tuning = getSignatureSkillTuning(user && user.template ? user.template : null, sk);
      sfxSkill(sk);
      if(sk==='Fly Charge'){
        const dx=target.x-user.x,dz=target.z-user.z,d=Math.sqrt(dx*dx+dz*dz)||1;
        user.vx=dx/d*user.template.spd*(tuning.chargeScale || 2.4);
        user.vz=dz/d*user.template.spd*(tuning.chargeScale || 2.4);
        user.dashing=true;
        user.dashT=typeof tuning.dashT === 'number' ? tuning.dashT : 0.28;
        if(typeof tuning.roleBiasBoost === 'number' && tuning.roleBiasBoost > 0){
          user.roleBiasBoost = tuning.roleBiasBoost;
          user.roleBiasBoostT = typeof tuning.roleBiasWindow === 'number' ? tuning.roleBiasWindow : 0.48;
        }
        spawnParts(user.x,user.z,0xff6600,18);
        spawnParts(user.x,user.z,0xffff00,8);
        announceSignatureSkill(user, 'Fly Charge');
      }else if(sk==='Fortress Pulse'){
        const dx=target.x-user.x,dz=target.z-user.z,d=Math.sqrt(dx*dx+dz*dz)||1;
        user.vx*=typeof tuning.selfVelocityScale === 'number' ? tuning.selfVelocityScale : 0.26;
        user.vz*=typeof tuning.selfVelocityScale === 'number' ? tuning.selfVelocityScale : 0.26;
        user.tiltVX*=typeof tuning.selfTiltScale === 'number' ? tuning.selfTiltScale : 0.4;
        user.tiltVZ*=typeof tuning.selfTiltScale === 'number' ? tuning.selfTiltScale : 0.4;
        target.vx+=dx/d*(tuning.knockback || 6.8);
        target.vz+=dz/d*(tuning.knockback || 6.8);
        if(typeof target.spin === 'number') target.spin=Math.max(0,target.spin-(tuning.spinDamage || 78));
        if(typeof target.hp === 'number') target.hp=Math.max(0,target.hp-(tuning.hpDamage || 5));
        spawnParts(user.x,user.z,0x66bbff,18);
        spawnParts(user.x,user.z,0xe6f7ff,7);
        spawnParts(target.x,target.z,0x99ddff,10);
        announceSignatureSkill(user, 'Fortress Pulse');
      }else if(sk==='Phantom'){
        const dx=target.x-user.x,dz=target.z-user.z,d=Math.sqrt(dx*dx+dz*dz)||1;
        const nx=dx/d,nz=dz/d;
        const lateralScale = tuning.lateralDrift || 0;
        user.vx = nx * user.template.spd * (tuning.speedMul || 2.0) + (-nz) * lateralScale;
        user.vz = nz * user.template.spd * (tuning.speedMul || 2.0) + nx * lateralScale;
        user.phantom=true;
        user.phantomT=typeof tuning.phantomT === 'number' ? tuning.phantomT : 1.2;
        target.vx+=nx*(tuning.targetKnockback || 4.5);
        target.vz+=nz*(tuning.targetKnockback || 4.5);
        spawnParts(user.x,user.z,0xaa44ff,16);
        spawnParts(user.x,user.z,0xffffff,6);
        announceSignatureSkill(user, 'Phantom');
      }
    }

    function doPlayerDash(){
      const tp = getTp();
      if(!tp || tp.dashCD>0 || tp.guarding) return;
      const s=Math.sqrt(tp.vx*tp.vx+tp.vz*tp.vz);
      if(s<.5) return;
      tp.vx*=2.6;
      tp.vz*=2.6;
      tp.dashing=true;
      tp.dashT=.18;
      tp.dashCD=tp.DASH_CD;
      sfxDash();
      showMsg(uiText.messageDash || 'DASH!',.7,'impact');
    }

    function doPlayerGuard(){
      const tp = getTp();
      if(!tp || tp.guardCD>0 || tp.guarding || !hasGuardAction(tp.template)) return;
      const guardConfig = getGuardActionConfig(tp.template);
      tp.guarding=true;
      tp.guardT=guardConfig.duration || tp.GUARD_T || 0.82;
      tp.guardCD=guardConfig.cooldown || tp.GUARD_CD || 4.0;
      tp.vx*=0.82;
      tp.vz*=0.82;
      spawnParts(tp.x,tp.z,0x66bbff,12);
      spawnParts(tp.x,tp.z,0xe6f7ff,5);
      sfxGuard();
      showMsg(uiText.messageGuard || 'GUARD!',.8,'major');
    }

    function doPlayerSkill(){
      const tp = getTp();
      const te = getTe();
      if(!tp || !te || tp.burst<100 || tp.skillCD>0 || tp.guarding) return;
      tp.burst=0;
      tp.skillCD=tp.SKILL_CD;
      fireSkill(tp,te);
    }

    function installInputBindings(){
      if(!renderer) return;
      renderer.domElement.addEventListener('mousedown',e=>onDragStart(e.clientX,e.clientY));
      renderer.domElement.addEventListener('mousemove',e=>onDragMove(e.clientX,e.clientY));
      renderer.domElement.addEventListener('mouseup',()=>onDragEnd());
      renderer.domElement.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];onDragStart(t.clientX,t.clientY);},{passive:false});
      renderer.domElement.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0];onDragMove(t.clientX,t.clientY);},{passive:false});
      renderer.domElement.addEventListener('touchend',e=>{e.preventDefault();onDragEnd();},{passive:false});
      document.addEventListener('keydown',e=>{
        if(getGameState()!=='active') return;
        if(e.code==='Space'){e.preventDefault();doPlayerDash();}
        if(e.code==='KeyE'){e.preventDefault();doPlayerGuard();}
        if(e.code==='KeyQ'){e.preventDefault();doPlayerSkill();}
      });
      ['act-dash','act-guard','act-skill'].forEach(id=>{
        const el=document.getElementById(id);
        if(!el) return;
        el.addEventListener('touchstart',e=>{
          e.preventDefault();
          e.stopPropagation();
          if(id==='act-dash') doPlayerDash();
          else if(id==='act-guard') doPlayerGuard();
          else doPlayerSkill();
        },{passive:false});
      });
    }

    return {
      flashScreen,
      getSignatureSkillId,
      fireSkill,
      doPlayerDash,
      doPlayerGuard,
      doPlayerSkill,
      installInputBindings
    };
  };
})();
