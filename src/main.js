'use strict';

function showRuntimeError(message){
  if(runtimeAudioTools) runtimeAudioTools.showRuntimeError(message);
}

function initAudioSafely(){
  if(runtimeAudioTools) runtimeAudioTools.initAudioSafely();
}

function startMusic(options){
  if(runtimeAudioTools) runtimeAudioTools.startMusic(options);
}
function stopMusic(options){
  if(runtimeAudioTools) runtimeAudioTools.stopMusic(options);
}
function getMusicDebugState(){
  return runtimeAudioTools ? runtimeAudioTools.getMusicDebugState() : null;
}
function sfxCollide(force){
  if(runtimeAudioTools) runtimeAudioTools.sfxCollide(force);
}
function sfxWall(spd){
  if(runtimeAudioTools) runtimeAudioTools.sfxWall(spd);
}

function sfxLaunch(){
  if(runtimeAudioTools) runtimeAudioTools.sfxLaunch();
}

function sfxDash(){
  if(runtimeAudioTools) runtimeAudioTools.sfxDash();
}

function sfxGuard(){
  if(runtimeAudioTools) runtimeAudioTools.sfxGuard();
}

function sfxOrb(){
  if(runtimeAudioTools) runtimeAudioTools.sfxOrb();
}

function sfxSkill(sk){
  if(runtimeAudioTools) runtimeAudioTools.sfxSkill(sk);
}

function sfxRingOut(){
  if(runtimeAudioTools) runtimeAudioTools.sfxRingOut();
}

function sfxRoundWin(){
  if(runtimeAudioTools) runtimeAudioTools.sfxRoundWin();
}
function sfxRoundLose(){
  if(runtimeAudioTools) runtimeAudioTools.sfxRoundLose();
}
function sfxCountdown(){
  if(runtimeAudioTools) runtimeAudioTools.sfxCountdown();
}
function getHeartPoints(){
  return arenaMathTools ? arenaMathTools.HEART_PTS : [];
}

function heartContains(x,z,scale=1){
  return arenaMathTools ? arenaMathTools.heartContains(x,z,scale) : false;
}
function heartWallNormal(x,z){
  return arenaMathTools ? arenaMathTools.heartWallNormal(x,z) : {nx:0,nz:0};
}
function heartNearWall(x,z){return arenaMathTools ? arenaMathTools.heartNearWall(x,z) : false;}
function heartInHaz(x,z){return arenaMathTools ? arenaMathTools.heartInHaz(x,z) : false;}
function heartCrossed(x,z){return arenaMathTools ? arenaMathTools.heartCrossed(x,z) : false;}
function heartRingOut(x,z){return arenaMathTools ? arenaMathTools.heartRingOut(x,z) : false;}

let timeScale=1;
let timeDilationHoldT=0;
let timeDilationRecoverRate=1.1;

const pTrailPos=[],eTrailPos=[];

const root = window.SpinClash || {};
const TOPS = (root.config && root.config.tops) || [];
const ARENAS = (root.config && root.config.arenas) || [];
const MODIFIERS = (root.config && root.config.modifiers) || {};
const ENEMY_PRESETS = (root.config && root.config.enemyPresets) || {};
const ECONOMY = (root.config && root.config.economy) || {};
const RESEARCH = (root.config && root.config.research) || [];
const ROAD_RANKS = (root.config && root.config.roadRanks) || [];
const CHALLENGE_ROAD = (root.config && root.config.challengeRoad) || [];
const SIGNATURE_SKILLS = (root.config && root.config.signatureSkills) || {};
const UI_TEXT = (root.config && root.config.text) || {};
const storageService = (root.services && root.services.storage) || null;
const analyticsService = (root.services && root.services.analytics) || null;
const rewardService = (root.services && root.services.reward) || null;
const shareService = (root.services && root.services.share) || null;
const debugService = (root.services && root.services.debug) || null;
const createProgressionTools = root.createProgressionTools || null;
const createLoadoutUiTools = root.createLoadoutUiTools || null;
const createMatchFlowTools = root.createMatchFlowTools || null;
const createDebugRuntimeTools = root.createDebugRuntimeTools || null;
const createUiEntryTools = root.createUiEntryTools || null;
const createStartupTools = root.createStartupTools || null;
const createUiShellTools = root.createUiShellTools || null;
const createCombatActionTools = root.createCombatActionTools || null;
const createRoundFlowTools = root.createRoundFlowTools || null;
const createBattleEffectsTools = root.createBattleEffectsTools || null;
const createRuntimeAudioTools = root.createRuntimeAudioTools || null;
const createArenaMathTools = root.createArenaMathTools || null;
const createArenaRenderTools = root.createArenaRenderTools || null;
const createTrailRenderTools = root.createTrailRenderTools || null;
const createScratchLayerTools = root.createScratchLayerTools || null;
const createTopRenderTools = root.createTopRenderTools || null;
const createHomeTopShowcaseTools = root.createHomeTopShowcaseTools || null;
const createQuickBattlePreviewTools = root.createQuickBattlePreviewTools || null;
const createAimLineTools = root.createAimLineTools || null;
const createSceneShellTools = root.createSceneShellTools || null;
const createBattleCommentaryTools = root.createBattleCommentaryTools || null;
const createMessageUiTools = root.createMessageUiTools || null;
const createBattleViewTools = root.createBattleViewTools || null;
const createBattleSimTools = root.createBattleSimTools || null;
const createLocalizationTools = root.createLocalizationTools || null;

function buildSkillIconMap(registry){
  return Object.keys(registry || {}).reduce(function(map, skillId){
    const entry = registry[skillId] || {};
    if(entry.icon) map[skillId] = entry.icon;
    return map;
  }, {});
}

const SK_ICONS = buildSkillIconMap(SIGNATURE_SKILLS);

let enemyTopId=1;
let currentEnemyPresetId=null;
let currentMode='quick';
let uiRoute='home';
let uiRouteFrom='home';
let battleReturnRoute='home';
let activeChallengeIndex=0;
let lastRoundEndReason=null;
let matchStartedAt=null;
let challengeContinueUsed=false;
let roundRewardGranted=false;
let doubleRewardUsed=false;
let pendingContinue=false;
let currentArena=0;
let selectedArenaIndex=0;
let currentLocale='en';
let infoPage='about';

function createBattlePerfBucket(){
  return {
    samples:0,
    lastMs:0,
    avgMs:0,
    maxMs:0
  };
}

function resetBattlePerfBucket(bucket){
  bucket.samples = 0;
  bucket.lastMs = 0;
  bucket.avgMs = 0;
  bucket.maxMs = 0;
}

function recordBattlePerfSample(bucket,durationMs){
  const safeDuration = Math.max(0, durationMs || 0);
  bucket.samples += 1;
  bucket.lastMs = safeDuration;
  bucket.avgMs += (safeDuration - bucket.avgMs) / bucket.samples;
  if(safeDuration > bucket.maxMs){
    bucket.maxMs = safeDuration;
  }
}

function getPerfNow(){
  return (window.performance && typeof window.performance.now === 'function') ? window.performance.now() : Date.now();
}

const isTouchDevice = typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
const isMobileUserAgent = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
const lowCoreCount = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 6;
const lowDeviceMemory = typeof navigator !== 'undefined' && typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
const battlePerformanceMode = {
  enabled:true,
  battleOnly:true,
  lowEndMobile:!!(isTouchDevice && isMobileUserAgent && (lowCoreCount || lowDeviceMemory)),
  activeBattle:false,
  qualityTier:'full',
  rendererPixelRatioCap:2
};
const battlePerfMetrics = {
  frameMs:Object.assign(createBattlePerfBucket(), {
    over22Ms:0,
    over28Ms:0,
    over33Ms:0
  }),
  phases:{
    physTick:createBattlePerfBucket(),
    battleView:createBattlePerfBucket(),
    renderer:createBattlePerfBucket()
  }
};

function resetBattlePerfMetrics(){
  resetBattlePerfBucket(battlePerfMetrics.frameMs);
  battlePerfMetrics.frameMs.over22Ms = 0;
  battlePerfMetrics.frameMs.over28Ms = 0;
  battlePerfMetrics.frameMs.over33Ms = 0;
  Object.keys(battlePerfMetrics.phases).forEach(function(key){
    resetBattlePerfBucket(battlePerfMetrics.phases[key]);
  });
}

function recordBattlePerfPhase(phaseName,durationMs){
  if(!battlePerfMetrics.phases[phaseName]){
    battlePerfMetrics.phases[phaseName] = createBattlePerfBucket();
  }
  recordBattlePerfSample(battlePerfMetrics.phases[phaseName],durationMs);
}

function recordBattleFrame(durationMs){
  recordBattlePerfSample(battlePerfMetrics.frameMs,durationMs);
  if(durationMs > 22) battlePerfMetrics.frameMs.over22Ms += 1;
  if(durationMs > 28) battlePerfMetrics.frameMs.over28Ms += 1;
  if(durationMs > 33) battlePerfMetrics.frameMs.over33Ms += 1;
}

root.battlePerformanceMode = battlePerformanceMode;
root.battlePerfMetrics = battlePerfMetrics;
root.recordBattlePerfPhase = recordBattlePerfPhase;

const sessionTrialArenaIds = new Set();
let activeModifier=MODIFIERS.standard || { id:'standard', label:'STANDARD', description:'No special rules.', player:{}, enemy:{}, rules:{} };
let loadoutUiTools=null;
let matchFlowTools=null;
let debugRuntimeTools=null;
let uiEntryTools=null;
let startupTools=null;
let uiShellTools=null;
let combatActionTools=null;
let roundFlowTools=null;
let battleEffectsTools=null;
let runtimeAudioTools=null;
let arenaMathTools=null;
let arenaRenderTools=null;
let trailRenderTools=null;
let scratchLayerTools=null;
let topRenderTools=null;
let homeTopShowcaseTools=null;
let quickBattlePreviewTools=null;
let aimLineTools=null;
let sceneShellTools=null;
let battleCommentaryTools=null;
let messageUiTools=null;
let battleViewTools=null;
let battleSimTools=null;
let localizationTools=null;
runtimeAudioTools = createRuntimeAudioTools ? createRuntimeAudioTools({
  storageService,
  signatureSkills:SIGNATURE_SKILLS
}) : null;
if(runtimeAudioTools) runtimeAudioTools.installRuntimeGuards();
arenaMathTools = createArenaMathTools ? createArenaMathTools() : null;

function getLoadoutSubtitle(){
  return loadoutUiTools
    ? loadoutUiTools.getLoadoutSubtitle()
    : (currentMode==='challenge' ? UI_TEXT.challengeSubtitle : UI_TEXT.quickBattleSubtitle);
}

function getCurrentChallengeNode(){
  return loadoutUiTools
    ? loadoutUiTools.getCurrentChallengeNode()
    : (CHALLENGE_ROAD[activeChallengeIndex] || CHALLENGE_ROAD[CHALLENGE_ROAD.length-1] || null);
}

function getArenaLabel(index){
  return loadoutUiTools
    ? loadoutUiTools.getArenaLabel(index)
    : (ARENAS[index] ? ARENAS[index].label : 'ARENA');
}

function getArenaConfig(index){
  return loadoutUiTools
    ? loadoutUiTools.getArenaConfig(index)
    : (ARENAS[index] || { id:'unknown_arena', label:'ARENA', type:'circle', unlockCost:0 });
}

function getEnemyPresetById(id){
  return id && ENEMY_PRESETS[id] ? ENEMY_PRESETS[id] : null;
}

function getCurrentEnemyPreset(){
  return getEnemyPresetById(currentEnemyPresetId);
}

function getCurrentEnemyAiConfig(){
  const enemyPreset = getCurrentEnemyPreset();
  return enemyPreset && enemyPreset.ai ? enemyPreset.ai : null;
}

function getCurrentEnemyPresetLabel(){
  const enemyPreset = getCurrentEnemyPreset();
  return enemyPreset ? (enemyPreset.label || enemyPreset.id || null) : null;
}

function isCircleArena(){
  return getArenaConfig(currentArena).type === 'circle';
}

function isHeartArena(){
  return getArenaConfig(currentArena).type === 'heart';
}

function isHexArena(){
  return getArenaConfig(currentArena).type === 'hex';
}

function isArenaUnlocked(index){
  return loadoutUiTools ? loadoutUiTools.isArenaUnlocked(index) : true;
}

function attemptArenaAccess(index){
  return loadoutUiTools ? loadoutUiTools.attemptArenaAccess(index) : Promise.resolve(true);
}

function getArenaButtonText(index){
  return loadoutUiTools ? loadoutUiTools.getArenaButtonText(index) : getArenaLabel(index);
}

function getModifierById(id){
  return MODIFIERS[id] || MODIFIERS.standard || { id:'standard', label:'STANDARD', description:'No special rules.', player:{}, enemy:{}, rules:{} };
}

function updateCurrencyUI(){
  if(loadoutUiTools) loadoutUiTools.updateCurrencyUI();
}

function applyStaticText(){
  if(loadoutUiTools) loadoutUiTools.applyStaticText();
}


function updateModeUI(){
  if(loadoutUiTools) loadoutUiTools.updateModeUI();
  if(homeTopShowcaseTools) homeTopShowcaseTools.sync();
  if(quickBattlePreviewTools) quickBattlePreviewTools.sync();
}


const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,battlePerformanceMode.rendererPixelRatioCap));
renderer.shadowMap.enabled=true;
document.getElementById('gc').appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010108);
scene.fog=new THREE.Fog(0x010108,22,55);

const cam=new THREE.PerspectiveCamera(50,1,0.1,100);
cam.position.set(0,17,12);cam.lookAt(0,0,0);
const textureLoader = new THREE.TextureLoader();
function loadFxTexture(relativePath){
  const texture = textureLoader.load(relativePath, function(loadedTexture){
    loadedTexture.magFilter = THREE.LinearFilter;
    loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
    loadedTexture.generateMipmaps = true;
  }, undefined, function(){
    showRuntimeError('Failed to load FX texture: '+relativePath);
  });
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}
const FX_TEXTURES = {
  impactBurst:loadFxTexture('assets/fx/impact-burst-v1.png'),
  ringOutFlash:loadFxTexture('assets/fx/ringout-flash-v1.png')
};
const HEX_R = 7.1;
const HEX_PTS = Array.from({length:6},(_,i)=>{
  const a = Math.PI/6 + i*Math.PI/3;
  return { x:Math.cos(a)*HEX_R, z:Math.sin(a)*HEX_R };
});
const TRAIL_N=14;

const AR=8,TOP_R=0.55;
const FRIC=0.9996,SPIN_D=1.2,SPIN_HAZ=6;

function polygonContains(points,x,z){
  return arenaMathTools ? arenaMathTools.polygonContains(points,x,z) : false;
}

function nearestPolygonEdgeData(points,x,z){
  return arenaMathTools ? arenaMathTools.nearestPolygonEdgeData(points,x,z) : { dist:Infinity, nx:0, nz:0 };
}

function scalePolygon(points,scale){
  return arenaMathTools ? arenaMathTools.scalePolygon(points,scale) : points;
}

arenaRenderTools = createArenaRenderTools ? createArenaRenderTools({
  THREE,
  scene,
  arenaRadius:AR,
  hexRadius:HEX_R,
  hexPoints:HEX_PTS,
  arenaMathTools,
  isCircleArena:()=>isCircleArena(),
  isHeartArena:()=>isHeartArena(),
  onArenaBuilt:()=>{ if(scratchLayerTools) scratchLayerTools.onArenaBuilt(); }
}) : null;
trailRenderTools = createTrailRenderTools ? createTrailRenderTools({
  THREE,
  scene,
  trailLength:TRAIL_N,
  tops:TOPS,
  getPlayerTopId:()=>playerTopId,
  getEnemyTopId:()=>enemyTopId,
  getBattlePerformanceMode:()=>battlePerformanceMode
}) : null;
scratchLayerTools = createScratchLayerTools ? createScratchLayerTools({
  THREE,
  scene,
  renderer,
  arenaRadius:AR,
  hexRadius:HEX_R,
  hexPoints:HEX_PTS,
  getHeartPoints,
  isCircleArena:()=>isCircleArena(),
  isHeartArena:()=>isHeartArena(),
  getGameState:()=>gameState,
  getBattlePerformanceMode:()=>battlePerformanceMode
}) : null;

function setupArena(){
  if(arenaRenderTools) arenaRenderTools.setupArena();
  else if(scratchLayerTools) scratchLayerTools.onArenaBuilt();
}

function initTrails(){
  if(trailRenderTools) trailRenderTools.initTrails();
}

function updateTrail(isPlayer,posArr,x,z,alive){
  if(trailRenderTools){
    if(isPlayer) trailRenderTools.updatePlayerTrail(posArr,x,z,alive);
    else trailRenderTools.updateEnemyTrail(posArr,x,z,alive);
  }
}

topRenderTools = createTopRenderTools ? createTopRenderTools({ THREE }) : null;
homeTopShowcaseTools = createHomeTopShowcaseTools ? createHomeTopShowcaseTools({
  THREE,
  tops:TOPS,
  topRenderTools,
  getUiRoute:()=>uiRoute,
  getHomePreviewTopId:()=>homePreviewTopId,
  isTopUnlocked:(index)=>loadoutUiTools ? loadoutUiTools.isTopUnlocked(index) : true
}) : null;
quickBattlePreviewTools = createQuickBattlePreviewTools ? createQuickBattlePreviewTools({
  THREE,
  arenas:ARENAS,
  tops:TOPS,
  topRenderTools,
  arenaMathTools,
  getUiRoute:()=>uiRoute,
  getSelectedArenaIndex:()=>selectedArenaIndex,
  isArenaUnlocked:(index)=>loadoutUiTools ? loadoutUiTools.isArenaUnlocked(index) : true,
  getPlayerTopId:()=>playerTopId,
  isTopUnlocked:(index)=>loadoutUiTools ? loadoutUiTools.isTopUnlocked(index) : true
}) : null;
aimLineTools = createAimLineTools ? createAimLineTools({
  THREE,
  scene,
  renderer,
  camera:cam
}) : null;
sceneShellTools = createSceneShellTools ? createSceneShellTools({
  THREE,
  scene,
  renderer,
  camera:cam
}) : null;
if(sceneShellTools){
  sceneShellTools.installLights();
  sceneShellTools.onResize();
  window.addEventListener('resize',()=>{
    sceneShellTools.onResize();
    if(homeTopShowcaseTools) homeTopShowcaseTools.resize();
    if(quickBattlePreviewTools) quickBattlePreviewTools.resize();
  });
}
messageUiTools = createMessageUiTools ? createMessageUiTools() : null;
battleCommentaryTools = createBattleCommentaryTools ? createBattleCommentaryTools({
  uiText:UI_TEXT
}) : null;

function mkSpotTex(bgCol,dotCol,patId){
  return topRenderTools ? topRenderTools.mkSpotTex(bgCol,dotCol,patId) : null;
}

function mkTop(color,emi,typeId,isPlayer){
  return topRenderTools ? topRenderTools.mkTop(color,emi,typeId,isPlayer) : new THREE.Group();
}

function setBattleTimeScale(next){
  timeScale = next;
  if(next >= 1){
    timeDilationHoldT = 0;
    timeDilationRecoverRate = 1.1;
  }
}

function triggerTimeDilation(nextScale,holdT=0.06,recoverRate=4.8){
  let options = null;
  if(arguments.length > 3 && arguments[3] && typeof arguments[3] === 'object'){
    options = arguments[3];
  }
  if(typeof nextScale !== 'number' || !isFinite(nextScale) || nextScale >= 1) return;
  timeScale = Math.max(0.12, Math.min(timeScale, nextScale));
  timeDilationHoldT = Math.max(timeDilationHoldT, holdT || 0);
  if(options && options.replaceRecoverRate === true){
    timeDilationRecoverRate = Math.max(0.2, recoverRate || 1.1);
    return;
  }
  timeDilationRecoverRate = Math.max(timeDilationRecoverRate, recoverRate || 1.1);
}

const partPool=[];
const pGeo=new THREE.SphereGeometry(.07,5,5);
function spawnParts(x,z,color,n=8){
  if(battleEffectsTools) battleEffectsTools.spawnParts(partPool,x,z,color,n);
}
function emitClashEffect(payload){
  if(battleEffectsTools) battleEffectsTools.emitClashEffect(partPool,payload);
}
function emitWallImpactEffect(payload){
  if(battleEffectsTools) battleEffectsTools.emitWallImpactEffect(partPool,payload);
}
function emitRingOutEffect(payload){
  if(battleEffectsTools) battleEffectsTools.emitRingOutEffect(partPool,payload);
}
function tickParts(dt){
  if(battleEffectsTools) battleEffectsTools.tickParts(partPool,dt);
}

const orbObjs=[];
const orbGeo=new THREE.SphereGeometry(.3,14,14);
function spawnOrbs(){
  if(battleEffectsTools) battleEffectsTools.spawnOrbs(orbObjs);
}
function tickOrbs(dt,tp,te){
  if(battleEffectsTools) battleEffectsTools.tickOrbs(orbObjs,dt,tp,te);
}

function mkTopData(template,isPlayer){
  const guardAction = template && template.combat && template.combat.actions
    ? (template.combat.actions.guard || {})
    : {};
  return roundFlowTools
    ? roundFlowTools.mkTopData(template,isPlayer)
    : {mesh:null,isPlayer,x:0,z:isPlayer?5.0:-5.0,vx:0,vz:0,hp:template.hp,maxHp:template.hp,spin:template.maxSpin,maxSpin:template.maxSpin,burst:0,dashCD:0,DASH_CD:2.5,guardCD:0,GUARD_CD:guardAction.cooldown||4.0,guardT:0,GUARD_T:guardAction.duration||0.82,skillCD:0,SKILL_CD:8,dashing:false,dashT:0,guarding:false,shielded:false,shieldT:0,phantom:false,phantomT:0,tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,wallCD:0,alive:true,template};
}

function applyModifierToTemplate(template, sideConfig){
  return roundFlowTools
    ? roundFlowTools.applyModifierToTemplate(template, sideConfig)
    : template;
}

function getCurrentRoundTimer(){
  return roundFlowTools ? roundFlowTools.getCurrentRoundTimer() : 30;
}

function syncDebugPanel(){
  if(debugRuntimeTools) debugRuntimeTools.syncDebugPanel();
}

function getLoadoutOverlay(){
  return uiShellTools ? uiShellTools.getLoadoutOverlay() : document.getElementById('ov-loadout');
}

function clearOverlayInlineState(overlay){
  if(uiShellTools) uiShellTools.clearOverlayInlineState(overlay);
}

function showLoadoutOverlay(){
  if(uiShellTools) uiShellTools.showLoadoutOverlay();
}

function hideLoadoutOverlay(){
  if(uiShellTools) uiShellTools.hideLoadoutOverlay();
}

function syncArenaSelectionUI(){
  if(uiShellTools) uiShellTools.syncArenaSelectionUI();
}

function refreshDebugState(){
  updateCurrencyUI();
  updateModeUI();
  syncDebugPanel();
}

const progressionTools = createProgressionTools ? createProgressionTools({
  storageService,
  challengeRoad:CHALLENGE_ROAD,
  researchTracks:RESEARCH,
  roadRanks:ROAD_RANKS,
  refresh:refreshDebugState,
  getSessionTrialArenaIds:()=>sessionTrialArenaIds,
  setMode:(mode)=>{ currentMode = mode; },
  setCurrentArena:(index)=>{ currentArena = index; },
  setSelectedArenaIndex:(index)=>{ selectedArenaIndex = index; },
  setActiveChallengeIndex:(index)=>{ activeChallengeIndex = index; },
  resetRuntimeFlags:()=>{
    challengeContinueUsed = false;
    roundRewardGranted = false;
    doubleRewardUsed = false;
  }
}) : null;

const getSave = progressionTools ? progressionTools.getSave : function(){
  return storageService ? storageService.get() : {
    currency:0,
    challenge:{ unlockedNodeIndex:0, checkpointNodeIndex:0, completedNodes:[], unlockedRankIndex:0, selectedRankIndex:0 },
    sessions:0,
    analytics:[]
  };
};
const saveProgress = progressionTools ? progressionTools.saveProgress : function(mutator){
  if(!storageService) return getSave();
  return storageService.transact(mutator);
};
const setChallengeProgress = progressionTools ? progressionTools.setChallengeProgress : function(){};
const addCurrency = progressionTools ? progressionTools.addCurrency : function(){};
const getResearchLevel = progressionTools ? progressionTools.getResearchLevel : function(){ return 0; };
const getResearchBonuses = progressionTools ? progressionTools.getResearchBonuses : function(){ return { hpMul:1, maxSpinMul:1, brateMul:1 }; };
const buyResearchLevel = progressionTools ? progressionTools.buyResearchLevel : function(){ return { ok:false, reason:'unavailable' }; };
const getUnlockedRoadRankIndex = progressionTools ? progressionTools.getUnlockedRoadRankIndex : function(){ return 0; };
const getSelectedRoadRankIndex = progressionTools ? progressionTools.getSelectedRoadRankIndex : function(){ return 0; };
const setSelectedRoadRankIndex = progressionTools ? progressionTools.setSelectedRoadRankIndex : function(index){ return index; };
function getCurrentSettings(){
  const save = getSave();
  const settings = save && save.settings ? save.settings : {};
  return {
    locale:settings.locale || currentLocale || 'en',
    musicEnabled:settings.musicEnabled !== false,
    sfxEnabled:settings.sfxEnabled !== false
  };
}
function patchCurrentSettings(patch){
  const current = getCurrentSettings();
  const nextSettings = Object.assign({}, current, patch || {});
  if(storageService && typeof storageService.patch === 'function'){
    const nextSave = storageService.patch({ settings:nextSettings });
    return nextSave && nextSave.settings ? nextSave.settings : nextSettings;
  }
  return nextSettings;
}
function toggleMusicPreference(){
  const nextEnabled = !getCurrentSettings().musicEnabled;
  patchCurrentSettings({ musicEnabled:nextEnabled });
  if(nextEnabled){
    initAudioSafely();
    syncMusicState();
  }else{
    stopMusic({ fadeMs:180 });
  }
  return nextEnabled;
}
function syncMusicState(){
  if(!runtimeAudioTools) return;
  if(!getCurrentSettings().musicEnabled){
    stopMusic({ fadeMs:180 });
    return;
  }
  if(gameState === 'active' || gameState === 'roundOutro' || gameState === 'roundResult' || gameState === 'matchResult'){
    startMusic({
      scene:'battle',
      round:round,
      fadeMs:220
    });
    return;
  }
  if(gameState === 'prepare'){
    stopMusic({ fadeMs:220 });
    return;
  }
  if(uiRoute === 'home' || uiRoute === 'quick' || uiRoute === 'path' || uiRoute === 'workshop' || uiRoute === 'settings' || uiRoute === 'info'){
    startMusic({
      scene:'menu',
      route:uiRoute,
      fadeMs:320
    });
    return;
  }
  stopMusic({ fadeMs:220 });
}
let audioGesturePrimed = false;
function primeAudioFromInteraction(){
  if(audioGesturePrimed) return;
  audioGesturePrimed = true;
  initAudioSafely();
  syncMusicState();
  window.removeEventListener('pointerdown', primeAudioFromInteraction, true);
  window.removeEventListener('keydown', primeAudioFromInteraction, true);
  window.removeEventListener('touchstart', primeAudioFromInteraction, true);
}
function attemptInitialMusicPlayback(){
  initAudioSafely();
  syncMusicState();
}
function toggleSfxPreference(){
  const nextEnabled = !getCurrentSettings().sfxEnabled;
  patchCurrentSettings({ sfxEnabled:nextEnabled });
  if(nextEnabled){
    initAudioSafely();
  }
  return nextEnabled;
}
function getCurrentRoadRank(){
  return ROAD_RANKS[getSelectedRoadRankIndex()] || ROAD_RANKS[0] || { id:'rank_i', label:'RANK I', rewardMul:1, enemy:{ hpMul:1, spinMul:1, spdMul:1, massMul:1, brate:1 } };
}
const unlockArenaById = progressionTools ? progressionTools.unlockArenaById : function(){};
const unlockTopById = progressionTools ? progressionTools.unlockTopById : function(){};
const resetDebugProgress = progressionTools ? progressionTools.resetDebugProgress : function(){};
loadoutUiTools = createLoadoutUiTools ? createLoadoutUiTools({
  uiText:UI_TEXT,
  tops:TOPS,
  arenas:ARENAS,
  researchTracks:RESEARCH,
  roadRanks:ROAD_RANKS,
  modifiers:MODIFIERS,
  enemyPresets:ENEMY_PRESETS,
  challengeRoad:CHALLENGE_ROAD,
  analyticsService,
  getSave,
  saveProgress,
  getResearchLevel,
  getResearchBonuses,
  buyResearchLevel,
  getCurrentMode:()=>currentMode,
  getUiRoute:()=>uiRoute,
  getUiRouteFrom:()=>uiRouteFrom,
  getCurrentLocale:()=>currentLocale,
  getMusicEnabled:()=>getCurrentSettings().musicEnabled,
  getSfxEnabled:()=>getCurrentSettings().sfxEnabled,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  getSelectedArenaIndex:()=>selectedArenaIndex,
  getPlayerTopId:()=>playerTopId,
  getHomePreviewTopId:()=>homePreviewTopId,
  getSessionTrialArenaIds:()=>sessionTrialArenaIds,
  getInfoPage:()=>infoPage,
  setInfoPage:(next)=>{ infoPage = next; },
  getUnlockedRoadRankIndex,
  getSelectedRoadRankIndex,
  setSelectedRoadRankIndex,
  setCurrentArena:(index)=>{ currentArena = index; },
  goPathRoute:()=>{ if(uiEntryTools) uiEntryTools.goPath(); },
  rewardService,
  showMsg,
  refresh:refreshDebugState
  }) : null;
let gameState='title',playerTopId=0,homePreviewTopId=0,score=[0,0],round=1,roundTimer=(ECONOMY.runtime && typeof ECONOMY.runtime.defaultRoundTimer === 'number' ? ECONOMY.runtime.defaultRoundTimer : 30);
if(homeTopShowcaseTools) homeTopShowcaseTools.initialize();
if(quickBattlePreviewTools) quickBattlePreviewTools.initialize();
uiShellTools = createUiShellTools ? createUiShellTools({
  uiText:UI_TEXT,
  tops:TOPS,
  getSelectedArenaIndex:()=>selectedArenaIndex,
  getGameState:()=>gameState,
  getScore:()=>score,
  getPlayerTopId:()=>playerTopId,
  getTp:()=>tp,
  getTe:()=>te,
  signatureSkills:SIGNATURE_SKILLS,
  skillIcons:SK_ICONS
}) : null;
matchFlowTools = createMatchFlowTools ? createMatchFlowTools({
  uiText:UI_TEXT,
  tops:TOPS,
  challengeRoad:CHALLENGE_ROAD,
  roadRanks:ROAD_RANKS,
  economy:ECONOMY,
  rewardService,
  shareService,
  analyticsService,
  getScore:()=>score,
  getRound:()=>round,
  setScore:(next)=>{ score = next; },
  setRound:(next)=>{ round = next; },
  getCurrentMode:()=>currentMode,
  getBattleReturnRoute:()=>battleReturnRoute,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  setActiveChallengeIndex:(next)=>{ activeChallengeIndex = next; },
  getCurrentArena:()=>currentArena,
  getPlayerTopId:()=>playerTopId,
  getEnemyTopId:()=>enemyTopId,
  getCurrentEnemyPresetId:()=>currentEnemyPresetId,
  getCurrentEnemyPresetLabel,
  getActiveModifier:()=>activeModifier,
  getCurrentChallengeNode,
  getArenaLabel,
  getArenaConfig,
  getSave,
  saveProgress,
  getSelectedRoadRankIndex,
  getCurrentRoadRank,
  showMsg,
  updateCurrencyUI,
  updateModeUI,
  syncDebugPanel,
  initRound,
  getChallengeContinueUsed:()=>challengeContinueUsed,
  setChallengeContinueUsed:(next)=>{ challengeContinueUsed = next; },
  getRoundRewardGranted:()=>roundRewardGranted,
  setRoundRewardGranted:(next)=>{ roundRewardGranted = next; },
  getDoubleRewardUsed:()=>doubleRewardUsed,
  setDoubleRewardUsed:(next)=>{ doubleRewardUsed = next; },
  getLastRoundEndReason:()=>lastRoundEndReason,
  setLastRoundEndReason:(next)=>{ lastRoundEndReason = next; },
  getMatchStartedAt:()=>matchStartedAt,
  setMatchStartedAt:(next)=>{ matchStartedAt = next; }
}) : null;
uiEntryTools = createUiEntryTools ? createUiEntryTools({
  uiText:UI_TEXT,
  tops:TOPS,
  arenas:ARENAS,
  getCurrentMode:()=>currentMode,
  getUiRoute:()=>uiRoute,
  setUiRoute:(next)=>{ uiRoute = next; },
  getUiRouteFrom:()=>uiRouteFrom,
  setUiRouteFrom:(next)=>{ uiRouteFrom = next; },
  getBattleReturnRoute:()=>battleReturnRoute,
  setBattleReturnRoute:(next)=>{ battleReturnRoute = next; },
  setCurrentMode:(next)=>{ currentMode = next; },
  getActiveChallengeIndex:()=>activeChallengeIndex,
  setActiveChallengeIndex:(next)=>{ activeChallengeIndex = next; },
  getCurrentArena:()=>currentArena,
  setCurrentArena:(next)=>{ currentArena = next; },
  getSelectedArenaIndex:()=>selectedArenaIndex,
  setSelectedArenaIndex:(next)=>{ selectedArenaIndex = next; },
  getPlayerTopId:()=>playerTopId,
  setPlayerTopId:(next)=>{ playerTopId = next; homePreviewTopId = next; },
  getHomePreviewTopId:()=>homePreviewTopId,
  setHomePreviewTopId:(next)=>{ homePreviewTopId = next; },
  getInfoPage:()=>infoPage,
  setInfoPage:(next)=>{ infoPage = next; },
  resetScoreRound:()=>{ score=[0,0]; round=1; },
  setChallengeContinueUsed:(next)=>{ challengeContinueUsed = next; },
  getSave,
  getLoadoutOverlay,
  showLoadoutOverlay,
  hideLoadoutOverlay,
  syncArenaSelectionUI,
  updateModeUI,
  syncDebugPanel,
  initAudioSafely,
  syncMusicState,
  showRuntimeError,
  updateSkillIcon,
  attemptArenaAccess,
  attemptTopAccess:(index)=>loadoutUiTools ? loadoutUiTools.attemptTopAccess(index) : Promise.resolve(true),
  isTopUnlocked:(index)=>loadoutUiTools ? loadoutUiTools.isTopUnlocked(index) : true,
  selectRoadRank:(index)=>loadoutUiTools ? loadoutUiTools.selectRoadRank(index) : index,
  toggleWorkshop:()=>loadoutUiTools ? loadoutUiTools.toggleWorkshopOpen() : false,
  setWorkshopOpen:(next)=>loadoutUiTools ? loadoutUiTools.setWorkshopOpen(next) : false,
  attemptResearchPurchase:(index)=>loadoutUiTools ? loadoutUiTools.attemptResearchPurchase(index) : Promise.resolve(false),
  setLocale:(locale)=>localizationTools ? localizationTools.setLocale(locale) : locale,
  toggleMusicPreference,
  toggleSfxPreference,
  showMsg,
  beginFight,
  doSwap,
  doPlayerDash,
  doPlayerGuard,
  doPlayerSkill,
  resetMatch,
  handleDoubleReward,
  handleContinueReward,
  handleShare
}) : null;
combatActionTools = createCombatActionTools ? createCombatActionTools({
  uiText:UI_TEXT,
  signatureSkills:SIGNATURE_SKILLS,
  renderer,
  getGameState:()=>gameState,
  getTp:()=>tp,
  getTe:()=>te,
  showMsg,
  sfxDash,
  sfxGuard,
  sfxSkill,
  spawnParts,
  launch,
  onDragStart,
  onDragMove,
  onDragEnd
}) : null;
roundFlowTools = createRoundFlowTools ? createRoundFlowTools({
  uiText:UI_TEXT,
  tops:TOPS,
  economy:ECONOMY,
  analyticsService,
  getResearchBonuses,
  getCurrentRoadRank,
  getCurrentMode:()=>currentMode,
  getCurrentChallengeNode,
  getModifierById,
  getArenaLabel,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  getCurrentArena:()=>currentArena,
  setCurrentArena:(next)=>{ currentArena = next; },
  setSelectedArenaIndex:(next)=>{ selectedArenaIndex = next; },
  getEnemyPresetById,
  getCurrentEnemyPresetId:()=>currentEnemyPresetId,
  getCurrentEnemyPresetLabel,
  setCurrentEnemyPresetId:(next)=>{ currentEnemyPresetId = next; },
  getEnemyTopId:()=>enemyTopId,
  setEnemyTopId:(next)=>{ enemyTopId = next; },
  getPlayerTopId:()=>playerTopId,
  getRound:()=>round,
  setRound:(next)=>{ round = next; },
  getScore:()=>score,
  setScore:(next)=>{ score = next; },
  getTp:()=>tp,
  setTp:(next)=>{ tp = next; },
  getTe:()=>te,
  setTe:(next)=>{ te = next; },
  getOrbObjects:()=>orbObjs,
  getPartPool:()=>partPool,
  getPTrailPos:()=>pTrailPos,
  getETrailPos:()=>eTrailPos,
  setupArena,
  mkTop,
  scene,
  showMsg,
  updateSkillIcon,
  updateHUD,
  refreshPips,
  syncDebugPanel,
  showMatchResult,
  spawnOrbs,
  sfxLaunch,
  startMusic,
  sfxRoundWin,
  sfxRoundLose,
  setGameState:(next)=>{ gameState = next; },
  setEndLock:(next)=>{ endLock = next; },
  getPhysTick:()=>physTick,
  getTimeScale:()=>timeScale,
  setTimeScale:setBattleTimeScale,
  getAimLine:()=>aimLineTools ? aimLineTools.getAimLine() : null,
  getCurrentModifier:()=>activeModifier,
  setCurrentModifier:(next)=>{ activeModifier = next; },
  setRoundTimer:(next)=>{ roundTimer = next; },
  setRoundRewardGranted:(next)=>{ roundRewardGranted = next; },
  setDoubleRewardUsed:(next)=>{ doubleRewardUsed = next; },
  setPendingContinue:(next)=>{ pendingContinue = next; },
  setLastRoundEndReason:(next)=>{ lastRoundEndReason = next; },
  getMatchStartedAt:()=>matchStartedAt,
  setMatchStartedAt:(next)=>{ matchStartedAt = next; },
  isHeartArena:()=>isHeartArena()
}) : null;
battleEffectsTools = createBattleEffectsTools ? createBattleEffectsTools({
  uiText:UI_TEXT,
  scene,
  showMsg,
  sfxOrb,
  partGeo:pGeo,
  orbGeo,
  impactTexture:FX_TEXTURES.impactBurst,
  ringOutTexture:FX_TEXTURES.ringOutFlash,
  getBattlePerformanceMode:()=>battlePerformanceMode
}) : null;
battleViewTools = createBattleViewTools ? createBattleViewTools({
  camera:cam,
  getBaseCameraY:()=>sceneShellTools ? sceneShellTools.getBaseCameraY() : 17,
  getBaseCameraZ:()=>sceneShellTools ? sceneShellTools.getBaseCameraZ() : 12,
  getBattleVisualTime:()=>battleVisualClock,
  getBattlePerformanceMode:()=>battlePerformanceMode,
  updateHUD
}) : null;
battleSimTools = createBattleSimTools ? createBattleSimTools({
  uiText:UI_TEXT,
  friction:FRIC,
  spinDrain:SPIN_D,
  hazardDrain:SPIN_HAZ,
  arenaRadius:AR,
  topRadius:TOP_R,
  hexPoints:HEX_PTS,
  getTimeScale:()=>timeScale,
  setTimeScale:setBattleTimeScale,
  triggerTimeDilation,
  getCamShake:()=>camShake,
  setCamShake:(next)=>{ camShake = next; },
  getPlayerTrailPositions:()=>pTrailPos,
  getEnemyTrailPositions:()=>eTrailPos,
  isCircleArena:()=>isCircleArena(),
  isHeartArena:()=>isHeartArena(),
  isHexArena:()=>isHexArena(),
  heartNearWall,
  heartWallNormal,
  heartInHaz,
  heartCrossed,
  heartRingOut,
  polygonContains,
  nearestPolygonEdgeData,
  scalePolygon,
  getBattleVisualTime:()=>battleVisualClock,
  getEnemyAiConfig:getCurrentEnemyAiConfig,
  spawnParts,
    emitClashEffect,
    emitWallImpactEffect,
    emitRingOutEffect,
    flashScreen,
    showMsg,
    showCommentary,
    sfxWall,
    sfxRingOut,
  sfxCollide,
  endRound,
  fireSkill,
  scene
}) : null;
localizationTools = createLocalizationTools ? createLocalizationTools({
  storageService,
  applyStaticText,
  updateModeUI,
  ensureStorageNotice:()=>{
    if(startupTools && typeof startupTools.ensureStorageNotice === 'function'){
      startupTools.ensureStorageNotice();
    }
  },
  getCurrentLocale:()=>currentLocale,
  setCurrentLocale:(next)=>{ currentLocale = next; }
}) : null;
if(localizationTools) localizationTools.initialize();
else {
  applyStaticText();
  updateModeUI();
}
window.addEventListener('load', attemptInitialMusicPlayback, { once:true });
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible' && !audioGesturePrimed){
    attemptInitialMusicPlayback();
  }
});
window.addEventListener('pointerdown', primeAudioFromInteraction, true);
window.addEventListener('keydown', primeAudioFromInteraction, true);
window.addEventListener('touchstart', primeAudioFromInteraction, true);

let tp,te,camShake=0,lastT=0,endLock=false;
let battleVisualClock=0;

function xyToArena(cx,cy){
  return aimLineTools ? aimLineTools.xyToArena(cx,cy) : null;
}

const drag={on:false,sx:0,sz:0,mx:0,mz:0};
function onDragStart(cx,cy){
  if(gameState!=='prepare')return;
  const p=xyToArena(cx,cy);if(!p)return;
  drag.on=true;drag.sx=p.x;drag.sz=p.z;drag.mx=p.x;drag.mz=p.z;
  if(aimLineTools) aimLineTools.showAimLine();
}
function onDragMove(cx,cy){
  if(!drag.on||gameState!=='prepare')return;
  const p=xyToArena(cx,cy);if(!p)return;
  drag.mx=p.x;drag.mz=p.z;
  const dx=drag.mx-drag.sx,dz=drag.mz-drag.sz,d=Math.sqrt(dx*dx+dz*dz)||.001;
  const sc=Math.min(d/4,1);
  if(aimLineTools) aimLineTools.setAimLine(tp.x,tp.z,tp.x+dx/d*sc*5,tp.z+dz/d*sc*5);
}
function onDragEnd(){
  if(!drag.on||gameState!=='prepare'){drag.on=false;return;}
  drag.on=false;
  if(aimLineTools) aimLineTools.hideAimLine();
  const dx=drag.mx-drag.sx,dz=drag.mz-drag.sz,d=Math.sqrt(dx*dx+dz*dz);
  if(d<.3)return;
  const spd=Math.min(d/4,1)*tp.template.spd;
  tp.vx=dx/d*spd;tp.vz=dz/d*spd;
  launch();
}
function doPlayerDash(){
  if(combatActionTools) combatActionTools.doPlayerDash();
}
function doPlayerGuard(){
  if(combatActionTools) combatActionTools.doPlayerGuard();
}
function doPlayerSkill(){
  if(combatActionTools) combatActionTools.doPlayerSkill();
}
function flashScreen(type){
  if(combatActionTools) combatActionTools.flashScreen(type);
}
function fireSkill(user,target){
  if(combatActionTools) combatActionTools.fireSkill(user,target);
}

function initRound(){
  battleVisualClock = 0;
  battlePerformanceMode.activeBattle = true;
  timeDilationHoldT = 0;
  timeDilationRecoverRate = 1.1;
  resetBattlePerfMetrics();
  clearBattleCommentary();
  if(battleSimTools && typeof battleSimTools.resetCommentary === 'function'){
    battleSimTools.resetCommentary();
  }
  if(roundFlowTools) roundFlowTools.initRound();
  syncMusicState();
}

function launch(){
  if(roundFlowTools) roundFlowTools.launch();
}

function physTick(dt){
  if(gameState!=='active' && gameState!=='roundOutro' && gameState!=='roundResult') return;
  const tickBattlePresentation = function(){
    battleVisualClock += dt;
    tickParts(dt);
    if(tp){
      updateTrail(true,pTrailPos,tp.x,tp.z,tp.alive);
    }
    if(te){
      updateTrail(false,eTrailPos,te.x,te.z,te.alive);
    }
    if(timeDilationHoldT>0){
      timeDilationHoldT = Math.max(0,timeDilationHoldT-dt);
    }else if(timeScale<1){
      timeScale=Math.min(1,timeScale+dt*timeDilationRecoverRate);
      if(timeScale>=0.999){
        timeScale = 1;
        timeDilationRecoverRate = 1.1;
      }
    }
    if(battleViewTools){
      const battleViewStartedAt = getPerfNow();
      camShake = battleViewTools.updateFrame(tp,te,dt,camShake);
      if(gameState==='active'){
        recordBattlePerfPhase('battleView', getPerfNow() - battleViewStartedAt);
      }
    }
  };
  if(gameState!=='active'){
    tickBattlePresentation();
    return;
  }
  battlePerformanceMode.activeBattle = true;
  const physTickStartedAt = getPerfNow();
  roundTimer-=dt;
  if(roundTimer<=0){roundTimer=0;endRound('time');return;}
  const ts=Math.ceil(roundTimer);
  const timerEl=document.getElementById('timer-txt');
  timerEl.textContent=ts;timerEl.classList.toggle('urgent',ts<=10);
  if(ts<=10 && Math.ceil(roundTimer+dt)>ts) sfxCountdown();
  movTop(tp,dt);if(gameState!=='active')return;
  movTop(te,dt);if(gameState!=='active')return;
  aiTick(te,tp,dt);
  checkColl(tp,te);if(gameState!=='active')return;
  tickOrbs(dt,tp,te);
  if(battleSimTools && typeof battleSimTools.tickCommentary === 'function'){
    battleSimTools.tickCommentary(tp,te,dt);
  }
  if(scratchLayerTools) scratchLayerTools.tick(tp,te,dt);
  tickBattlePresentation();
  const allOrbDead=orbObjs.length===0||orbObjs.every(o=>!o.alive);
  if(allOrbDead&&roundTimer>5&&!physTick._orbTimer){
    physTick._orbTimer=setTimeout(()=>{spawnOrbs();physTick._orbTimer=null;},9500);
  }
  recordBattlePerfPhase('physTick', getPerfNow() - physTickStartedAt);
}

function movTop(t,dt){
  if(battleSimTools) battleSimTools.movTop(t,dt);
}

function checkColl(ta,tb){
  if(battleSimTools) battleSimTools.checkColl(ta,tb);
}

function aiTick(ai,pl,dt){
  if(battleSimTools) battleSimTools.aiTick(ai,pl,dt);
}

function endRound(reason){
  if(endLock||gameState!=='active')return;
  battlePerformanceMode.activeBattle = false;
  if(roundFlowTools) roundFlowTools.endRound(reason);
}

function showMatchResult(){
  gameState='matchResult';
  battlePerformanceMode.activeBattle = false;
  clearBattleCommentary();
  syncMusicState();
  if(matchFlowTools) matchFlowTools.showMatchResult();
}

function resetMatch(options){
  if(matchFlowTools) matchFlowTools.resetMatch(options);
}

function getBaseReward(){
  return matchFlowTools ? matchFlowTools.getBaseReward() : 8;
}

function grantMatchReward(multiplier){
  if(matchFlowTools) matchFlowTools.grantMatchReward(multiplier);
}

function handleDoubleReward(){
  if(matchFlowTools) matchFlowTools.handleDoubleReward();
}

function handleContinueReward(){
  if(matchFlowTools) matchFlowTools.handleContinueReward();
}

function handleShare(){
  if(matchFlowTools) matchFlowTools.handleShare();
}

function showMsg(txt,dur,tone){
  if(messageUiTools) messageUiTools.showMsg(txt,dur,tone);
}

function showCommentary(key,tokens,options){
  return battleCommentaryTools
    ? battleCommentaryTools.showCommentary(key,tokens,options)
    : false;
}

function clearBattleCommentary(){
  if(battleCommentaryTools) battleCommentaryTools.clear();
}

function updateHUD(){
  if(uiShellTools) uiShellTools.updateHUD();
}

function refreshPips(){
  if(uiShellTools) uiShellTools.refreshPips();
}

function handleEnterBattle(){
  if(uiEntryTools) uiEntryTools.handleEnterBattle();
}


function selectPlayerTopById(topId){
  if(uiEntryTools) uiEntryTools.selectPlayerTopById(topId);
}

function startFight(){
  if(uiEntryTools) uiEntryTools.startFight();
}

function beginFight(){
  hideLoadoutOverlay();
  if(uiShellTools) uiShellTools.showBattleHud();
  initTrails();
  initRound();
  if(uiShellTools){
    const playerTop = TOPS[playerTopId] || { name:'TOP' };
    const enemyTop = TOPS[enemyTopId] || { name:'TOP' };
    const node = getCurrentChallengeNode();
    uiShellTools.showBattleIntro({
      playerTopLabel:playerTop.name || 'TOP',
      enemyTopLabel:enemyTop.name || 'TOP',
      arenaLabel:getArenaLabel(currentArena),
      roadRankLabel:currentMode==='challenge' ? (getCurrentRoadRank().label || null) : null,
      stageLabel:currentMode==='challenge' && node
        ? ((UI_TEXT.battleIntroNodeLabel || 'NODE')+' '+(activeChallengeIndex + 1)+' - '+node.name)
        : (UI_TEXT.battleIntroQuickStage || UI_TEXT.quickMode || 'QUICK BATTLE')
    });
  }
}

function handleSwapRematch(){
  if(uiEntryTools) uiEntryTools.handleSwapRematch();
}

function setMode(mode){
  if(uiEntryTools) uiEntryTools.setMode(mode);
}

function selectArenaByIndex(index){
  if(uiEntryTools) uiEntryTools.selectArenaByIndex(index);
}

const actSwap=document.getElementById('act-swap');
actSwap.addEventListener('touchstart',e=>{e.preventDefault();doSwap();},{passive:false});
function doSwap(){
  if(gameState!=='prepare')return;
  if(tp&&tp.mesh){scene.remove(tp.mesh);tp.mesh=null;}
  if(te&&te.mesh){scene.remove(te.mesh);te.mesh=null;}
  pTrailPos.length=0;eTrailPos.length=0;
  battlePerformanceMode.activeBattle = false;
  clearBattleCommentary();
  if(uiShellTools) uiShellTools.hideBattleHud();
  showLoadoutOverlay();
  updateModeUI();
  syncMusicState();
}

function updateSkillIcon(){
  if(uiShellTools) uiShellTools.updateSkillIcon();
}

if(uiEntryTools) uiEntryTools.installWindowBindings();
if(combatActionTools) combatActionTools.installInputBindings();

let prevT=0;
function loop(t){
  requestAnimationFrame(loop);
  const rawDt=Math.min((t-prevT)/1000,.05);prevT=t;
  const dt=rawDt*timeScale;
  const battleFrameStartedAt = gameState==='active' ? getPerfNow() : 0;
  physTick(dt);
  if(homeTopShowcaseTools) homeTopShowcaseTools.tick(rawDt);
  if(quickBattlePreviewTools) quickBattlePreviewTools.tick(rawDt);
  const renderStartedAt = gameState==='active' ? getPerfNow() : 0;
  renderer.render(scene,cam);
  if(gameState==='active'){
    recordBattlePerfPhase('renderer', getPerfNow() - renderStartedAt);
    recordBattleFrame(getPerfNow() - battleFrameStartedAt);
  }
}

function renderGameToText(){
  return debugRuntimeTools ? debugRuntimeTools.renderGameToText() : '{}';
}

debugRuntimeTools = createDebugRuntimeTools ? createDebugRuntimeTools({
  storageService,
  analyticsService,
  debugService,
  rewardService,
  shareService,
  economy:ECONOMY,
  tops:TOPS,
  arenas:ARENAS,
  researchTracks:RESEARCH,
  roadRanks:ROAD_RANKS,
  challengeRoad:CHALLENGE_ROAD,
  enemyPresets:ENEMY_PRESETS,
  getSave,
  saveProgress,
  addCurrency,
  getResearchBonuses,
  getUnlockedRoadRankIndex,
  getSelectedRoadRankIndex,
  getCurrentRoadRank,
  unlockArenaById,
  unlockTopById,
  setChallengeProgress,
  resetDebugProgress,
  getArenaLabel,
  getCurrentChallengeNode,
  getCurrentMode:()=>currentMode,
  getCurrentArena:()=>currentArena,
  getPlayerTopId:()=>playerTopId,
  getEnemyTopId:()=>enemyTopId,
  getCurrentEnemyPresetId:()=>currentEnemyPresetId,
  getCurrentEnemyPresetLabel,
  getCurrentEnemyAiConfig,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  getChallengeContinueUsed:()=>challengeContinueUsed,
  getActiveModifier:()=>activeModifier,
  getScore:()=>score,
  getRound:()=>round,
  getRoundTimer:()=>roundTimer,
  getGameState:()=>gameState,
  getTimeScale:()=>timeScale,
  getTp:()=>tp,
  getTe:()=>te,
  getOrbObjects:()=>orbObjs,
  getSessionTrialArenaIds:()=>sessionTrialArenaIds,
  getHintText:()=>document.getElementById('hint-bar').textContent,
  getMessageText:()=>document.getElementById('msg-txt').textContent,
  getBattlePerfMetrics:()=>battlePerfMetrics,
  getBattlePerformanceMode:()=>battlePerformanceMode,
  physTick,
  renderer,
  scene,
  camera:cam,
  syncAfterReset:syncDebugPanel
}) : null;
startupTools = createStartupTools ? createStartupTools({
  debugRuntimeTools,
  storageService,
  uiText:UI_TEXT,
  getRenderGameToText:()=>renderGameToText,
  setAdvanceTime:(handler)=>{ window.advanceTime = handler; },
  setActiveChallengeIndex:(next)=>{ activeChallengeIndex = next; },
  maxChallengeIndex:CHALLENGE_ROAD.length - 1,
  updateModeUI,
  syncDebugPanel,
  startAnimationLoop:()=>{
    requestAnimationFrame((t)=>{
      prevT=t;
      requestAnimationFrame(loop);
    });
  }
}) : null;
if(startupTools) startupTools.initialize();
attemptInitialMusicPlayback();





