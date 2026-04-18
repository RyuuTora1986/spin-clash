(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleSimTools = function createBattleSimTools(deps){
    const uiText = deps.uiText || {};
    const friction = deps.friction;
    const spinDrain = deps.spinDrain;
    const hazardDrain = deps.hazardDrain;
    const arenaRadius = deps.arenaRadius;
    const topRadius = deps.topRadius;
    const hexPoints = deps.hexPoints;
    const getTimeScale = deps.getTimeScale;
    const setTimeScale = deps.setTimeScale;
    const getCamShake = deps.getCamShake;
    const setCamShake = deps.setCamShake;
    const getPlayerTrailPositions = deps.getPlayerTrailPositions;
    const getEnemyTrailPositions = deps.getEnemyTrailPositions;
    const isCircleArena = deps.isCircleArena;
    const isHeartArena = deps.isHeartArena;
    const isHexArena = deps.isHexArena;
    const heartNearWall = deps.heartNearWall;
    const heartWallNormal = deps.heartWallNormal;
    const heartInHaz = deps.heartInHaz;
    const heartCrossed = deps.heartCrossed;
    const heartRingOut = deps.heartRingOut;
    const polygonContains = deps.polygonContains;
    const nearestPolygonEdgeData = deps.nearestPolygonEdgeData;
    const scalePolygon = deps.scalePolygon;
    const getEnemyAiConfig = deps.getEnemyAiConfig || function(){ return null; };
    const spawnParts = deps.spawnParts;
    const showMsg = deps.showMsg;
    const sfxWall = deps.sfxWall;
    const sfxRingOut = deps.sfxRingOut;
    const sfxCollide = deps.sfxCollide;
    const endRound = deps.endRound;
    const fireSkill = deps.fireSkill;
    const scene = deps.scene;
    const hexInner = scalePolygon(hexPoints,0.82);
    const hexOuter = scalePolygon(hexPoints,1.12);
    const DEFAULT_ENEMY_AI = {
      seekForce:6.5,
      speedCapScale:0.9,
      inwardBiasRadius:5.9,
      inwardBiasForce:7,
      dashRange:4.5,
      dashScale:2.2,
      dashCooldownScaleMin:0.8,
      dashCooldownScaleMax:1.3,
      intentGuardLead:0.28,
      intentDashLead:0.18,
      intentSkillLead:0.36,
      useSkillOnBurstReady:true
    };

    function buildImpactProfile(topA,topB){
      const dx=topA.x-topB.x;
      const dz=topA.z-topB.z;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<0.001){
        return null;
      }
      const nx=dx/dist;
      const nz=dz/dist;
      const rvx=topA.vx-topB.vx;
      const rvz=topA.vz-topB.vz;
      const relativeSpeed=rvx*nx+rvz*nz;
      const aClosingSpeed=Math.max(0,-(topA.vx*nx+topA.vz*nz));
      const bClosingSpeed=Math.max(0,(topB.vx*nx+topB.vz*nz));
      const closingSpeed=aClosingSpeed+bClosingSpeed;
      return {
        dx,dz,dist,nx,nz,rvx,rvz,relativeSpeed,
        aClosingSpeed,
        bClosingSpeed,
        closingSpeed,
        advantage:aClosingSpeed-bClosingSpeed,
        roleThreshold:Math.max(0.6,closingSpeed*0.18),
        force:Math.abs(relativeSpeed)
      };
    }

    function resolveCollisionRoles(topA,topB,impactProfile){
      if(!impactProfile){
        return { aggressor:null, defender:null, clearAdvantage:false };
      }
      if(impactProfile.advantage > impactProfile.roleThreshold){
        return { aggressor:'A', defender:'B', clearAdvantage:true };
      }
      if(impactProfile.advantage < -impactProfile.roleThreshold){
        return { aggressor:'B', defender:'A', clearAdvantage:true };
      }
      return { aggressor:null, defender:null, clearAdvantage:false };
    }

    function buildLegacyCollisionOutcome(topA,topB,impactProfile){
      const force = impactProfile.force;
      const damage = force*0.55;
      const ma=topA.template.mass;
      const mb=topB.template.mass;
      return {
        hpDamageA: topA.phantom ? 0 : damage/ma,
        hpDamageB: topB.phantom ? 0 : damage/mb,
        spinDamageA: topA.phantom ? 0 : force*18,
        spinDamageB: topB.phantom ? 0 : force*18
      };
    }

    function getCollisionRoleBias(top){
      const combat = top && top.template ? top.template.combat : null;
      const collision = combat ? combat.collision : null;
      const baseBias = collision && typeof collision.roleBias === 'number' && isFinite(collision.roleBias)
        ? collision.roleBias
        : 1;
      const runtimeBoost = top && typeof top.roleBiasBoost === 'number' && isFinite(top.roleBiasBoost)
        ? top.roleBiasBoost
        : 0;
      return baseBias + runtimeBoost;
    }

    function getPassiveHpDecayPerSec(top){
      const combat = top && top.template ? top.template.combat : null;
      const attrition = combat ? combat.attrition : null;
      return attrition && typeof attrition.hpDecayPerSec === 'number' && isFinite(attrition.hpDecayPerSec)
        ? Math.max(0, attrition.hpDecayPerSec)
        : 0;
    }

    function hasGuardAction(top){
      const combat = top && top.template ? top.template.combat : null;
      const actions = combat ? combat.actions : null;
      const guard = actions ? actions.guard : null;
      return !guard || guard.enabled !== false;
    }

    function getGuardRuntimeConfig(top){
      const combat = top && top.template ? top.template.combat : null;
      const actions = combat ? combat.actions : null;
      const guard = actions ? actions.guard : null;
      return guard || {};
    }

    function getSignatureSkillId(template){
      const combat = template && template.combat ? template.combat : null;
      const actions = combat && combat.actions ? combat.actions : null;
      const signature = actions && actions.signature ? actions.signature : null;
      return (signature && signature.skillId) || (template ? template.skill : null) || 'Fly Charge';
    }

    function setIntent(top,type,lead){
      top.intentType = type;
      top.intentLead = lead;
      top.intentT = lead;
      top.intentSkillId = type === 'skill' ? getSignatureSkillId(top.template) : null;
    }

    function clearIntent(top){
      top.intentType = null;
      top.intentLead = 0;
      top.intentT = 0;
      top.intentSkillId = null;
    }

    function executeGuardIntent(ai){
      if(!hasGuardAction(ai) || ai.guarding || ai.guardCD>0) return;
      const guardConfig = getGuardRuntimeConfig(ai);
      ai.guarding = true;
      ai.guardT = guardConfig.duration || ai.GUARD_T || 0.82;
      ai.guardCD = (guardConfig.cooldown || ai.GUARD_CD || 4.0) * (0.92 + Math.random()*0.24);
    }

    function executeDashIntent(ai,dashScale,dashCooldownScaleMin,dashCooldownScaleMax){
      if(ai.guarding || ai.dashCD>0) return;
      ai.vx *= dashScale;
      ai.vz *= dashScale;
      ai.dashing = true;
      ai.dashT = 0.18;
      ai.dashCD = ai.DASH_CD * (dashCooldownScaleMin + Math.random()*(dashCooldownScaleMax-dashCooldownScaleMin));
    }

    function executeSkillIntent(ai,player){
      if(ai.guarding || ai.burst<100 || ai.skillCD>0) return;
      ai.burst = 0;
      ai.skillCD = ai.SKILL_CD;
      fireSkill(ai,player);
    }

    function getDefenseMultipliers(top){
      let hpMul = 1;
      let spinMul = 1;
      if(top && top.shielded){
        hpMul *= 0.2;
        spinMul *= 0.34;
      }
      if(top && top.guarding){
        hpMul *= 0.54;
        spinMul *= 0.60;
      }
      return { hpMul, spinMul };
    }

    function buildCollisionOutcome(topA,topB,impactProfile,collisionRoles){
      const outcome = buildLegacyCollisionOutcome(topA,topB,impactProfile);
      if(!collisionRoles || !collisionRoles.clearAdvantage || !collisionRoles.aggressor){
        return outcome;
      }
      const aggressorIsA = collisionRoles.aggressor === 'A';
      const aggressor = aggressorIsA ? topA : topB;
      const defender = aggressorIsA ? topB : topA;
      const aggressorBias = getCollisionRoleBias(aggressor);
      const defenderBias = getCollisionRoleBias(defender);
      const advantageRatio = Math.min(1, Math.abs(impactProfile.advantage) / Math.max(impactProfile.closingSpeed || 0, 1));
      const hpRoleShift = Math.min(0.34, 0.12 + advantageRatio * 0.2 + Math.max(0, aggressorBias - 1) * 0.08);
      const spinRoleShift = Math.min(0.30, 0.1 + advantageRatio * 0.18 + Math.max(0, aggressorBias - 1) * 0.06);
      const defenderRoleBonus = 1 + hpRoleShift + Math.max(0, 1 - defenderBias) * 0.08;
      const aggressorHpMul = Math.max(0.62, 1 - hpRoleShift * 0.78);
      const aggressorSpinMul = Math.max(0.7, 1 - spinRoleShift * 0.7);
      const defenderSpinBonus = 1 + spinRoleShift + Math.max(0, 1 - defenderBias) * 0.06;
      if(aggressorIsA){
        outcome.hpDamageA *= aggressorHpMul;
        outcome.hpDamageB *= defenderRoleBonus;
        outcome.spinDamageA *= aggressorSpinMul;
        outcome.spinDamageB *= defenderSpinBonus;
      }else{
        outcome.hpDamageB *= aggressorHpMul;
        outcome.hpDamageA *= defenderRoleBonus;
        outcome.spinDamageB *= aggressorSpinMul;
        outcome.spinDamageA *= defenderSpinBonus;
      }
      const defenseA = getDefenseMultipliers(topA);
      const defenseB = getDefenseMultipliers(topB);
      outcome.hpDamageA *= defenseA.hpMul;
      outcome.hpDamageB *= defenseB.hpMul;
      outcome.spinDamageA *= defenseA.spinMul;
      outcome.spinDamageB *= defenseB.spinMul;
      return outcome;
    }

    function movTop(top,dt){
      if(!top.alive) return;
      const frictionScale = Math.pow(friction,dt*60);
      top.vx *= frictionScale;
      top.vz *= frictionScale;
      const slopeK = isCircleArena() ? 5.5 : (isHeartArena() ? 4.8 : 5.0);
      if(isCircleArena()){
        const dist0 = Math.sqrt(top.x*top.x+top.z*top.z);
        if(dist0>0.05){
          const slope = slopeK*Math.pow(dist0/arenaRadius,0.8);
          top.vx -= top.x/dist0*slope*dt;
          top.vz -= top.z/dist0*slope*dt;
        }
      }else{
        const dist0 = Math.sqrt(top.x*top.x+top.z*top.z);
        if(dist0>0.05){
          top.vx -= top.x/dist0*slopeK*0.6*dt;
          top.vz -= top.z/dist0*slopeK*0.6*dt;
        }
      }
      top.x += top.vx*dt;
      top.z += top.vz*dt;

      if(top.dashing){
        top.dashT -= dt;
        if(top.dashT<=0) top.dashing = false;
      }
      if(top.shielded){
        top.shieldT -= dt;
        if(top.mesh) top.mesh.traverse((child)=>{ if(child.material) child.material.emissiveIntensity=.4+Math.sin(Date.now()*.007)*.45; });
        if(top.shieldT<=0){
          top.shielded = false;
          if(top.mesh) top.mesh.traverse((child)=>{ if(child.material) child.material.emissiveIntensity=.35; });
        }
      }
      if(top.guarding){
        top.guardT -= dt;
        if(top.mesh) top.mesh.traverse((child)=>{ if(child.material) child.material.emissiveIntensity=.48+Math.sin(Date.now()*.009)*.22; });
        if(top.guardT<=0){
          top.guarding = false;
          top.guardT = 0;
          if(top.mesh) top.mesh.traverse((child)=>{ if(child.material) child.material.emissiveIntensity=.35; });
        }
      }
      if(top.phantom){
        top.phantomT -= dt;
        if(top.mesh) top.mesh.traverse((child)=>{ if(child.isMesh&&child.material){ child.material.transparent=true; child.material.opacity=.40; } });
        if(top.phantomT<=0){
          top.phantom = false;
          if(top.mesh) top.mesh.traverse((child)=>{ if(child.isMesh&&child.material){ child.material.transparent=false; child.material.opacity=1; } });
        }
      }
      if(top.roleBiasBoostT>0){
        top.roleBiasBoostT = Math.max(0, top.roleBiasBoostT - dt);
        if(top.roleBiasBoostT<=0){
          top.roleBiasBoost = 0;
        }
      }
      top.dashCD = Math.max(0,top.dashCD-dt);
      top.guardCD = Math.max(0,(top.guardCD||0)-dt);
      top.skillCD = Math.max(0,top.skillCD-dt);
      top.wallCD = Math.max(0,(top.wallCD||0)-dt);

      const dist = Math.sqrt(top.x*top.x+top.z*top.z);
      const inHaz = isCircleArena()
        ? dist>6.5
        : (isHeartArena() ? heartInHaz(top.x,top.z) : (polygonContains(hexPoints,top.x,top.z) && !polygonContains(hexInner,top.x,top.z)));
      top.spin = Math.max(0,top.spin-(spinDrain+(inHaz?hazardDrain:0))*dt);
      const passiveHpDecay = getPassiveHpDecayPerSec(top);
      if(passiveHpDecay>0){
        top.hp = Math.max(0, top.hp - passiveHpDecay*dt);
      }

      let nearWall=false;
      let wallNx=0;
      let wallNz=0;
      if(isCircleArena()){
        if(dist>arenaRadius-topRadius-0.1&&dist>0.01){ nearWall=true; wallNx=top.x/dist; wallNz=top.z/dist; }
      }else if(isHeartArena()){
        if(heartNearWall(top.x,top.z)){
          nearWall=true;
          const wallNormal = heartWallNormal(top.x,top.z);
          wallNx = wallNormal.nx;
          wallNz = wallNormal.nz;
        }
      }else{
        const edge = nearestPolygonEdgeData(hexPoints,top.x,top.z);
        if(polygonContains(hexPoints,top.x,top.z) && edge.dist < topRadius+0.12){
          nearWall = true;
          wallNx = edge.nx;
          wallNz = edge.nz;
        }
      }

      if(nearWall && top.wallCD<=0){
        const dot = top.vx*wallNx + top.vz*wallNz;
        if(dot>0){
          const speed = Math.sqrt(top.vx*top.vx+top.vz*top.vz);
          const elasticity = 1.38+Math.min(speed*0.028,0.28);
          top.vx -= elasticity*dot*wallNx;
          top.vz -= elasticity*dot*wallNz;
          if(isCircleArena()){
            const safeRadius = arenaRadius-topRadius-0.18;
            top.x = wallNx*safeRadius;
            top.z = wallNz*safeRadius;
          }else{
            top.x -= wallNx*0.42;
            top.z -= wallNz*0.42;
          }
          top.spin = Math.max(0,top.spin-22);
          top.burst = Math.min(100,top.burst+8);
          top.wallCD = 0.15;
          const tiltForce = dot*0.65;
          top.tiltVX += wallNz*tiltForce;
          top.tiltVZ -= wallNx*tiltForce;
          (top.isPlayer ? getPlayerTrailPositions() : getEnemyTrailPositions()).length = 0;
          sfxWall(Math.abs(dot));
          spawnParts(top.x,top.z,isCircleArena()?0x2299ff:(isHeartArena()?0xff2288:0xffb000),6);
          spawnParts(top.x,top.z,0xffffff,3);
          setCamShake(Math.min(0.8,getCamShake()+Math.abs(dot)*0.11));
        }
      }

      const isOut = isCircleArena()
        ? dist>arenaRadius+1.0
        : (isHeartArena() ? heartRingOut(top.x,top.z) : !polygonContains(hexOuter,top.x,top.z));
      if(isCircleArena()&&dist>arenaRadius+0.05&&dist<arenaRadius+0.3&&getTimeScale()>0.5) setTimeScale(0.18);
      if(isHeartArena()&&heartCrossed(top.x,top.z)&&!heartRingOut(top.x,top.z)&&getTimeScale()>0.5) setTimeScale(0.18);
      if(isHexArena()&&polygonContains(hexOuter,top.x,top.z)&&!polygonContains(hexPoints,top.x,top.z)&&getTimeScale()>0.5) setTimeScale(0.18);

      if(isOut){
        top.alive=false;
        if(top.mesh){
          spawnParts(top.x,top.z,top.template.color,32);
          spawnParts(top.x,top.z,0xffffff,16);
          spawnParts(top.x,top.z,0xffcc00,10);
          scene.remove(top.mesh);
          top.mesh=null;
        }
        (top.isPlayer ? getPlayerTrailPositions() : getEnemyTrailPositions()).length = 0;
        setCamShake(1.1);
        sfxRingOut();
        showMsg(
          top.isPlayer
            ? (uiText.messagePlayerRingOut || 'You were knocked out of the arena!')
            : (uiText.messageEnemyRingOut || 'The opponent flew out of the arena!'),
          1.6,
          'impact'
        );
        endRound('ringout');
        return;
      }
      if(top.spin<=0){
        top.alive=false;
        if(top.mesh){ spawnParts(top.x,top.z,top.template.color,10); scene.remove(top.mesh); top.mesh=null; }
        endRound('spinout');
        return;
      }
      if(top.hp<=0){
        top.hp=0;
        top.alive=false;
        if(top.mesh){ spawnParts(top.x,top.z,top.template.color,10); scene.remove(top.mesh); top.mesh=null; }
        endRound('hpout');
      }
    }

    function checkColl(topA,topB){
      if(!topA.alive||!topB.alive) return;
      const impactProfile = buildImpactProfile(topA,topB);
      if(!impactProfile || impactProfile.dist>=topRadius*2) return;
      if(impactProfile.relativeSpeed>0) return;
      const nx=impactProfile.nx;
      const nz=impactProfile.nz;
      const ma=topA.template.mass;
      const mb=topB.template.mass;
      const elasticity=0.95;
      const impulse=-(1+elasticity)*impactProfile.relativeSpeed/(1/ma+1/mb);
      topA.vx += impulse/ma*nx;
      topA.vz += impulse/ma*nz;
      topB.vx -= impulse/mb*nx;
      topB.vz -= impulse/mb*nz;
      const overlap=topRadius*2-impactProfile.dist;
      topA.x += nx*overlap*.55;
      topA.z += nz*overlap*.55;
      topB.x -= nx*overlap*.45;
      topB.z -= nz*overlap*.45;
      const force=impactProfile.force;
      const collisionRoles = resolveCollisionRoles(topA,topB,impactProfile);
      const outcome = buildCollisionOutcome(topA,topB,impactProfile,collisionRoles);
      if(outcome.hpDamageA>0) topA.hp=Math.max(0,topA.hp-outcome.hpDamageA);
      if(outcome.hpDamageB>0) topB.hp=Math.max(0,topB.hp-outcome.hpDamageB);
      if(outcome.spinDamageA>0) topA.spin=Math.max(0,topA.spin-outcome.spinDamageA);
      if(outcome.spinDamageB>0) topB.spin=Math.max(0,topB.spin-outcome.spinDamageB);
      const lowA=topA.hp/topA.maxHp<0.3?1.6:1;
      const lowB=topB.hp/topB.maxHp<0.3?1.6:1;
      topA.burst=Math.min(100,topA.burst+force*14*topA.template.brate*lowA);
      topB.burst=Math.min(100,topB.burst+force*14*topB.template.brate*lowB);
      const tiltForce=force*.38;
      topA.tiltVX += (-nz)*tiltForce/ma;
      topA.tiltVZ += nx*tiltForce/ma;
      topB.tiltVX += nz*tiltForce/mb;
      topB.tiltVZ += (-nx)*tiltForce/mb;
      const centerX=(topA.x+topB.x)/2;
      const centerZ=(topA.z+topB.z)/2;
      const bigHit=force>5.5;
      spawnParts(centerX,centerZ,bigHit?0xffff44:0xffffff,Math.round(Math.min(22,6+force*2)));
      if(bigHit){
        spawnParts(centerX,centerZ,0xff8800,8);
        spawnParts(centerX,centerZ,topA.template.color,5);
        spawnParts(centerX,centerZ,topB.template.color,5);
      }
      setCamShake(Math.min(.9,force*.13));
      sfxCollide(force);
      if(force>7) showMsg(uiText.messageHeavyCollision || 'Heavy Collision!',.6,'impact');
      if(force>11) showMsg(uiText.messageSuperImpact || 'Super Impact!!',.8,'impact');
    }

    function aiTick(ai,player,dt){
      if(!ai.alive||!player.alive) return;
      const aiConfig = getEnemyAiConfig() || {};
      const seekForce = typeof aiConfig.seekForce === 'number' ? aiConfig.seekForce : DEFAULT_ENEMY_AI.seekForce;
      const speedCapScale = typeof aiConfig.speedCapScale === 'number' ? aiConfig.speedCapScale : DEFAULT_ENEMY_AI.speedCapScale;
      const inwardBiasRadius = typeof aiConfig.inwardBiasRadius === 'number' ? aiConfig.inwardBiasRadius : DEFAULT_ENEMY_AI.inwardBiasRadius;
      const inwardBiasForce = typeof aiConfig.inwardBiasForce === 'number' ? aiConfig.inwardBiasForce : DEFAULT_ENEMY_AI.inwardBiasForce;
      const dashRange = typeof aiConfig.dashRange === 'number' ? aiConfig.dashRange : DEFAULT_ENEMY_AI.dashRange;
      const dashScale = typeof aiConfig.dashScale === 'number' ? aiConfig.dashScale : DEFAULT_ENEMY_AI.dashScale;
      const dashCooldownScaleMin = typeof aiConfig.dashCooldownScaleMin === 'number' ? aiConfig.dashCooldownScaleMin : DEFAULT_ENEMY_AI.dashCooldownScaleMin;
      const dashCooldownScaleMax = typeof aiConfig.dashCooldownScaleMax === 'number' ? aiConfig.dashCooldownScaleMax : DEFAULT_ENEMY_AI.dashCooldownScaleMax;
      const intentGuardLead = typeof aiConfig.intentGuardLead === 'number' ? aiConfig.intentGuardLead : DEFAULT_ENEMY_AI.intentGuardLead;
      const intentDashLead = typeof aiConfig.intentDashLead === 'number' ? aiConfig.intentDashLead : DEFAULT_ENEMY_AI.intentDashLead;
      const intentSkillLead = typeof aiConfig.intentSkillLead === 'number' ? aiConfig.intentSkillLead : DEFAULT_ENEMY_AI.intentSkillLead;
      const useSkillOnBurstReady = typeof aiConfig.useSkillOnBurstReady === 'boolean' ? aiConfig.useSkillOnBurstReady : DEFAULT_ENEMY_AI.useSkillOnBurstReady;
      const dx=player.x-ai.x;
      const dz=player.z-ai.z;
      const dist=Math.sqrt(dx*dx+dz*dz)||1;
      ai.vx += dx/dist*seekForce*dt;
      ai.vz += dz/dist*seekForce*dt;
      const speed=Math.sqrt(ai.vx*ai.vx+ai.vz*ai.vz);
      const cap=ai.template.spd*speedCapScale;
      if(speed>cap){
        ai.vx=ai.vx/speed*cap;
        ai.vz=ai.vz/speed*cap;
      }
      const centerDist=Math.sqrt(ai.x*ai.x+ai.z*ai.z);
      if(centerDist>inwardBiasRadius){
        ai.vx -= ai.x/centerDist*inwardBiasForce*dt;
        ai.vz -= ai.z/centerDist*inwardBiasForce*dt;
      }
      const wantsSkill = useSkillOnBurstReady && !ai.guarding && ai.burst>=100 && ai.skillCD<=0;
      const wantsGuard = hasGuardAction(ai)
        && !ai.guarding
        && ai.guardCD<=0
        && dist<3.2
        && (player.dashing || player.burst>=100 || Math.abs(ai.vx-player.vx)+Math.abs(ai.vz-player.vz)>12);
      const wantsDash = !ai.guarding && ai.dashCD<=0 && dist<dashRange;
      if(ai.intentType && ai.intentT>0){
        ai.intentT = Math.max(0, ai.intentT - dt);
        if(ai.intentT<=0){
          const intentType = ai.intentType;
          clearIntent(ai);
          if(intentType === 'skill') executeSkillIntent(ai,player);
          else if(intentType === 'guard') executeGuardIntent(ai);
          else if(intentType === 'dash') executeDashIntent(ai,dashScale,dashCooldownScaleMin,dashCooldownScaleMax);
        }
        return;
      }
      if(wantsSkill){
        setIntent(ai,'skill',intentSkillLead);
        return;
      }
      if(wantsGuard){
        setIntent(ai,'guard',intentGuardLead);
        return;
      }
      if(wantsDash){
        setIntent(ai,'dash',intentDashLead);
      }
    }

    return {
      movTop,
      buildImpactProfile,
      buildCollisionOutcome,
      getDefenseMultipliers,
      checkColl,
      resolveCollisionRoles,
      aiTick
    };
  };
})();
