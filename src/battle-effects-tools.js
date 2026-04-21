(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleEffectsTools = function createBattleEffectsTools(options){
    const uiText = options.uiText || {};
    const scene = options.scene || null;
    const showMsg = typeof options.showMsg === 'function' ? options.showMsg : function(){};
    const sfxOrb = typeof options.sfxOrb === 'function' ? options.sfxOrb : function(){};
    const partGeo = options.partGeo || null;
    const orbGeo = options.orbGeo || null;
    const getBattlePerformanceMode = typeof options.getBattlePerformanceMode === 'function' ? options.getBattlePerformanceMode : function(){ return null; };
    const inactiveParticles = [];

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
        life:0
      };
    }

    function spawnParts(partPool,x,z,color,n){
      const perfMode = getBattlePerformanceMode() || {};
      const requestedCount = n || 8;
      const count = perfMode.lowEndMobile ? Math.max(4, Math.round(requestedCount * 0.75)) : requestedCount;
      for(let i=0;i<count;i++){
        const particle = acquireParticle(color);
        const m = particle.mesh;
        const a=Math.PI*2*i/count+Math.random()*.6;
        const s=2+Math.random()*6;
        m.position.set(x,.6,z);
        particle.vx = Math.cos(a)*s;
        particle.vy = 1.5+Math.random()*3;
        particle.vz = Math.sin(a)*s;
        particle.life = 1;
        partPool.push(particle);
      }
    }

    function tickParts(partPool,dt){
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
        p.vx*=.88;
        p.vy-=14*dt;
        p.vz*=.88;
        p.mesh.position.x+=p.vx*dt;
        p.mesh.position.y+=p.vy*dt;
        p.mesh.position.z+=p.vz*dt;
        p.mesh.material.opacity=p.life*.9;
      }
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

    return {
      spawnParts,
      tickParts,
      spawnOrbs,
      tickOrbs
    };
  };
})();
