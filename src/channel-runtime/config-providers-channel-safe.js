(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.config = root.config || {};

  root.config.providers = {
    reward: {
      adapter: 'disabled',
      mockMode: 'disabled',
      livePlacements: {}
    },
    analytics: {
      adapter: 'local_buffer',
      enableForwarding: false
    }
  };
})();
