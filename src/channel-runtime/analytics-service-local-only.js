(function(){
  const root = window.SpinClash;
  const storage = root.services.storage;

  function getEvents(){
    return (storage && typeof storage.get === 'function' && storage.get().analytics) || [];
  }

  function writeEvents(mutator){
    if(!storage || typeof storage.transact !== 'function'){
      return [];
    }
    let nextEvents = [];
    storage.transact(function(save){
      save.analytics = Array.isArray(save.analytics) ? save.analytics : [];
      nextEvents = mutator(save.analytics.slice());
      save.analytics = nextEvents.slice(-200);
      return save;
    });
    return nextEvents;
  }

  root.services.analytics = {
    track(name, payload){
      const event = {
        name,
        payload:payload || {},
        at:new Date().toISOString(),
        forwarding:{
          forwarded:false,
          reason:'local_only'
        }
      };
      writeEvents(function(events){
        events.push(event);
        return events;
      });
      if(root.debug && root.debug.enabled){
        console.info('[analytics]', event);
      }
      return event;
    },
    list(){
      return getEvents();
    },
    clear(){
      writeEvents(function(){
        return [];
      });
    },
    getAdapterInfo(){
      return {
        adapter:'local_buffer',
        forwardingEnabled:false,
        ready:false,
        loading:false,
        lastForwardReason:'local_only',
        initialized:false,
        queuedEvents:0
      };
    }
  };
})();
