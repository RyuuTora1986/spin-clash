(function(){
  const runtime = window.__spinClashSharedBackendRuntime;
  if(!runtime || runtime.enabled !== true){
    return;
  }

  let root = null;

  function ensureStyle(){
    if(document.getElementById('shared-backend-status-style')){
      return;
    }
    const style = document.createElement('style');
    style.id = 'shared-backend-status-style';
    style.textContent = [
      '.shared-backend-status{position:fixed;top:14px;right:14px;z-index:9999;min-width:220px;padding:10px 12px 11px;border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(6,10,18,0.84);backdrop-filter:blur(10px);box-shadow:0 14px 40px rgba(0,0,0,0.3);font-family:"Segoe UI",sans-serif;color:#f4f7fb;pointer-events:none;}',
      '.shared-backend-status__eyebrow{font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(244,247,251,0.58);margin-bottom:6px;}',
      '.shared-backend-status__title{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:13px;font-weight:700;}',
      '.shared-backend-status__env{padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.08);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;}',
      '.shared-backend-status__meta{margin-top:8px;font-size:11px;line-height:1.45;color:rgba(244,247,251,0.72);}',
      '.shared-backend-status__tone-ready{border-color:rgba(69,220,198,0.34);}',
      '.shared-backend-status__tone-loading{border-color:rgba(255,200,90,0.34);}',
      '.shared-backend-status__tone-error{border-color:rgba(255,117,117,0.34);}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureRoot(){
    if(root && root.isConnected){
      return root;
    }
    root = document.createElement('div');
    root.className = 'shared-backend-status';
    document.body.appendChild(root);
    return root;
  }

  function readBridgeState(){
    const bridge = window.SpinClash
      && window.SpinClash.services
      && window.SpinClash.services.sharedBackendBridge;
    return bridge && typeof bridge.getState === 'function'
      ? bridge.getState()
      : null;
  }

  function buildModel(){
    const state = readBridgeState();
    if(state && (state.lastHydrationError || state.lastSyncError)){
      return {
        tone:'error',
        statusLabel:'同步异常',
        detail:state.lastHydrationError || state.lastSyncError
      };
    }
    if(state && state.loading){
      return {
        tone:'loading',
        statusLabel:'同步中',
        detail:'当前页面正在和共享后端交换进度。'
      };
    }
    if(state && state.ready){
      return {
        tone:'ready',
        statusLabel:'已连接',
        detail:'当前页面使用共享后端状态，不再只依赖本地存档。'
      };
    }
    return {
      tone:'loading',
      statusLabel:'初始化中',
      detail:'正在准备匿名会话和远端进度。'
    };
  }

  function render(){
    const node = ensureRoot();
    const model = buildModel();
    node.className = 'shared-backend-status shared-backend-status__tone-' + model.tone;
    node.innerHTML = [
      '<div class="shared-backend-status__eyebrow">Shared Backend</div>',
      '<div class="shared-backend-status__title">',
      '<span>Spin Clash</span>',
      '<span class="shared-backend-status__env">' + runtime.environmentLabel + '</span>',
      '</div>',
      '<div class="shared-backend-status__meta">状态: ' + model.statusLabel + '</div>',
      '<div class="shared-backend-status__meta">' + model.detail + '</div>'
    ].join('');
  }

  ensureStyle();
  render();
  window.setInterval(render, 500);
})();
