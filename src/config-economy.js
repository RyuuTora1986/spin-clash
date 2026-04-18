(function(){
  const root = window.SpinClash;
  root.config.economy = {
    rewards:{
      winBase:16,
      lossBase:6,
      challengeWinBase:20,
      challengeLossBase:10,
      doubleRewardMultiplier:2
    },
    runtime:{
      defaultRoundTimer:30,
      challengeContinueEnabled:true,
      challengeContinueLimit:1
    }
  };
})();
