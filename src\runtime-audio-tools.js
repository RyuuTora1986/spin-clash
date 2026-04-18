(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createRuntimeAudioTools = function createRuntimeAudioTools(options){
    const runtimeOptions = options || {};
    const storageService = runtimeOptions.storageService || null;
    const signatureSkills = runtimeOptions.signatureSkills || {};
    let AC=null,mGain=null,_beatTimer=null,_nextBeat=0,_beatStep=0;
    let _wallCD=0;
    const BPM=174;
    const S16=60/BPM/4;

    function getAudioSettings(){
      const save = storageService && typeof storageService.get === 'function'
        ? (storageService.get() || {})
        : {};
      const settings = save && save.settings ? save.settings : {};
      return {
        musicEnabled:settings.musicEnabled !== false,
        sfxEnabled:settings.sfxEnabled !== false
      };
    }

    function isMusicEnabled(){
      return getAudioSettings().musicEnabled;
    }

    function isSfxEnabled(){
      return getAudioSettings().sfxEnabled;
    }

    function resolveSignatureAudioStyle(skillId){
      const signature = skillId && signatureSkills[skillId] ? signatureSkills[skillId] : null;
      if(signature && signature.audioStyle) return signature.audioStyle;
      if(skillId === 'Fly Charge') return 'charge';
      if(skillId === 'Fortress Pulse') return 'pulse';
      return 'phantom';
    }

    function isSameOriginScript(filename){
      if(!filename) return false;
      try{
        const url = new URL(filename, window.location.href);
        return url.origin === window.location.origin;
      }catch(_error){
        return false;
      }
    }

    function isIgnoredRuntimeError(message, filename){
      const text = message ? String(message) : '';
      const source = filename ? String(filename) : '';
      if(!text) return true;
      if(text === 'Script error.') return true;
      if(text === 'ResizeObserver loop limit exceeded') return true;
      if(text === 'ResizeObserver loop completed with undelivered notifications.') return true;
      if(source && !isSameOriginScript(source)) return true;
      return false;
    }

    function showRuntimeError(message){
      let box=document.getElementById('runtime-error-box');
      if(!box){
        box=document.createElement('div');
        box.id='runtime-error-box';
        box.style.position='fixed';
        box.style.left='10px';
        box.style.right='10px';
        box.style.bottom='10px';
        box.style.zIndex='1000';
        box.style.padding='10px 12px';
        box.style.background='rgba(120,0,0,0.92)';
        box.style.border='1px solid rgba(255,160,160,0.5)';
        box.style.color='#fff';
        box.style.font='12px/1.4 monospace';
        box.style.whiteSpace='pre-wrap';
        document.body.appendChild(box);
      }
      box.textContent='Runtime error: '+message;
    }

    function installRuntimeGuards(){
      window.addEventListener('error',(event)=>{
        const message = (event && event.message) ? String(event.message) : '';
        const filename = (event && event.filename) ? String(event.filename) : '';
        if(isIgnoredRuntimeError(message, filename)) return;
        showRuntimeError(message);
      });

      window.addEventListener('unhandledrejection',(event)=>{
        const reason = event ? event.reason : null;
        const message =
          reason instanceof Error ? reason.message :
          typeof reason === 'string' ? reason :
          reason && typeof reason.message === 'string' ? reason.message :
          'Unhandled promise rejection';
        showRuntimeError(message);
      });
    }

    function initAudio(){
      if(AC) return;
      AC=new(window.AudioContext||window.webkitAudioContext)();
      mGain=AC.createGain();
      mGain.gain.value=0.54;
      mGain.connect(AC.destination);
    }

    function initAudioSafely(){
      try{
        initAudio();
        if(AC && AC.state === 'suspended' && typeof AC.resume === 'function'){
          AC.resume().catch(()=>{});
        }
      }catch(error){
        console.warn('Audio init failed', error);
      }
    }

    function _osc(freq,type,t,dur,vol,dest){
      const g=AC.createGain();
      g.gain.setValueAtTime(vol,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      g.connect(dest||mGain);
      const o=AC.createOscillator();
      o.type=type;
      o.frequency.setValueAtTime(freq,t);
      o.connect(g);
      o.start(t);
      o.stop(t+dur+0.02);
    }

    function _noise(t,dur,vol,flo=800,fhi=null,dest){
      const sr=AC.sampleRate;
      const n=Math.ceil(sr*(dur+0.02));
      const b=AC.createBuffer(1,n,sr);
      const d=b.getChannelData(0);
      for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
      const s=AC.createBufferSource();
      s.buffer=b;
      const f1=AC.createBiquadFilter();
      f1.type='highpass';
      f1.frequency.value=flo;
      const g=AC.createGain();
      g.gain.setValueAtTime(vol,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      let chain=f1;
      if(fhi){
        const f2=AC.createBiquadFilter();
        f2.type='lowpass';
        f2.frequency.value=fhi;
        f1.connect(f2);
        chain=f2;
      }
      s.connect(f1);
      chain.connect(g);
      g.connect(dest||mGain);
      s.start(t);
      s.stop(t+dur+0.02);
    }

    function _distCurve(amt){
      const n=512,c=new Float32Array(n);
      for(let i=0;i<n;i++){
        const x=i*2/n-1;
        c[i]=(Math.PI+amt)*x/(Math.PI+amt*Math.abs(x));
      }
      return c;
    }

    function _kick(t){
      const g=AC.createGain();
      g.gain.setValueAtTime(1.3,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.48);
      g.connect(mGain);
      const o=AC.createOscillator();
      o.frequency.setValueAtTime(200,t);
      o.frequency.exponentialRampToValueAtTime(36,t+0.38);
      o.connect(g);
      o.start(t);
      o.stop(t+0.5);
      const sg=AC.createGain();
      sg.gain.setValueAtTime(0.7,t);
      sg.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
      sg.connect(mGain);
      const so=AC.createOscillator();
      so.type='sine';
      so.frequency.setValueAtTime(55,t);
      so.frequency.exponentialRampToValueAtTime(28,t+0.12);
      so.connect(sg);
      so.start(t);
      so.stop(t+0.2);
      _noise(t,0.028,0.25,2000,16000);
    }

    function _snare(t,ghost=false){
      const v=ghost?0.08:0.22;
      _noise(t,ghost?0.1:0.17,v,1800,12000);
      if(!ghost) _osc(240,'triangle',t,0.09,0.18,null);
    }

    function _hat(t,open){
      _noise(t,open?0.25:0.042,open?0.13:0.16,8000,22000);
    }

    function _bass(t,hz){
      const ws=AC.createWaveShaper();
      ws.curve=_distCurve(120);
      const flt=AC.createBiquadFilter();
      flt.type='lowpass';
      flt.frequency.value=620;
      flt.Q.value=3;
      const g=AC.createGain();
      g.gain.setValueAtTime(0.48,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.19);
      g.connect(mGain);
      const o=AC.createOscillator();
      o.type='sawtooth';
      o.frequency.value=hz;
      o.connect(ws);
      ws.connect(flt);
      flt.connect(g);
      o.start(t);
      o.stop(t+0.22);
    }

    function _stab(t,hz){
      [hz,hz*1.5,hz*2,hz*3].forEach((f,i)=>{
        const ws=AC.createWaveShaper();
        ws.curve=_distCurve(180+i*40);
        const flt=AC.createBiquadFilter();
        flt.type='lowpass';
        flt.frequency.value=2200-i*200;
        const g=AC.createGain();
        g.gain.setValueAtTime(0.16/(i+1),t);
        g.gain.exponentialRampToValueAtTime(0.0001,t+0.1);
        g.connect(mGain);
        const o=AC.createOscillator();
        o.type='sawtooth';
        o.frequency.value=f;
        o.connect(ws);
        ws.connect(flt);
        flt.connect(g);
        o.start(t);
        o.stop(t+0.12);
      });
      _noise(t,0.02,0.12,4000,18000);
    }

    function _lead(t,hz,dur){
      const ws=AC.createWaveShaper();
      ws.curve=_distCurve(60);
      const flt=AC.createBiquadFilter();
      flt.type='lowpass';
      flt.frequency.value=3200;
      flt.Q.value=5;
      const g=AC.createGain();
      g.gain.setValueAtTime(0.18,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      g.connect(mGain);
      const o=AC.createOscillator();
      o.type='square';
      o.frequency.value=hz;
      const g2=AC.createGain();
      g2.gain.setValueAtTime(0.08,t);
      g2.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      g2.connect(mGain);
      const o2=AC.createOscillator();
      o2.type='sawtooth';
      o2.frequency.value=hz*1.005;
      o.connect(ws);
      ws.connect(flt);
      flt.connect(g);
      o.start(t);
      o.stop(t+dur+0.02);
      o2.connect(g2);
      o2.start(t);
      o2.stop(t+dur+0.02);
    }

    const _K= [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,1,0];
    const _SN=[0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1];
    const _GH=[0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1];
    const _HH=[1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1];
    const _OH=[0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0];
    const _BN=[110,0,0,0, 0,0,110,0, 82,0,0,0, 92,0,0,82,
               110,0,0,0, 0,0,82,0,  73,0,82,0, 92,0,0,0];
    const _ST=[0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,
               0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0];
    const _SH=[147,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0,
               147,0,0,0,0,0,0,0,110,0,0,0,0,0,0,0];
    const _LN=Array(64).fill(0);
    [[0,659],[2,587],[4,659],[6,784],[8,880],[10,784],[12,659],[14,587],
     [16,698],[18,659],[20,587],[22,523],[24,587],[26,523],[28,494],[30,440],
     [32,880],[34,988],[36,880],[38,784],[40,880],[42,988],[44,1047],[46,880],
     [48,784],[50,698],[52,784],[54,880],[56,784],[58,698],[60,659],[62,587]
    ].forEach(([s,f])=>_LN[s]=f);
    const _LD=[0.09,0.07,0.09,0.07,0.12,0.07,0.09,0.07,
               0.09,0.07,0.09,0.07,0.09,0.07,0.09,0.07,
               0.07,0.06,0.07,0.06,0.09,0.06,0.12,0.07,
               0.09,0.07,0.09,0.07,0.09,0.07,0.09,0.07];

    function _scheduleBeat(){
      while(_nextBeat < AC.currentTime+0.14){
        const s=_beatStep%16, s32=_beatStep%32, s64=_beatStep%64;
        if(_K[s])  _kick(_nextBeat);
        if(_SN[s]&&!_GH[s]) _snare(_nextBeat,false);
        if(_GH[s]) _snare(_nextBeat,true);
        if(_HH[s]) _hat(_nextBeat,!!_OH[s]);
        if(_BN[s32]) _bass(_nextBeat,_BN[s32]);
        if(_ST[s32]&&_SH[s32]) _stab(_nextBeat,_SH[s32]);
        if(_LN[s64]) _lead(_nextBeat,_LN[s64],_LD[s64%32]||0.09);
        _nextBeat+=S16;
        _beatStep++;
      }
    }

    function startMusic(){
      if(_beatTimer||!AC||!isMusicEnabled()) return;
      _nextBeat=AC.currentTime+0.05;
      _beatStep=0;
      _beatTimer=setInterval(_scheduleBeat,20);
    }

    function stopMusic(){
      if(_beatTimer){
        clearInterval(_beatTimer);
        _beatTimer=null;
      }
    }

    function sfxCollide(force){
      if(!AC||!isSfxEnabled()||force<0.5) return;
      const t=AC.currentTime;
      const v=Math.min(0.92,0.15+force*0.09);
      _noise(t,0.014,v*0.88,5500,22000);
      const scrapeDur=Math.min(0.2,0.07+force*0.012);
      const sr=AC.sampleRate,sn=Math.ceil(sr*(scrapeDur+0.01));
      const sb=AC.createBuffer(1,sn,sr);
      const sd=sb.getChannelData(0);
      for(let i=0;i<sn;i++) sd[i]=Math.random()*2-1;
      const ss=AC.createBufferSource();
      ss.buffer=sb;
      const bp=AC.createBiquadFilter();
      bp.type='bandpass';
      bp.Q.value=2.8;
      bp.frequency.setValueAtTime(9000+force*180,t+0.006);
      bp.frequency.exponentialRampToValueAtTime(2200,t+scrapeDur);
      const sg=AC.createGain();
      sg.gain.setValueAtTime(v*0.78,t+0.006);
      sg.gain.exponentialRampToValueAtTime(0.0001,t+scrapeDur);
      ss.connect(bp);
      bp.connect(sg);
      sg.connect(mGain);
      ss.start(t+0.005);
      ss.stop(t+scrapeDur+0.02);
      const rg=AC.createGain();
      rg.gain.setValueAtTime(v*0.6,t+0.003);
      rg.gain.exponentialRampToValueAtTime(0.0001,t+0.1);
      rg.connect(mGain);
      const ro=AC.createOscillator();
      ro.type='sawtooth';
      ro.frequency.setValueAtTime(3400+force*90,t+0.003);
      ro.frequency.exponentialRampToValueAtTime(700,t+0.08);
      ro.connect(rg);
      ro.start(t+0.002);
      ro.stop(t+0.11);
      const rg2=AC.createGain();
      rg2.gain.setValueAtTime(v*0.35,t+0.008);
      rg2.gain.exponentialRampToValueAtTime(0.0001,t+0.06);
      rg2.connect(mGain);
      const ro2=AC.createOscillator();
      ro2.type='sawtooth';
      ro2.frequency.setValueAtTime(5500+force*60,t+0.008);
      ro2.frequency.exponentialRampToValueAtTime(1400,t+0.055);
      ro2.connect(rg2);
      ro2.start(t+0.007);
      ro2.stop(t+0.07);
      if(force>5){
        const ig=AC.createGain();
        ig.gain.setValueAtTime(v*0.55,t);
        ig.gain.exponentialRampToValueAtTime(0.0001,t+0.1);
        ig.connect(mGain);
        const io=AC.createOscillator();
        io.frequency.setValueAtTime(130+force*5,t);
        io.frequency.exponentialRampToValueAtTime(38,t+0.08);
        io.connect(ig);
        io.start(t);
        io.stop(t+0.11);
        _noise(t,0.05,v*0.35,300,3500);
      }
    }

    function sfxWall(spd){
      if(!AC||!isSfxEnabled()) return;
      const now=AC.currentTime;
      if(now<_wallCD) return;
      _wallCD=now+0.06;
      const v=Math.min(0.65,0.18+spd*0.05);
      [180,360,540].forEach((f,i)=>{
        const g=AC.createGain();
        g.gain.setValueAtTime(v/(i+1),now);
        g.gain.exponentialRampToValueAtTime(0.0001,now+0.22-i*0.04);
        g.connect(mGain);
        const o=AC.createOscillator();
        o.type='sine';
        o.frequency.value=f;
        o.connect(g);
        o.start(now);
        o.stop(now+0.25);
      });
      _noise(now,0.04,v*0.55,1200,8000);
      _noise(now,0.12,v*0.25,180,600);
    }

    function sfxLaunch(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      const g=AC.createGain();
      g.gain.setValueAtTime(0.42,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.35);
      g.connect(mGain);
      const o=AC.createOscillator();
      o.type='sawtooth';
      o.frequency.setValueAtTime(160,t);
      o.frequency.exponentialRampToValueAtTime(1100,t+0.26);
      const f=AC.createBiquadFilter();
      f.type='lowpass';
      f.frequency.value=3500;
      o.connect(f);
      f.connect(g);
      o.start(t);
      o.stop(t+0.38);
      _noise(t,0.15,0.16,2200);
      const sg=AC.createGain();
      sg.gain.setValueAtTime(0,t);
      sg.gain.linearRampToValueAtTime(0.12,t+0.25);
      sg.gain.linearRampToValueAtTime(0,t+1.1);
      sg.connect(mGain);
      const so=AC.createOscillator();
      so.type='sawtooth';
      so.frequency.value=68;
      const sf=AC.createBiquadFilter();
      sf.type='bandpass';
      sf.frequency.value=220;
      sf.Q.value=10;
      so.connect(sf);
      sf.connect(sg);
      so.start(t);
      so.stop(t+1.2);
    }

    function sfxDash(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      const g=AC.createGain();
      g.gain.setValueAtTime(0.32,t);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
      g.connect(mGain);
      const o=AC.createOscillator();
      o.type='square';
      o.frequency.setValueAtTime(440,t);
      o.frequency.exponentialRampToValueAtTime(180,t+0.13);
      o.connect(g);
      o.start(t);
      o.stop(t+0.18);
      _noise(t,0.08,0.14,2000,12000);
    }

    function sfxGuard(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      [440,660,990].forEach((f,i)=>_osc(f,'sine',t+i*0.03,0.22,0.18/(i+1),null));
      _noise(t,0.06,0.1,3500,14000);
      _osc(90,'triangle',t,0.28,0.18,null);
    }

    function sfxOrb(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      [880,1108,1318,1760].forEach((f,i)=>_osc(f,'sine',t+i*0.05,0.22,0.2,null));
    }

    function sfxSkill(sk){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      const audioStyle = resolveSignatureAudioStyle(sk);
      if(audioStyle==='charge'){
        [80,160,320,640,1280].forEach((f,i)=>{_osc(f,'sawtooth',t+i*0.045,0.1,0.4/(i+1),null);});
        _noise(t,0.3,0.32,400,10000);
      }else if(audioStyle==='pulse'){
        [220,330,440,660,880,1100].forEach((f,i)=>_osc(f,'sine',t+i*0.032,0.32,0.24,null));
        _noise(t,0.06,0.18,5000,16000);
        _osc(60,'sine',t,0.4,0.45,null);
      }else{
        _osc(880,'square',t,0.035,0.4,null);
        _osc(1320,'sine',t+0.04,0.18,0.3,null);
        _osc(660,'square',t+0.08,0.035,0.35,null);
        _noise(t,0.22,0.28,2500,14000);
      }
    }

    function sfxRingOut(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      [65,97,130].forEach((f,i)=>{
        const g=AC.createGain();
        g.gain.setValueAtTime(0.6-i*0.12,t);
        g.gain.exponentialRampToValueAtTime(0.0001,t+0.9-i*0.1);
        g.connect(mGain);
        const o=AC.createOscillator();
        o.type=i===0?'sawtooth':'sine';
        o.frequency.setValueAtTime(f*2,t);
        o.frequency.exponentialRampToValueAtTime(f,t+0.25);
        o.connect(g);
        o.start(t);
        o.stop(t+1);
      });
      _noise(t,0.6,0.55,120,6000);
      _noise(t+0.05,0.5,0.4,80,2000);
      _noise(t+0.15,0.35,0.28,60,800);
    }

    function sfxRoundWin(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      [[523,0],[659,.09],[784,.18],[1047,.32],[1318,.48]].forEach(([f,d])=>_osc(f,'sine',t+d,0.28,0.35,null));
    }

    function sfxRoundLose(){
      if(!AC||!isSfxEnabled()) return;
      const t=AC.currentTime;
      [[392,0],[349,.11],[330,.24],[262,.4],[196,.58]].forEach(([f,d])=>_osc(f,'sine',t+d,0.24,0.28,null));
    }

    function sfxCountdown(){
      if(!AC||!isSfxEnabled()) return;
      _osc(1047,'sine',AC.currentTime,0.06,0.28,null);
      _noise(AC.currentTime,0.04,0.1,4000,12000);
    }

    return {
      installRuntimeGuards,
      showRuntimeError,
      initAudioSafely,
      isMusicEnabled,
      isSfxEnabled,
      resolveSignatureAudioStyle,
      startMusic,
      stopMusic,
      sfxCollide,
      sfxWall,
      sfxLaunch,
      sfxDash,
      sfxGuard,
      sfxOrb,
      sfxSkill,
      sfxRingOut,
      sfxRoundWin,
      sfxRoundLose,
      sfxCountdown
    };
  };
})();
