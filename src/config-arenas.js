(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.state = root.state || {};

  root.config.arenas = [
    {
      id:'circle_bowl',
      label:'Azure Ring Court',
      type:'circle',
      hazardSpinThreshold:6.5,
      unlockCost:0,
      geometry:{
        bowlHeight:0.58,
        scratchBowlHeight:0.78,
        hazardStart:6.5,
        markerScales:[0.25, 0.5, 0.75]
      },
      physics:{
        slopeForce:5.5,
        radialPull:1,
        safeWallInset:0.18,
        wallPush:0.42
      },
      renderer:{
        floorColor:0x070710,
        floorEmissive:0x010118,
        rimColor:0x0055ff,
        hazardColor:0xff2200,
        centerColor:0x00ffcc,
        accentColor:0x1a3355,
        deepAccentColor:0x0e1a2e
      }
    },
    {
      id:'heart_bowl',
      label:'Scarlet Heart Verge',
      type:'heart',
      hazardSpinThreshold:null,
      unlockCost:0,
      shape:{
        scaleX:1,
        scaleZ:1,
        pinch:0
      },
      launchSlots:{
        player:{ x:-2.55, z:0.62 },
        enemy:{ x:2.55, z:0.62 }
      },
      geometry:{
        bowlHeight:0.58,
        scratchBowlHeight:0.78,
        hazardScale:0.84,
        nearWallScale:0.94,
        outerScale:1.14
      },
      physics:{
        slopeForce:4.4,
        radialPull:0.84,
        wallPush:0.38,
        openingGrace:1.28,
        openingInwardAssist:16.0,
        openingClampPush:0.34
      },
      renderer:{
        floorColor:0x07050f,
        floorEmissive:0x010008,
        rimColor:0xff2288,
        hazardColor:0xff1166,
        centerColor:0xff44aa,
        accentColor:0x3a0a44,
        deepAccentColor:0x1a0520
      }
    },
    {
      id:'hex_bowl',
      label:'Shard Hex Array',
      type:'hex',
      hazardSpinThreshold:null,
      unlockCost:120,
      shape:{
        sides:6,
        radiusScale:1,
        rotation:Math.PI / 6
      },
      launchSlots:{
        player:{ x:-1.15, z:4.45 },
        enemy:{ x:1.15, z:-4.45 }
      },
      geometry:{
        bowlHeight:0.62,
        scratchBowlHeight:0.78,
        hazardScale:0.82,
        outerScale:1.12
      },
      physics:{
        slopeForce:5.0,
        radialPull:0.6,
        wallPush:0.42
      },
      renderer:{
        floorColor:0x0b0d11,
        floorEmissive:0x071119,
        rimColor:0xffb000,
        hazardColor:0xffd266,
        centerColor:0xffd266,
        accentColor:0x4a3410,
        deepAccentColor:0x1f1808
      }
    },
    {
      id:'cyclone_bowl',
      label:'Tempest Maw Depth',
      type:'circle',
      hazardSpinThreshold:5.9,
      unlockCost:180,
      geometry:{
        bowlHeight:0.7,
        scratchBowlHeight:0.9,
        hazardStart:5.9,
        markerScales:[0.2, 0.4, 0.62, 0.82]
      },
      physics:{
        slopeForce:6.25,
        radialPull:1.05,
        safeWallInset:0.22,
        wallPush:0.46
      },
      renderer:{
        floorColor:0x071018,
        floorEmissive:0x041629,
        rimColor:0x4ad7ff,
        hazardColor:0xff7a18,
        centerColor:0xb5fff2,
        accentColor:0x16466d,
        deepAccentColor:0x0d2238
      }
    },
    {
      id:'rose_bowl',
      label:'Thornbloom Snare',
      type:'heart',
      hazardSpinThreshold:null,
      unlockCost:210,
      shape:{
        scaleX:1.08,
        scaleZ:0.92,
        pinch:0.22
      },
      launchSlots:{
        player:{ x:-2.35, z:0.58 },
        enemy:{ x:2.35, z:0.58 }
      },
      geometry:{
        bowlHeight:0.66,
        scratchBowlHeight:0.86,
        hazardScale:0.78,
        nearWallScale:0.9,
        outerScale:1.16
      },
      physics:{
        slopeForce:5.1,
        radialPull:0.68,
        wallPush:0.48,
        openingGrace:0.92,
        openingInwardAssist:9.6,
        openingClampPush:0.48
      },
      renderer:{
        floorColor:0x140712,
        floorEmissive:0x2a091f,
        rimColor:0xff5aa6,
        hazardColor:0xff2e7a,
        centerColor:0xffb0d2,
        accentColor:0x61203c,
        deepAccentColor:0x2d0d1e
      }
    },
    {
      id:'octa_bowl',
      label:'Prism Arcade',
      type:'hex',
      hazardSpinThreshold:null,
      unlockCost:240,
      shape:{
        sides:8,
        radiusScale:0.97,
        rotation:Math.PI / 8
      },
      geometry:{
        bowlHeight:0.68,
        scratchBowlHeight:0.88,
        hazardScale:0.78,
        outerScale:1.16
      },
      physics:{
        slopeForce:5.45,
        radialPull:0.66,
        wallPush:0.48
      },
      renderer:{
        floorColor:0x101119,
        floorEmissive:0x171f36,
        rimColor:0x9f8cff,
        hazardColor:0xffc857,
        centerColor:0xfff0b8,
        accentColor:0x50437d,
        deepAccentColor:0x27213f
      }
    },
    {
      id:'heart_bowl_intro',
      label:'Heart Entry Bowl',
      type:'heart',
      hiddenFromQuick:true,
      challengeOnly:true,
      unlockCost:0,
      shape:{
        scaleX:1.08,
        scaleZ:1.08,
        pinch:0.02
      },
      launchSlots:{
        player:{ x:-2.88, z:0.42 },
        enemy:{ x:2.88, z:-0.42 }
      },
      geometry:{
        bowlHeight:0.54,
        scratchBowlHeight:0.74,
        hazardScale:0.9,
        nearWallScale:0.975,
        outerScale:1.2
      },
      physics:{
        slopeForce:3.7,
        radialPull:1.02,
        wallPush:0.28,
        openingGrace:1.82,
        openingInwardAssist:26.0,
        openingClampPush:0.22
      },
      renderer:{
        floorColor:0x081018,
        floorEmissive:0x02060e,
        rimColor:0xff6fa8,
        hazardColor:0xff8cb6,
        centerColor:0x7ff4ff,
        accentColor:0x243a52,
        deepAccentColor:0x112032
      }
    },
    {
      id:'hex_bowl_intro',
      label:'Hex Entry Bowl',
      type:'hex',
      hiddenFromQuick:true,
      challengeOnly:true,
      unlockCost:0,
      shape:{
        sides:6,
        radiusScale:1.2,
        rotation:Math.PI / 6
      },
      launchSlots:{
        player:{ x:0, z:3.15 },
        enemy:{ x:0, z:-3.15 }
      },
      geometry:{
        bowlHeight:0.58,
        scratchBowlHeight:0.76,
        hazardScale:0.92,
        outerScale:1.36
      },
      physics:{
        slopeForce:3.85,
        radialPull:1.08,
        wallPush:0.5
      },
      renderer:{
        floorColor:0x0b1016,
        floorEmissive:0x08111b,
        rimColor:0xffcc72,
        hazardColor:0xffdf9d,
        centerColor:0xc2fff2,
        accentColor:0x34506f,
        deepAccentColor:0x162536
      }
    },
    {
      id:'circle_boss_intro',
      label:'Redline Training Ring',
      type:'circle',
      hiddenFromQuick:true,
      challengeOnly:true,
      hazardSpinThreshold:6.9,
      unlockCost:0,
      launchSlots:{
        player:{ x:0, z:4.35 },
        enemy:{ x:0, z:-4.35 }
      },
      geometry:{
        bowlHeight:0.58,
        scratchBowlHeight:0.78,
        hazardStart:6.9,
        outerScale:1.3,
        markerScales:[0.25, 0.5, 0.75]
      },
      physics:{
        slopeForce:5.2,
        radialPull:1,
        safeWallInset:0.38,
        wallPush:0.42
      },
      renderer:{
        floorColor:0x100809,
        floorEmissive:0x120303,
        rimColor:0xff4c2c,
        hazardColor:0xff8b42,
        centerColor:0xfff0b0,
        accentColor:0x4b1820,
        deepAccentColor:0x1c0a10
      }
    }
  ];

  if(typeof root.state.currentArenaIndex !== 'number'){
    root.state.currentArenaIndex = 0;
  }
  if(!root.state.currentArenaId && root.config.arenas[0]){
    root.state.currentArenaId = root.config.arenas[0].id;
  }
})();
