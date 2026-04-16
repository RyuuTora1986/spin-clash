(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createAimLineTools = function createAimLineTools(deps){
    const THREE = deps.THREE;
    const scene = deps.scene;
    const renderer = deps.renderer;
    const camera = deps.camera;
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const floorHit = new THREE.Vector3();
    const aimPoints = [new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-5)];
    const aimGeometry = new THREE.BufferGeometry().setFromPoints(aimPoints);
    const aimLine = new THREE.Line(aimGeometry,new THREE.LineDashedMaterial({
      color:0x00ffcc,
      dashSize:0.28,
      gapSize:0.16,
      transparent:true,
      opacity:0.75
    }));
    aimLine.position.y = 0.22;
    aimLine.visible = false;
    aimLine.computeLineDistances();
    scene.add(aimLine);

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
      const positions = aimLine.geometry.attributes.position;
      positions.setXYZ(0,startX,0,startZ);
      positions.setXYZ(1,endX,0,endZ);
      positions.needsUpdate = true;
      aimLine.computeLineDistances();
    }

    function showAimLine(){
      aimLine.visible = true;
    }

    function hideAimLine(){
      aimLine.visible = false;
    }

    function getAimLine(){
      return aimLine;
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
