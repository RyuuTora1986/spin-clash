(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.config = root.config || {};

  function isPlainObject(value){
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function mergeConfig(base, override){
    if(!isPlainObject(base)) return isPlainObject(override) ? mergeConfig({}, override) : override;
    const merged = Object.assign({}, base);
    if(!isPlainObject(override)) return merged;
    Object.keys(override).forEach(function(key){
      const nextValue = override[key];
      if(nextValue === undefined) return;
      if(isPlainObject(nextValue) && isPlainObject(merged[key])){
        merged[key] = mergeConfig(merged[key], nextValue);
        return;
      }
      if(isPlainObject(nextValue)){
        merged[key] = mergeConfig({}, nextValue);
        return;
      }
      merged[key] = nextValue;
    });
    return merged;
  }

  const overrides = window.__spinClashProviderOverrides;
  if(!isPlainObject(overrides)) return;

  root.config.providers = mergeConfig(root.config.providers || {}, overrides);
})();
