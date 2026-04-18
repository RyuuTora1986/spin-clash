(function(){
  const root = window.SpinClash;
  const params = new URLSearchParams(window.location.search);
  const enabled = params.get('debug') === '1';
  root.debug.enabled = enabled;

  root.services.debug = {
    enabled,
    getQueryFlag(name){ return params.get(name); },
    mount(infoProvider, actions){
      if (!enabled) return null;
      const wrap = document.createElement('div');
      wrap.id = 'debug-panel-wrap';
      wrap.style.position = 'fixed';
      wrap.style.top = '8px';
      wrap.style.left = '8px';
      wrap.style.zIndex = '999';
      wrap.style.width = '360px';
      wrap.style.maxWidth = 'calc(100vw - 16px)';
      wrap.style.maxHeight = '52vh';
      wrap.style.overflow = 'auto';
      wrap.style.padding = '8px 10px';
      wrap.style.background = 'rgba(0,0,0,0.72)';
      wrap.style.border = '1px solid rgba(0,255,200,0.3)';
      wrap.style.color = '#9efce6';
      wrap.style.font = '11px/1.4 monospace';

      const panel = document.createElement('pre');
      panel.id = 'debug-panel';
      panel.style.margin = '0';
      panel.style.whiteSpace = 'pre-wrap';

      wrap.appendChild(panel);

      const status = document.createElement('div');
      status.id = 'debug-panel-status';
      status.style.marginTop = '8px';
      status.style.minHeight = '16px';
      status.style.color = '#7fd5c2';
      status.style.font = '11px/1.3 monospace';
      wrap.appendChild(status);

      function setStatus(message, tone){
        status.textContent = message || '';
        status.style.color = tone === 'error'
          ? '#ff8f8f'
          : (tone === 'ok' ? '#7fd5c2' : '#9efce6');
      }

      if (Array.isArray(actions) && actions.length){
        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.flexWrap = 'wrap';
        actionRow.style.gap = '6px';
        actionRow.style.marginTop = '8px';
        actions.forEach((action)=>{
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = action.label;
          btn.style.padding = '4px 6px';
          btn.style.border = '1px solid rgba(0,255,200,0.3)';
          btn.style.background = 'rgba(0,255,200,0.08)';
          btn.style.color = '#9efce6';
          btn.style.cursor = 'pointer';
          btn.style.font = '11px/1.2 monospace';
          btn.addEventListener('click',()=>{
            let result;
            try {
              result = action.run();
            } catch (error) {
              render();
              setStatus((action.label || 'ACTION')+' FAILED: '+(error && error.message ? error.message : String(error)), 'error');
              return;
            }
            if(result && typeof result.then === 'function'){
              btn.disabled = true;
              setStatus((action.label || 'ACTION')+'...', 'info');
              result.then((message)=>{
                render();
                setStatus(typeof message === 'string' && message ? message : ((action.label || 'ACTION')+' OK'), 'ok');
              }).catch((error)=>{
                render();
                setStatus((action.label || 'ACTION')+' FAILED: '+(error && error.message ? error.message : String(error)), 'error');
              }).finally(()=>{
                btn.disabled = false;
              });
              return;
            }
            render();
            if(typeof result === 'string' && result){
              setStatus(result, 'ok');
            }else{
              setStatus((action.label || 'ACTION')+' OK', 'ok');
            }
          });
          actionRow.appendChild(btn);
        });
        wrap.appendChild(actionRow);
      }

      document.body.appendChild(wrap);
      const render = ()=>{ panel.textContent = JSON.stringify(infoProvider(), null, 2); };
      render();
      return { panel, wrap, render, setStatus };
    }
  };
})();
