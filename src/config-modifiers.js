(function(){
  const root = window.SpinClash;
  root.config.modifiers = {
    standard:{ id:'standard', label:'STANDARD', description:'No special rules.', player:{}, enemy:{} },
    overclock:{ id:'overclock', label:'OVERCLOCK', description:'Both tops start with stronger burst gain.', player:{ brate:1.18 }, enemy:{ brate:1.18 } },
    ironwall:{ id:'ironwall', label:'IRON WALL', description:'Enemy durability is boosted.', player:{}, enemy:{ hpMul:1.12, massMul:1.08 } },
    suddenDeath:{ id:'sudden_death', label:'SUDDEN DEATH', description:'Lower HP, faster rounds.', player:{ hpMul:0.82 }, enemy:{ hpMul:0.82 }, rules:{ roundTimer:22 } },
    burstRush:{ id:'burst_rush', label:'BURST RUSH', description:'Player starts closer to burst skill.', player:{ startBurst:45 }, enemy:{ startBurst:20 } },
    heavyFloor:{ id:'heavy_floor', label:'HEAVY FLOOR', description:'Heavier arena friction rewards control.', player:{ spdMul:0.95, massMul:1.06 }, enemy:{ spdMul:0.95, massMul:1.06 } }
  };
})();
