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

    function resolveFamilyVariant(typeId){
      if(typeId === 'impact' || typeId === 0) return { family:'impact', variant:'core' };
      if(typeId === 'armor' || typeId === 1) return { family:'armor', variant:'core' };
      if(typeId === 'trick' || typeId === 2) return { family:'trick', variant:'core' };
      if(typeof typeId === 'string'){
        if(typeId.indexOf('impact') === 0){
          return {
            family:'impact',
            variant:typeId === 'impact' ? 'core' : typeId.slice('impact_'.length)
          };
        }
        if(typeId.indexOf('armor') === 0){
          return {
            family:'armor',
            variant:typeId === 'armor' ? 'core' : typeId.slice('armor_'.length)
          };
        }
        if(typeId.indexOf('trick') === 0){
          return {
            family:'trick',
            variant:typeId === 'trick' ? 'core' : typeId.slice('trick_'.length)
          };
        }
      }
      return { family:'trick', variant:'core' };
    }

    function mkTop(color,emi,typeId,isPlayer){
      const group = new THREE.Group();
      const resolvedType = resolveFamilyVariant(typeId);
      const family = resolvedType.family;
      const variant = resolvedType.variant;
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
        const bladeCount = variant === 'tremor' ? 4 : (variant === 'nova' ? 5 : 3);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(
            variant === 'vanguard' ? 0.74 : 0.68,
            variant === 'tremor' ? 0.84 : 0.76,
            variant === 'nova' ? 0.18 : 0.2,
            bladeCount === 5 ? 10 : 6
          ),
          standardMaterial(color,emi,0.2,0.92)
        );
        disc.castShadow = true;
        group.add(disc);
        const bladeLength = variant === 'nova' ? 0.76 : (variant === 'vanguard' ? 0.62 : 0.7);
        const bladeWidth = variant === 'tremor' ? 0.16 : 0.13;
        for(let i=0;i<bladeCount;i++){
          const angle = i*Math.PI*2/bladeCount;
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(bladeLength,bladeWidth,variant === 'tremor' ? 0.26 : 0.2),
            standardMaterial(0xffddbb,emi,0.12,0.98)
          );
          blade.position.set(Math.cos(angle)*(variant === 'nova' ? 0.8 : 0.74),0,Math.sin(angle)*(variant === 'nova' ? 0.8 : 0.74));
          blade.rotation.y = -angle;
          group.add(blade);
          const fang = new THREE.Mesh(new THREE.ConeGeometry(0.07,0.22,5),standardMaterial(0xffffff,emi,0.08,1));
          fang.position.set(Math.cos(angle)*(variant === 'nova' ? 1.18 : 1.08),0.02,Math.sin(angle)*(variant === 'nova' ? 1.18 : 1.08));
          fang.rotation.z = Math.PI/2;
          fang.rotation.y = -angle + Math.PI/2;
          group.add(fang);
        }
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16,0.45,6),standardMaterial(0xeeddcc,emi,0.1,1));
        spike.position.y = 0.33;
        group.add(spike);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(variant === 'tremor' ? 0.78 : 0.72,variant === 'nova' ? 0.07 : 0.055,6,18),glowMaterial(mainColor));
        ring.rotation.x = Math.PI/2;
        group.add(ring);
        if(variant === 'breaker'){
          const smashRing = new THREE.Mesh(new THREE.TorusGeometry(0.96,0.04,6,24),glowMaterial(new THREE.Color(0xffcc88)));
          smashRing.rotation.x = Math.PI/2;
          smashRing.position.y = -0.03;
          group.add(smashRing);
        }else if(variant === 'vanguard'){
          for(let i=0;i<4;i++){
            const angle = i*Math.PI/2 + Math.PI/4;
            const shield = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.12,0.24),standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0xffffff),0.24),emi,0.2,0.9));
            shield.position.set(Math.cos(angle)*0.92,0.06,Math.sin(angle)*0.92);
            shield.rotation.y = -angle;
            group.add(shield);
          }
        }else if(variant === 'nova'){
          const novaRing = new THREE.Mesh(new THREE.TorusGeometry(0.98,0.03,6,28),glowMaterial(new THREE.Color(0xfff0aa)));
          novaRing.rotation.x = Math.PI/2;
          novaRing.position.y = 0.08;
          group.add(novaRing);
        }else if(variant === 'tremor'){
          const ballast = new THREE.Mesh(new THREE.TorusGeometry(0.88,0.12,10,26),standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0x554433),0.35),emi,0.42,0.82));
          ballast.rotation.x = Math.PI/2;
          ballast.position.y = -0.08;
          group.add(ballast);
        }
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09,0.48,8),tipMaterial);
        tip.position.y = -0.35;
        tip.rotation.x = Math.PI;
        group.add(tip);
        group.add(makeSpotDisk(0.62,0.12,color,0xffee00,0));
      }else if(family==='armor'){
        const tower = new THREE.Mesh(
          new THREE.CylinderGeometry(
            variant === 'mirror' ? 0.34 : 0.38,
            variant === 'mammoth' ? 0.5 : 0.44,
            variant === 'bastion' ? 0.88 : 0.78,
            8
          ),
          standardMaterial(color,emi,0.45,0.7)
        );
        tower.castShadow = true;
        group.add(tower);
        const bumper = new THREE.Mesh(
          new THREE.TorusGeometry(variant === 'mammoth' ? 0.7 : 0.64,variant === 'mirror' ? 0.18 : 0.22,10,20),
          standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0xaaccff),0.18),emi,0.38,0.72)
        );
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
        if(variant === 'bastion'){
          for(let i=0;i<4;i++){
            const angle = i*Math.PI/2;
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.3,0.12),standardMaterial(new THREE.Color(0xe6f4ff),emi,0.24,0.86));
            plate.position.set(Math.cos(angle)*0.74,0.02,Math.sin(angle)*0.74);
            plate.rotation.y = angle;
            group.add(plate);
          }
        }else if(variant === 'aegis'){
          const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.84,0.03,6,28),glowMaterial(new THREE.Color(0xdaf6ff)));
          haloRing.rotation.x = Math.PI/2;
          haloRing.position.y = 0.12;
          group.add(haloRing);
        }else if(variant === 'mammoth'){
          const undercarriage = new THREE.Mesh(new THREE.CylinderGeometry(0.74,0.74,0.12,10),standardMaterial(new THREE.Color(color).multiplyScalar(0.84),emi,0.5,0.68));
          undercarriage.position.y = -0.24;
          group.add(undercarriage);
        }else if(variant === 'mirror'){
          const mirrorDome = new THREE.Mesh(new THREE.SphereGeometry(0.44,16,10,0,Math.PI*2,0,Math.PI/2),standardMaterial(0xf6fdff,new THREE.Color(color).multiplyScalar(0.55),0.08,0.96));
          mirrorDome.position.y = 0.12;
          group.add(mirrorDome);
        }
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
        const axle = new THREE.Mesh(
          new THREE.CylinderGeometry(
            variant === 'glitch' ? 0.14 : 0.17,
            variant === 'venom' ? 0.17 : 0.19,
            variant === 'orbit' ? 0.7 : 0.62,
            10
          ),
          standardMaterial(color,emi,0.22,0.88)
        );
        axle.castShadow = true;
        group.add(axle);
        const armDirs = variant === 'glitch' ? [[1,0,0],[0,0,1],[0.7,0,0.7]] : [[1,0,0],[0,0,1]];
        armDirs.forEach((dir,index)=>{
          const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(variant === 'venom' ? 0.045 : 0.055,0.055,variant === 'orbit' ? 1.4 : 1.6,8),
            standardMaterial(new THREE.Color(color).lerp(new THREE.Color(0xffffff),0.22),emi,0.18,0.92)
          );
          if(index===0) arm.rotation.z = Math.PI/2;
          else if(index===1) arm.rotation.x = Math.PI/2;
          else arm.rotation.z = Math.PI/4;
          group.add(arm);
          for(let sign=-1;sign<=1;sign+=2){
            const weight = new THREE.Mesh(new THREE.SphereGeometry(0.18,12,10),standardMaterial(0xffffff,new THREE.Color(color).multiplyScalar(0.55),0.12,0.97));
            weight.position.set(dir[0]*sign*(variant === 'orbit' ? 0.68 : 0.76),dir[1]*sign*0.76,dir[2]*sign*(variant === 'orbit' ? 0.68 : 0.76));
            group.add(weight);
            const weightRing = new THREE.Mesh(new THREE.TorusGeometry(0.18,0.032,6,14),glowMaterial(mainColor));
            weightRing.position.copy(weight.position);
            if(index===0) weightRing.rotation.z = Math.PI/2;
            else if(index===1) weightRing.rotation.x = Math.PI/2;
            else weightRing.rotation.z = Math.PI/4;
            group.add(weightRing);
            group.add(makeSpotDisk(0.14,weight.position.y+0.01,color,0xff44ff,2));
          }
        });
        if(variant === 'venom'){
          const tail = new THREE.Mesh(new THREE.TorusGeometry(0.92,0.035,6,32),glowMaterial(new THREE.Color(0xaaffaa)));
          tail.rotation.x = Math.PI/2;
          tail.position.y = -0.08;
          group.add(tail);
        }else if(variant === 'orbit'){
          const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.02,0.024,6,40),glowMaterial(new THREE.Color(0xaad4ff)));
          orbitRing.rotation.x = Math.PI/2;
          group.add(orbitRing);
        }else if(variant === 'glitch'){
          const glitchRing = new THREE.Mesh(new THREE.TorusGeometry(0.88,0.028,6,24),glowMaterial(new THREE.Color(0xff88dd)));
          glitchRing.rotation.x = Math.PI/2;
          glitchRing.rotation.z = Math.PI/8;
          group.add(glitchRing);
        }else if(variant === 'raider'){
          const raiderHook = new THREE.Mesh(new THREE.TorusGeometry(0.84,0.03,6,24,Math.PI*1.25),glowMaterial(new THREE.Color(0xffaadd)));
          raiderHook.rotation.x = Math.PI/2;
          group.add(raiderHook);
        }
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
