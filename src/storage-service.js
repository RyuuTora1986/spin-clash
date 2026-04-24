(function(){
  const root = window.SpinClash;
  const STORAGE_KEY = 'spin-clash-save';
  const SAVE_VERSION = 1;
  const WINDOW_NAME_PREFIX = '__spin_clash_save__:';
  const SUPPORTED_LOCALES = ['en', 'zh', 'ja'];
  const DEFAULT_RESEARCH_LEVELS = {
    spin_core:0,
    guard_frame:0,
    burst_relay:0
  };
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
      checkpointNodeIndex:0,
      completedNodes:[],
      lastNodeIndex:null,
      unlockedRankIndex:0,
      selectedRankIndex:0,
      rankProgress:{
        0:{
          unlockedNodeIndex:0,
          checkpointNodeIndex:0,
          completedNodes:[],
          lastNodeIndex:null
        }
      }
    },
    unlocks:{
      arenas:['circle_bowl','heart_bowl'],
      tops:['impact','armor']
    },
    research:{
      levels:Object.assign({}, DEFAULT_RESEARCH_LEVELS)
    },
    settings:{
      locale:'en',
      musicEnabled:true,
      sfxEnabled:true
    },
    analytics:[]
  });

  function isPlainObject(value){
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function toNonNegativeInteger(value){
    if(typeof value !== 'number' || !isFinite(value)) return null;
    const normalized = Math.floor(value);
    return normalized >= 0 ? normalized : null;
  }

  function pickFirstNonNegativeInteger(values, fallback){
    for(let index = 0; index < values.length; index += 1){
      const normalized = toNonNegativeInteger(values[index]);
      if(normalized != null) return normalized;
    }
    return fallback;
  }

  function normalizeStringList(){
    const seen = new Set();
    const normalized = [];
    for(let groupIndex = 0; groupIndex < arguments.length; groupIndex += 1){
      const group = arguments[groupIndex];
      if(!Array.isArray(group)) continue;
      for(let itemIndex = 0; itemIndex < group.length; itemIndex += 1){
        const value = group[itemIndex];
        if(typeof value !== 'string' || !value) continue;
        if(seen.has(value)) continue;
        seen.add(value);
        normalized.push(value);
      }
    }
    return normalized;
  }

  function normalizeIntegerList(){
    const source = arguments[0];
    const seen = new Set();
    const normalized = [];
    if(!Array.isArray(source)) return normalized;
    for(let index = 0; index < source.length; index += 1){
      const value = toNonNegativeInteger(source[index]);
      if(value == null || seen.has(value)) continue;
      seen.add(value);
      normalized.push(value);
    }
    return normalized;
  }

  function normalizeRankProgressEntry(source, fallback){
    const sourceEntry = isPlainObject(source) ? source : {};
    const fallbackEntry = fallback || {};
    return {
      unlockedNodeIndex:pickFirstNonNegativeInteger(
        [sourceEntry.unlockedNodeIndex],
        pickFirstNonNegativeInteger([fallbackEntry.unlockedNodeIndex], 0)
      ),
      checkpointNodeIndex:pickFirstNonNegativeInteger(
        [sourceEntry.checkpointNodeIndex],
        pickFirstNonNegativeInteger([fallbackEntry.checkpointNodeIndex], 0)
      ),
      completedNodes:normalizeIntegerList(
        Array.isArray(sourceEntry.completedNodes) ? sourceEntry.completedNodes : fallbackEntry.completedNodes
      ),
      lastNodeIndex:pickFirstNonNegativeInteger(
        [sourceEntry.lastNodeIndex],
        pickFirstNonNegativeInteger([fallbackEntry.lastNodeIndex], null)
      )
    };
  }

  function normalizeRankProgress(sourceChallenge, legacyProgress){
    const normalized = {};
    const sourceRankProgress = isPlainObject(sourceChallenge.rankProgress) ? sourceChallenge.rankProgress : {};
    Object.keys(sourceRankProgress).forEach(function(rawKey){
      const rankIndex = toNonNegativeInteger(Number(rawKey));
      if(rankIndex == null || rankIndex > 2) return;
      normalized[rankIndex] = normalizeRankProgressEntry(
        sourceRankProgress[rawKey],
        rankIndex === 0 ? legacyProgress : null
      );
    });
    if(!normalized[0]){
      normalized[0] = normalizeRankProgressEntry(null, legacyProgress);
    }
    return normalized;
  }

  function normalizeAnalytics(events){
    if(!Array.isArray(events)) return [];
    return events.filter(function(entry){
      return isPlainObject(entry);
    }).slice(-200);
  }

  function normalizeLocale(value){
    if(typeof value !== 'string' || !value) return 'en';
    const normalized = String(value).toLowerCase();
    for(let index = 0; index < SUPPORTED_LOCALES.length; index += 1){
      const locale = SUPPORTED_LOCALES[index];
      if(normalized === locale || normalized.indexOf(locale + '-') === 0 || normalized.indexOf(locale + '_') === 0){
        return locale;
      }
    }
    return 'en';
  }

  function normalizeBoolean(value, fallback){
    if(typeof value === 'boolean') return value;
    return fallback;
  }

  function normalizeChallenge(source, baseChallenge){
    const sourceChallenge = isPlainObject(source.challenge) ? source.challenge : {};
    const legacyProgress = {
      unlockedNodeIndex:pickFirstNonNegativeInteger(
        [sourceChallenge.unlockedNodeIndex, source.challengeUnlockedNodeIndex],
        baseChallenge.unlockedNodeIndex
      ),
      checkpointNodeIndex:pickFirstNonNegativeInteger(
        [sourceChallenge.checkpointNodeIndex],
        baseChallenge.checkpointNodeIndex
      ),
      completedNodes:normalizeIntegerList(sourceChallenge.completedNodes),
      lastNodeIndex:pickFirstNonNegativeInteger([sourceChallenge.lastNodeIndex], null)
    };
    const normalized = {
      unlockedNodeIndex:legacyProgress.unlockedNodeIndex,
      checkpointNodeIndex:legacyProgress.checkpointNodeIndex,
      completedNodes:legacyProgress.completedNodes.slice(),
      lastNodeIndex:legacyProgress.lastNodeIndex,
      unlockedRankIndex:pickFirstNonNegativeInteger([sourceChallenge.unlockedRankIndex], baseChallenge.unlockedRankIndex),
      selectedRankIndex:0,
      rankProgress:normalizeRankProgress(sourceChallenge, legacyProgress)
    };
    const rankI = normalized.rankProgress[0] || legacyProgress;
    normalized.unlockedNodeIndex = rankI.unlockedNodeIndex;
    normalized.checkpointNodeIndex = rankI.checkpointNodeIndex;
    normalized.completedNodes = rankI.completedNodes.slice();
    normalized.lastNodeIndex = rankI.lastNodeIndex;
    return normalized;
  }

  function normalizeUnlocks(source, baseUnlocks){
    const sourceUnlocks = isPlainObject(source.unlocks) ? source.unlocks : {};
    return {
      arenas:normalizeStringList(baseUnlocks.arenas, sourceUnlocks.arenas, source.unlockedArenas),
      tops:normalizeStringList(baseUnlocks.tops, sourceUnlocks.tops, source.unlockedTops)
    };
  }

  function normalizeResearch(source, baseResearch){
    const sourceResearch = isPlainObject(source.research) ? source.research : {};
    const sourceLevels = isPlainObject(sourceResearch.levels) ? sourceResearch.levels : sourceResearch;
    const normalizedLevels = {};
    Object.keys(baseResearch.levels || {}).forEach(function(trackId){
      normalizedLevels[trackId] = pickFirstNonNegativeInteger(
        [sourceLevels[trackId]],
        baseResearch.levels[trackId]
      );
    });
    return {
      levels:normalizedLevels
    };
  }

  function normalizeSettings(source, baseSettings){
    const sourceSettings = isPlainObject(source.settings) ? source.settings : {};
    return {
      locale:normalizeLocale(sourceSettings.locale || source.locale || baseSettings.locale),
      musicEnabled:normalizeBoolean(sourceSettings.musicEnabled, baseSettings.musicEnabled !== false),
      sfxEnabled:normalizeBoolean(sourceSettings.sfxEnabled, baseSettings.sfxEnabled !== false)
    };
  }

  function sanitizeSave(save){
    const base = defaultSave();
    const source = save || {};
    const merged = Object.assign({}, base, source);
    const baseChallenge = base.challenge || {};
    const baseUnlocks = base.unlocks || {};
    const baseResearch = base.research || { levels:Object.assign({}, DEFAULT_RESEARCH_LEVELS) };
    const baseSettings = base.settings || { locale:'en', musicEnabled:true, sfxEnabled:true };
    merged.challenge = normalizeChallenge(source, baseChallenge);
    merged.challenge.unlockedRankIndex = Math.max(0, Math.min(merged.challenge.unlockedRankIndex, 2));
    merged.challenge.selectedRankIndex = Math.max(
      0,
      Math.min(
        pickFirstNonNegativeInteger(
          [isPlainObject(source.challenge) ? source.challenge.selectedRankIndex : null],
          baseChallenge.selectedRankIndex
        ),
        merged.challenge.unlockedRankIndex
      )
    );
    merged.unlocks = normalizeUnlocks(source, baseUnlocks);
    merged.research = normalizeResearch(source, baseResearch);
    merged.settings = normalizeSettings(source, baseSettings);
    merged.analytics = normalizeAnalytics(source.analytics);
    merged.version = SAVE_VERSION;
    merged.currency = typeof source.currency === 'number' && isFinite(source.currency) && source.currency >= 0
      ? source.currency
      : base.currency;
    merged.sessions = toNonNegativeInteger(source.sessions);
    if(merged.sessions == null) merged.sessions = base.sessions;
    if(typeof merged.firstSeenAt !== 'string' || !merged.firstSeenAt) merged.firstSeenAt = base.firstSeenAt;
    if(typeof merged.lastSeenAt !== 'string' || !merged.lastSeenAt) merged.lastSeenAt = base.lastSeenAt;
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
