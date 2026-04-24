(function(){
  const root = window.SpinClash;
  root.config.modifiers = {
    standard:{ id:'standard', label:'STANDARD', description:'No special rules.', player:{}, enemy:{} },
    overclock:{ id:'overclock', label:'OVERCLOCK', description:'Both tops start with faster burst gain.', player:{ brate:1.14 }, enemy:{ brate:1.14 } },
    ironwall:{ id:'ironwall', label:'IRON WALL', description:'Enemy durability is boosted.', player:{}, enemy:{ hpMul:1.09, massMul:1.05 } },
    suddenDeath:{ id:'sudden_death', label:'SUDDEN DEATH', description:'Lower HP, faster rounds.', player:{ hpMul:0.82 }, enemy:{ hpMul:0.82 }, rules:{ roundTimer:22 } },
    burstRush:{ id:'burst_rush', label:'BURST RUSH', description:'Player starts closer to burst skill.', player:{ startBurst:55, brate:1.12 }, enemy:{ startBurst:10, hpMul:0.88, spinMul:0.92 }, rules:{ roundTimer:26 } },
    heavyFloor:{ id:'heavy_floor', label:'HEAVY FLOOR', description:'Heavier arena friction rewards control.', player:{ spdMul:1.0, massMul:1.1, brate:1.12 }, enemy:{ spdMul:0.9, massMul:0.94, hpMul:0.82, spinMul:0.88 }, rules:{ roundTimer:24 } },
    roundRelief:{ id:'round_relief', label:'ROUND RELIEF', description:'Safer round-arena pacing for path nodes that replaced heart arenas.', player:{ spinMul:1.08, brate:1.12 }, enemy:{ spdMul:0.9, massMul:0.84, hpMul:0.88, spinMul:0.86, brate:0.96 }, rules:{ roundTimer:28 } },
    launchSurge:{ id:'launch_surge', label:'LAUNCH SURGE', description:'Both tops open with faster burst pressure.', player:{ startBurst:40, brate:1.12, massMul:1.16 }, enemy:{ startBurst:10, brate:0.98, spdMul:0.9, massMul:0.78, hpMul:0.92, spinMul:0.94 }, rules:{ roundTimer:24 } },
    grindCore:{ id:'grind_core', label:'GRIND CORE', description:'Heavier footing turns the duel into a control grind.', player:{ spdMul:1.0, massMul:1.16, brate:1.08 }, enemy:{ spdMul:0.9, massMul:0.78, hpMul:0.94, spinMul:0.95 }, rules:{ roundTimer:24 } },
    lowSpin:{ id:'low_spin', label:'LOW SPIN', description:'Lower spin reserves tighten every mistake.', player:{ spinMul:0.88 }, enemy:{ spinMul:0.88 }, rules:{ roundTimer:25 } }
  };
})();
