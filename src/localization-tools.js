(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  const SUPPORTED_LOCALES = ['en', 'zh', 'ja'];
  let baseContentSnapshot = null;

  function isPlainObject(value){
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value){
    if(Array.isArray(value)){
      return value.map(clone);
    }
    if(isPlainObject(value)){
      const result = {};
      Object.keys(value).forEach(function(key){
        result[key] = clone(value[key]);
      });
      return result;
    }
    return value;
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

  function replaceObject(target, source){
    const resolvedTarget = isPlainObject(target) ? target : {};
    Object.keys(resolvedTarget).forEach(function(key){
      delete resolvedTarget[key];
    });
    Object.keys(source || {}).forEach(function(key){
      resolvedTarget[key] = clone(source[key]);
    });
    return resolvedTarget;
  }

  function snapshotById(list, selector){
    const output = {};
    (list || []).forEach(function(entry){
      if(!entry || !entry.id) return;
      output[entry.id] = selector(entry);
    });
    return output;
  }

  function takeBaseContentSnapshot(){
    const config = root.config || {};
    return {
      arenas:snapshotById(config.arenas, function(entry){
        return { label:entry.label };
      }),
      tops:snapshotById(config.tops, function(entry){
        return { name:entry.name };
      }),
      research:snapshotById(config.research, function(entry){
        return {
          label:entry.label,
          description:entry.description,
          statLabel:entry.statLabel,
          levels:(entry.levels || []).map(function(level){
            return { preview:level.preview };
          })
        };
      }),
      roadRanks:snapshotById(config.roadRanks, function(entry){
        return {
          label:entry.label,
          description:entry.description
        };
      }),
      enemyPresets:snapshotById(config.enemyPresets ? Object.keys(config.enemyPresets).map(function(key){ return config.enemyPresets[key]; }) : [], function(entry){
        return {
          label:entry.label
        };
      }),
      modifiers:snapshotById(config.modifiers ? Object.keys(config.modifiers).map(function(key){ return config.modifiers[key]; }) : [], function(entry){
        return {
          label:entry.label,
          description:entry.description
        };
      }),
      challengeRoad:snapshotById(config.challengeRoad, function(entry){
        return {
          name:entry.name,
          chapterLabel:entry.chapterLabel,
          previewLabel:entry.previewLabel,
          previewDesc:entry.previewDesc
        };
      })
    };
  }

  function applyFields(target, baseFields, localeFields){
    if(!target) return;
    const baseline = baseFields || {};
    const localized = localeFields || {};
    Object.keys(baseline).forEach(function(key){
      if(key === 'levels' && Array.isArray(target.levels) && Array.isArray(baseline.levels)){
        target.levels.forEach(function(level, index){
          const source = baseline.levels[index] || {};
          Object.keys(source).forEach(function(levelKey){
            level[levelKey] = clone(source[levelKey]);
          });
        });
        return;
      }
      target[key] = clone(baseline[key]);
    });
    Object.keys(localized).forEach(function(key){
      if(key === 'levels' && Array.isArray(target.levels) && Array.isArray(localized.levels)){
        target.levels.forEach(function(level, index){
          const source = localized.levels[index] || {};
          Object.keys(source).forEach(function(levelKey){
            level[levelKey] = clone(source[levelKey]);
          });
        });
        return;
      }
      target[key] = clone(localized[key]);
    });
  }

  function applyContentLocale(locale){
    if(!baseContentSnapshot){
      baseContentSnapshot = takeBaseContentSnapshot();
    }
    const contentLocales = (root.config && root.config.contentLocales) || {};
    const localeContent = contentLocales[locale] || {};
    const config = root.config || {};

    (config.arenas || []).forEach(function(entry){
      applyFields(entry, baseContentSnapshot.arenas[entry.id], localeContent.arenas && localeContent.arenas[entry.id]);
    });
    (config.tops || []).forEach(function(entry){
      applyFields(entry, baseContentSnapshot.tops[entry.id], localeContent.tops && localeContent.tops[entry.id]);
    });
    (config.research || []).forEach(function(entry){
      applyFields(entry, baseContentSnapshot.research[entry.id], localeContent.research && localeContent.research[entry.id]);
    });
    (config.roadRanks || []).forEach(function(entry){
      applyFields(entry, baseContentSnapshot.roadRanks[entry.id], localeContent.roadRanks && localeContent.roadRanks[entry.id]);
    });
    Object.keys(config.enemyPresets || {}).forEach(function(key){
      const entry = config.enemyPresets[key];
      applyFields(entry, baseContentSnapshot.enemyPresets[entry.id], localeContent.enemyPresets && localeContent.enemyPresets[entry.id]);
    });
    Object.keys(config.modifiers || {}).forEach(function(key){
      const entry = config.modifiers[key];
      applyFields(entry, baseContentSnapshot.modifiers[entry.id], localeContent.modifiers && localeContent.modifiers[entry.id]);
    });
    (config.challengeRoad || []).forEach(function(entry){
      applyFields(entry, baseContentSnapshot.challengeRoad[entry.id], localeContent.challengeRoad && localeContent.challengeRoad[entry.id]);
    });
  }

  function detectBrowserLocale(){
    const languageList = []
      .concat(Array.isArray(navigator.languages) ? navigator.languages : [])
      .concat(typeof navigator.language === 'string' ? [navigator.language] : []);
    for(let index = 0; index < languageList.length; index += 1){
      const locale = normalizeLocale(languageList[index]);
      if(SUPPORTED_LOCALES.indexOf(locale) >= 0){
        return locale;
      }
    }
    return 'en';
  }

  function updateDocumentLang(locale){
    if(document && document.documentElement){
      document.documentElement.lang = locale;
    }
  }

  function updateLocaleButtons(locale){
    if(!document || typeof document.querySelectorAll !== 'function') return;
    document.querySelectorAll('[data-locale-target]').forEach(function(button){
      const target = button && button.dataset ? button.dataset.localeTarget : '';
      button.classList.toggle('active', target === locale);
    });
  }

  root.createLocalizationTools = function createLocalizationTools(options){
    const storageService = options.storageService || null;
    const applyStaticText = typeof options.applyStaticText === 'function' ? options.applyStaticText : function(){};
    const updateModeUI = typeof options.updateModeUI === 'function' ? options.updateModeUI : function(){};
    const ensureStorageNotice = typeof options.ensureStorageNotice === 'function' ? options.ensureStorageNotice : function(){};
    const setCurrentLocale = typeof options.setCurrentLocale === 'function' ? options.setCurrentLocale : function(){};
    const getCurrentLocale = typeof options.getCurrentLocale === 'function' ? options.getCurrentLocale : function(){ return 'en'; };

    function persistLocale(locale){
      if(!storageService || typeof storageService.patch !== 'function') return;
      const current = typeof storageService.get === 'function' ? (storageService.get() || {}) : {};
      const currentSettings = isPlainObject(current.settings) ? current.settings : {};
      storageService.patch({
        settings:Object.assign({}, currentSettings, { locale:locale })
      });
    }

    function resolveSavedLocale(){
      if(!storageService || typeof storageService.get !== 'function') return null;
      try {
        const save = storageService.get() || {};
        return save.settings && save.settings.locale ? normalizeLocale(save.settings.locale) : null;
      } catch (error) {
        return null;
      }
    }

    function applyLocale(locale, shouldPersist){
      const normalized = normalizeLocale(locale);
      const textLocales = (root.config && root.config.textLocales) || {};
      const textSource = textLocales[normalized] || textLocales.en || root.config.text || {};
      root.config.text = replaceObject(root.config.text || {}, textSource);
      applyContentLocale(normalized);
      setCurrentLocale(normalized);
      updateDocumentLang(normalized);
      updateLocaleButtons(normalized);
      applyStaticText();
      updateModeUI();
      ensureStorageNotice();
      if(shouldPersist !== false){
        persistLocale(normalized);
      }
      return normalized;
    }

    function initialize(){
      const savedLocale = resolveSavedLocale();
      const initialLocale = savedLocale || detectBrowserLocale();
      return applyLocale(initialLocale, true);
    }

    function setLocale(locale){
      return applyLocale(locale, true);
    }

    return {
      normalizeLocale,
      detectBrowserLocale,
      initialize,
      setLocale,
      getCurrentLocale
    };
  };
})();
