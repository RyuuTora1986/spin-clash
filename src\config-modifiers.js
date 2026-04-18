(function(){
  const root = window.SpinClash;
  root.config.modifiers = {
    standard:{ id:'standard', label:'STANDARD', description:'No special rules.', player:{}, enemy:{} },
    overclock:{ id:'overclock', label:'OVERCLOCK', description:'Both tops start with faster burst gain.', player:{ brate:1.14 }, enemy:{ brate:1.14 } },
    ironwall:{ id:'ironwall', label:'IRON WALL', description:'Enemy durability is boosted.', player:{}, enemy:{ hpMul:1.09, massMul:1.05 } },
    suddenDeath:{ id:'sudden_death', label:'SUDDEN DEATH', description:'Lower HP, faster rounds.', player:{ hpMul:0.82 }, enemy:{ hpMul:0.82 }, rules:{ roundTimer:22 } },
    burstRush:{ id:'burst_rush', label:'BURST RUSH', description:'Player starts closer to burst skill.', player:{ startBurst:45 }, enemy:{ startBurst:20 } },
    heavyFloor:{ id:'heavy_floor', label:'HEAVY FLOOR', description:'Heavier arena friction rewards control.', player:{ spdMul:0.95, massMul:1.06 }, enemy:{ spdMul:0.95, massMul:1.06 } },
    launchSurge:{ id:'launch_surge', label:'LAUNCH SURGE', description:'Both tops open with faster burst pressure.', player:{ startBurst:28, brate:1.05 }, enemy:{ startBurst:28, brate:1.05 } },
    grindCore:{ id:'grind_core', label:'GRIND CORE', description:'Heavier footing turns the duel into a control grind.', player:{ spdMul:0.94, massMul:1.08 }, enemy:{ spdMul:0.94, massMul:1.08 } },
    lowSpin:{ id:'low_spin', label:'LOW SPIN', description:'Lower spin reserves tighten every mistake.', player:{ spinMul:0.88 }, enemy:{ spinMul:0.88 }, rules:{ roundTimer:25 } }
  };
})();
