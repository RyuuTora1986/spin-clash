(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleViewTools = function createBattleViewTools(deps){
    const camera = deps.camera;
    const getBaseCameraY = deps.getBaseCameraY;
    const getBaseCameraZ = deps.getBaseCameraZ;
    const updateHUD = deps.updateHUD;
    const getBattleVisualTime = typeof deps.getBattleVisualTime === 'function' ? deps.getBattleVisualTime : function(){ return 0; };
    const getBattlePerformanceMode = typeof deps.getBattlePerformanceMode === 'function' ? deps.getBattlePerformanceMode : function(){ return null; };
    let hudElapsed = 0;
    let lastHudSignature = '';

    function getCrownTransparentMaterials(crown){
      if(!crown) return [];
      if(crown._transparentMaterials) return crown._transparentMaterials;
      const materials = [];
      crown.traverse(function(child){
        if(!child.isMesh || !child.material) return;
        const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
        childMaterials.forEach(function(material){
          if(!material || !material.transparent || materials.indexOf(material)!==-1) return;
          materials.push({
            material:material,
            baseOpacity:material.opacity
          });
        });
      });
      crown._transparentMaterials = materials;
      return materials;
    }

    function buildHudSignature(tp,te){
      return [
        Math.ceil(tp.hp),
        Math.ceil(te.hp),
        Math.round(tp.spin),
        Math.round(te.spin),
        Math.round(tp.burst),
        Math.round(te.burst),
        Math.ceil(tp.dashCD * 10),
        Math.ceil(tp.guardCD * 10),
        Math.ceil(tp.skillCD * 10),
        Math.ceil(te.guardCD * 10),
        Math.ceil(te.skillCD * 10),
        tp.guarding ? 1 : 0,
        te.guarding ? 1 : 0,
        tp.intentType || '',
        te.intentType || ''
      ].join('|');
    }

    function shouldRefreshHud(tp,te,dt){
      const perfMode = getBattlePerformanceMode() || {};
      const hudInterval = perfMode.lowEndMobile ? (1 / 15) : (1 / 24);
      const nextSignature = buildHudSignature(tp,te);
      hudElapsed += dt;
      if(nextSignature !== lastHudSignature || hudElapsed >= hudInterval){
        lastHudSignature = nextSignature;
        hudElapsed = 0;
        return true;
      }
      return false;
    }

    function updateFrame(tp,te,dt,camShake){
      let nextCamShake = camShake;
      const battleVisualTime = getBattleVisualTime();
      if(nextCamShake>0){
        const s=nextCamShake;
        camera.position.x=Math.sin(s*55)*s*.55;
        camera.position.z=getBaseCameraZ()+Math.sin(s*41)*.3;
        camera.position.y=getBaseCameraY()+Math.cos(s*38)*s*.2;
        nextCamShake=Math.max(0,nextCamShake-dt*5.5);
        if(nextCamShake<=0){
          camera.position.set(0,getBaseCameraY(),getBaseCameraZ());
        }
      }
      [tp,te].forEach((top)=>{
        if(!top.alive||!top.mesh) return;
        const joltDamp = Math.pow(0.76,dt*60);
        const liftDamp = Math.pow(0.68,dt*60);
        top.joltX = (top.joltX || 0) * joltDamp;
        top.joltZ = (top.joltZ || 0) * joltDamp;
        top.joltY = (top.joltY || 0) * liftDamp;
        top.spinVisualBoost = Math.max(0,(top.spinVisualBoost || 0) - dt*2.8);
        top.mesh.position.set(top.x + (top.joltX || 0),0.6 + (top.joltY || 0),top.z + (top.joltZ || 0));
        top.mesh.rotation.y+=top.spin/top.maxSpin*150*(1 + (top.spinVisualBoost || 0))*dt;
        if(top.mesh._crown){
          top.mesh._crown.rotation.y-=top.spin/top.maxSpin*150*dt;
          const pulse=0.35+Math.sin(battleVisualTime*3.2)*0.17;
          getCrownTransparentMaterials(top.mesh._crown).forEach(function(entry){
            entry.material.opacity = Math.max(0.08, pulse*(entry.baseOpacity>0.3 ? 1 : 0.55));
          });
        }
        const springK=22;
        const damp=Math.pow(0.82,dt*60);
        top.tiltVX+=(-springK*top.tiltX)*dt;
        top.tiltVZ+=(-springK*top.tiltZ)*dt;
        top.tiltVX*=damp;
        top.tiltVZ*=damp;
        top.tiltX+=top.tiltVX*dt;
        top.tiltZ+=top.tiltVZ*dt;
        const spinRatio=top.spin/top.maxSpin;
        const wobble=spinRatio<0.15?Math.sin(battleVisualTime*14)*(1-spinRatio/0.15)*.28:0;
        const impactLeanX = (top.joltZ || 0) * 0.32;
        const impactLeanZ = (top.joltX || 0) * -0.32;
        top.tiltX=Math.max(-0.55,Math.min(0.55,top.tiltX));
        top.tiltZ=Math.max(-0.55,Math.min(0.55,top.tiltZ+wobble));
        top.mesh.rotation.x=top.tiltX + impactLeanX;
        top.mesh.rotation.z=top.tiltZ + impactLeanZ;
      });
      if(shouldRefreshHud(tp,te,dt)){
        updateHUD();
      }
      return nextCamShake;
    }

    return {
      updateFrame
    };
  };
})();
