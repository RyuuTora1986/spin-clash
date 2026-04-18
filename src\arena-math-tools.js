(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createArenaMathTools = function createArenaMathTools(){
    const HEART_N=96;
    const HEART_PTS=[];

    for(let i=0;i<HEART_N;i++){
      const t=i/HEART_N*Math.PI*2;
      const hx=6.2*Math.sin(t);
      const hy=4.8*Math.cos(t)-1.8*Math.cos(2*t)-0.25*Math.cos(3*t)+0.3;
      HEART_PTS.push({x:hx,z:-hy});
    }

    function heartContains(x,z,scale=1){
      const px=x/scale,pz=z/scale;
      let inside=false;
      for(let i=0,j=HEART_N-1;i<HEART_N;j=i++){
        const xi=HEART_PTS[i].x,zi=HEART_PTS[i].z;
        const xj=HEART_PTS[j].x,zj=HEART_PTS[j].z;
        if((zi>pz)!==(zj>pz)&&px<(xj-xi)*(pz-zi)/(zj-zi)+xi) inside=!inside;
      }
      return inside;
    }

    function heartWallNormal(x,z){
      let minD=Infinity,bx=HEART_PTS[0].x,bz=HEART_PTS[0].z;
      for(let i=0;i<HEART_N;i++){
        const d=(x-HEART_PTS[i].x)**2+(z-HEART_PTS[i].z)**2;
        if(d<minD){minD=d;bx=HEART_PTS[i].x;bz=HEART_PTS[i].z;}
      }
      const len=Math.sqrt(bx*bx+bz*bz)||1;
      return {nx:bx/len,nz:bz/len};
    }

    function heartNearWall(x,z){ return heartContains(x,z,1.0)&&!heartContains(x,z,0.94); }
    function heartInHaz(x,z){ return heartContains(x,z,1.0)&&!heartContains(x,z,0.84); }
    function heartCrossed(x,z){ return !heartContains(x,z,1.0); }
    function heartRingOut(x,z){ return !heartContains(x,z,1.14); }

    function polygonContains(points,x,z){
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const xi=points[i].x, zi=points[i].z;
        const xj=points[j].x, zj=points[j].z;
        if((zi>z)!==(zj>z) && x < ((xj-xi)*(z-zi)/(zj-zi))+xi) inside=!inside;
      }
      return inside;
    }

    function nearestPolygonEdgeData(points,x,z){
      let best = { dist:Infinity, nx:0, nz:0 };
      for(let i=0;i<points.length;i++){
        const a=points[i];
        const b=points[(i+1)%points.length];
        const ex=b.x-a.x, ez=b.z-a.z;
        const len2=ex*ex+ez*ez || 1;
        let t=((x-a.x)*ex+(z-a.z)*ez)/len2;
        t=Math.max(0,Math.min(1,t));
        const px=a.x+ex*t, pz=a.z+ez*t;
        const dx=x-px, dz=z-pz;
        const dist=Math.sqrt(dx*dx+dz*dz);
        let nx=ez, nz=-ex;
        const nl=Math.sqrt(nx*nx+nz*nz) || 1;
        nx/=nl; nz/=nl;
        if((x+nx*0.2)!==(x+nx*0.2)) continue;
        if(!polygonContains(points,x+nx*0.12,z+nz*0.12)){ nx=-nx; nz=-nz; }
        if(dist<best.dist) best={ dist,nx,nz };
      }
      return best;
    }

    function scalePolygon(points,scale){
      return points.map((p)=>({ x:p.x*scale, z:p.z*scale }));
    }

    return {
      HEART_PTS,
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
