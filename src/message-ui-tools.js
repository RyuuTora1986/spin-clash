(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createMessageUiTools = function createMessageUiTools(){
    function showMsg(text,duration){
      const el=document.getElementById('msg-txt');
      el.textContent=text;
      el.style.opacity='1';
      clearTimeout(el._t);
      el._t=setTimeout(()=>{ el.style.opacity='0'; },duration*1000);
    }

    return {
      showMsg
    };
  };
})();
