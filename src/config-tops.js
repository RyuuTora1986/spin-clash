(function(){
  const root = window.SpinClash;
  root.config.tops = [
    {
      id:'impact',
      name:'Impact',
      family:'impact',
      variant:'core',
      unlockSource:'starter',
      skill:'Fly Charge',
      combat:{
        actions:{
          dash:{ id:'dash', key:'Space', universal:true },
          guard:{ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 },
          signature:{ id:'signature', key:'KeyQ', skillId:'Fly Charge' }
        },
        collision:{ roleBias:1.08 },
        attrition:{ hpDecayPerSec:0.08 }
      },
      meshFamily:'impact',
      color:0xff4400,
      emi:0x551100,
      hp:140,
      maxSpin:3400,
      spd:28,
      mass:0.80,
      brate:1.2,
      unlockCost:0
    },
    {
      id:'armor',
      name:'Armor',
      family:'armor',
      variant:'core',
      unlockSource:'starter',
      skill:'Fortress Pulse',
      combat:{
        actions:{
          dash:{ id:'dash', key:'Space', universal:true },
          guard:{ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 },
          signature:{ id:'signature', key:'KeyQ', skillId:'Fortress Pulse' }
        },
        collision:{ roleBias:0.95 },
        attrition:{ hpDecayPerSec:0.05 }
      },
      meshFamily:'armor',
      color:0x4488ff,
      emi:0x001133,
      hp:200,
      maxSpin:2600,
      spd:22,
      mass:0.95,
      brate:1.0,
      unlockCost:0
    },
    {
      id:'trick',
      name:'Trick',
      family:'trick',
      variant:'core',
      unlockSource:'road_or_shop',
      skill:'Phantom',
      combat:{
        actions:{
          dash:{ id:'dash', key:'Space', universal:true },
          guard:{ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 },
          signature:{ id:'signature', key:'KeyQ', skillId:'Phantom' }
        },
        collision:{ roleBias:1.02 },
        attrition:{ hpDecayPerSec:0.11 }
      },
      meshFamily:'trick',
      color:0xaa44ff,
      emi:0x220044,
      hp:115,
      maxSpin:3900,
      spd:34,
      mass:0.70,
      brate:1.4,
      unlockCost:90
    },
    {
      id:'impact_breaker',
      name:'Breaker',
      family:'impact',
      variant:'breaker',
      unlockSource:'shop',
      skill:'Fly Charge',
      combat:{
        actions:{
          dash:{ id:'dash', key:'Space', universal:true },
          guard:{ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 },
          signature:{ id:'signature', key:'KeyQ', skillId:'Fly Charge' }
        },
        collision:{ roleBias:1.16 },
        attrition:{ hpDecayPerSec:0.10 }
      },
      meshFamily:'impact',
      color:0xff8855,
      emi:0x662200,
      hp:130,
      maxSpin:3600,
      spd:31,
      mass:0.74,
      brate:1.38,
      unlockCost:250
    },
    {
      id:'trick_raider',
      name:'Raider',
      family:'trick',
      variant:'raider',
      unlockSource:'shop',
      skill:'Phantom',
      combat:{
        actions:{
          dash:{ id:'dash', key:'Space', universal:true },
          guard:{ id:'guard', key:'KeyE', universal:true, enabled:true, cooldown:4.0, duration:0.82 },
          signature:{ id:'signature', key:'KeyQ', skillId:'Phantom' }
        },
        collision:{ roleBias:1.1 },
        attrition:{ hpDecayPerSec:0.13 }
      },
      meshFamily:'trick',
      color:0xff66cc,
      emi:0x441122,
      hp:108,
      maxSpin:4100,
      spd:36,
      mass:0.66,
      brate:1.52,
      unlockCost:320
    }
  ];
})();
