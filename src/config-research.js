(function(){
  const root = window.SpinClash;
  root.config.research = [
    {
      id:'spin_core',
      label:'SPIN CORE',
      description:'Raise max spin reserves across every top shell.',
      statLabel:'MAX SPIN',
      levels:[
        { cost:45, preview:'+4% MAX SPIN', effect:{ maxSpinMul:1.04 } },
        { cost:80, preview:'+8% MAX SPIN', effect:{ maxSpinMul:1.08 } },
        { cost:145, preview:'+12% MAX SPIN', effect:{ maxSpinMul:1.12 } },
        { cost:220, preview:'+16% MAX SPIN', effect:{ maxSpinMul:1.16 } }
      ]
    },
    {
      id:'guard_frame',
      label:'GUARD FRAME',
      description:'Reinforce the shell ring for steadier hit survival.',
      statLabel:'MAX HP',
      levels:[
        { cost:45, preview:'+3% MAX HP', effect:{ hpMul:1.03 } },
        { cost:80, preview:'+6% MAX HP', effect:{ hpMul:1.06 } },
        { cost:140, preview:'+9% MAX HP', effect:{ hpMul:1.09 } },
        { cost:210, preview:'+12% MAX HP', effect:{ hpMul:1.12 } }
      ]
    },
    {
      id:'burst_relay',
      label:'BURST RELAY',
      description:'Accelerate burst gain so skills come online sooner.',
      statLabel:'BURST GAIN',
      levels:[
        { cost:40, preview:'+5% BURST GAIN', effect:{ brateMul:1.05 } },
        { cost:85, preview:'+10% BURST GAIN', effect:{ brateMul:1.10 } },
        { cost:145, preview:'+15% BURST GAIN', effect:{ brateMul:1.15 } },
        { cost:220, preview:'+20% BURST GAIN', effect:{ brateMul:1.20 } }
      ]
    }
  ];
})();
