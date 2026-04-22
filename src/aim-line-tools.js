(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createAimLineTools = function createAimLineTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const renderer = deps.renderer;
    const camera = deps.camera;
    const guideTexture = deps.guideTexture || null;
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const floorHit = new THREE.Vector3();

    const AIM_Y = 0.22;
    const AIM_RENDER_ORDER = 999;
    function makeMaterial(color, opacity, blending){
      return new THREE.MeshBasicMaterial({
        color,
        transparent:true,
        opacity,
        depthWrite:false,
        depthTest:false,
        blending:blending || THREE.AdditiveBlending,
        toneMapped:false
      });
    }

    function makeBox(width, height, depth, color, opacity, blending){
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        makeMaterial(color, opacity, blending)
      );
      mesh.renderOrder = AIM_RENDER_ORDER;
      return mesh;
    }

    function makeRing(radius, tube, color, opacity){
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 10, 20),
        makeMaterial(color, opacity)
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.renderOrder = AIM_RENDER_ORDER;
      return mesh;
    }

    const aimRoot = new THREE.Group();
    aimRoot.visible = false;
    aimRoot.position.y = AIM_Y;
    aimRoot.renderOrder = AIM_RENDER_ORDER;
    aimRoot.frustumCulled = false;
    scene.add(aimRoot);

    const lineGroup = new THREE.Group();
    lineGroup.renderOrder = AIM_RENDER_ORDER;
    lineGroup.frustumCulled = false;
    aimRoot.add(lineGroup);

    void guideTexture;

    const shaftGlow = makeBox(1, 0.12, 0.12, 0x1cefd2, 0.18, THREE.NormalBlending);
    shaftGlow.position.set(0.5, 0, 0);
    lineGroup.add(shaftGlow);

    const shaftCore = makeBox(1, 0.05, 0.05, 0x77fff2, 0.82);
    shaftCore.position.set(0.5, 0, 0);
    lineGroup.add(shaftCore);

    const forceSegments = [];
    const segmentSpecs = [
      { x:0.16, w:0.12, h:0.05, d:0.05, color:0x4fffe6, opacity:0.28 },
      { x:0.32, w:0.10, h:0.05, d:0.05, color:0x63ffe8, opacity:0.34 },
      { x:0.48, w:0.10, h:0.05, d:0.05, color:0x7bffe9, opacity:0.42 },
      { x:0.64, w:0.08, h:0.05, d:0.05, color:0x9fffee, opacity:0.50 },
      { x:0.80, w:0.08, h:0.05, d:0.05, color:0xc8fff2, opacity:0.58 }
    ];
    segmentSpecs.forEach((spec)=>{
      const seg = makeBox(spec.w, spec.h, spec.d, spec.color, spec.opacity);
      seg.position.set(spec.x, 0, 0);
      seg.userData.baseOpacity = spec.opacity;
      lineGroup.add(seg);
      forceSegments.push(seg);
    });

    const startPulse = makeBox(0.10, 0.12, 0.12, 0xe8fff7, 0.90, THREE.NormalBlending);
    startPulse.position.set(0, 0, 0);
    lineGroup.add(startPulse);

    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.28, 3, 1, false),
      makeMaterial(0xfff0b0, 0.96)
    );
    arrowHead.rotation.z = -Math.PI / 2;
    arrowHead.renderOrder = AIM_RENDER_ORDER;
    aimRoot.add(arrowHead);

    const landingRing = makeRing(0.18, 0.028, 0xf8ffd4, 0.80);
    landingRing.renderOrder = AIM_RENDER_ORDER;
    aimRoot.add(landingRing);

    const landingDot = makeBox(0.08, 0.06, 0.08, 0xfff9df, 0.92, THREE.NormalBlending);
    landingDot.position.y = 0.01;
    landingDot.renderOrder = AIM_RENDER_ORDER;
    aimRoot.add(landingDot);

    let pulseFrame = 0;
    let pulseRunning = false;
    let pulseBaseLength = 0;

    function updateAimPulse(){
      if(!pulseRunning || !aimRoot.visible){
        pulseRunning = false;
        pulseFrame = 0;
        return;
      }
      const t = performance.now() * 0.006;
      const breathe = 0.5 + 0.5 * Math.sin(t);
      const shimmer = 0.5 + 0.5 * Math.sin(t * 1.6 + 1.2);
      const force = 0.5 + 0.5 * Math.sin(t * 1.1 + pulseBaseLength * 0.15);

      shaftGlow.material.opacity = 0.14 + breathe * 0.10;
      shaftCore.material.opacity = 0.76 + shimmer * 0.10;
      startPulse.material.opacity = 0.72 + breathe * 0.18;
      arrowHead.material.opacity = 0.90 + shimmer * 0.08;
      landingRing.material.opacity = 0.58 + force * 0.24;

      arrowHead.scale.setScalar(0.95 + breathe * 0.08);
      landingRing.scale.setScalar(0.92 + force * 0.24);
      landingDot.scale.setScalar(0.95 + shimmer * 0.12);
      forceSegments.forEach((seg, index)=>{
        const base = seg.userData.baseOpacity;
        const segmentPhase = 0.75 + 0.25 * Math.sin(t * 1.7 + index * 0.8);
        seg.material.opacity = base * (0.78 + breathe * 0.24) * segmentPhase;
      });

      pulseFrame = requestAnimationFrame(updateAimPulse);
    }

    function ensurePulse(){
      if(pulseRunning) return;
      pulseRunning = true;
      pulseFrame = requestAnimationFrame(updateAimPulse);
    }

    function stopPulse(){
      pulseRunning = false;
      if(pulseFrame){
        cancelAnimationFrame(pulseFrame);
        pulseFrame = 0;
      }
    }

    function xyToArena(clientX,clientY){
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      return raycaster.ray.intersectPlane(floorPlane,floorHit)
        ? { x:floorHit.x, z:floorHit.z }
        : null;
    }

    function setAimLine(startX,startZ,endX,endZ){
      if(typeof startX === 'object' && startX){
        const point = startX;
        startX = point.startX ?? point.x ?? 0;
        startZ = point.startZ ?? point.z ?? 0;
        endX = point.endX ?? point.targetX ?? point.x2 ?? point.x ?? startX;
        endZ = point.endZ ?? point.targetZ ?? point.z2 ?? point.z ?? startZ;
      }

      const dx = (endX ?? startX) - startX;
      const dz = (endZ ?? startZ) - startZ;
      const length = Math.max(Math.hypot(dx,dz), 0.001);
      const angle = Math.atan2(-dz,dx);

      aimRoot.position.set(startX,AIM_Y,startZ);
      aimRoot.rotation.set(0,angle,0);

      lineGroup.scale.set(length,1,1);
      lineGroup.visible = true;

      arrowHead.position.set(length + 0.04, 0, 0);
      landingRing.position.set(length, 0, 0);
      landingDot.position.set(length, 0.015, 0);

      pulseBaseLength = length;
      ensurePulse();
    }

    function showAimLine(){
      aimRoot.visible = true;
      ensurePulse();
    }

    function hideAimLine(){
      aimRoot.visible = false;
      stopPulse();
    }

    function getAimLine(){
      return aimRoot;
    }

    return {
      xyToArena,
      setAimLine,
      showAimLine,
      hideAimLine,
      getAimLine
    };
  };
})();
