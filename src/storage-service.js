(function(){
  const root = window.SpinClash;
  const STORAGE_KEY = 'spin-clash-save';
  const SAVE_VERSION = 1;
  const WINDOW_NAME_PREFIX = '__spin_clash_save__:';
  let storageBackend = null;
  let storageMode = 'memory';
  let lastDiagnostic = { mode:'memory', reason:'startup' };

  const defaultSave = () => ({
    version:SAVE_VERSION,
    firstSeenAt:new Date().toISOString(),
    lastSeenAt:new Date().toISOString(),
    sessions:0,
    currency:0,
    challenge:{
      unlockedNodeIndex:0,
      completedNodes:[],
      lastNodeIndex:null
    },
    unlocks:{
      arenas:['circle_bowl','heart_bowl'],
      tops:['impact','armor']
    },
    analytics:[]
  });

  function sanitizeSave(save){
    const base = defaultSave();
    const source = save || {};
    const merged = Object.assign({}, base, source);
    const baseChallenge = base.challenge || {};
    const baseUnlocks = base.unlocks || {};
    const sourceChallenge = source.challenge || {};
    const sourceUnlocks = source.unlocks || {};
    merged.challenge = Object.assign({}, baseChallenge, sourceChallenge);
    merged.unlocks = Object.assign({}, baseUnlocks, sourceUnlocks);
    merged.challenge.completedNodes = Array.isArray(merged.challenge.completedNodes)
      ? merged.challenge.completedNodes.slice()
      : (Array.isArray(baseChallenge.completedNodes) ? baseChallenge.completedNodes.slice() : []);
    merged.unlocks.arenas = Array.isArray(merged.unlocks.arenas)
      ? merged.unlocks.arenas.slice()
      : (Array.isArray(baseUnlocks.arenas) ? baseUnlocks.arenas.slice() : []);
    merged.unlocks.tops = Array.isArray(merged.unlocks.tops)
      ? merged.unlocks.tops.slice()
      : (Array.isArray(baseUnlocks.tops) ? baseUnlocks.tops.slice() : []);
    merged.analytics = Array.isArray(merged.analytics) ? merged.analytics.slice(-200) : [];
    merged.version = SAVE_VERSION;
    if(typeof merged.currency !== 'number') merged.currency = 0;
    if(typeof merged.sessions !== 'number') merged.sessions = 0;
    return merged;
  }

  function canUseStorage(candidate){
    const probeKey = STORAGE_KEY + '-probe';
    try {
      candidate.setItem(probeKey, '1');
      candidate.removeItem(probeKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function setDiagnostic(mode, reason, detail){
    lastDiagnostic = {
      mode:mode || storageMode,
      reason:reason || 'unknown',
      detail:detail || null
    };
  }

  function resolveStorageBackend(){
    try {
      if(typeof window !== 'undefined' && window.localStorage && canUseStorage(window.localStorage)){
        setDiagnostic('local', 'local_storage_available');
        return { backend:window.localStorage, mode:'local' };
      }
    } catch (error) {
      setDiagnostic('memory', 'local_storage_access_error', String(error && error.message ? error.message : error));
    }
    try {
      if(typeof window !== 'undefined' && window.sessionStorage && canUseStorage(window.sessionStorage)){
        setDiagnostic('session', 'session_storage_available');
        return { backend:window.sessionStorage, mode:'session' };
      }
    } catch (error) {
      setDiagnostic('memory', 'session_storage_access_error', String(error && error.message ? error.message : error));
    }
    if(typeof window !== 'undefined' && typeof window.name === 'string'){
      setDiagnostic('window_name', 'window_name_available');
      return { backend:null, mode:'window_name' };
    }
    setDiagnostic('memory', 'no_browser_storage_path');
    return { backend:null, mode:'memory' };
  }

  function selectStorageBackend(){
    const resolved = resolveStorageBackend();
    storageBackend = resolved.backend;
    storageMode = resolved.mode;
  }

  function load(){
    selectStorageBackend();
    if(storageMode === 'window_name'){
      if(window.name.indexOf(WINDOW_NAME_PREFIX) !== 0){
        setDiagnostic('window_name', 'window_name_empty');
        return defaultSave();
      }
      try {
        return sanitizeSave(JSON.parse(window.name.slice(WINDOW_NAME_PREFIX.length)));
      } catch (error) {
        window.name = '';
        setDiagnostic('window_name', 'window_name_parse_failed_reset', String(error && error.message ? error.message : error));
        return defaultSave();
      }
    }
    try {
      if(!storageBackend){
        setDiagnostic('memory', 'no_storage_backend_after_selection');
        return defaultSave();
      }
      const raw = storageBackend.getItem(STORAGE_KEY);
      if(!raw){
        setDiagnostic(storageMode, 'storage_empty');
        return defaultSave();
      }
      return sanitizeSave(JSON.parse(raw));
    } catch (error) {
      storageBackend = null;
      storageMode = 'memory';
      setDiagnostic('memory', 'storage_load_failed', String(error && error.message ? error.message : error));
      console.warn('Storage load failed', error);
      return defaultSave();
    }
  }

  let cache = load();

  function persist(){
    cache.lastSeenAt = new Date().toISOString();
    if(storageMode === 'window_name'){
      try {
        window.name = WINDOW_NAME_PREFIX + JSON.stringify(cache);
        setDiagnostic('window_name', 'window_name_persist_ok');
      } catch (error) {
        storageMode = 'memory';
        setDiagnostic('memory', 'window_name_persist_failed', String(error && error.message ? error.message : error));
        console.warn('Window.name persist failed; falling back to memory only', error);
      }
      return cache;
    }
    if(!storageBackend){
      return cache;
    }
    try {
      storageBackend.setItem(STORAGE_KEY, JSON.stringify(cache));
      setDiagnostic(storageMode, 'storage_persist_ok');
    } catch (error) {
      if(storageMode === 'local'){
        selectStorageBackend();
        if(storageMode === 'session' && storageBackend){
          try {
            storageBackend.setItem(STORAGE_KEY, JSON.stringify(cache));
            setDiagnostic('session', 'downgraded_from_local_to_session');
            console.warn('Local storage persist failed; downgraded to session storage', error);
            return cache;
          } catch (sessionError) {
            setDiagnostic('memory', 'session_persist_failed_after_local_downgrade', String(sessionError && sessionError.message ? sessionError.message : sessionError));
            console.warn('Session storage persist failed after local storage downgrade', sessionError);
          }
        }
      }
      storageBackend = null;
      storageMode = 'memory';
      setDiagnostic('memory', 'storage_persist_failed', String(error && error.message ? error.message : error));
      console.warn('Storage persist failed; falling back to memory only', error);
    }
    return cache;
  }

  const service = {
    key: STORAGE_KEY,
    version:SAVE_VERSION,
    isPersistent(){ return storageMode !== 'memory'; },
    getPersistenceMode(){ return storageMode; },
    getDiagnostics(){ return Object.assign({}, lastDiagnostic); },
    get(){ return cache; },
    reload(){ cache = load(); return cache; },
    save(next){ cache = sanitizeSave(next); return persist(); },
    import(raw){
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      cache = sanitizeSave(parsed);
      return persist();
    },
    patch(patch){ cache = sanitizeSave(Object.assign({}, cache, patch)); return persist(); },
    transact(mutator){
      const draft = JSON.parse(JSON.stringify(cache));
      const result = mutator(draft) || draft;
      cache = sanitizeSave(result);
      return persist();
    },
    reset(){ cache = defaultSave(); return persist(); },
    export(){ return JSON.stringify(cache, null, 2); }
  };

  root.services.storage = service;
})();
