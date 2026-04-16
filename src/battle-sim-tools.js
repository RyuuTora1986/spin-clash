(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleSimTools = function createBattleSimTools(deps){
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
      if(top.phantom){
        top.phantomT -= dt;
        if(top.mesh) top.mesh.traverse((child)=>{ if(child.isMesh&&child.material){ child.material.transparent=true; child.material.opacity=.40; } });
        if(top.phantomT<=0){
          top.phantom = false;
          if(top.mesh) top.mesh.traverse((child)=>{ if(child.isMesh&&child.material){ child.material.transparent=false; child.material.opacity=1; } });
        }
      }
      top.dashCD = Math.max(0,top.dashCD-dt);
      top.skillCD = Math.max(0,top.skillCD-dt);
      top.wallCD = Math.max(0,(top.wallCD||0)-dt);

      const dist = Math.sqrt(top.x*top.x+top.z*top.z);
      const inHaz = isCircleArena()
        ? dist>6.5
        : (isHeartArena() ? heartInHaz(top.x,top.z) : (polygonContains(hexPoints,top.x,top.z) && !polygonContains(hexInner,top.x,top.z)));
      top.spin = Math.max(0,top.spin-(spinDrain+(inHaz?hazardDrain:0))*dt);

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
        showMsg(top.isPlayer?'You were knocked out of the arena!':'The opponent flew out of the arena!',1.6);
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
      const dx=topA.x-topB.x;
      const dz=topA.z-topB.z;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist>=topRadius*2||dist<.001) return;
      const nx=dx/dist;
      const nz=dz/dist;
      const rvx=topA.vx-topB.vx;
      const rvz=topA.vz-topB.vz;
      const relativeSpeed=rvx*nx+rvz*nz;
      if(relativeSpeed>0) return;
      const ma=topA.template.mass;
      const mb=topB.template.mass;
      const elasticity=0.95;
      const impulse=-(1+elasticity)*relativeSpeed/(1/ma+1/mb);
      topA.vx += impulse/ma*nx;
      topA.vz += impulse/ma*nz;
      topB.vx -= impulse/mb*nx;
      topB.vz -= impulse/mb*nz;
      const overlap=topRadius*2-dist;
      topA.x += nx*overlap*.55;
      topA.z += nz*overlap*.55;
      topB.x -= nx*overlap*.45;
      topB.z -= nz*overlap*.45;
      const force=Math.abs(relativeSpeed);
      const damage=force*0.55;
      if(!topA.phantom) topA.hp=Math.max(0,topA.hp-damage/ma*(topB.shielded?.2:1));
      if(!topB.phantom) topB.hp=Math.max(0,topB.hp-damage/mb*(topA.shielded?.2:1));
      if(!topA.phantom) topA.spin=Math.max(0,topA.spin-force*18);
      if(!topB.phantom) topB.spin=Math.max(0,topB.spin-force*18);
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
      if(force>7) showMsg('Heavy Collision!',.6);
      if(force>11) showMsg('Super Impact!!',.8);
    }

    function aiTick(ai,player,dt){
      if(!ai.alive||!player.alive) return;
      const dx=player.x-ai.x;
      const dz=player.z-ai.z;
      const dist=Math.sqrt(dx*dx+dz*dz)||1;
      ai.vx += dx/dist*6.5*dt;
      ai.vz += dz/dist*6.5*dt;
      const speed=Math.sqrt(ai.vx*ai.vx+ai.vz*ai.vz);
      const cap=ai.template.spd*.9;
      if(speed>cap){
        ai.vx=ai.vx/speed*cap;
        ai.vz=ai.vz/speed*cap;
      }
      const centerDist=Math.sqrt(ai.x*ai.x+ai.z*ai.z);
      if(centerDist>5.9){
        ai.vx -= ai.x/centerDist*7*dt;
        ai.vz -= ai.z/centerDist*7*dt;
      }
      if(ai.dashCD<=0&&dist<4.5){
        ai.vx*=2.2;
        ai.vz*=2.2;
        ai.dashing=true;
        ai.dashT=.18;
        ai.dashCD=ai.DASH_CD*(.8+Math.random()*.5);
      }
      if(ai.burst>=100&&ai.skillCD<=0){
        ai.burst=0;
        ai.skillCD=ai.SKILL_CD;
        fireSkill(ai,player);
      }
    }

    return {
      movTop,
      checkColl,
      aiTick
    };
  };
})();
