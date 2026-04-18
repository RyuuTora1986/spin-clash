(function(){
  const root = window.SpinClash;
  root.config.arenas = [
    {
      id:'circle_bowl',
      label:'CIRCLE BOWL',
      type:'circle',
      hazardSpinThreshold:6.5,
      unlockCost:0
    },
    {
      id:'heart_bowl',
      label:'HEART BOWL',
      type:'heart',
      hazardSpinThreshold:null,
      unlockCost:0
    },
    {
      id:'hex_bowl',
      label:'HEX BOWL',
      type:'hex',
      hazardSpinThreshold:null,
      unlockCost:120
    }
  ];
})();
