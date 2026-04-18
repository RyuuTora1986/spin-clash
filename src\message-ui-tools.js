(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createMessageUiTools = function createMessageUiTools(){
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

    function showMsg(text,duration,tone){
      const el=document.getElementById('msg-txt');
      el.textContent=text;
      const resolvedTone = tone || inferTone(text);
      el.className = resolvedTone === 'normal' ? '' : ('tone-'+resolvedTone);
      el.style.opacity='1';
      clearTimeout(el._t);
      el._t=setTimeout(()=>{
        el.style.opacity='0';
        el.className = '';
      },duration*1000);
    }

    return {
      showMsg
    };
  };
})();
