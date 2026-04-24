(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.config = root.config || {};
  root.services = root.services || {};
  root.state = root.state || {};
  root.debug = root.debug || {};
  root.runtime = root.runtime || {};
  root.runtime.build = root.runtime.build || {
    profile:'development',
    debugToolsEnabled:true,
    exposeUiBindings:true
  };
})();
