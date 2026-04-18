(function(){
  const root = window.SpinClash;
  root.config.roadRanks = [
    {
      id:'rank_i',
      label:'RANK I',
      description:'Base championship tuning and baseline rewards.',
      rewardMul:1,
      enemy:{ hpMul:1, spinMul:1, spdMul:1, massMul:1, brate:1 }
    },
    {
      id:'rank_ii',
      label:'RANK II',
      description:'Sharper enemy tuning with a measured Scrap bonus.',
      rewardMul:1.2,
      enemy:{ hpMul:1.07, spinMul:1.08, spdMul:1.03, massMul:1.01, brate:1.04 }
    },
    {
      id:'rank_iii',
      label:'RANK III',
      description:'Final road pressure with the highest controlled reward bonus.',
      rewardMul:1.38,
      enemy:{ hpMul:1.13, spinMul:1.16, spdMul:1.06, massMul:1.03, brate:1.08 }
    }
  ];
})();
