(function(){
  const root = window.SpinClash;
  const analytics = () => root.services.analytics;
  const uiText = () => root.config && root.config.text ? root.config.text : {};
  const createShareCardTools = root.createShareCardTools || null;
  const shareCardTools = createShareCardTools ? createShareCardTools() : null;

  function normalizeSharePayload(payload){
    const source = payload || {};
    return {
      kind:source.kind || 'result',
      mode:source.mode || null,
      result:source.result || null,
      moment:source.moment || null,
      arenaId:source.arenaId || null,
      arenaLabel:source.arenaLabel || null,
      playerTop:source.playerTop || null,
      playerTopLabel:source.playerTopLabel || null,
      enemyTop:source.enemyTop || null,
      enemyTopLabel:source.enemyTopLabel || null,
      enemyPreset:source.enemyPreset || null,
      enemyPresetLabel:source.enemyPresetLabel || null,
      challengeNode:source.challengeNode != null ? source.challengeNode : null,
      scorePlayer:typeof source.scorePlayer === 'number' ? source.scorePlayer : null,
      scoreEnemy:typeof source.scoreEnemy === 'number' ? source.scoreEnemy : null
    };
  }

  function fallbackCopy(text){
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    window.prompt((uiText().copyShareText || 'Copy share text'), text);
    return Promise.resolve();
  }

  function track(eventName, payload){
    const analyticsService = analytics();
    if (analyticsService && typeof analyticsService.track === 'function') {
      analyticsService.track(eventName, payload);
    }
  }

  function buildResultCard(payload){
    if (!shareCardTools || typeof shareCardTools.buildResultCard !== 'function') {
      return null;
    }
    return shareCardTools.buildResultCard(payload);
  }

  function downloadArtifact(artifact){
    if (!artifact || !document || typeof document.createElement !== 'function' || !URL || typeof URL.createObjectURL !== 'function') {
      return Promise.resolve(false);
    }
    const blob = new Blob([artifact.text], { type: artifact.mimeType || 'application/octet-stream' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = artifact.filename || 'spin-clash-share.txt';
    if (document.body && typeof document.body.appendChild === 'function') {
      document.body.appendChild(anchor);
    }
    if (typeof anchor.click === 'function') {
      anchor.click();
    }
    if (document.body && typeof document.body.removeChild === 'function') {
      document.body.removeChild(anchor);
    }
    URL.revokeObjectURL(href);
    return Promise.resolve(true);
  }

  function tryFileShare(title, text, artifact){
    if (!artifact || !navigator.share || typeof File === 'undefined') {
      return Promise.resolve(false);
    }
    const file = new File([artifact.text], artifact.filename || 'spin-clash-share.svg', {
      type: artifact.mimeType || 'image/svg+xml'
    });
    if (typeof navigator.canShare === 'function' && !navigator.canShare({ files:[file] })) {
      return Promise.resolve(false);
    }
    return navigator.share({
      title,
      text,
      files:[file]
    }).then(function(){
      return true;
    }).catch(function(){
      return false;
    });
  }

  root.services.share = {
    buildResultCard,
    downloadResultCard(payload){
      return downloadArtifact(buildResultCard(payload));
    },
    share(payload){
      const analyticsPayload = normalizeSharePayload(payload);
      track('share_click', analyticsPayload);
      const text = payload.text || '';
      const title = payload.title || 'Spin Clash';
      const artifact = payload && payload.kind === 'result' ? buildResultCard(payload) : null;
      return tryFileShare(title, text, artifact).then(function(sharedFile){
        if (sharedFile) {
          const result = { method:'web_share_file', artifact:artifact ? artifact.kind : null };
          track('share_complete', Object.assign({}, analyticsPayload, result));
          return result;
        }
        if (navigator.share) {
          return navigator.share({ title:title, text:text })
            .then(function(){
              const result = { method:'web_share_text', artifact:artifact ? artifact.kind : null };
              track('share_complete', Object.assign({}, analyticsPayload, result));
              return result;
            })
            .catch(function(){
              return downloadArtifact(artifact).then(function(downloaded){
                return fallbackCopy(text).then(function(){
                  const result = { method:downloaded ? 'download_and_copy' : 'copy_text', artifact:artifact ? artifact.kind : null };
                  track('share_complete', Object.assign({}, analyticsPayload, result));
                  return result;
                });
              });
            });
        }
        return downloadArtifact(artifact).then(function(downloaded){
          return fallbackCopy(text).then(function(){
            const result = { method:downloaded ? 'download_and_copy' : 'copy_text', artifact:artifact ? artifact.kind : null };
            track('share_complete', Object.assign({}, analyticsPayload, result));
            return result;
          });
        });
      });
    }
  };
})();
