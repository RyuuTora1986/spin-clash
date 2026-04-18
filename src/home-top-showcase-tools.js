(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createHomeTopShowcaseTools = function createHomeTopShowcaseTools(options){
    const THREE = options.THREE;
    const tops = options.tops || [];
    const topRenderTools = options.topRenderTools || null;
    const getUiRoute = typeof options.getUiRoute === 'function' ? options.getUiRoute : function(){ return 'home'; };
    const getHomePreviewTopId = typeof options.getHomePreviewTopId === 'function' ? options.getHomePreviewTopId : function(){ return 0; };
    const isTopUnlocked = typeof options.isTopUnlocked === 'function' ? options.isTopUnlocked : function(){ return true; };

    let container = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let ambientLight = null;
    let keyLight = null;
    let fillLight = null;
    let rimLight = null;
    let pedestalBase = null;
    let pedestalTopPlate = null;
    let pedestalRim = null;
    let pedestalGlow = null;
    let topMesh = null;
    let topAccent = null;
    let currentTopId = null;
    let currentSize = { width:0, height:0 };
    let visible = false;
    let idleTime = 0;
    let previewLocked = false;
    const pedestalLift = 0.18;
    const topLift = 0.12;
    const topScale = 1.34;
    const lockedTopLift = 0.1;
    const lockedTopScale = 1.22;

    function ensureContainer(){
      if(container) return container;
      container = document.getElementById('home-top-stage');
      return container;
    }

    function buildPedestal(){
      const pedestal = new THREE.Group();

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.9, 0.34, 40),
        new THREE.MeshStandardMaterial({
          color:0x07111b,
          emissive:0x02131b,
          emissiveIntensity:0.26,
          metalness:0.86,
          roughness:0.24
        })
      );
      base.position.y = -1.08 + pedestalLift;
      pedestal.add(base);
      pedestalBase = base;

      const topPlate = new THREE.Mesh(
        new THREE.CylinderGeometry(1.16, 1.36, 0.08, 40),
        new THREE.MeshStandardMaterial({
          color:0x10293a,
          emissive:0x043746,
          emissiveIntensity:0.22,
          metalness:0.74,
          roughness:0.2
        })
      );
      topPlate.position.y = -0.86 + pedestalLift;
      pedestal.add(topPlate);
      pedestalTopPlate = topPlate;

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.08, 0.055, 10, 52),
        new THREE.MeshBasicMaterial({
          color:0x33ffd2,
          transparent:true,
          opacity:0.5
        })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -0.8 + pedestalLift;
      pedestal.add(rim);
      pedestalRim = rim;

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.5, 40),
        new THREE.MeshBasicMaterial({
          color:0x18d6c8,
          transparent:true,
          opacity:0.12,
          side:THREE.DoubleSide
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.79 + pedestalLift;
      pedestal.add(glow);
      pedestalGlow = glow;

      scene.add(pedestal);
    }

    function buildLights(){
      ambientLight = new THREE.AmbientLight(0x9fc7ff, 0.95);
      scene.add(ambientLight);

      keyLight = new THREE.DirectionalLight(0xd7f6ff, 1.55);
      keyLight.position.set(2.8, 5.4, 4.8);
      scene.add(keyLight);

      fillLight = new THREE.PointLight(0x00ffd0, 1.45, 12);
      fillLight.position.set(-2.2, 1.5, 2.4);
      scene.add(fillLight);

      rimLight = new THREE.PointLight(0xffa84a, 0.72, 14);
      rimLight.position.set(2.5, 1.2, -3.6);
      scene.add(rimLight);
    }

    function applyPreviewLighting(){
      if(!ambientLight || !keyLight || !fillLight || !rimLight) return;
      if(previewLocked){
        ambientLight.intensity = 0.18;
        keyLight.intensity = 0.24;
        fillLight.intensity = 0.1;
        rimLight.intensity = 0.42;
        rimLight.color = new THREE.Color(0xffc76b);
        if(pedestalBase && pedestalBase.material){
          pedestalBase.material.emissiveIntensity = 0.02;
        }
        if(pedestalTopPlate && pedestalTopPlate.material){
          pedestalTopPlate.material.emissiveIntensity = 0.015;
        }
        if(pedestalRim && pedestalRim.material){
          pedestalRim.material.opacity = 0.03;
        }
        if(pedestalGlow && pedestalGlow.material){
          pedestalGlow.material.opacity = 0.008;
        }
      }else{
        ambientLight.intensity = 0.95;
        keyLight.intensity = 1.55;
        fillLight.intensity = 1.45;
        rimLight.intensity = 0.72;
        rimLight.color = new THREE.Color(0xffa84a);
        if(pedestalBase && pedestalBase.material){
          pedestalBase.material.emissiveIntensity = 0.26;
        }
        if(pedestalTopPlate && pedestalTopPlate.material){
          pedestalTopPlate.material.emissiveIntensity = 0.22;
        }
        if(pedestalRim && pedestalRim.material){
          pedestalRim.material.opacity = 0.5;
        }
        if(pedestalGlow && pedestalGlow.material){
          pedestalGlow.material.opacity = 0.12;
        }
      }
    }

    function ensureRenderer(){
      if(renderer) return true;
      const mount = ensureContainer();
      if(!mount || !THREE || !topRenderTools || typeof topRenderTools.mkTop !== 'function'){
        return false;
      }

      renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      mount.innerHTML = '';
      mount.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
      buildLights();
      buildPedestal();
      resize();
      return true;
    }

    function getTopConfig(){
      const index = Math.max(0, Math.min(tops.length - 1, parseInt(getHomePreviewTopId(), 10) || 0));
      return tops[index] || null;
    }

    function applyShadowPreview(mesh){
      mesh.traverse(function(node){
        if(!node || !node.isMesh || !node.material) return;
        const nextMaterial = Array.isArray(node.material)
          ? node.material.map(function(material){ return material.clone(); })
          : node.material.clone();
        const materials = Array.isArray(nextMaterial) ? nextMaterial : [nextMaterial];
        if(node.geometry && (node.geometry.type === 'CircleGeometry' || node.geometry.type === 'RingGeometry')){
          node.visible = false;
        }
        materials.forEach(function(material){
          if(material.color){
            const baseColor = material.color.clone();
            material.color.copy(baseColor.lerp(new THREE.Color(0x05080b), 0.94));
          }
          if(material.emissive){
            material.emissive.copy(new THREE.Color(0x020405));
          }
          if(typeof material.emissiveIntensity === 'number'){
            material.emissiveIntensity = 0.01;
          }
          if(typeof material.metalness === 'number'){
            material.metalness = Math.min(0.2, material.metalness * 0.24);
          }
          if(typeof material.roughness === 'number'){
            material.roughness = Math.max(0.78, material.roughness);
          }
          if(Object.prototype.hasOwnProperty.call(material, 'map')){
            material.map = null;
          }
          material.transparent = false;
          material.opacity = 1;
        });
        node.material = nextMaterial;
      });
    }

    function clearTopMesh(){
      if(topMesh && scene){
        scene.remove(topMesh);
      }
      if(topAccent && scene){
        scene.remove(topAccent);
      }
      topMesh = null;
      topAccent = null;
      currentTopId = null;
    }

    function buildTopAccent(template){
      const accent = new THREE.Mesh(
        new THREE.TorusGeometry(1.32, 0.06, 10, 56),
        new THREE.MeshBasicMaterial({
          color:template && template.color ? template.color : 0x00ffd0,
          transparent:true,
          opacity:0.34
        })
      );
      accent.rotation.x = Math.PI / 2;
      accent.position.y = -0.24;
      return accent;
    }

    function syncTop(force){
      if(!ensureRenderer()) return;
      const template = getTopConfig();
      if(!template) return;
      if(!force && currentTopId === template.id && topMesh){
        return;
      }

      clearTopMesh();
      previewLocked = !isTopUnlocked(parseInt(getHomePreviewTopId(), 10) || 0);
      applyPreviewLighting();
      topMesh = topRenderTools.mkTop(
        template.color,
        template.emi,
        template.meshFamily || template.family || template.id,
        true
      );
      if(topMesh._crown){
        topMesh._crown.visible = false;
      }
      if(previewLocked){
        applyShadowPreview(topMesh);
      }
      topMesh.scale.setScalar(previewLocked ? lockedTopScale : topScale);
      topMesh.position.set(0, 0.18 + topLift + (previewLocked ? lockedTopLift : 0), 0);
      topMesh.rotation.x = -0.08;
      scene.add(topMesh);

      topAccent = buildTopAccent(template);
      if(previewLocked && topAccent && topAccent.material){
        topAccent.material.color = new THREE.Color(0xffc76b);
        topAccent.material.opacity = 0;
      }
      scene.add(topAccent);
      currentTopId = template.id;
      idleTime = 0;
      render();
    }

    function resize(){
      if(!renderer) return;
      const mount = ensureContainer();
      const width = Math.max(220, mount && mount.clientWidth ? mount.clientWidth : 220);
      const height = Math.max(220, mount && mount.clientHeight ? mount.clientHeight : 220);
      if(width === currentSize.width && height === currentSize.height){
        return;
      }
      currentSize = { width, height };
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width / height < 1.08 ? 34 : 30;
      camera.position.set(0, 4.5, width / height < 1.08 ? 8.5 : 7.95);
      camera.lookAt(0, 0.34, 0);
      camera.updateProjectionMatrix();
      render();
    }

    function render(){
      if(!renderer || !scene || !camera || !visible) return;
      renderer.render(scene, camera);
    }

    function setVisible(next){
      visible = !!next;
      const mount = ensureContainer();
      if(mount){
        mount.style.opacity = visible ? '1' : '0';
      }
      if(renderer && renderer.domElement){
        renderer.domElement.style.display = visible ? 'block' : 'none';
      }
      if(visible){
        resize();
        syncTop(false);
        render();
      }
    }

    function sync(){
      if(!ensureRenderer()) return;
      setVisible(getUiRoute() === 'home');
      if(visible){
        syncTop(false);
      }
    }

    function tick(dt){
      if(!visible || !topMesh) return;
      resize();
      idleTime += dt;
      topMesh.rotation.y += dt * 0.9;
      topMesh.rotation.z = Math.sin(idleTime * 0.8) * 0.04;
      topMesh.position.y = 0.18 + topLift + (previewLocked ? lockedTopLift : 0) + Math.sin(idleTime * 1.7) * 0.08;
      if(topAccent){
        topAccent.rotation.z += dt * 0.22;
        if(topAccent.material){
          topAccent.material.opacity = 0.22 + (Math.sin(idleTime * 1.4) + 1) * 0.08;
        }
      }
      render();
    }

    function initialize(){
      ensureRenderer();
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
