(function(){
  const root = window.SpinClash;
  const analytics = () => root.services.analytics;
  const ADAPTER = 'mock';
  let mockMode = 'grant';

  function getResultValue(placement, context){
    const payloadContext = context || {};
    if(placement === 'double_reward'){
      return { kind:'currency_multiplier', multiplier:2 };
    }
    if(placement === 'continue_once'){
      return {
        kind:'continue',
        nodeIndex:payloadContext.nodeIndex != null ? payloadContext.nodeIndex : null
      };
    }
    if(placement === 'trial_unlock_arena'){
      return {
        kind:'trial_unlock',
        targetType:'arena',
        arenaId:payloadContext.arenaId || null
      };
    }
    return { kind:'generic_reward', placement };
  }

  function buildMockResult(placement, payloadContext, resultValue){
    if(mockMode === 'deny'){
      return Promise.resolve({
        placement,
        adapter:ADAPTER,
        granted:false,
        context:payloadContext,
        resultValue,
        reason:'mock_decline'
      });
    }
    if(mockMode === 'error'){
      return Promise.reject(new Error('mock_error'));
    }
    return Promise.resolve({
      placement,
      adapter:ADAPTER,
      granted:true,
      context: payloadContext,
      resultValue
    });
  }

  root.services.reward = {
    getMockMode(){
      return mockMode;
    },
    setMockMode(nextMode){
      const safeMode = nextMode === 'deny' || nextMode === 'error' ? nextMode : 'grant';
      mockMode = safeMode;
      return mockMode;
    },
    request(placement, context){
      const payloadContext = context || {};
      const resultValue = getResultValue(placement, payloadContext);
      analytics().track('reward_offer_show', {
        placement,
        context: payloadContext,
        adapter:ADAPTER,
        resultValue,
        mockMode
      });
      return buildMockResult(placement, payloadContext, resultValue).then((result)=>{
        if(!result || result.granted === false){
          analytics().track('reward_decline', {
            placement,
            context: payloadContext,
            granted:false,
            adapter:result && result.adapter ? result.adapter : ADAPTER,
            resultValue:result && result.resultValue ? result.resultValue : resultValue,
            reason: result && result.reason ? result.reason : 'not_granted',
            mockMode
          });
          return result;
        }
        analytics().track('reward_complete', {
          placement,
          context: payloadContext,
          granted:true,
          adapter:result.adapter || ADAPTER,
          resultValue:result.resultValue || resultValue,
          mockMode
        });
        return result;
      }).catch((error)=>{
        analytics().track('reward_decline', {
          placement,
          context: payloadContext,
          granted:false,
          adapter:ADAPTER,
          resultValue,
          reason:error && error.message ? error.message : 'request_failed',
          mockMode
        });
        throw error;
      });
    }
  };
})();
