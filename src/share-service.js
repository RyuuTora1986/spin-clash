(function(){
  const root = window.SpinClash;
  const analytics = () => root.services.analytics;

  function normalizeSharePayload(payload){
    const source = payload || {};
    return {
      kind:source.kind || 'result',
      mode:source.mode || null,
      result:source.result || null,
      arenaId:source.arenaId || null,
      arenaLabel:source.arenaLabel || null,
      playerTop:source.playerTop || null,
      enemyTop:source.enemyTop || null,
      challengeNode:source.challengeNode != null ? source.challengeNode : null
    };
  }

  function fallbackCopy(text){
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    window.prompt('Copy share text', text);
    return Promise.resolve();
  }

  root.services.share = {
    share(payload){
      analytics().track('share_click', normalizeSharePayload(payload));
      const text = payload.text || '';
      if (navigator.share) {
        return navigator.share({ title: payload.title || 'Spin Clash', text }).catch(()=>fallbackCopy(text));
      }
      return fallbackCopy(text);
    }
  };
})();