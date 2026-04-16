(function(){
  const root = window.SpinClash;
  const storage = root.services.storage;

  const service = {
    track(name, payload){
      const event = {
        name,
        payload: payload || {},
        at: new Date().toISOString()
      };
      storage.transact((save)=>{
        save.analytics = Array.isArray(save.analytics) ? save.analytics : [];
        save.analytics.push(event);
        save.analytics = save.analytics.slice(-200);
        return save;
      });
      if (root.debug.enabled) {
        console.info('[analytics]', event);
      }
      return event;
    },
    list(){
      return storage.get().analytics || [];
    },
    clear(){
      storage.transact((save)=>{ save.analytics = []; return save; });
    }
  };

  root.services.analytics = service;
})();
