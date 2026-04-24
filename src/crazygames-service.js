(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.services = root.services || {};

  const platformRuntime = root.runtime && root.runtime.platform
    ? root.runtime.platform
    : { id:'web', isCrazyGames:false, crazyGamesLaunchStage:'basic' };

  const state = {
    enabled:platformRuntime.isCrazyGames === true,
    initializing:false,
    initialized:false,
    environment:'disabled',
    loadingStarted:false,
    loadingStopped:false,
    gameplayActive:false,
    lastError:null,
    lastGameplayContext:null,
    systemInfo:null,
    settings:{
      disableChat:false,
      muteAudio:false
    }
  };

  let initPromise = null;
  let settingsListenerInstalled = false;
  let getRuntimeAudioTools = null;
  let scrollGuardInstalled = false;

  function getSdk(){
    return window.CrazyGames && window.CrazyGames.SDK ? window.CrazyGames.SDK : null;
  }

  function clone(value){
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normalizeError(error){
    if(!error) return 'unknown_error';
    if(typeof error === 'string') return error;
    if(error && typeof error.message === 'string' && error.message){
      return error.message;
    }
    if(error && typeof error.code === 'string' && error.code){
      return error.code;
    }
    return 'unknown_error';
  }

  function canCallSdk(){
    return state.initialized
      && (state.environment === 'local' || state.environment === 'crazygames');
  }

  function resolveEnvironment(sdk){
    if(!sdk) return Promise.resolve('disabled');
    if(typeof sdk.environment === 'string' && sdk.environment){
      return Promise.resolve(sdk.environment);
    }
    if(typeof sdk.getEnvironment === 'function'){
      try{
        return Promise.resolve(sdk.getEnvironment()).then(function(environment){
          return typeof environment === 'string' && environment ? environment : 'disabled';
        });
      }catch(error){
        return Promise.resolve('disabled');
      }
    }
    return Promise.resolve('disabled');
  }

  function readSettings(sdk){
    if(!sdk || !sdk.game || !sdk.game.settings){
      return {
        disableChat:false,
        muteAudio:false
      };
    }
    return {
      disableChat:sdk.game.settings.disableChat === true,
      muteAudio:sdk.game.settings.muteAudio === true
    };
  }

  function applyRuntimeAudioMute(nextMute){
    if(!getRuntimeAudioTools) return;
    const runtimeAudioTools = getRuntimeAudioTools();
    if(!runtimeAudioTools || typeof runtimeAudioTools.setExternalMute !== 'function') return;
    runtimeAudioTools.setExternalMute(nextMute === true);
  }

  function applySettings(nextSettings){
    state.settings = {
      disableChat:nextSettings && nextSettings.disableChat === true,
      muteAudio:nextSettings && nextSettings.muteAudio === true
    };
    applyRuntimeAudioMute(state.settings.muteAudio);
  }

  function installScrollGuard(){
    if(scrollGuardInstalled || !state.enabled) return;
    const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

    window.addEventListener('wheel', function(event){
      event.preventDefault();
    }, { passive:false });

    window.addEventListener('keydown', function(event){
      const target = event && event.target ? event.target : null;
      const tagName = target && target.tagName ? String(target.tagName).toUpperCase() : '';
      const editable = !!(target && (target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'));
      if(editable) return;
      if(preventKeys.indexOf(event.key) === -1) return;
      event.preventDefault();
    }, { passive:false });

    scrollGuardInstalled = true;
  }

  function installSettingsListener(sdk){
    if(settingsListenerInstalled || !sdk || !sdk.game || typeof sdk.game.addSettingsChangeListener !== 'function'){
      return;
    }
    sdk.game.addSettingsChangeListener(function(nextSettings){
      applySettings(nextSettings || {});
    });
    settingsListenerInstalled = true;
  }

  function readSystemInfo(sdk){
    if(!sdk || !sdk.user) return Promise.resolve(null);
    if(sdk.user.systemInfo){
      return Promise.resolve(clone(sdk.user.systemInfo));
    }
    if(typeof sdk.user.getSystemInfo === 'function'){
      try{
        return Promise.resolve(sdk.user.getSystemInfo()).then(function(systemInfo){
          return clone(systemInfo);
        }).catch(function(){
          return null;
        });
      }catch(error){
        return Promise.resolve(null);
      }
    }
    return Promise.resolve(null);
  }

  function setGameContext(sdk, context){
    if(!sdk || !sdk.game || typeof sdk.game.setGameContext !== 'function' || !context){
      return Promise.resolve(false);
    }
    try{
      return Promise.resolve(sdk.game.setGameContext(context)).then(function(){
        return true;
      }).catch(function(){
        return false;
      });
    }catch(error){
      return Promise.resolve(false);
    }
  }

  function clearGameContext(sdk){
    if(!sdk || !sdk.game || typeof sdk.game.clearGameContext !== 'function'){
      return Promise.resolve(false);
    }
    try{
      return Promise.resolve(sdk.game.clearGameContext()).then(function(){
        return true;
      }).catch(function(){
        return false;
      });
    }catch(error){
      return Promise.resolve(false);
    }
  }

  function initialize(options){
    const initOptions = options || {};
    if(typeof initOptions.getRuntimeAudioTools === 'function'){
      getRuntimeAudioTools = initOptions.getRuntimeAudioTools;
    }

    if(!state.enabled){
      return Promise.resolve(state);
    }
    if(initPromise){
      return initPromise;
    }

    installScrollGuard();
    state.initializing = true;
    initPromise = Promise.resolve().then(function(){
      const sdk = getSdk();
      if(!sdk || typeof sdk.init !== 'function'){
        throw new Error('sdk_missing');
      }
      return sdk.init().then(function(){
        return resolveEnvironment(sdk).then(function(environment){
          state.initialized = true;
          state.environment = environment || 'disabled';
          applySettings(readSettings(sdk));
          installSettingsListener(sdk);
          return readSystemInfo(sdk);
        }).then(function(systemInfo){
          state.systemInfo = systemInfo;
          if(canCallSdk() && !state.loadingStarted && sdk.game && typeof sdk.game.loadingStart === 'function'){
            return Promise.resolve(sdk.game.loadingStart()).then(function(){
              state.loadingStarted = true;
            }).catch(function(error){
              state.lastError = normalizeError(error);
            });
          }
          return null;
        }).then(function(){
          state.lastError = null;
          return state;
        });
      });
    }).catch(function(error){
      state.lastError = normalizeError(error);
      return state;
    }).finally(function(){
      state.initializing = false;
    });

    return initPromise;
  }

  function reportLoadingComplete(){
    return initialize().then(function(){
      const sdk = getSdk();
      if(!canCallSdk() || state.loadingStopped || !sdk || !sdk.game || typeof sdk.game.loadingStop !== 'function'){
        return false;
      }
      return Promise.resolve(sdk.game.loadingStop()).then(function(){
        state.loadingStopped = true;
        return true;
      }).catch(function(error){
        state.lastError = normalizeError(error);
        return false;
      });
    });
  }

  function syncGameplayActive(active, context){
    const nextActive = active === true;
    return initialize().then(function(){
      const sdk = getSdk();
      if(!canCallSdk() || !sdk || !sdk.game){
        return false;
      }
      if(state.gameplayActive === nextActive){
        if(nextActive && context){
          state.lastGameplayContext = clone(context);
        }
        return false;
      }
      const action = nextActive ? sdk.game.gameplayStart : sdk.game.gameplayStop;
      if(typeof action !== 'function'){
        return false;
      }
      return Promise.resolve(action()).then(function(){
        state.gameplayActive = nextActive;
        if(nextActive){
          state.lastGameplayContext = clone(context || null);
          return setGameContext(sdk, context || null);
        }
        state.lastGameplayContext = null;
        return clearGameContext(sdk);
      }).then(function(){
        return true;
      }).catch(function(error){
        state.lastError = normalizeError(error);
        return false;
      });
    });
  }

  function happytime(){
    return initialize().then(function(){
      const sdk = getSdk();
      if(!canCallSdk() || !sdk || !sdk.game || typeof sdk.game.happytime !== 'function'){
        return false;
      }
      return Promise.resolve(sdk.game.happytime()).then(function(){
        return true;
      }).catch(function(error){
        state.lastError = normalizeError(error);
        return false;
      });
    });
  }

  root.services.crazyGames = {
    enabled:state.enabled,
    initialize:initialize,
    reportLoadingComplete:reportLoadingComplete,
    syncGameplayActive:syncGameplayActive,
    happytime:happytime,
    getState:function(){
      return {
        enabled:state.enabled,
        initializing:state.initializing,
        initialized:state.initialized,
        environment:state.environment,
        loadingStarted:state.loadingStarted,
        loadingStopped:state.loadingStopped,
        gameplayActive:state.gameplayActive,
        lastError:state.lastError,
        lastGameplayContext:clone(state.lastGameplayContext),
        systemInfo:clone(state.systemInfo),
        settings:clone(state.settings)
      };
    }
  };
})();
