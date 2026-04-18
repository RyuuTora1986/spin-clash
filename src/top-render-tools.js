(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createTopRenderTools = function createTopRenderTools(deps){
    const THREE = deps.THREE;

    function mkSpotTex(bgCol,dotCol,patId){
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const half = size / 2;
      ctx.fillStyle = '#' + new THREE.Color(bgCol).getHexString();
      ctx.fillRect(0,0,size,size);
      ctx.fillStyle = '#' + new THREE.Color(dotCol).getHexString();
      if(patId===0){
        [[half,half,55],[half-95,half-75,40],[half+95,half-75,40],[half-75,half+90,30],[half+75,half+90,30],
         [half,half-138,20],[half-138,half+32,16],[half+138,half+32,16]].forEach(([x,y,r])=>{
          ctx.beginPath();
          ctx.arc(x,y,r,0,Math.PI*2);
          ctx.fill();
        });
        ctx.strokeStyle = '#' + new THREE.Color(dotCol).getHexString();
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.38;
        for(let i=0;i<3;i++){
          const angle = i / 3 * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(half,half,148,angle,angle+0.85);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }else if(patId===1){
        ctx.beginPath();
        ctx.arc(half,half,38,0,Math.PI*2);
        ctx.fill();
        [[8,95,24],[16,180,15],[24,230,9]].forEach(([count,radius,dotRadius])=>{
          for(let i=0;i<count;i++){
            const angle = i / count * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(half + Math.cos(angle) * radius, half + Math.sin(angle) * radius, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }else{
        for(let i=0;i<18;i++){
          const t = i / 18;
          const angle = t * Math.PI * 7;
          const radius = 14 + t * 200;
          ctx.beginPath();
          ctx.arc(half + Math.cos(angle) * radius, half + Math.sin(angle) * radius, 5 + t * 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.5;
        ctx.fillRect(half-6,half-50,12,100);
        ctx.fillRect(half-50,half-6,100,12);
        ctx.globalAlpha = 1;
      }
      return new THREE.CanvasTexture(canvas);
    }

    function mkTop(color,emi,typeId,isPlayer){
      const group = new THREE.Group();
      const family = typeId === 'impact' || typeId === 0
        ? 'impact'
        : (typeId === 'armor' || typeId === 1 ? 'armor' : 'trick');
      const mainColor = new THREE.Color(color);
      const standardMaterial = (base,emissive,roughness=0.3,metalness=0.8)=>new THREE.MeshStandardMaterial({
        color:base instanceof THREE.Color ? base : new THREE.Color(base),
        emissive:emissive instanceof THREE.Color ? emissive : new THREE.Color(emissive),
        emissiveIntensity:0.35,
        roughness,
        metalness
      });
      const tipMaterial = new THREE.MeshStandardMaterial({color:0xccddee,metalness:1,roughness:0.04});
      const glowMaterial = (emissive)=>new THREE.MeshStandardMaterial({color:0xffffff,emissive,emissiveIntensity:0.85,metalness:0.95,roughness:0.06});
      const makeSpotDisk = (radius,y,bgColor,dotColor,patternId)=>{
        const mesh = new THREE.Mesh(
          new THREE.CircleGeometry(radius,56),
          new THREE.MeshStandardMaterial({map:mkSpotTex(bgColor,dotColor,patternId),roughness:0.3,metalness:0.1})
        );
        mesh.rotation.x = -Math.PI/2;
        mesh.position.y = y;
        return mesh;
      };

      if(family==='impact'){
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.68,0.76,0.2,6),standardMaterial(color,emi,0.2,0.92));
        disc.castShadow = true;
        group.add(disc);
        for(let i=0;i<3;i++){
          const angle = i*Math.PI*2/3;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.13,0.2),standardMaterial(0xffddbb,emi,0.12,0.98));
          blade.position.set(Math.cos(angle)*0.74,0,Math.sin(angle)*0.74);
          blade.rotation.y = -angle;
          group.add(blade);
          const fang = new THREE.Mesh(new THREE.ConeGeometry(0.07,0.22,5),standardMaterial(0xffffff,emi,0.08,1));
          fang.position.set(Math.cos(angle)*1.08,0.02,Math.sin(angle)*1.08);
          fang.rotation.z = Math.PI/2;
          fang.rotation.y = -angle + Math.PI/2;
          group.add(fang);
        }
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16,0.45,6),standardMaterial(0xeeddcc,emi,0.1,1));
        spike.position.y = 0.33;
        group.add(spike);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72,0.055,6,18),glowMaterial(mainColor));
        ring.rotation.x = Math.PI/2;
        group.add(ring);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09,0.48,8),tipMaterial);
        tip.position.y = -0.35;
        tip.rotation.x = Math.PI;
        group.add(tip);
        group.add(makeSpotDisk(0.62,0.12,color,0xffee00,0));
      }else if(family==='armor'){
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.44,0.78,8),standardMaterial(color,emi,0.45,0.7));
        tower.castShadow = true;
        group.add(tower);
        const bumper = new THREE.Mesh(new THREE.TorusGeometry(0.64,0.22,10,20),standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0xaaccff),0.18),emi,0.38,0.72));
        bumper.rotation.x = Math.PI/2;
        bumper.position.y = -0.04;
        group.add(bumper);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.63,0.1,8),standardMaterial(color,emi,0.5,0.65));
        base.position.y = -0.44;
        group.add(base);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35,14,8,0,Math.PI*2,0,Math.PI/2),standardMaterial(0xddeeff,new THREE.Color(color).multiplyScalar(0.4),0.18,0.88));
        dome.position.y = 0.39;
        group.add(dome);
        const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(0.64,0.038,6,24),glowMaterial(mainColor));
        rimGlow.rotation.x = Math.PI/2;
        rimGlow.position.y = -0.04;
        group.add(rimGlow);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11,0.38,8),tipMaterial);
        tip.position.y = -0.56;
        tip.rotation.x = Math.PI;
        group.add(tip);
        const ringDisk = new THREE.Mesh(
          new THREE.RingGeometry(0.42,0.84,56),
          new THREE.MeshStandardMaterial({map:mkSpotTex(color,0x00ffee,1),roughness:0.3,metalness:0.1,side:THREE.DoubleSide})
        );
        ringDisk.rotation.x = -Math.PI/2;
        ringDisk.position.y = 0.18;
        group.add(ringDisk);
      }else{
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.19,0.62,10),standardMaterial(color,emi,0.22,0.88));
        axle.castShadow = true;
        group.add(axle);
        const armDirs = [[1,0,0],[0,0,1]];
        armDirs.forEach((dir,index)=>{
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,1.6,8),standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0xffffff),0.22),emi,0.18,0.92));
          if(index===0) arm.rotation.z = Math.PI/2;
          else arm.rotation.x = Math.PI/2;
          group.add(arm);
          for(let sign=-1;sign<=1;sign+=2){
            const weight = new THREE.Mesh(new THREE.SphereGeometry(0.18,12,10),standardMaterial(0xffffff,new THREE.Color(color).multiplyScalar(0.55),0.12,0.97));
            weight.position.set(dir[0]*sign*0.76,dir[1]*sign*0.76,dir[2]*sign*0.76);
            group.add(weight);
            const weightRing = new THREE.Mesh(new THREE.TorusGeometry(0.18,0.032,6,14),glowMaterial(mainColor));
            weightRing.position.copy(weight.position);
            if(index===0) weightRing.rotation.z = Math.PI/2;
            else weightRing.rotation.x = Math.PI/2;
            group.add(weightRing);
            group.add(makeSpotDisk(0.14,weight.position.y+0.01,color,0xff44ff,2));
          }
        });
        const hub = new THREE.Mesh(new THREE.SphereGeometry(0.22,14,12),glowMaterial(mainColor));
        group.add(hub);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07,0.58,8),tipMaterial);
        tip.position.y = -0.48;
        tip.rotation.x = Math.PI;
        group.add(tip);
        group.add(makeSpotDisk(0.16,0.32,color,0xff44ff,2));
      }

      const idColor = isPlayer ? 0x00ffcc : 0xff3322;
      const crownGroup = new THREE.Group();
      const crown = new THREE.Mesh(
        new THREE.TorusGeometry(0.95,0.07,10,40),
        new THREE.MeshBasicMaterial({color:idColor,transparent:true,opacity:0.38})
      );
      crown.rotation.x = Math.PI/2;
      crownGroup.add(crown);
      const crownOuter = new THREE.Mesh(
        new THREE.TorusGeometry(1.08,0.028,8,40),
        new THREE.MeshBasicMaterial({color:idColor,transparent:true,opacity:0.16})
      );
      crownOuter.rotation.x = Math.PI/2;
      crownGroup.add(crownOuter);
      const arrowGeometry = new THREE.BufferGeometry();
      arrowGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0.28,0,-0.18,-0.14,0,0.18,-0.14,0]),3));
      const arrow = new THREE.Mesh(arrowGeometry,new THREE.MeshBasicMaterial({color:idColor,transparent:true,opacity:0.28,side:THREE.DoubleSide}));
      arrow.position.y = 0.02;
      crownGroup.add(arrow);
      crownGroup.position.set(0,1.12,0);
      group.add(crownGroup);
      group._crown = crownGroup;

      const halo = new THREE.Mesh(
        new THREE.CircleGeometry(1.4,40),
        new THREE.MeshBasicMaterial({color:idColor,transparent:true,opacity:0.1,side:THREE.DoubleSide})
      );
      halo.rotation.x = -Math.PI/2;
      halo.position.y = -0.64;
      group.add(halo);
      const haloRim = new THREE.Mesh(
        new THREE.RingGeometry(1.1,1.4,40),
        new THREE.MeshBasicMaterial({color:idColor,transparent:true,opacity:0.22,side:THREE.DoubleSide})
      );
      haloRim.rotation.x = -Math.PI/2;
      haloRim.position.y = -0.63;
      group.add(haloRim);

      group.position.y = 0.6;
      return group;
    }

    return {
      mkSpotTex,
      mkTop
    };
  };
})();
