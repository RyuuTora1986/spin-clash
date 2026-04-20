(function(){
  const root = window.SpinClash;
  root.config.roadRanks = [
    {
      id:'rank_i',
      label:'RANK I',
      description:'Base championship tuning and baseline rewards.',
      rewardTopId:'trick',
      rewardMul:1,
      enemy:{ hpMul:1, spinMul:1, spdMul:1, massMul:1, brate:1 }
    },
    {
      id:'rank_ii',
      label:'RANK II',
      description:'Sharper enemy tuning with a measured Scrap bonus for repeat clears.',
      rewardTopId:'armor_bastion',
      rewardMul:1.2,
      enemy:{ hpMul:1.08, spinMul:1.09, spdMul:1.04, massMul:1.015, brate:1.05 }
    },
    {
      id:'rank_iii',
      label:'RANK III',
      description:'Final road pressure with the strongest enemy climb, not a runaway reward spike.',
      rewardTopId:'impact_nova',
      rewardMul:1.38,
      enemy:{ hpMul:1.15, spinMul:1.17, spdMul:1.07, massMul:1.04, brate:1.10 }
    }
  ];
})();
