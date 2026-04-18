(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createArenaRenderTools = function createArenaRenderTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const arenaRadius = deps.arenaRadius;
    const hexRadius = deps.hexRadius;
    const hexPoints = deps.hexPoints;
    const arenaMathTools = deps.arenaMathTools;
    const isCircleArena = deps.isCircleArena;
    const isHeartArena = deps.isHeartArena;
    const onArenaBuilt = deps.onArenaBuilt;
    const arenaObjs = [];

    function addArenaObject(object){
      scene.add(object);
      arenaObjs.push(object);
      return object;
    }

    function clearArena(){
      arenaObjs.forEach((object)=>scene.remove(object));
      arenaObjs.length = 0;
    }

    function buildCircleArena(){
      const rings = 22;
      const segments = 72;
      const bowlHeight = 0.58;
      const verts = [];
      const indices = [];
      const uvs = [];
      verts.push(0,0,0);
      uvs.push(0.5,0.5);
      for(let ring=1; ring<=rings; ring++){
        const radius = arenaRadius * ring / rings;
        const y = Math.pow(ring / rings, 1.8) * bowlHeight;
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
      const bowlGeometry = new THREE.BufferGeometry();
      bowlGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      bowlGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      bowlGeometry.setIndex(indices);
      bowlGeometry.computeVertexNormals();
      const floor = new THREE.Mesh(bowlGeometry, new THREE.MeshStandardMaterial({
        color:0x070710,
        emissive:0x010118,
        roughness:0.8,
        metalness:0.25,
        side:THREE.DoubleSide
      }));
      floor.receiveShadow = true;
      addArenaObject(floor);
      for(let ring=2; ring<arenaRadius; ring+=2){
        const y = Math.pow(ring / arenaRadius, 1.8) * bowlHeight + 0.02;
        const marker = new THREE.Mesh(
          new THREE.TorusGeometry(ring, 0.018, 8, 64),
          new THREE.MeshBasicMaterial({
            color:ring === 6 ? 0x1a3355 : 0x0e1a2e,
            transparent:true,
            opacity:0.7
          })
        );
        marker.rotation.x = Math.PI / 2;
        marker.position.y = y;
        addArenaObject(marker);
      }
      const rimY = bowlHeight + 0.02;
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(arenaRadius, 0.1, 16, 80),
        new THREE.MeshBasicMaterial({ color:0x0055ff, transparent:true, opacity:0.95 })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = rimY;
      addArenaObject(rim);
      const hazard = new THREE.Mesh(
        new THREE.RingGeometry(6.5, arenaRadius, 64),
        new THREE.MeshBasicMaterial({
          color:0xff2200,
          transparent:true,
          opacity:0.06,
          side:THREE.DoubleSide
        })
      );
      hazard.rotation.x = -Math.PI / 2;
      hazard.position.y = rimY - 0.01;
      addArenaObject(hazard);
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(0.32, 32),
        new THREE.MeshBasicMaterial({ color:0x00ffcc, transparent:true, opacity:0.22 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.01;
      addArenaObject(centerMark);
    }

    function buildHeartArena(){
      const heartPoints = (arenaMathTools && arenaMathTools.HEART_PTS) || [];
      const bowlHeight = 0.58;
      const shape2D = new THREE.Shape(heartPoints.map((point)=>new THREE.Vector2(point.x, -point.z)));
      const geometry = new THREE.ShapeGeometry(shape2D, 80);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      for(let i=0; i<positions.count; i++){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / 7.0, 1.9) * bowlHeight);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      addArenaObject(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color:0x07050f,
        emissive:0x010008,
        roughness:0.88,
        metalness:0.18,
        side:THREE.DoubleSide
      })));
      const rimPoints = heartPoints.map((point)=>new THREE.Vector3(point.x, bowlHeight + 0.06, point.z));
      rimPoints.push(rimPoints[0]);
      addArenaObject(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rimPoints),
        new THREE.LineBasicMaterial({ color:0xff2288 })
      ));
      [0.84, 0.6].forEach((scale, index)=>{
        const inner = heartPoints.map((point)=>{
          const radius = Math.sqrt(point.x * point.x + point.z * point.z);
          const y = Math.pow(radius / 7.0, 1.9) * bowlHeight;
          return new THREE.Vector3(point.x * scale, y + 0.02, point.z * scale);
        });
        inner.push(inner[0]);
        addArenaObject(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(inner),
          new THREE.LineBasicMaterial({
            color:index === 0 ? 0x3a0a44 : 0x1a0520,
            transparent:true,
            opacity:0.75
          })
        ));
      });
      const outerPoints = heartPoints.map((point)=>new THREE.Vector2(point.x, -point.z));
      const innerPoints = heartPoints.map((point)=>new THREE.Vector2(point.x * 0.84, -point.z * 0.84));
      const dangerShape = new THREE.Shape(outerPoints);
      dangerShape.holes.push(new THREE.Path(innerPoints));
      const dangerGeometry = new THREE.ShapeGeometry(dangerShape, 48);
      dangerGeometry.rotateX(-Math.PI / 2);
      addArenaObject(new THREE.Mesh(dangerGeometry, new THREE.MeshBasicMaterial({
        color:0xff1166,
        transparent:true,
        opacity:0.055,
        side:THREE.DoubleSide
      })));
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(0.32, 32),
        new THREE.MeshBasicMaterial({ color:0xff44aa, transparent:true, opacity:0.22 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.02;
      addArenaObject(centerMark);
    }

    function buildHexArena(){
      const bowlHeight = 0.62;
      const shape2D = new THREE.Shape(hexPoints.map((point)=>new THREE.Vector2(point.x, -point.z)));
      const geometry = new THREE.ShapeGeometry(shape2D, 48);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      for(let i=0; i<positions.count; i++){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / hexRadius, 1.8) * bowlHeight);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      addArenaObject(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color:0x0b0d11,
        emissive:0x071119,
        roughness:0.82,
        metalness:0.26,
        side:THREE.DoubleSide
      })));
      const rimPoints = hexPoints.map((point)=>new THREE.Vector3(point.x, bowlHeight + 0.05, point.z));
      rimPoints.push(new THREE.Vector3(hexPoints[0].x, bowlHeight + 0.05, hexPoints[0].z));
      addArenaObject(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rimPoints),
        new THREE.LineBasicMaterial({ color:0xffb000 })
      ));
      [0.86, 0.66].forEach((scale, index)=>{
        const inner = hexPoints.map((point)=>{
          const radius = Math.sqrt(point.x * point.x + point.z * point.z);
          return new THREE.Vector3(
            point.x * scale,
            Math.pow(radius / hexRadius, 1.8) * bowlHeight * scale + 0.02,
            point.z * scale
          );
        });
        inner.push(new THREE.Vector3(inner[0].x, inner[0].y, inner[0].z));
        addArenaObject(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(inner),
          new THREE.LineBasicMaterial({
            color:index === 0 ? 0x4a3410 : 0x1f1808,
            transparent:true,
            opacity:0.8
          })
        ));
      });
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(0.34, 6),
        new THREE.MeshBasicMaterial({ color:0xffd266, transparent:true, opacity:0.26 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.02;
      addArenaObject(centerMark);
    }

    function setupArena(){
      clearArena();
      if(isCircleArena()) buildCircleArena();
      else if(isHeartArena()) buildHeartArena();
      else buildHexArena();
      if(typeof onArenaBuilt === 'function') onArenaBuilt();
    }

    return {
      setupArena,
      clearArena
    };
  };
})();
