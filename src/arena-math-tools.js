(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createArenaMathTools = function createArenaMathTools(){
    const HEART_N = 96;

    function isFiniteNumber(value){
      return typeof value === 'number' && isFinite(value);
    }

    function readNumber(value, fallback){
      return isFiniteNumber(value) ? value : fallback;
    }

    function createHeartPoints(options){
      const shape = options || {};
      const scaleX = Math.max(0.7, readNumber(shape.scaleX, 1));
      const scaleZ = Math.max(0.7, readNumber(shape.scaleZ, 1));
      const pinch = Math.max(0, Math.min(0.45, readNumber(shape.pinch, 0)));
      const points = [];

      for(let i = 0; i < HEART_N; i += 1){
        const t = i / HEART_N * Math.PI * 2;
        let hx = 6.2 * Math.sin(t);
        const hy = 4.8 * Math.cos(t) - 1.8 * Math.cos(2 * t) - 0.25 * Math.cos(3 * t) + 0.3;
        const topBias = Math.max(0, Math.cos(t));
        hx *= scaleX * (1 - pinch * topBias);
        points.push({ x:hx, z:-hy * scaleZ });
      }

      return points;
    }

    const HEART_PTS = createHeartPoints();

    function polygonContains(points, x, z){
      let inside = false;
      for(let i = 0, j = points.length - 1; i < points.length; j = i++){
        const xi = points[i].x;
        const zi = points[i].z;
        const xj = points[j].x;
        const zj = points[j].z;
        if((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi) / (zj - zi)) + xi){
          inside = !inside;
        }
      }
      return inside;
    }

    function nearestPolygonEdgeData(points, x, z){
      let best = { dist:Infinity, nx:0, nz:0 };
      for(let i = 0; i < points.length; i += 1){
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const ex = b.x - a.x;
        const ez = b.z - a.z;
        const len2 = ex * ex + ez * ez || 1;
        let t = ((x - a.x) * ex + (z - a.z) * ez) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = a.x + ex * t;
        const pz = a.z + ez * t;
        const dx = x - px;
        const dz = z - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        let nx = ez;
        let nz = -ex;
        const normalLength = Math.sqrt(nx * nx + nz * nz) || 1;
        nx /= normalLength;
        nz /= normalLength;
        if(!polygonContains(points, x + nx * 0.12, z + nz * 0.12)){
          nx = -nx;
          nz = -nz;
        }
        if(dist < best.dist){
          best = { dist, nx, nz };
        }
      }
      return best;
    }

    function scalePolygon(points, scale){
      return points.map(function(point){
        return { x:point.x * scale, z:point.z * scale };
      });
    }

    function createRegularPolygonPoints(sides, radius, rotation){
      const safeSides = Math.max(3, Math.round(readNumber(sides, 6)));
      const safeRadius = Math.max(0.1, readNumber(radius, 7.1));
      const safeRotation = readNumber(rotation, 0);
      const points = [];
      for(let i = 0; i < safeSides; i += 1){
        const angle = safeRotation + i / safeSides * Math.PI * 2;
        points.push({
          x:Math.cos(angle) * safeRadius,
          z:Math.sin(angle) * safeRadius
        });
      }
      return points;
    }

    function heartContains(x, z, scaleOrPoints){
      if(Array.isArray(scaleOrPoints)){
        return polygonContains(scaleOrPoints, x, z);
      }
      const scale = Math.max(0.01, readNumber(scaleOrPoints, 1));
      return polygonContains(HEART_PTS, x / scale, z / scale);
    }

    function heartWallNormal(x, z, points){
      const edge = nearestPolygonEdgeData(Array.isArray(points) ? points : HEART_PTS, x, z);
      return { nx:edge.nx, nz:edge.nz };
    }

    function heartNearWall(x, z, profile){
      const resolved = profile || {};
      const points = resolved.heartPoints || HEART_PTS;
      const nearWallPoints = resolved.nearWallPoints || scalePolygon(points, 0.94);
      return polygonContains(points, x, z) && !polygonContains(nearWallPoints, x, z);
    }

    function heartInHaz(x, z, profile){
      const resolved = profile || {};
      const points = resolved.heartPoints || HEART_PTS;
      const hazardPoints = resolved.hazardPoints || scalePolygon(points, 0.84);
      return polygonContains(points, x, z) && !polygonContains(hazardPoints, x, z);
    }

    function heartCrossed(x, z, profile){
      const points = profile && profile.heartPoints ? profile.heartPoints : HEART_PTS;
      return !polygonContains(points, x, z);
    }

    function heartRingOut(x, z, profile){
      const resolved = profile || {};
      const points = resolved.outerPoints || scalePolygon(resolved.heartPoints || HEART_PTS, 1.14);
      return !polygonContains(points, x, z);
    }

    function getArenaProfile(arenaConfig, runtime){
      const arena = arenaConfig || {};
      const type = arena.type || 'circle';
      const geometry = arena.geometry || {};
      const physics = arena.physics || {};
      const renderer = arena.renderer || {};
      const shape = arena.shape || {};
      const arenaRadius = Math.max(0.1, readNumber(runtime && runtime.arenaRadius, 8));
      const polygonRadius = Math.max(0.1, readNumber(runtime && runtime.polygonRadius, 7.1));
      const profile = {
        id:arena.id || 'unknown_arena',
        type:type,
        bowlHeight:readNumber(geometry.bowlHeight, type === 'circle' ? 0.58 : (type === 'heart' ? 0.58 : 0.62)),
        scratchBowlHeight:readNumber(geometry.scratchBowlHeight, type === 'circle' ? 0.78 : 0.78),
        slopeForce:readNumber(physics.slopeForce, type === 'circle' ? 5.5 : (type === 'heart' ? 4.8 : 5.0)),
        radialPull:readNumber(physics.radialPull, type === 'circle' ? 1 : 0.6),
        wallPush:readNumber(physics.wallPush, 0.42),
        safeWallInset:readNumber(physics.safeWallInset, 0.18),
        outerScale:readNumber(geometry.outerScale, type === 'circle' ? 1.125 : (type === 'heart' ? 1.14 : 1.12)),
        rimColor:readNumber(renderer.rimColor, type === 'heart' ? 0xff2288 : (type === 'hex' ? 0xffb000 : 0x0055ff)),
        hazardColor:readNumber(renderer.hazardColor, type === 'heart' ? 0xff1166 : (type === 'hex' ? 0xffd266 : 0xff2200)),
        centerColor:readNumber(renderer.centerColor, type === 'heart' ? 0xff44aa : (type === 'hex' ? 0xffd266 : 0x00ffcc)),
        floorColor:readNumber(renderer.floorColor, type === 'heart' ? 0x07050f : (type === 'hex' ? 0x0b0d11 : 0x070710)),
        floorEmissive:readNumber(renderer.floorEmissive, type === 'heart' ? 0x010008 : (type === 'hex' ? 0x071119 : 0x010118)),
        accentColor:readNumber(renderer.accentColor, type === 'heart' ? 0x3a0a44 : (type === 'hex' ? 0x4a3410 : 0x1a3355)),
        deepAccentColor:readNumber(renderer.deepAccentColor, type === 'heart' ? 0x1a0520 : (type === 'hex' ? 0x1f1808 : 0x0e1a2e)),
        centerRadius:readNumber(geometry.centerRadius, type === 'hex' ? 0.34 : 0.32),
        markerScales:Array.isArray(geometry.markerScales) && geometry.markerScales.length ? geometry.markerScales.slice() : [0.25, 0.5, 0.75]
      };

      if(type === 'circle'){
        profile.hazardStart = Math.max(0.1, readNumber(geometry.hazardStart, readNumber(arena.hazardSpinThreshold, 6.5)));
        profile.outerRadius = arenaRadius * profile.outerScale;
        return profile;
      }

      if(type === 'heart'){
        profile.heartPoints = createHeartPoints(shape);
        profile.hazardScale = readNumber(geometry.hazardScale, 0.84);
        profile.nearWallScale = readNumber(geometry.nearWallScale, 0.94);
        profile.hazardPoints = scalePolygon(profile.heartPoints, profile.hazardScale);
        profile.nearWallPoints = scalePolygon(profile.heartPoints, profile.nearWallScale);
        profile.outerPoints = scalePolygon(profile.heartPoints, profile.outerScale);
        return profile;
      }

      profile.polygonSides = Math.max(3, Math.round(readNumber(shape.sides, 6)));
      profile.polygonRadius = polygonRadius * Math.max(0.6, readNumber(shape.radiusScale, 1));
      profile.rotation = readNumber(shape.rotation, Math.PI / 6);
      profile.hazardScale = readNumber(geometry.hazardScale, 0.82);
      profile.polygonPoints = createRegularPolygonPoints(profile.polygonSides, profile.polygonRadius, profile.rotation);
      profile.hazardPoints = scalePolygon(profile.polygonPoints, profile.hazardScale);
      profile.outerPoints = scalePolygon(profile.polygonPoints, profile.outerScale);
      return profile;
    }

    return {
      HEART_PTS,
      createHeartPoints,
      createRegularPolygonPoints,
      getArenaProfile,
      heartContains,
      heartWallNormal,
      heartNearWall,
      heartInHaz,
      heartCrossed,
      heartRingOut,
      polygonContains,
      nearestPolygonEdgeData,
      scalePolygon
    };
  };
})();
