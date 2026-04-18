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

    function refreshUVScale(){
      if(isCircleArena()){
        uvScaleX = 1 / (arenaRadius * 2);
        uvScaleZ = 1 / (arenaRadius * 2);
      }else if(isHeartArena()){
        uvScaleX = 1 / 15.2;
        uvScaleZ = 1 / 15.2;
      }else{
        uvScaleX = 1 / (hexRadius * 2.25);
        uvScaleZ = 1 / (hexRadius * 2.25);
      }
    }

    function clear(){
      ctx.clearRect(0, 0, textureSize, textureSize);
      texture.needsUpdate = true;
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
      phase += dt * 2.8;
      let drew = false;
      ctx.globalCompositeOperation = 'source-over';
      if(playerTop.alive && !isNaN(playerPrevX)){
        strokeTop(playerPrevX, playerPrevZ, playerTop.x, playerTop.z, playerTop.vx, playerTop.vz, 0);
        drew = true;
      }
      if(enemyTop.alive && !isNaN(enemyPrevX)){
        strokeTop(enemyPrevX, enemyPrevZ, enemyTop.x, enemyTop.z, enemyTop.vx, enemyTop.vz, Math.PI);
        drew = true;
      }
      if(drew) texture.needsUpdate = true;
      if(playerTop.alive){
        playerPrevX = playerTop.x;
        playerPrevZ = playerTop.z;
      }
      if(enemyTop.alive){
        enemyPrevX = enemyTop.x;
        enemyPrevZ = enemyTop.z;
      }
    }

    function buildCircleScratchGeometry(){
      const rings = 22;
      const segments = 72;
      const offset = 0.012;
      const bowlHeight = 0.78;
      const verts = [];
      const indices = [];
      const uvs = [];
      verts.push(0, offset, 0);
      uvs.push(0.5, 0.5);
      for(let ring=1; ring<=rings; ring++){
        const radius = arenaRadius * ring / rings;
        const y = Math.pow(ring / rings, 1.8) * bowlHeight + offset;
        for(let segment=0; segment<segments; segment++){
          const angle = segment / segments * Math.PI * 2;
          verts.push(radius * Math.cos(angle), y, radius * Math.sin(angle));
          uvs.push(
            0.5 + 0.5 * (ring / rings) * Math.cos(angle),
            0.5 + 0.5 * (ring / rings) * Math.sin(angle)
          );
        }
      }
      for(let segment=0; segment<segments; segment++) indices.push(0, 1 + segment, 1 + (segment + 1) % segments);
      for(let ring=0; ring<rings - 1; ring++){
        for(let segment=0; segment<segments; segment++){
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

    function buildHeartScratchGeometry(){
      const offset = 0.012;
      const bowlHeight = 0.78;
      const heartPoints = getHeartPoints();
      const shape2D = new THREE.Shape(heartPoints.map((point)=>new THREE.Vector2(point.x, -point.z)));
      const geometry = new THREE.ShapeGeometry(shape2D, 80);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      const uvs = [];
      for(let i=0; i<positions.count; i++){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / 7.0, 1.9) * bowlHeight + offset);
        uvs.push(0.5 + x / 15.2, 0.5 - z / 15.2);
      }
      positions.needsUpdate = true;
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      return geometry;
    }

    function buildHexScratchGeometry(){
      const offset = 0.012;
      const bowlHeight = 0.78;
      const shape2D = new THREE.Shape(hexPoints.map((point)=>new THREE.Vector2(point.x, -point.z)));
      const geometry = new THREE.ShapeGeometry(shape2D, 48);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      const uvs = [];
      for(let i=0; i<positions.count; i++){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / hexRadius, 1.8) * bowlHeight + offset);
        uvs.push(0.5 + x / (hexRadius * 2.25), 0.5 - z / (hexRadius * 2.25));
      }
      positions.needsUpdate = true;
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      return geometry;
    }

    function onArenaBuilt(){
      if(mesh){
        scene.remove(mesh);
        mesh = null;
      }
      clear();
      const geometry = isCircleArena()
        ? buildCircleScratchGeometry()
        : (isHeartArena() ? buildHeartScratchGeometry() : buildHexScratchGeometry());
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
