(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createSceneShellTools = function createSceneShellTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const renderer = deps.renderer;
    const camera = deps.camera;
    let baseCameraY = 17;
    let baseCameraZ = 12;

    function installLights(){
      scene.add(new THREE.AmbientLight(0x112233,0.75));
      const centerLight = new THREE.PointLight(0x0099ff,2.8,38);
      centerLight.position.set(0,13,0);
      centerLight.castShadow = true;
      scene.add(centerLight);
      const playerGlow = new THREE.PointLight(0x00ffcc,1.2,20);
      playerGlow.position.set(0,2,7);
      scene.add(playerGlow);
      const enemyGlow = new THREE.PointLight(0xff3300,1.0,20);
      enemyGlow.position.set(0,2,-7);
      scene.add(enemyGlow);
    }

    function onResize(){
      renderer.setSize(innerWidth,innerHeight);
      camera.aspect = innerWidth / innerHeight;
      if(camera.aspect < 1){
        const scale = Math.min(1 / camera.aspect * 0.88, 2.2);
        baseCameraY = 17 * scale;
        baseCameraZ = 12 * scale;
      }else{
        baseCameraY = 17;
        baseCameraZ = 12;
      }
      camera.position.set(0,baseCameraY,baseCameraZ);
      camera.lookAt(0,0,0);
      camera.updateProjectionMatrix();
    }

    function getBaseCameraY(){
      return baseCameraY;
    }

    function getBaseCameraZ(){
      return baseCameraZ;
    }

    return {
      installLights,
      onResize,
      getBaseCameraY,
      getBaseCameraZ
    };
  };
})();
