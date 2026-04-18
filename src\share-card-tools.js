(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  const uiText = function(){
    return root.config && root.config.text ? root.config.text : {};
  };

  function escapeXml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&apos;');
  }

  function slugify(value){
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'') || 'share-card';
  }

  function formatMoment(moment){
    const shareMoments = uiText().shareMoments || {};
    if(shareMoments[moment]){
      return String(shareMoments[moment]);
    }
    return String(moment || 'result')
      .replace(/[_-]+/g,' ')
      .toUpperCase();
  }

  function getPalette(moment){
    const palettes = {
      road_clear:{ bgA:'#fff3b0', bgB:'#ff8c42', line:'#40210f', accent:'#fff8dc', text:'#20130b', textSoft:'#5a3927' },
      challenge_clear:{ bgA:'#9be7ff', bgB:'#1167b1', line:'#06274f', accent:'#d8f8ff', text:'#051423', textSoft:'#16395b' },
      ring_out:{ bgA:'#ffb347', bgB:'#ff3c38', line:'#4f100c', accent:'#ffe1a6', text:'#2a0c09', textSoft:'#6f241a' },
      perfect_win:{ bgA:'#d2ff72', bgB:'#28c76f', line:'#123d1d', accent:'#f4ffd6', text:'#0c1f10', textSoft:'#2a5c35' },
      close_loss:{ bgA:'#ffd6e0', bgB:'#ff6b8a', line:'#5b1125', accent:'#fff0f4', text:'#240910', textSoft:'#6a2035' },
      victory:{ bgA:'#82f7c5', bgB:'#00a896', line:'#0d3d37', accent:'#dffef1', text:'#071d1b', textSoft:'#19524d' },
      defeat:{ bgA:'#ffe0b2', bgB:'#ff7f50', line:'#5a2110', accent:'#fff1da', text:'#220e08', textSoft:'#6c3320' }
    };
    return palettes[moment] || palettes.victory;
  }

  function buildScoreLabel(payload){
    if(typeof payload.scorePlayer === 'number' && typeof payload.scoreEnemy === 'number'){
      return payload.scorePlayer+' - '+payload.scoreEnemy;
    }
    return payload.result === 'win'
      ? (uiText().shareCardVictory || 'VICTORY')
      : (uiText().shareCardDefeat || 'DEFEAT');
  }

  function buildModeLabel(payload){
    if(payload.mode === 'challenge' && payload.challengeNode != null){
      return (uiText().shareCardChallengeRoad || 'CHALLENGE ROAD')+' / '+(uiText().shareCardNode || 'NODE')+' ' + (payload.challengeNode + 1);
    }
    if(payload.mode === 'challenge'){
      return uiText().shareCardChallengeRoad || 'CHALLENGE ROAD';
    }
    return uiText().shareCardQuickBattle || 'QUICK BATTLE';
  }

  function buildFooterLabel(payload){
    const arena = payload.arenaLabel || 'ARENA';
    const top = payload.playerTopLabel || payload.playerTop || 'TOP';
    const enemy = payload.enemyTopLabel || payload.enemyTop || 'ENEMY';
    return arena+' / '+top+(uiText().battleIntroVersus || ' VS ')+enemy;
  }

  function buildResultCard(payload){
    const source = payload || {};
    const title = source.title || 'Spin Clash';
    const moment = source.moment || (source.result === 'loss' ? 'defeat' : 'victory');
    const palette = getPalette(moment);
    const scoreLabel = buildScoreLabel(source);
    const modeLabel = buildModeLabel(source);
    const footerLabel = buildFooterLabel(source);
    const arenaLabel = source.arenaLabel || 'ARENA';
    const playerTopLabel = source.playerTopLabel || source.playerTop || 'TOP';
    const enemyTopLabel = source.enemyTopLabel || source.enemyTop || 'ENEMY';
    const resultLabel = source.result === 'loss'
      ? (uiText().shareCardDefeat || 'DEFEAT')
      : (uiText().shareCardVictory || 'VICTORY');
    const momentLabel = formatMoment(moment);
    const nodeLabel = source.challengeNode != null
      ? (uiText().shareCardNode || 'NODE')+' ' + (source.challengeNode + 1)
      : (uiText().shareCardOpenMatch || 'OPEN MATCH');
    const svg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="'+escapeXml(title+' '+momentLabel)+'">',
      '  <defs>',
      '    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
      '      <stop offset="0%" stop-color="'+palette.bgA+'"/>',
      '      <stop offset="100%" stop-color="'+palette.bgB+'"/>',
      '    </linearGradient>',
      '    <linearGradient id="band" x1="0%" y1="0%" x2="100%" y2="0%">',
      '      <stop offset="0%" stop-color="'+palette.line+'" stop-opacity="0.18"/>',
      '      <stop offset="100%" stop-color="'+palette.line+'" stop-opacity="0.02"/>',
      '    </linearGradient>',
      '  </defs>',
      '  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>',
      '  <rect x="38" y="38" width="1124" height="554" rx="26" fill="none" stroke="'+palette.line+'" stroke-width="4"/>',
      '  <rect x="70" y="92" width="1060" height="18" rx="9" fill="url(#band)"/>',
      '  <rect x="70" y="520" width="1060" height="18" rx="9" fill="url(#band)"/>',
      '  <circle cx="1030" cy="145" r="126" fill="'+palette.accent+'" fill-opacity="0.22"/>',
      '  <circle cx="1060" cy="460" r="188" fill="'+palette.accent+'" fill-opacity="0.14"/>',
      '  <circle cx="170" cy="510" r="162" fill="'+palette.accent+'" fill-opacity="0.18"/>',
      '  <rect x="78" y="74" width="220" height="54" rx="27" fill="'+palette.accent+'" fill-opacity="0.86"/>',
      '  <text x="110" y="109" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="'+palette.text+'">'+escapeXml(momentLabel)+'</text>',
      '  <text x="78" y="190" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="'+palette.text+'">'+escapeXml(title)+'</text>',
      '  <text x="80" y="244" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="600" fill="'+palette.textSoft+'">'+escapeXml(modeLabel)+'</text>',
      '  <text x="80" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="'+palette.textSoft+'">'+escapeXml(arenaLabel)+'</text>',
      '  <text x="80" y="384" font-family="Segoe UI, Arial, sans-serif" font-size="136" font-weight="900" fill="'+palette.text+'">'+escapeXml(scoreLabel)+'</text>',
      '  <text x="80" y="444" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="'+palette.textSoft+'">'+escapeXml(resultLabel+' / '+nodeLabel)+'</text>',
      '  <text x="80" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="'+palette.textSoft+'">'+escapeXml(footerLabel)+'</text>',
      '  <g transform="translate(780 176)">',
      '    <rect x="0" y="0" width="290" height="118" rx="24" fill="'+palette.accent+'" fill-opacity="0.85"/>',
      '    <text x="28" y="46" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="'+palette.textSoft+'">'+escapeXml(uiText().shareCardPlayerTop || 'PLAYER TOP')+'</text>',
      '    <text x="28" y="84" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="800" fill="'+palette.text+'">'+escapeXml(playerTopLabel)+'</text>',
      '  </g>',
      '  <g transform="translate(780 318)">',
      '    <rect x="0" y="0" width="290" height="118" rx="24" fill="'+palette.accent+'" fill-opacity="0.85"/>',
      '    <text x="28" y="46" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="'+palette.textSoft+'">'+escapeXml(uiText().shareCardEnemyTop || 'ENEMY TOP')+'</text>',
      '    <text x="28" y="84" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="800" fill="'+palette.text+'">'+escapeXml(enemyTopLabel)+'</text>',
      '  </g>',
      '</svg>'
    ].join('\n');

    return {
      kind:'result_card_svg',
      mimeType:'image/svg+xml',
      filename:'spin-clash-'+slugify(moment)+'-'+slugify(arenaLabel)+'-'+slugify(playerTopLabel)+'.svg',
      text:svg
    };
  }

  root.createShareCardTools = function createShareCardTools(){
    return {
      buildResultCard
    };
  };
})();
