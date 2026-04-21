(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createTrailRenderTools = function createTrailRenderTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const trailLength = deps.trailLength || 14;
    const tops = deps.tops || [];
    const getPlayerTopId = deps.getPlayerTopId;
    const getEnemyTopId = deps.getEnemyTopId;
    const getBattlePerformanceMode = typeof deps.getBattlePerformanceMode === 'function' ? deps.getBattlePerformanceMode : function(){ return null; };
    const trailGeometry = new THREE.SphereGeometry(0.07, 4, 4);
    let playerTrailMeshes = [];
    let enemyTrailMeshes = [];

    function makeTrail(color){
      const meshes = [];
      for(let i=0; i<trailLength; i++){
        const mesh = new THREE.Mesh(trailGeometry, new THREE.MeshBasicMaterial({
          color,
          transparent:true,
          opacity:0
        }));
        scene.add(mesh);
        meshes.push(mesh);
      }
      return meshes;
    }

    function clearTrailMeshes(){
      [...playerTrailMeshes, ...enemyTrailMeshes].forEach((mesh)=>scene.remove(mesh));
      playerTrailMeshes = [];
      enemyTrailMeshes = [];
    }

    function initTrails(){
      clearTrailMeshes();
      const playerTop = tops[getPlayerTopId()] || tops[0] || { color:0xffffff };
      const enemyTop = tops[getEnemyTopId()] || tops[1] || tops[0] || { color:0xffffff };
      playerTrailMeshes = makeTrail(playerTop.color);
      enemyTrailMeshes = makeTrail(enemyTop.color);
    }

    function getTrailMinDistanceSq(){
      const perfMode = getBattlePerformanceMode() || {};
      const minDistance = perfMode.lowEndMobile ? 0.16 : 0.1;
      return minDistance * minDistance;
    }

    function renderTrailMeshes(meshes, positions, alive, startIndex){
      const firstIndex = typeof startIndex === 'number' ? startIndex : 0;
      for(let index=firstIndex; index<meshes.length; index+=1){
        const mesh = meshes[index];
        const point = positions[index];
        if(point && alive){
          mesh.position.set(point.x, 0.58, point.z);
          const alpha = 1 - index / trailLength;
          mesh.material.opacity = alpha * alpha * 0.55;
          const scale = 0.55 + alpha * 0.45;
          mesh.scale.setScalar(scale);
        }else{
          mesh.material.opacity = 0;
        }
      }
    }

    function updateTrail(meshes, positions, x, z, alive){
      const minDistanceSq = getTrailMinDistanceSq();
      if(alive){
        if(!positions.length){
          positions.push({ x, z });
          renderTrailMeshes(meshes, positions, true);
          return;
        }
        const head = positions[0];
        const prevX = head.x;
        const prevZ = head.z;
        const dx = x - prevX;
        const dz = z - prevZ;
        head.x = x;
        head.z = z;
        const headMesh = meshes[0];
        if(headMesh){
          headMesh.position.set(x, 0.58, z);
          headMesh.material.opacity = 0.55;
          headMesh.scale.setScalar(1);
        }
        if(dx * dx + dz * dz >= minDistanceSq){
          positions.splice(1, 0, { x:prevX, z:prevZ });
          if(positions.length > trailLength) positions.pop();
          renderTrailMeshes(meshes, positions, true, 1);
        }
        return;
      }
      if(!positions.length) return;
      positions.length = 0;
      renderTrailMeshes(meshes, positions, false);
    }

    function updatePlayerTrail(positions, x, z, alive){
      updateTrail(playerTrailMeshes, positions, x, z, alive);
    }

    function updateEnemyTrail(positions, x, z, alive){
      updateTrail(enemyTrailMeshes, positions, x, z, alive);
    }

    return {
      initTrails,
      updatePlayerTrail,
      updateEnemyTrail
    };
  };
})();
