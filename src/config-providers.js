(function(){
  const root = window.SpinClash || (window.SpinClash = {});
  root.config = root.config || {};

  root.config.providers = {
    reward: {
      adapter: 'mock',
      mockMode: 'grant',
      livePlacements: {
        double_reward: true,
        continue_once: true,
        trial_unlock_arena: true
      },
      adsense: {
        enabled: false,
        scriptUrl: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
        rewardedAdUnitPath: '',
        gamInterstitialAdUnitPath: '',
        h5: {
          enabled: false,
          scriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          publisherId: '',
          dataAdClient: '',
          preloadHints: {
            sound: 'off',
            preload: 'auto'
          }
        }
      }
    },
    analytics: {
      adapter: 'local_buffer',
      enableForwarding: false,
      posthog: {
        enabled: false,
        projectApiKey: '',
        apiHost: 'https://us.i.posthog.com',
        scriptUrl: '',
        capturePageview: false,
        autocapture: false,
        disableSessionRecording: true
      }
    }
  };
})();
