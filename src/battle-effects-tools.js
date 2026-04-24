(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleEffectsTools = function createBattleEffectsTools(options){
    const uiText = options.uiText || {};
    const scene = options.scene || null;
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const sfxOrb = typeof options.sfxOrb === 'function' ? options.sfxOrb : function(){};
    const partGeo = options.partGeo || null;
    const orbGeo = options.orbGeo || null;
    const impactTexture = options.impactTexture || null;
    const ringOutTexture = options.ringOutTexture || null;
    const getBattlePerformanceMode = typeof options.getBattlePerformanceMode === 'function' ? options.getBattlePerformanceMode : function(){ return null; };
    const inactiveParticles = [];
    const inactiveBursts = [];
    const activeBursts = [];

    function getEffectCount(requestedCount, minimum){
      const perfMode = getBattlePerformanceMode() || {};
      const baseCount = Math.max(minimum || 1, requestedCount || 1);
      if(!perfMode.lowEndMobile) return baseCount;
      return Math.max(minimum || 1, Math.round(baseCount * 0.72));
    }

    function acquireParticle(color){
      const next = inactiveParticles.pop();
      if(next){
        next.mesh.material.color.setHex(color);
        next.mesh.material.opacity = 1;
        next.mesh.visible = true;
        if(next.mesh.parent !== scene){
          scene.add(next.mesh);
        }
        return next;
      }
      return {
        mesh:new THREE.Mesh(partGeo,new THREE.MeshBasicMaterial({ color, transparent:true, opacity:1 })),
        vx:0,
        vy:0,
        vz:0,
        life:0,
        gravity:14,
        drag:0.88,
        fade:0.9,
        scale:1
      };
    }

    function acquireBurst(texture){
      const next = inactiveBursts.pop();
      if(next){
        next.mesh.material.map = texture || null;
        next.mesh.material.needsUpdate = true;
        next.mesh.material.opacity = 1;
        next.mesh.visible = true;
        if(next.mesh.parent !== scene){
          scene.add(next.mesh);
        }
        return next;
      }
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1,1),
        new THREE.MeshBasicMaterial({
          map:texture || null,
          transparent:true,
          opacity:1,
          depthWrite:false,
          depthTest:false,
          blending:THREE.AdditiveBlending,
          toneMapped:false
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 974;
      mesh.frustumCulled = false;
      return {
        mesh:mesh,
        life:0,
        fade:1,
        growth:1,
        baseScale:1,
        spin:0
      };
    }

    function emitOverlayBurst(texture,config){
      if(!texture) return;
      const settings = config || {};
      const burst = acquireBurst(texture);
      const mesh = burst.mesh;
      mesh.position.set(settings.x || 0, typeof settings.y === 'number' ? settings.y : 0.08, settings.z || 0);
      mesh.rotation.y = settings.rotation || 0;
      burst.life = typeof settings.life === 'number' ? settings.life : 0.42;
      burst.maxLife = burst.life;
      burst.fade = typeof settings.fade === 'number' ? settings.fade : 1;
      burst.growth = typeof settings.growth === 'number' ? settings.growth : 1;
      burst.baseScale = typeof settings.baseScale === 'number' ? settings.baseScale : 1;
      burst.spin = typeof settings.spin === 'number' ? settings.spin : 0;
      mesh.scale.setScalar(burst.baseScale);
      activeBursts.push(burst);
    }

    function spawnBurst(partPool,x,z,color,count,config){
      const settings = config || {};
      const dirX = typeof settings.dirX === 'number' ? settings.dirX : 0;
      const dirZ = typeof settings.dirZ === 'number' ? settings.dirZ : 0;
      const spread = typeof settings.spread === 'number' ? settings.spread : Math.PI;
      const baseAngle = Math.atan2(dirZ, dirX);
      const minSpeed = typeof settings.minSpeed === 'number' ? settings.minSpeed : 2;
      const maxSpeed = typeof settings.maxSpeed === 'number' ? settings.maxSpeed : 8;
      const y = typeof settings.y === 'number' ? settings.y : 0.6;
      const minLift = typeof settings.minLift === 'number' ? settings.minLift : 1.5;
      const maxLift = typeof settings.maxLift === 'number' ? settings.maxLift : 4.5;
      const life = typeof settings.life === 'number' ? settings.life : 1;
      const gravity = typeof settings.gravity === 'number' ? settings.gravity : 14;
      const drag = typeof settings.drag === 'number' ? settings.drag : 0.88;
      const fade = typeof settings.fade === 'number' ? settings.fade : 0.9;
      const scale = typeof settings.scale === 'number' ? settings.scale : 1;
      const burstCount = getEffectCount(count, Math.min(4, count || 1));
      for(let i=0;i<burstCount;i++){
        const particle = acquireParticle(color);
        const m = particle.mesh;
        const laneRatio = burstCount > 1 ? i / (burstCount - 1) : 0.5;
        const angle = dirX || dirZ
          ? baseAngle + (laneRatio - 0.5) * spread + (Math.random() - 0.5) * spread * 0.18
          : Math.PI * 2 * laneRatio + Math.random() * 0.6;
        const speed = minSpeed + Math.random() * Math.max(0, maxSpeed - minSpeed);
        m.position.set(x,y,z);
        m.scale.setScalar(scale * (0.88 + Math.random() * 0.36));
        particle.vx = Math.cos(angle) * speed;
        particle.vy = minLift + Math.random() * Math.max(0, maxLift - minLift);
        particle.vz = Math.sin(angle) * speed;
        particle.life = life * (0.88 + Math.random() * 0.22);
        particle.gravity = gravity;
        particle.drag = drag;
        particle.fade = fade;
        particle.scale = m.scale.x;
        partPool.push(particle);
      }
    }

    function spawnParts(partPool,x,z,color,n){
      const requestedCount = n || 8;
      const count = getEffectCount(requestedCount, 4);
      for(let i=0;i<count;i++){
        spawnBurst(partPool,x,z,color,1,{
          spread:Math.PI * 2,
          minSpeed:2 + i * 0.02,
          maxSpeed:8,
          y:0.6,
          minLift:1.5,
          maxLift:4.5,
          life:1,
          gravity:14,
          drag:0.88,
          fade:0.9,
          scale:1
        });
      }
    }

    function tickParts(partPool,dt){
      for(let i=activeBursts.length-1;i>=0;i--){
        const burst = activeBursts[i];
        burst.life -= dt;
        if(burst.life<=0){
          scene.remove(burst.mesh);
          burst.mesh.visible = false;
          inactiveBursts.push(burst);
          activeBursts.splice(i,1);
          continue;
        }
        const progress = 1 - burst.life / Math.max(0.0001, burst.maxLife || 1);
        const scale = burst.baseScale * (1 + progress * burst.growth);
        burst.mesh.scale.setScalar(scale);
        burst.mesh.material.opacity = Math.max(0, (1 - progress) * burst.fade);
        burst.mesh.rotation.y += burst.spin * dt;
      }
      for(let i=partPool.length-1;i>=0;i--){
        const p=partPool[i];
        p.life-=dt*2.2;
        if(p.life<=0){
          scene.remove(p.mesh);
          p.mesh.visible = false;
          inactiveParticles.push(p);
          partPool.splice(i,1);
          continue;
        }
        p.vx*=typeof p.drag === 'number' ? p.drag : 0.88;
        p.vy-=(typeof p.gravity === 'number' ? p.gravity : 14)*dt;
        p.vz*=typeof p.drag === 'number' ? p.drag : 0.88;
        p.mesh.position.x+=p.vx*dt;
        p.mesh.position.y+=p.vy*dt;
        p.mesh.position.z+=p.vz*dt;
        p.mesh.material.opacity=p.life*(typeof p.fade === 'number' ? p.fade : 0.9);
        if(typeof p.scale === 'number'){
          const scale = Math.max(0.2, p.scale * (0.55 + p.life * 0.65));
          p.mesh.scale.setScalar(scale);
        }
      }
    }

    function emitClashEffect(partPool,payload){
      const impact = payload || {};
      const force = Math.max(0, impact.force || 0);
      const dirX = typeof impact.nx === 'number' ? impact.nx : 0;
      const dirZ = typeof impact.nz === 'number' ? impact.nz : 0;
      const centerX = typeof impact.x === 'number' ? impact.x : 0;
      const centerZ = typeof impact.z === 'number' ? impact.z : 0;
      const intensity = Math.min(1.5, 0.42 + force / 9);
      const mainCount = Math.round(8 + force * 1.5);
      spawnBurst(partPool,centerX,centerZ,impact.coreColor || 0xffffff,mainCount,{
        dirX:dirX,
        dirZ:dirZ,
        spread:1.25,
        minSpeed:3.5,
        maxSpeed:7.5 + force * 0.3,
        minLift:1.8,
        maxLift:4.8 + intensity,
        life:0.68 + intensity * 0.18,
        gravity:11,
        drag:0.9,
        fade:0.95,
        scale:0.92 + intensity * 0.12
      });
      if(impact.accentColor){
        spawnBurst(partPool,centerX,centerZ,impact.accentColor,Math.round(4 + force * 0.8),{
          dirX:-dirX,
          dirZ:-dirZ,
          spread:1.6,
          minSpeed:2.6,
          maxSpeed:5.8 + force * 0.22,
          minLift:1.2,
          maxLift:3.5,
          life:0.54 + intensity * 0.16,
          gravity:10,
          drag:0.92,
          fade:0.82,
          scale:0.76 + intensity * 0.1
        });
      }
      emitOverlayBurst(impactTexture,{
        x:centerX,
        z:centerZ,
        y:0.18,
        life:0.34 + intensity * 0.1,
        fade:0.98,
        growth:1.1 + intensity * 0.44,
        baseScale:1.65 + intensity * 0.88,
        spin:(Math.random() - 0.5) * 0.8
      });
    }

    function emitWallImpactEffect(partPool,payload){
      const impact = payload || {};
      const speed = Math.max(0, impact.speed || 0);
      const dirX = typeof impact.nx === 'number' ? impact.nx : 0;
      const dirZ = typeof impact.nz === 'number' ? impact.nz : 0;
      const intensity = Math.min(1.4, 0.35 + speed / 10);
      spawnBurst(partPool,impact.x || 0,impact.z || 0,impact.rimColor || impact.color || 0xffffff,Math.round(7 + speed * 0.9),{
        dirX:dirX,
        dirZ:dirZ,
        spread:0.92,
        minSpeed:3.8,
        maxSpeed:8.8 + speed * 0.24,
        minLift:1.4,
        maxLift:4.1,
        life:0.62 + intensity * 0.18,
        gravity:12,
        drag:0.9,
        fade:0.92,
        scale:0.88 + intensity * 0.14
      });
      spawnBurst(partPool,impact.x || 0,impact.z || 0,impact.color || 0xffffff,Math.round(3 + speed * 0.45),{
        dirX:-dirX,
        dirZ:-dirZ,
        spread:1.3,
        minSpeed:2.4,
        maxSpeed:5.8,
        minLift:1.0,
        maxLift:2.8,
        life:0.48 + intensity * 0.12,
        gravity:10,
        drag:0.93,
        fade:0.8,
        scale:0.72 + intensity * 0.1
      });
      emitOverlayBurst(impactTexture,{
        x:impact.x || 0,
        z:impact.z || 0,
        y:0.14,
        life:0.26 + intensity * 0.08,
        fade:0.84,
        growth:0.74 + intensity * 0.26,
        baseScale:1.14 + intensity * 0.52,
        spin:(Math.random() - 0.5) * 1.1
      });
    }

    function emitRingOutEffect(partPool,payload){
      const impact = payload || {};
      const centerX = typeof impact.x === 'number' ? impact.x : 0;
      const centerZ = typeof impact.z === 'number' ? impact.z : 0;
      spawnBurst(partPool,centerX,centerZ,impact.color || 0xffffff,20,{
        spread:Math.PI * 2,
        minSpeed:4.2,
        maxSpeed:11.4,
        minLift:1.8,
        maxLift:6.1,
        life:1.02,
        gravity:9.2,
        drag:0.92,
        fade:0.98,
        scale:1.16
      });
      spawnBurst(partPool,centerX,centerZ,impact.flashColor || 0xffffff,10,{
        spread:Math.PI * 2,
        minSpeed:2.8,
        maxSpeed:7.2,
        minLift:3.1,
        maxLift:5.8,
        life:0.84,
        gravity:8.4,
        drag:0.94,
        fade:0.9,
        scale:0.92
      });
      emitOverlayBurst(ringOutTexture,{
        x:centerX,
        z:centerZ,
        y:0.2,
        life:0.86,
        fade:1,
        growth:2.35,
        baseScale:2.7,
        spin:(Math.random() - 0.5) * 0.6
      });
    }

    function spawnOrbs(orbObjs){
      orbObjs.forEach((o)=>{ if(o.alive) scene.remove(o.mesh); });
      orbObjs.length=0;
      [{x:-2.5,z:0},{x:2.5,z:0}].forEach((p)=>{
        const m=new THREE.Mesh(orbGeo,new THREE.MeshStandardMaterial({color:0xffcc00,emissive:0xffaa00,emissiveIntensity:1.3,roughness:0,metalness:.5}));
        m.position.set(p.x,.7,p.z);
        m.castShadow=true;
        scene.add(m);
        orbObjs.push({mesh:m,x:p.x,z:p.z,t:Math.random()*6.28,alive:true});
      });
    }

    function tickOrbs(orbObjs,dt,tp,te){
      orbObjs.forEach((o)=>{
        if(!o.alive)return;
        o.t+=dt;
        o.mesh.position.y=.6+Math.sin(o.t*2)*.22;
        o.mesh.rotation.y+=dt*2;
        [tp,te].forEach((t)=>{
          if(!t.alive||!o.alive)return;
          const dx=t.x-o.x,dz=t.z-o.z;
          if(dx*dx+dz*dz<1.1){
            o.alive=false;
            scene.remove(o.mesh);
            t.burst=Math.min(100,t.burst+55);
            sfxOrb();
            if(t.isPlayer) showMsg(uiText.messageBurstOrb || '+55 BURST',.9);
          }
        });
      });
    }

    function clearEffects(partPool, orbObjs){
      if(Array.isArray(partPool)){
        for(let i=partPool.length-1;i>=0;i--){
          const particle = partPool[i];
          if(particle && particle.mesh){
            scene.remove(particle.mesh);
            particle.mesh.visible = false;
            inactiveParticles.push(particle);
          }
          partPool.splice(i,1);
        }
      }
      for(let i=activeBursts.length-1;i>=0;i--){
        const burst = activeBursts[i];
        if(burst && burst.mesh){
          scene.remove(burst.mesh);
          burst.mesh.visible = false;
          inactiveBursts.push(burst);
        }
        activeBursts.splice(i,1);
      }
      if(Array.isArray(orbObjs)){
        orbObjs.forEach((orb)=>{
          if(orb && orb.mesh){
            scene.remove(orb.mesh);
          }
        });
        orbObjs.length = 0;
      }
    }

    return {
      spawnParts,
      emitClashEffect,
      emitWallImpactEffect,
      emitRingOutEffect,
      tickParts,
      spawnOrbs,
      tickOrbs,
      clearEffects
    };
  };
})();
