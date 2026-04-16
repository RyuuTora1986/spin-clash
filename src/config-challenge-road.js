(function(){
  const root = window.SpinClash;
  root.config.challengeRoad = [
    { id:'node-1', name:'Qualifier', arenaIndex:0, enemyTopId:1, modifierId:'standard', reward:20 },
    { id:'node-2', name:'Counter Spin', arenaIndex:1, enemyTopId:2, modifierId:'burstRush', reward:25 },
    { id:'node-3', name:'Redline', arenaIndex:0, enemyTopId:0, modifierId:'overclock', reward:30 },
    { id:'node-4', name:'Guard Break', arenaIndex:2, enemyTopId:1, modifierId:'ironwall', reward:35 },
    { id:'node-5', name:'Tight Clock', arenaIndex:2, enemyTopId:2, modifierId:'suddenDeath', reward:40, unlockTopId:'trick' },
    { id:'node-6', name:'Final Bowl', arenaIndex:2, enemyTopId:0, modifierId:'heavyFloor', reward:50 }
  ];
})();
