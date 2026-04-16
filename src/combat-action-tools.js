(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createCombatActionTools = function createCombatActionTools(options){
    const renderer = options.renderer || null;
    const getGameState = typeof options.getGameState === 'function' ? options.getGameState : function(){ return 'title'; };
    const getTp = typeof options.getTp === 'function' ? options.getTp : function(){ return null; };
    const getTe = typeof options.getTe === 'function' ? options.getTe : function(){ return null; };
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const sfxDash = typeof options.sfxDash === 'function' ? options.sfxDash : function(){};
    const sfxSkill = typeof options.sfxSkill === 'function' ? options.sfxSkill : function(){};
    const spawnParts = typeof options.spawnParts === 'function' ? options.spawnParts : function(){};
    const launch = typeof options.launch === 'function' ? options.launch : function(){};
    const onDragStart = typeof options.onDragStart === 'function' ? options.onDragStart : function(){};
    const onDragMove = typeof options.onDragMove === 'function' ? options.onDragMove : function(){};
    const onDragEnd = typeof options.onDragEnd === 'function' ? options.onDragEnd : function(){};

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

    function fireSkill(user,target){
      const sk=user.template.skill;
      sfxSkill(sk);
      if(sk==='Fly Charge'){
        const dx=target.x-user.x,dz=target.z-user.z,d=Math.sqrt(dx*dx+dz*dz)||1;
        user.vx=dx/d*user.template.spd*2.4;
        user.vz=dz/d*user.template.spd*2.4;
        user.dashing=true;
        user.dashT=.28;
        spawnParts(user.x,user.z,0xff6600,18);
        spawnParts(user.x,user.z,0xffff00,8);
        if(user.isPlayer){flashScreen('instant');showMsg('Fly Charge!',1);}
        else showMsg('Enemy used Fly Charge!',.9);
      }else if(sk==='Shield'){
        user.shielded=true;
        user.shieldT=2.8;
        spawnParts(user.x,user.z,0x4488ff,14);
        spawnParts(user.x,user.z,0xaaddff,6);
        if(user.isPlayer){flashScreen('sustained');showMsg('Shield up!',1);}
        else showMsg('Enemy activated Shield!',.9);
      }else if(sk==='Phantom'){
        user.vx*=2.0;
        user.vz*=2.0;
        user.phantom=true;
        user.phantomT=1.2;
        const dx=target.x-user.x,dz=target.z-user.z,d=Math.sqrt(dx*dx+dz*dz)||1;
        target.vx+=dx/d*4.5;
        target.vz+=dz/d*4.5;
        spawnParts(user.x,user.z,0xaa44ff,16);
        spawnParts(user.x,user.z,0xffffff,6);
        if(user.isPlayer){flashScreen('sustained');showMsg('Phantom!',1);}
        else showMsg('Enemy used Phantom!',.9);
      }
    }

    function doPlayerDash(){
      const tp = getTp();
      if(!tp || tp.dashCD>0) return;
      const s=Math.sqrt(tp.vx*tp.vx+tp.vz*tp.vz);
      if(s<.5) return;
      tp.vx*=2.6;
      tp.vz*=2.6;
      tp.dashing=true;
      tp.dashT=.18;
      tp.dashCD=tp.DASH_CD;
      sfxDash();
      showMsg('DASH!',.7);
    }

    function doPlayerSkill(){
      const tp = getTp();
      const te = getTe();
      if(!tp || !te || tp.burst<100 || tp.skillCD>0) return;
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
        if(e.code==='KeyQ'){e.preventDefault();doPlayerSkill();}
      });
      ['act-dash','act-skill'].forEach(id=>{
        const el=document.getElementById(id);
        el.addEventListener('touchstart',e=>{
          e.preventDefault();
          e.stopPropagation();
          if(id==='act-dash') doPlayerDash(); else doPlayerSkill();
        },{passive:false});
      });
    }

    return {
      flashScreen,
      fireSkill,
      doPlayerDash,
      doPlayerSkill,
      installInputBindings
    };
  };
})();
