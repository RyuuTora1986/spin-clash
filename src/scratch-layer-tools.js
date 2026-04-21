(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createScratchLayerTools = function createScratchLayerTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const renderer = deps.renderer;
    const arenaRadius = deps.arenaRadius;
    const hexRadius = deps.hexRadius;
    const hexPoints = deps.hexPoints;
    const getHeartPoints = deps.getHeartPoints;
    const isCircleArena = deps.isCircleArena;
    const isHeartArena = deps.isHeartArena;
    const getGameState = deps.getGameState;
    const getBattlePerformanceMode = typeof deps.getBattlePerformanceMode === 'function' ? deps.getBattlePerformanceMode : function(){ return null; };
    const arenaMathTools = root.createArenaMathTools ? root.createArenaMathTools() : null;
    const textureSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    let mesh = null;
    let playerPrevX = NaN;
    let playerPrevZ = NaN;
    let enemyPrevX = NaN;
    let enemyPrevZ = NaN;
    let uvScaleX = 1 / (arenaRadius * 2);
    let uvScaleZ = 1 / (arenaRadius * 2);
    let phase = 0;
    let uploadCooldown = 0;
    let textureDirty = false;

    function getScratchUploadInterval(){
      const perfMode = getBattlePerformanceMode() || {};
      return perfMode.lowEndMobile ? (1 / 18) : (1 / 28);
    }

    function getScratchMinDistanceSq(){
      const perfMode = getBattlePerformanceMode() || {};
      const minDistance = perfMode.lowEndMobile ? 0.12 : 0.08;
      return minDistance * minDistance;
    }

    function getBounds(points){
      return points.reduce(function(bounds, point){
        return {
          minX:Math.min(bounds.minX, point.x),
          maxX:Math.max(bounds.maxX, point.x),
          minZ:Math.min(bounds.minZ, point.z),
          maxZ:Math.max(bounds.maxZ, point.z)
        };
      }, {
        minX:Infinity,
        maxX:-Infinity,
        minZ:Infinity,
        maxZ:-Infinity
      });
    }

    function getActiveArenaConfig(){
      const arenas = (root.config && root.config.arenas) || [];
      const state = root.state || {};
      const index = typeof state.currentArenaIndex === 'number' ? state.currentArenaIndex : 0;
      const fallbackType = isCircleArena() ? 'circle' : (isHeartArena() ? 'heart' : 'hex');
      return arenas[index] || arenas[0] || { id:'fallback_arena', type:fallbackType };
    }

    function getActiveArenaProfile(){
      if(arenaMathTools && typeof arenaMathTools.getArenaProfile === 'function'){
        return arenaMathTools.getArenaProfile(getActiveArenaConfig(), {
          arenaRadius:arenaRadius,
          polygonRadius:hexRadius
        });
      }
      if(isCircleArena()){
        return { type:'circle', scratchBowlHeight:0.78 };
      }
      if(isHeartArena()){
        return { type:'heart', scratchBowlHeight:0.78, heartPoints:getHeartPoints() };
      }
      return { type:'hex', scratchBowlHeight:0.78, polygonPoints:hexPoints, polygonRadius:hexRadius, polygonSides:6 };
    }

    function refreshUVScale(){
      const profile = getActiveArenaProfile();
      if(profile.type === 'circle'){
        uvScaleX = 1 / (arenaRadius * 2);
        uvScaleZ = 1 / (arenaRadius * 2);
        return;
      }
      const points = profile.type === 'heart' ? (profile.heartPoints || getHeartPoints()) : (profile.polygonPoints || hexPoints);
      const bounds = getBounds(points);
      const width = Math.max(1, bounds.maxX - bounds.minX);
      const depth = Math.max(1, bounds.maxZ - bounds.minZ);
      uvScaleX = 1 / (width * 1.08);
      uvScaleZ = 1 / (depth * 1.08);
    }

    function clear(){
      ctx.clearRect(0, 0, textureSize, textureSize);
      texture.needsUpdate = true;
      textureDirty = false;
      uploadCooldown = 0;
      playerPrevX = NaN;
      playerPrevZ = NaN;
      enemyPrevX = NaN;
      enemyPrevZ = NaN;
      refreshUVScale();
    }

    function strokeTop(x0, z0, x1, z1, vx, vz, phaseOffset){
      const speed = Math.sqrt(vx * vx + vz * vz);
      const speedRatio = Math.min(speed / 32, 1);
      const wave = Math.sin(phase + phaseOffset) * 0.5 + 0.5;
      const alpha = 0.03 + (1 - speedRatio) * 0.11 + wave * 0.05;
      const lineWidth = 0.7 + (1 - speedRatio) * 1.6 + wave * 0.4;
      ctx.strokeStyle = 'rgba(210,212,220,1)';
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo((0.5 + x0 * uvScaleX) * textureSize, (0.5 - z0 * uvScaleZ) * textureSize);
      ctx.lineTo((0.5 + x1 * uvScaleX) * textureSize, (0.5 - z1 * uvScaleZ) * textureSize);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth = lineWidth * 0.28;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.moveTo((0.5 + x0 * uvScaleX) * textureSize, (0.5 - z0 * uvScaleZ) * textureSize);
      ctx.lineTo((0.5 + x1 * uvScaleX) * textureSize, (0.5 - z1 * uvScaleZ) * textureSize);
      ctx.stroke();
    }

    function tick(playerTop, enemyTop, dt){
      if(getGameState() !== 'active') return;
      uploadCooldown = Math.max(0, uploadCooldown - dt);
      phase += dt * 2.8;
      let drew = false;
      const minDistanceSq = getScratchMinDistanceSq();
      ctx.globalCompositeOperation = 'source-over';
      if(playerTop.alive){
        if(isNaN(playerPrevX)){
          playerPrevX = playerTop.x;
          playerPrevZ = playerTop.z;
        }else{
          const playerDx = playerTop.x - playerPrevX;
          const playerDz = playerTop.z - playerPrevZ;
          if(playerDx * playerDx + playerDz * playerDz >= minDistanceSq){
            strokeTop(playerPrevX, playerPrevZ, playerTop.x, playerTop.z, playerTop.vx, playerTop.vz, 0);
            playerPrevX = playerTop.x;
            playerPrevZ = playerTop.z;
            drew = true;
          }
        }
      }else{
        playerPrevX = NaN;
        playerPrevZ = NaN;
      }
      if(enemyTop.alive){
        if(isNaN(enemyPrevX)){
          enemyPrevX = enemyTop.x;
          enemyPrevZ = enemyTop.z;
        }else{
          const enemyDx = enemyTop.x - enemyPrevX;
          const enemyDz = enemyTop.z - enemyPrevZ;
          if(enemyDx * enemyDx + enemyDz * enemyDz >= minDistanceSq){
            strokeTop(enemyPrevX, enemyPrevZ, enemyTop.x, enemyTop.z, enemyTop.vx, enemyTop.vz, Math.PI);
            enemyPrevX = enemyTop.x;
            enemyPrevZ = enemyTop.z;
            drew = true;
          }
        }
      }else{
        enemyPrevX = NaN;
        enemyPrevZ = NaN;
      }
      if(drew){
        textureDirty = true;
      }
      if(textureDirty && uploadCooldown<=0){
        texture.needsUpdate = true;
        textureDirty = false;
        uploadCooldown = getScratchUploadInterval();
      }
    }

    function buildCircleScratchGeometry(profile){
      const rings = 22;
      const segments = 72;
      const offset = 0.012;
      const bowlHeight = profile.scratchBowlHeight;
      const verts = [];
      const indices = [];
      const uvs = [];
      verts.push(0, offset, 0);
      uvs.push(0.5, 0.5);
      for(let ring = 1; ring <= rings; ring += 1){
        const radius = arenaRadius * ring / rings;
        const y = Math.pow(ring / rings, 1.8) * bowlHeight + offset;
        for(let segment = 0; segment < segments; segment += 1){
          const angle = segment / segments * Math.PI * 2;
          verts.push(radius * Math.cos(angle), y, radius * Math.sin(angle));
          uvs.push(
            0.5 + 0.5 * (ring / rings) * Math.cos(angle),
            0.5 + 0.5 * (ring / rings) * Math.sin(angle)
          );
        }
      }
      for(let segment = 0; segment < segments; segment += 1){
        indices.push(0, 1 + segment, 1 + (segment + 1) % segments);
      }
      for(let ring = 0; ring < rings - 1; ring += 1){
        for(let segment = 0; segment < segments; segment += 1){
          const a = 1 + ring * segments + segment;
          const b = 1 + ring * segments + (segment + 1) % segments;
          const c = 1 + (ring + 1) * segments + segment;
          const d = 1 + (ring + 1) * segments + (segment + 1) % segments;
          indices.push(a, b, c);
          indices.push(b, d, c);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      return geometry;
    }

    function buildShapeScratchGeometry(points, safeRadius, bowlHeight){
      const shape2D = new THREE.Shape(points.map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      }));
      const geometry = new THREE.ShapeGeometry(shape2D, 80);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      const bounds = getBounds(points);
      const width = Math.max(1, bounds.maxX - bounds.minX);
      const depth = Math.max(1, bounds.maxZ - bounds.minZ);
      const uvs = [];
      for(let i = 0; i < positions.count; i += 1){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / safeRadius, 1.9) * bowlHeight + 0.012);
        uvs.push(0.5 + x / (width * 1.08), 0.5 - z / (depth * 1.08));
      }
      positions.needsUpdate = true;
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      return geometry;
    }

    function onArenaBuilt(){
      const profile = getActiveArenaProfile();
      if(mesh){
        scene.remove(mesh);
        mesh = null;
      }
      clear();
      const geometry = profile.type === 'circle'
        ? buildCircleScratchGeometry(profile)
        : buildShapeScratchGeometry(
          profile.type === 'heart' ? (profile.heartPoints || getHeartPoints()) : (profile.polygonPoints || hexPoints),
          profile.type === 'heart' ? 7.0 : (profile.polygonRadius || hexRadius),
          profile.scratchBowlHeight
        );
      geometry.computeVertexNormals();
      mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        map:texture,
        transparent:true,
        opacity:1,
        depthWrite:false,
        polygonOffset:true,
        polygonOffsetFactor:-2,
        polygonOffsetUnits:-2,
        side:THREE.DoubleSide
      }));
      scene.add(mesh);
    }

    return {
      tick,
      clear,
      onArenaBuilt
    };
  };
})();
