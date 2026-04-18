(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleViewTools = function createBattleViewTools(deps){
    const camera = deps.camera;
    const getBaseCameraY = deps.getBaseCameraY;
    const getBaseCameraZ = deps.getBaseCameraZ;
    const updateHUD = deps.updateHUD;

    function updateFrame(tp,te,dt,camShake){
      let nextCamShake = camShake;
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
        top.mesh.position.set(top.x,.6,top.z);
        top.mesh.rotation.y+=top.spin/top.maxSpin*150*dt;
        if(top.mesh._crown){
          top.mesh._crown.rotation.y-=top.spin/top.maxSpin*150*dt;
          const pulse=0.35+Math.sin(Date.now()*.0032)*0.17;
          top.mesh._crown.traverse((child)=>{
            if(child.isMesh&&child.material&&child.material.transparent){
              child.material.opacity=Math.max(0.08,child.material.opacity*0+pulse*(child.material.opacity>0.3?1:0.55));
            }
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
        const wobble=spinRatio<0.15?Math.sin(Date.now()*.014)*(1-spinRatio/0.15)*.28:0;
        top.tiltX=Math.max(-0.55,Math.min(0.55,top.tiltX));
        top.tiltZ=Math.max(-0.55,Math.min(0.55,top.tiltZ+wobble));
        top.mesh.rotation.x=top.tiltX;
        top.mesh.rotation.z=top.tiltZ;
      });
      updateHUD();
      return nextCamShake;
    }

    return {
      updateFrame
    };
  };
})();
