(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createQuickBattlePreviewTools = function createQuickBattlePreviewTools(options){
    const THREE = options.THREE;
    const arenas = options.arenas || [];
    const tops = options.tops || [];
    const topRenderTools = options.topRenderTools || null;
    const arenaMathTools = options.arenaMathTools || null;
    const getUiRoute = typeof options.getUiRoute === 'function' ? options.getUiRoute : function(){ return 'home'; };
    const getSelectedArenaIndex = typeof options.getSelectedArenaIndex === 'function' ? options.getSelectedArenaIndex : function(){ return 0; };
    const isArenaUnlocked = typeof options.isArenaUnlocked === 'function' ? options.isArenaUnlocked : function(){ return true; };
    const getPlayerTopId = typeof options.getPlayerTopId === 'function' ? options.getPlayerTopId : function(){ return 0; };
    const isTopUnlocked = typeof options.isTopUnlocked === 'function' ? options.isTopUnlocked : function(){ return true; };

    let arenaContainer = null;
    let arenaRenderer = null;
    let arenaScene = null;
    let arenaCamera = null;
    let arenaModel = null;
    let arenaAccent = null;
    let arenaCurrentId = null;
    let arenaLocked = false;
    let visible = false;
    let arenaIdleTime = 0;
    let arenaSize = { width:0, height:0 };

    let topContainer = null;
    let topRenderer = null;
    let topScene = null;
    let topCamera = null;
    let topMesh = null;
    let topCurrentId = null;
    let topIdleTime = 0;
    let topSize = { width:0, height:0 };

    function getArenaContainer(){
      if(!arenaContainer){
        arenaContainer = document.getElementById('quick-arena-stage');
      }
      return arenaContainer;
    }

    function getTopContainer(){
      if(!topContainer){
        topContainer = document.getElementById('quick-selected-top-stage');
      }
      return topContainer;
    }

    function buildLights(scene, locked){
      const ambient = new THREE.AmbientLight(locked ? 0x8c9aac : 0xa8d5ff, locked ? 0.38 : 0.86);
      const key = new THREE.DirectionalLight(locked ? 0xd1c2aa : 0xe4f7ff, locked ? 0.52 : 1.2);
      const fill = new THREE.PointLight(locked ? 0xffbf76 : 0x00ffd0, locked ? 0.32 : 0.7, 12);
      const rim = new THREE.PointLight(locked ? 0xffa960 : 0x7aaeff, locked ? 0.38 : 0.56, 14);
      key.position.set(2.8, 4.9, 4.4);
      fill.position.set(-2.4, 1.7, 2.1);
      rim.position.set(0.8, 1.4, -3.6);
      scene.add(ambient);
      scene.add(key);
      scene.add(fill);
      scene.add(rim);
    }

    function createHexShape(scale){
      const shape = new THREE.Shape();
      for(let index = 0; index < 6; index += 1){
        const angle = Math.PI / 6 + index * Math.PI / 3;
        const x = Math.cos(angle) * scale;
        const z = Math.sin(angle) * scale;
        if(index === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
      }
      shape.closePath();
      return shape;
    }

    function scaleArenaPoints(points, scale){
      return (points || []).map(function(point){
        return {
          x:point.x * scale,
          z:point.z * scale
        };
      });
    }

    function getPointRadius(points){
      return (points || []).reduce(function(maxRadius, point){
        return Math.max(maxRadius, Math.sqrt(point.x * point.x + point.z * point.z));
      }, 0);
    }

    function getArenaPreviewCameraPreset(arenaType, aspectRatio){
      if(arenaType === 'heart'){
        return {
          x:0,
          y:5.3,
          z:(aspectRatio || 1) < 1.1 ? 4.75 : 4.35,
          lookY:0.02
        };
      }
      if(arenaType === 'hex'){
        return {
          x:0,
          y:3.95,
          z:(aspectRatio || 1) < 1.1 ? 6.45 : 5.9,
          lookY:-0.04
        };
      }
      if(arenaType === 'circle'){
        return {
          x:0,
          y:3.95,
          z:(aspectRatio || 1) < 1.1 ? 6.25 : 5.75,
          lookY:-0.04
        };
      }
      return {
        x:0,
        y:3.95,
        z:(aspectRatio || 1) < 1.1 ? 6.25 : 5.75,
        lookY:-0.04
      };
    }

    function createBowlSurfaceFromPoints(points, radiusRef, bowlHeight, material, segments){
      const shape2D = new THREE.Shape((points || []).map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      }));
      const geometry = new THREE.ShapeGeometry(shape2D, segments || 48);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.attributes.position;
      for(let index = 0; index < positions.count; index += 1){
        const x = positions.getX(index);
        const z = positions.getZ(index);
        const radius = Math.sqrt(x * x + z * z);
        positions.setY(index, Math.pow(radius / (radiusRef || 1), 1.9) * bowlHeight);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, material);
    }

    function createExtrudedBodyFromPoints(points, material, depth, segments){
      const shape2D = new THREE.Shape((points || []).map(function(point){
        return new THREE.Vector2(point.x, -point.z);
      }));
      const geometry = new THREE.ExtrudeGeometry(shape2D, {
        depth:depth || 0.12,
        bevelEnabled:true,
        bevelSegments:2,
        bevelSize:0.02,
        bevelThickness:0.018,
        curveSegments:segments || 48
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, 0, -((depth || 0.12) * 0.5));
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, material);
    }

    function createLoopLine(points, y, material){
      return new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints((points || []).map(function(point){
          return new THREE.Vector3(point.x, y, point.z);
        })),
        material
      );
    }

    function createArenaBody(arena, locked){
      const group = new THREE.Group();
      const shellMaterial = new THREE.MeshStandardMaterial({
        color:locked ? 0x1a1713 : 0x102838,
        emissive:locked ? 0x130904 : 0x053647,
        emissiveIntensity:locked ? 0.08 : 0.2,
        metalness:0.72,
        roughness:locked ? 0.78 : 0.28
      });
      const floorMaterial = new THREE.MeshStandardMaterial({
        color:locked ? 0x25211b : 0x122837,
        emissive:locked ? 0x130a05 : 0x042a37,
        emissiveIntensity:locked ? 0.02 : 0.1,
        metalness:0.36,
        roughness:locked ? 0.86 : 0.5
      });

      if(!arena || arena.type === 'circle'){
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.84, 0.38, 40), shellMaterial);
        bowl.position.y = -0.08;
        group.add(bowl);

        const floor = new THREE.Mesh(new THREE.CircleGeometry(1.38, 40), floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.12;
        group.add(floor);

        const innerRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.18, 0.06, 8, 48),
          new THREE.MeshBasicMaterial({
            color:locked ? 0xffc070 : 0x31ffe3,
            transparent:true,
            opacity:locked ? 0.16 : 0.36
          })
        );
        innerRing.rotation.x = Math.PI / 2;
        innerRing.position.y = 0.16;
        group.add(innerRing);
        return group;
      }

      if(arena.type === 'heart'){
        const sourceHeartPoints = (arenaMathTools && arenaMathTools.HEART_PTS) || [];
        const heartPoints = scaleArenaPoints(sourceHeartPoints, 0.22);
        if(heartPoints.length >= 3){
          const bowlHeight = 0.14;
          const radiusRef = getPointRadius(heartPoints) || 1;
          const innerHeartPoints = scaleArenaPoints(sourceHeartPoints, 0.22 * 0.84);
          const heartBodyCapMaterial = new THREE.MeshStandardMaterial({
            color:locked ? 0x13202a : 0x143242,
            emissive:locked ? 0x080503 : 0x081b24,
            emissiveIntensity:locked ? 0.01 : 0.02,
            metalness:0.04,
            roughness:0.96,
            transparent:true,
            opacity:locked ? 0.18 : 0.12,
            side:THREE.DoubleSide
          });
          const heartBodySideMaterial = new THREE.MeshStandardMaterial({
            color:locked ? 0x10151b : 0x0e2432,
            emissive:locked ? 0x070403 : 0x071923,
            emissiveIntensity:locked ? 0.02 : 0.04,
            metalness:locked ? 0.08 : 0.12,
            roughness:0.94,
            side:THREE.DoubleSide
          });
          const heartShellMaterial = new THREE.MeshStandardMaterial({
            color:locked ? 0x14202a : 0x123140,
            emissive:locked ? 0x120904 : 0x0a2b38,
            emissiveIntensity:locked ? 0.04 : 0.08,
            metalness:locked ? 0.08 : 0.1,
            roughness:locked ? 0.92 : 0.9,
            side:THREE.DoubleSide
          });

          const body = createExtrudedBodyFromPoints(heartPoints, [heartBodyCapMaterial, heartBodySideMaterial], 0.22, 72);
          body.position.y = -0.16;
          body.scale.setScalar(1.01);
          group.add(body);

          const bowl = createBowlSurfaceFromPoints(heartPoints, radiusRef, bowlHeight, heartShellMaterial, 80);
          bowl.position.y = -0.02;
          group.add(bowl);

          const rimLine = createLoopLine(
            heartPoints,
            bowlHeight + 0.04,
            new THREE.LineBasicMaterial({
              color:locked ? 0xffc070 : 0x31ffe3,
              transparent:true,
              opacity:locked ? 0.18 : 0.34
            })
          );
          rimLine.position.y = -0.02;
          group.add(rimLine);

          const innerGuide = createLoopLine(
            innerHeartPoints,
            bowlHeight * 0.56 + 0.01,
            new THREE.LineBasicMaterial({
              color:locked ? 0xffbf74 : 0x67ffe8,
              transparent:true,
              opacity:locked ? 0.1 : 0.24
            })
          );
          innerGuide.position.y = -0.02;
          group.add(innerGuide);

          const dangerShape = new THREE.Shape(heartPoints.map(function(point){
            return new THREE.Vector2(point.x, -point.z);
          }));
          dangerShape.holes.push(new THREE.Path(innerHeartPoints.map(function(point){
            return new THREE.Vector2(point.x, -point.z);
          })));
          const dangerGeometry = new THREE.ShapeGeometry(dangerShape, 48);
          dangerGeometry.rotateX(-Math.PI / 2);
          const dangerMesh = new THREE.Mesh(
            dangerGeometry,
            new THREE.MeshBasicMaterial({
              color:locked ? 0xffb56a : 0x31ffe3,
              transparent:true,
              opacity:locked ? 0.05 : 0.1,
              side:THREE.DoubleSide
            })
          );
          dangerMesh.position.y = 0.04;
          group.add(dangerMesh);

          const centerMark = new THREE.Mesh(
            new THREE.CircleGeometry(0.12, 24),
            new THREE.MeshBasicMaterial({
              color:locked ? 0xffc070 : 0x5de9ff,
              transparent:true,
              opacity:locked ? 0.1 : 0.14
            })
          );
          centerMark.rotation.x = -Math.PI / 2;
          centerMark.position.y = 0.05;
          group.add(centerMark);
          return group;
        }
      }

      const shape = createHexShape(1.46);
      const shellGeometry = new THREE.ExtrudeGeometry(shape, {
        depth:0.42,
        bevelEnabled:true,
        bevelSegments:1,
        bevelSize:0.04,
        bevelThickness:0.04,
        curveSegments:32
      });
      shellGeometry.rotateX(-Math.PI / 2);
      shellGeometry.translate(0, 0.08, -0.21);
      const hexShellMaterial = locked
        ? new THREE.MeshStandardMaterial({
          color:0x241d15,
          emissive:0x1f1209,
          emissiveIntensity:0.12,
          metalness:0.26,
          roughness:0.8
        })
        : shellMaterial;
      group.add(new THREE.Mesh(shellGeometry, hexShellMaterial));

      const innerShape = createHexShape(1.14);
      const floor = new THREE.Mesh(
        new THREE.ShapeGeometry(innerShape, 32),
        locked
          ? new THREE.MeshStandardMaterial({
            color:0x32281d,
            emissive:0x26170d,
            emissiveIntensity:0.08,
            metalness:0.12,
            roughness:0.9
          })
          : floorMaterial
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.2;
      group.add(floor);

      if(locked){
        const lockedHexTopPlate = new THREE.Mesh(
          new THREE.ShapeGeometry(createHexShape(1.1), 32),
          new THREE.MeshStandardMaterial({
            color:0x5b4935,
            emissive:0x5a3218,
            emissiveIntensity:0.34,
            metalness:0.08,
            roughness:0.82
          })
        );
        lockedHexTopPlate.rotation.x = -Math.PI / 2;
        lockedHexTopPlate.position.y = 0.312;
        group.add(lockedHexTopPlate);

        const lockedHexInsetLine = createLoopLine(
          createHexShape(0.92).getPoints(6).map(function(point){
            return { x:point.x, z:-point.y };
          }),
          0.334,
          new THREE.LineBasicMaterial({
            color:0xffcf84,
            transparent:true,
            opacity:0.52
          })
        );
        group.add(lockedHexInsetLine);
      }

      const edgeShape = createHexShape(1.4);
      const edgePoints = edgeShape.getPoints(6);
      const edgeGeometry = new THREE.BufferGeometry().setFromPoints(
        edgePoints.concat(edgePoints[0]).map(function(point){
          return new THREE.Vector3(point.x, 0.28, point.y);
        })
      );
      const edgeLine = new THREE.Line(
        edgeGeometry,
        new THREE.LineBasicMaterial({
          color:locked ? 0xffc070 : 0x31ffe3,
          transparent:true,
          opacity:locked ? 0.28 : 0.3
        })
      );
      group.add(edgeLine);

      return group;
    }

    function applyLockedPreview(target){
      target.traverse(function(node){
        if(!node || !node.isMesh || !node.material) return;
        const nextMaterial = Array.isArray(node.material)
          ? node.material.map(function(material){ return material.clone(); })
          : node.material.clone();
        const materials = Array.isArray(nextMaterial) ? nextMaterial : [nextMaterial];
        materials.forEach(function(material){
          if(material.color){
            material.color.copy(material.color.clone().lerp(new THREE.Color(0x090806), 0.66));
          }
          if(material.emissive){
            material.emissive.copy(new THREE.Color(0x110804));
          }
          if(typeof material.emissiveIntensity === 'number'){
            material.emissiveIntensity *= 0.2;
          }
          if(typeof material.metalness === 'number'){
            material.metalness *= 0.45;
          }
          if(typeof material.roughness === 'number'){
            material.roughness = Math.max(0.76, material.roughness);
          }
          if(Object.prototype.hasOwnProperty.call(material, 'map')){
            material.map = null;
          }
        });
        node.material = nextMaterial;
      });
    }

    function ensureArenaRenderer(){
      if(arenaRenderer) return true;
      const mount = getArenaContainer();
      if(!mount || !THREE) return false;

      arenaRenderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
      arenaRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      arenaRenderer.setClearColor(0x000000, 0);
      mount.innerHTML = '';
      mount.appendChild(arenaRenderer.domElement);

      arenaScene = new THREE.Scene();
      arenaCamera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
      buildLights(arenaScene, false);
      resize();
      return true;
    }

    function ensureTopRenderer(){
      if(topRenderer) return true;
      const mount = getTopContainer();
      if(!mount || !THREE || !topRenderTools || typeof topRenderTools.mkTop !== 'function'){
        return false;
      }

      topRenderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
      topRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      topRenderer.setClearColor(0x000000, 0);
      mount.innerHTML = '';
      mount.appendChild(topRenderer.domElement);

      topScene = new THREE.Scene();
      topCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
      buildLights(topScene, false);
      resize();
      return true;
    }

    function getArenaConfig(){
      const index = Math.max(0, Math.min(arenas.length - 1, parseInt(getSelectedArenaIndex(), 10) || 0));
      return arenas[index] || null;
    }

    function getTopConfig(){
      const index = Math.max(0, Math.min(tops.length - 1, parseInt(getPlayerTopId(), 10) || 0));
      return tops[index] || null;
    }

    function clearArenaModel(){
      if(arenaModel && arenaScene) arenaScene.remove(arenaModel);
      if(arenaAccent && arenaScene) arenaScene.remove(arenaAccent);
      arenaModel = null;
      arenaAccent = null;
      arenaCurrentId = null;
    }

    function clearTopModel(){
      if(topMesh && topScene) topScene.remove(topMesh);
      topMesh = null;
      topCurrentId = null;
    }

    function syncArena(force){
      if(!ensureArenaRenderer()) return;
      const arena = getArenaConfig();
      if(!arena) return;
      if(!force && arenaCurrentId === arena.id && arenaModel) return;

      clearArenaModel();
      arenaLocked = !isArenaUnlocked(parseInt(getSelectedArenaIndex(), 10) || 0);
      arenaModel = createArenaBody(arena, arenaLocked);
      arenaModel.position.y = -0.08;
      arenaModel.rotation.x = 0;
      arenaModel.scale.setScalar(
        !arena || arena.type === 'circle'
          ? 1.14
          : arena.type === 'heart'
            ? 1.17
            : 1.12
      );
      arenaScene.add(arenaModel);

      if(!arena || arena.type === 'circle'){
        arenaAccent = new THREE.Mesh(
          new THREE.TorusGeometry(1.36, 0.055, 8, 56),
          new THREE.MeshBasicMaterial({
            color:arenaLocked ? 0xffc070 : 0x2affde,
            transparent:true,
            opacity:arenaLocked ? 0.12 : 0.24
          })
        );
        arenaAccent.rotation.x = Math.PI / 2;
        arenaAccent.position.y = -0.54;
        arenaScene.add(arenaAccent);
      }else{
        arenaAccent = null;
      }

      arenaCurrentId = arena.id;
      arenaIdleTime = 0;
      renderArena();
    }

    function syncTop(force){
      if(!ensureTopRenderer()) return;
      const top = getTopConfig();
      if(!top) return;
      if(!force && topCurrentId === top.id && topMesh) return;

      clearTopModel();
      topMesh = topRenderTools.mkTop(
        top.color,
        top.emi,
        top.meshFamily || top.family || top.id,
        true
      );
      if(topMesh._crown){
        topMesh._crown.visible = false;
      }
      if(!isTopUnlocked(parseInt(getPlayerTopId(), 10) || 0)){
        applyLockedPreview(topMesh);
      }
      topMesh.scale.setScalar(isTopUnlocked(parseInt(getPlayerTopId(), 10) || 0) ? 0.98 : 0.84);
      topMesh.position.set(0, 0.04, 0);
      topMesh.rotation.x = -0.12;
      topScene.add(topMesh);
      topCurrentId = top.id;
      topIdleTime = 0;
      renderTop();
    }

    function resize(){
      if(arenaRenderer){
        const mount = getArenaContainer();
        const width = Math.max(220, mount && mount.clientWidth ? mount.clientWidth : 220);
        const height = Math.max(220, mount && mount.clientHeight ? mount.clientHeight : 220);
        if(width !== arenaSize.width || height !== arenaSize.height){
          arenaSize = { width, height };
          arenaRenderer.setSize(width, height, false);
          arenaCamera.aspect = width / height;
          const arena = getArenaConfig();
          const preset = getArenaPreviewCameraPreset(arena && arena.type ? arena.type : 'circle', width / height);
          arenaCamera.position.set(preset.x, preset.y, preset.z);
          arenaCamera.lookAt(0, preset.lookY, 0);
          arenaCamera.updateProjectionMatrix();
        }
      }
      if(topRenderer){
        const mount = getTopContainer();
        const width = Math.max(110, mount && mount.clientWidth ? mount.clientWidth : 110);
        const height = Math.max(100, mount && mount.clientHeight ? mount.clientHeight : 100);
        if(width !== topSize.width || height !== topSize.height){
          topSize = { width, height };
          topRenderer.setSize(width, height, false);
          topCamera.aspect = width / height;
          topCamera.position.set(0, 3.2, 5.8);
          topCamera.lookAt(0, 0.05, 0);
          topCamera.updateProjectionMatrix();
        }
      }
      renderArena();
      renderTop();
    }

    function renderArena(){
      if(arenaRenderer && arenaScene && arenaCamera && visible){
        arenaRenderer.render(arenaScene, arenaCamera);
      }
    }

    function renderTop(){
      if(topRenderer && topScene && topCamera && visible){
        topRenderer.render(topScene, topCamera);
      }
    }

    function setVisible(next){
      visible = !!next;
      const arenaMount = getArenaContainer();
      const topMount = getTopContainer();
      if(arenaMount) arenaMount.style.opacity = visible ? '1' : '0';
      if(topMount) topMount.style.opacity = visible ? '1' : '0';
      if(arenaRenderer && arenaRenderer.domElement){
        arenaRenderer.domElement.style.display = visible ? 'block' : 'none';
      }
      if(topRenderer && topRenderer.domElement){
        topRenderer.domElement.style.display = visible ? 'block' : 'none';
      }
      if(visible){
        resize();
        syncArena(false);
        syncTop(false);
      }
    }

    function sync(){
      if(!ensureArenaRenderer()) return;
      ensureTopRenderer();
      setVisible(getUiRoute() === 'quick');
      if(visible){
        syncArena(false);
        syncTop(false);
      }
    }

    function tick(dt){
      if(!visible) return;
      resize();
      arenaIdleTime += dt;
      topIdleTime += dt;
      if(arenaAccent){
        if(arenaAccent.material){
          arenaAccent.material.opacity = (arenaLocked ? 0.08 : 0.18) + (Math.sin(arenaIdleTime * 1.3) + 1) * (arenaLocked ? 0.02 : 0.03);
        }
      }
      if(topMesh){
        topMesh.rotation.y += dt * 0.88;
        topMesh.rotation.z = Math.sin(topIdleTime * 1.4) * 0.04;
        topMesh.position.y = 0.04 + Math.sin(topIdleTime * 1.9) * 0.05;
      }
      renderArena();
      renderTop();
    }

    function initialize(){
      ensureArenaRenderer();
      ensureTopRenderer();
      sync();
    }

    return {
      initialize,
      sync,
      tick,
      resize
    };
  };
})();
