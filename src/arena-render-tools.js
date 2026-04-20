(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createArenaRenderTools = function createArenaRenderTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const arenaRadius = deps.arenaRadius;
    const hexRadius = deps.hexRadius;
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
      arenaObjs.forEach(function(object){
        scene.remove(object);
      });
      arenaObjs.length = 0;
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
      return {
        type:isCircleArena() ? 'circle' : (isHeartArena() ? 'heart' : 'hex'),
        bowlHeight:isCircleArena() ? 0.58 : (isHeartArena() ? 0.58 : 0.62),
        floorColor:isHeartArena() ? 0x07050f : (isCircleArena() ? 0x070710 : 0x0b0d11),
        floorEmissive:isHeartArena() ? 0x010008 : (isCircleArena() ? 0x010118 : 0x071119),
        rimColor:isHeartArena() ? 0xff2288 : (isCircleArena() ? 0x0055ff : 0xffb000),
        hazardColor:isHeartArena() ? 0xff1166 : (isCircleArena() ? 0xff2200 : 0xffd266),
        centerColor:isHeartArena() ? 0xff44aa : (isCircleArena() ? 0x00ffcc : 0xffd266),
        accentColor:isHeartArena() ? 0x3a0a44 : (isCircleArena() ? 0x1a3355 : 0x4a3410),
        deepAccentColor:isHeartArena() ? 0x1a0520 : (isCircleArena() ? 0x0e1a2e : 0x1f1808),
        centerRadius:isCircleArena() ? 0.32 : 0.34,
        markerScales:[0.25, 0.5, 0.75],
        hazardStart:6.5,
        heartPoints:arenaMathTools && arenaMathTools.HEART_PTS ? arenaMathTools.HEART_PTS : [],
        polygonPoints:deps.hexPoints || []
      };
    }

    function buildCircleArena(profile){
      const rings = 22;
      const segments = 72;
      const bowlHeight = profile.bowlHeight;
      const verts = [];
      const indices = [];
      const uvs = [];
      verts.push(0, 0, 0);
      uvs.push(0.5, 0.5);
      for(let ring = 1; ring <= rings; ring += 1){
        const radius = arenaRadius * ring / rings;
        const y = Math.pow(ring / rings, 1.8) * bowlHeight;
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
      const bowlGeometry = new THREE.BufferGeometry();
      bowlGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      bowlGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      bowlGeometry.setIndex(indices);
      bowlGeometry.computeVertexNormals();
      const floor = new THREE.Mesh(bowlGeometry, new THREE.MeshStandardMaterial({
        color:profile.floorColor,
        emissive:profile.floorEmissive,
        roughness:0.8,
        metalness:0.25,
        side:THREE.DoubleSide
      }));
      floor.receiveShadow = true;
      addArenaObject(floor);
      (profile.markerScales || []).forEach(function(scale, index){
        const radius = arenaRadius * scale;
        const y = Math.pow(scale, 1.8) * bowlHeight + 0.02;
        const marker = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.018, 8, 64),
          new THREE.MeshBasicMaterial({
            color:index === 0 ? profile.accentColor : profile.deepAccentColor,
            transparent:true,
            opacity:0.7
          })
        );
        marker.rotation.x = Math.PI / 2;
        marker.position.y = y;
        addArenaObject(marker);
      });
      const rimY = bowlHeight + 0.02;
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(arenaRadius, 0.1, 16, 80),
        new THREE.MeshBasicMaterial({ color:profile.rimColor, transparent:true, opacity:0.95 })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = rimY;
      addArenaObject(rim);
      const hazard = new THREE.Mesh(
        new THREE.RingGeometry(profile.hazardStart, arenaRadius, 72),
        new THREE.MeshBasicMaterial({
          color:profile.hazardColor,
          transparent:true,
          opacity:0.075,
          side:THREE.DoubleSide
        })
      );
      hazard.rotation.x = -Math.PI / 2;
      hazard.position.y = rimY - 0.01;
      addArenaObject(hazard);
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(profile.centerRadius, 36),
        new THREE.MeshBasicMaterial({ color:profile.centerColor, transparent:true, opacity:0.22 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.01;
      addArenaObject(centerMark);
    }

    function buildHeartArena(profile){
      const heartPoints = profile.heartPoints || [];
      const shape2D = new THREE.Shape(heartPoints.map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      }));
      const geometry = new THREE.ShapeGeometry(shape2D, 80);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      for(let i = 0; i < positions.count; i += 1){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / 7.0, 1.9) * profile.bowlHeight);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      addArenaObject(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color:profile.floorColor,
        emissive:profile.floorEmissive,
        roughness:0.88,
        metalness:0.18,
        side:THREE.DoubleSide
      })));
      const rimPoints = heartPoints.map(function(point){
        return new THREE.Vector3(point.x, profile.bowlHeight + 0.06, point.z);
      });
      rimPoints.push(rimPoints[0]);
      addArenaObject(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rimPoints),
        new THREE.LineBasicMaterial({ color:profile.rimColor })
      ));
      [profile.hazardScale, 0.6].forEach(function(scale, index){
        const inner = heartPoints.map(function(point){
          const radius = Math.sqrt(point.x * point.x + point.z * point.z);
          const y = Math.pow(radius / 7.0, 1.9) * profile.bowlHeight;
          return new THREE.Vector3(point.x * scale, y + 0.02, point.z * scale);
        });
        inner.push(inner[0]);
        addArenaObject(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(inner),
          new THREE.LineBasicMaterial({
            color:index === 0 ? profile.accentColor : profile.deepAccentColor,
            transparent:true,
            opacity:0.75
          })
        ));
      });
      const outerPoints = heartPoints.map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      });
      const innerPoints = (profile.hazardPoints || []).map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      });
      const dangerShape = new THREE.Shape(outerPoints);
      dangerShape.holes.push(new THREE.Path(innerPoints));
      const dangerGeometry = new THREE.ShapeGeometry(dangerShape, 48);
      dangerGeometry.rotateX(-Math.PI / 2);
      addArenaObject(new THREE.Mesh(dangerGeometry, new THREE.MeshBasicMaterial({
        color:profile.hazardColor,
        transparent:true,
        opacity:0.06,
        side:THREE.DoubleSide
      })));
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(profile.centerRadius, 32),
        new THREE.MeshBasicMaterial({ color:profile.centerColor, transparent:true, opacity:0.22 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.02;
      addArenaObject(centerMark);
    }

    function buildPolygonArena(profile){
      const polygonPoints = profile.polygonPoints || [];
      const shape2D = new THREE.Shape(polygonPoints.map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      }));
      const geometry = new THREE.ShapeGeometry(shape2D, 64);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      const safeRadius = profile.polygonRadius || hexRadius;
      for(let i = 0; i < positions.count; i += 1){
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(i, Math.pow(radius / safeRadius, 1.8) * profile.bowlHeight);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      addArenaObject(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color:profile.floorColor,
        emissive:profile.floorEmissive,
        roughness:0.82,
        metalness:0.26,
        side:THREE.DoubleSide
      })));
      const rimPoints = polygonPoints.map(function(point){
        return new THREE.Vector3(point.x, profile.bowlHeight + 0.05, point.z);
      });
      rimPoints.push(new THREE.Vector3(polygonPoints[0].x, profile.bowlHeight + 0.05, polygonPoints[0].z));
      addArenaObject(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rimPoints),
        new THREE.LineBasicMaterial({ color:profile.rimColor })
      ));
      [profile.hazardScale, 0.62].forEach(function(scale, index){
        const inner = polygonPoints.map(function(point){
          const radius = Math.sqrt(point.x * point.x + point.z * point.z);
          return new THREE.Vector3(
            point.x * scale,
            Math.pow(radius / safeRadius, 1.8) * profile.bowlHeight * scale + 0.02,
            point.z * scale
          );
        });
        inner.push(new THREE.Vector3(inner[0].x, inner[0].y, inner[0].z));
        addArenaObject(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(inner),
          new THREE.LineBasicMaterial({
            color:index === 0 ? profile.accentColor : profile.deepAccentColor,
            transparent:true,
            opacity:0.8
          })
        ));
      });
      const centerMark = new THREE.Mesh(
        new THREE.CircleGeometry(profile.centerRadius, Math.max(6, profile.polygonSides || 6)),
        new THREE.MeshBasicMaterial({ color:profile.centerColor, transparent:true, opacity:0.26 })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.y = 0.02;
      addArenaObject(centerMark);
    }

    function setupArena(){
      const profile = getActiveArenaProfile();
      clearArena();
      if(profile.type === 'circle'){
        buildCircleArena(profile);
      }else if(profile.type === 'heart'){
        buildHeartArena(profile);
      }else{
        buildPolygonArena(profile);
      }
      if(typeof onArenaBuilt === 'function'){
        onArenaBuilt();
      }
    }

    return {
      setupArena,
      clearArena
    };
  };
})();
