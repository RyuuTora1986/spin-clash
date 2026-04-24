(function(){
  const root = window.SpinClash;
  const analytics = root.services.analytics || null;

  function buildFailureInfo(input){
    if(input && input.granted === true){
      return {
        granted:true,
        category:'granted',
        reason:null
      };
    }
    const reason = input && input.reason
      ? input.reason
      : (input && input.message ? input.message : 'provider_disabled');
    return {
      granted:false,
      category:'unavailable',
      reason:reason
    };
  }

  function track(name, payload){
    if(analytics && typeof analytics.track === 'function'){
      analytics.track(name, payload);
    }
  }

  root.services.reward = {
    wasGranted(result){
      return !!(result && result.granted === true);
    },
    getFailureInfo:buildFailureInfo,
    getMockMode(){
      return 'disabled';
    },
    setMockMode(){
      return 'disabled';
    },
    isRewardAvailable(){
      return {
        available:false,
        reason:'provider_disabled'
      };
    },
    getAdapterInfo(){
      return {
        adapter:'disabled',
        mockMode:'disabled',
        rewardEnabled:false,
        ready:false,
        loading:false,
        allowedPlacements:[],
        rewardedAdUnitConfigured:false,
        lastAvailabilityReason:'provider_disabled',
        lastRequestReason:null,
        activePlacement:null
      };
    },
    request(placement, context){
      const rewardAttemptId = 'reward_disabled_' + Date.now().toString(36);
      const payload = {
        placement,
        context:context || {},
        adapter:'disabled',
        reward_attempt_id:rewardAttemptId
      };
      track('reward_request_start', payload);
      track('reward_decline', Object.assign({}, payload, {
        granted:false,
        reason:'provider_disabled'
      }));
      return Promise.resolve({
        placement,
        adapter:'disabled',
        granted:false,
        context:context || {},
        reward_attempt_id:rewardAttemptId,
        reason:'provider_disabled'
      });
    }
  };
})();
