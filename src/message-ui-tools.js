(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createMessageUiTools = function createMessageUiTools(){
    function normalizeOptions(durationOrOptions, tone){
      if(durationOrOptions && typeof durationOrOptions === 'object'){
        return {
          duration:typeof durationOrOptions.duration === 'number' ? durationOrOptions.duration : 1.2,
          tone:durationOrOptions.tone || null
        };
      }
      return {
        duration:typeof durationOrOptions === 'number' ? durationOrOptions : 1.2,
        tone:tone || null
      };
    }

    function inferTone(text){
      const normalized = String(text || '').toUpperCase();
      if(normalized.indexOf('SUPER') >= 0 || normalized.indexOf('HEAVY') >= 0 || normalized.indexOf('RING OUT') >= 0){
        return 'impact';
      }
      if(normalized.indexOf('VICTORY') >= 0 || normalized.indexOf('DEFEAT') >= 0 || normalized.indexOf('FIGHT') >= 0){
        return 'major';
      }
      if(normalized.indexOf('ROUND') >= 0){
        return 'round';
      }
      return 'normal';
    }

    function showMsg(text,durationOrOptions,tone){
      const el=document.getElementById('msg-txt');
      el.textContent=text;
      const options = normalizeOptions(durationOrOptions, tone);
      const resolvedTone = options.tone || inferTone(text);
      el.className = resolvedTone === 'normal' ? '' : ('tone-'+resolvedTone);
      el.style.opacity='1';
      clearTimeout(el._t);
      el._t=setTimeout(()=>{
        el.style.opacity='0';
        el.className = '';
      },options.duration*1000);
    }

    return {
      showMsg
    };
  };
})();
