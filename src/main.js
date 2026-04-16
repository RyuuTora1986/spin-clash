'use strict';

function showRuntimeError(message){
  if(runtimeAudioTools) runtimeAudioTools.showRuntimeError(message);
}

function initAudioSafely(){
  if(runtimeAudioTools) runtimeAudioTools.initAudioSafely();
}

function startMusic(){
  if(runtimeAudioTools) runtimeAudioTools.startMusic();
}
function stopMusic(){
  if(runtimeAudioTools) runtimeAudioTools.stopMusic();
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

const pTrailPos=[],eTrailPos=[];

const root = window.SpinClash || {};
const TOPS = (root.config && root.config.tops) || [];
const ARENAS = (root.config && root.config.arenas) || [];
const MODIFIERS = (root.config && root.config.modifiers) || {};
const CHALLENGE_ROAD = (root.config && root.config.challengeRoad) || [];
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
const createAimLineTools = root.createAimLineTools || null;
const createSceneShellTools = root.createSceneShellTools || null;
const createMessageUiTools = root.createMessageUiTools || null;
const createBattleViewTools = root.createBattleViewTools || null;
const createBattleSimTools = root.createBattleSimTools || null;

let enemyTopId=1;
let currentMode='quick';
let activeChallengeIndex=0;
let lastRoundEndReason=null;
let matchStartedAt=null;
let challengeContinueUsed=false;
let roundRewardGranted=false;
let doubleRewardUsed=false;
let pendingContinue=false;
let currentArena=0;
let selectedArenaIndex=0;
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
let aimLineTools=null;
let sceneShellTools=null;
let messageUiTools=null;
let battleViewTools=null;
let battleSimTools=null;
runtimeAudioTools = createRuntimeAudioTools ? createRuntimeAudioTools() : null;
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
}


const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
document.getElementById('gc').appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010108);
scene.fog=new THREE.Fog(0x010108,22,55);

const cam=new THREE.PerspectiveCamera(50,1,0.1,100);
cam.position.set(0,17,12);cam.lookAt(0,0,0);
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
  getEnemyTopId:()=>enemyTopId
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
  getGameState:()=>gameState
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
  window.addEventListener('resize',()=>sceneShellTools.onResize());
}
messageUiTools = createMessageUiTools ? createMessageUiTools() : null;

function mkSpotTex(bgCol,dotCol,patId){
  return topRenderTools ? topRenderTools.mkSpotTex(bgCol,dotCol,patId) : null;
}

function mkTop(color,emi,typeId,isPlayer){
  return topRenderTools ? topRenderTools.mkTop(color,emi,typeId,isPlayer) : new THREE.Group();
}

const partPool=[];
const pGeo=new THREE.SphereGeometry(.07,5,5);
function spawnParts(x,z,color,n=8){
  if(battleEffectsTools) battleEffectsTools.spawnParts(partPool,x,z,color,n);
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
  return roundFlowTools
    ? roundFlowTools.mkTopData(template,isPlayer)
    : {mesh:null,isPlayer,x:0,z:isPlayer?5.0:-5.0,vx:0,vz:0,hp:template.hp,maxHp:template.hp,spin:template.maxSpin,maxSpin:template.maxSpin,burst:0,dashCD:0,DASH_CD:2.5,skillCD:0,SKILL_CD:8,dashing:false,dashT:0,shielded:false,shieldT:0,phantom:false,phantomT:0,tiltX:0,tiltZ:0,tiltVX:0,tiltVZ:0,wallCD:0,alive:true,template};
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
  return storageService ? storageService.get() : { currency:0, challenge:{ unlockedNodeIndex:0, completedNodes:[] }, sessions:0, analytics:[] };
};
const saveProgress = progressionTools ? progressionTools.saveProgress : function(mutator){
  if(!storageService) return getSave();
  return storageService.transact(mutator);
};
const setChallengeProgress = progressionTools ? progressionTools.setChallengeProgress : function(){};
const addCurrency = progressionTools ? progressionTools.addCurrency : function(){};
const unlockArenaById = progressionTools ? progressionTools.unlockArenaById : function(){};
const unlockTopById = progressionTools ? progressionTools.unlockTopById : function(){};
const resetDebugProgress = progressionTools ? progressionTools.resetDebugProgress : function(){};
loadoutUiTools = createLoadoutUiTools ? createLoadoutUiTools({
  uiText:UI_TEXT,
  tops:TOPS,
  arenas:ARENAS,
  modifiers:MODIFIERS,
  challengeRoad:CHALLENGE_ROAD,
  analyticsService,
  getSave,
  saveProgress,
  getCurrentMode:()=>currentMode,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  getSelectedArenaIndex:()=>selectedArenaIndex,
  getPlayerTopId:()=>playerTopId,
  getSessionTrialArenaIds:()=>sessionTrialArenaIds,
  setCurrentArena:(index)=>{ currentArena = index; },
  rewardService,
  showMsg,
  refresh:refreshDebugState
}) : null;
let gameState='title',playerTopId=0,score=[0,0],round=1,roundTimer=30;
uiShellTools = createUiShellTools ? createUiShellTools({
  tops:TOPS,
  getSelectedArenaIndex:()=>selectedArenaIndex,
  getScore:()=>score,
  getPlayerTopId:()=>playerTopId,
  getTp:()=>tp,
  getTe:()=>te,
  skillIcons:{'Fly Charge':'FC','Shield':'SH','Phantom':'PH'}
}) : null;
matchFlowTools = createMatchFlowTools ? createMatchFlowTools({
  uiText:UI_TEXT,
  tops:TOPS,
  challengeRoad:CHALLENGE_ROAD,
  rewardService,
  shareService,
  analyticsService,
  getScore:()=>score,
  getRound:()=>round,
  setScore:(next)=>{ score = next; },
  setRound:(next)=>{ round = next; },
  getCurrentMode:()=>currentMode,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  setActiveChallengeIndex:(next)=>{ activeChallengeIndex = next; },
  getCurrentArena:()=>currentArena,
  getPlayerTopId:()=>playerTopId,
  getEnemyTopId:()=>enemyTopId,
  getActiveModifier:()=>activeModifier,
  getCurrentChallengeNode,
  getArenaLabel,
  getArenaConfig,
  getSave,
  saveProgress,
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
  tops:TOPS,
  getCurrentMode:()=>currentMode,
  setCurrentMode:(next)=>{ currentMode = next; },
  getActiveChallengeIndex:()=>activeChallengeIndex,
  setActiveChallengeIndex:(next)=>{ activeChallengeIndex = next; },
  getCurrentArena:()=>currentArena,
  setCurrentArena:(next)=>{ currentArena = next; },
  getSelectedArenaIndex:()=>selectedArenaIndex,
  setSelectedArenaIndex:(next)=>{ selectedArenaIndex = next; },
  getPlayerTopId:()=>playerTopId,
  setPlayerTopId:(next)=>{ playerTopId = next; },
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
  showRuntimeError,
  updateSkillIcon,
  attemptArenaAccess,
  attemptTopAccess:(index)=>loadoutUiTools ? loadoutUiTools.attemptTopAccess(index) : Promise.resolve(true),
  showMsg,
  beginFight,
  doSwap,
  doPlayerDash,
  doPlayerSkill,
  resetMatch,
  handleDoubleReward,
  handleContinueReward,
  handleShare
}) : null;
combatActionTools = createCombatActionTools ? createCombatActionTools({
  renderer,
  getGameState:()=>gameState,
  getTp:()=>tp,
  getTe:()=>te,
  showMsg,
  sfxDash,
  sfxSkill,
  spawnParts,
  launch,
  onDragStart,
  onDragMove,
  onDragEnd
}) : null;
roundFlowTools = createRoundFlowTools ? createRoundFlowTools({
  tops:TOPS,
  analyticsService,
  getCurrentMode:()=>currentMode,
  getCurrentChallengeNode,
  getModifierById,
  getArenaLabel,
  getActiveChallengeIndex:()=>activeChallengeIndex,
  getCurrentArena:()=>currentArena,
  setCurrentArena:(next)=>{ currentArena = next; },
  setSelectedArenaIndex:(next)=>{ selectedArenaIndex = next; },
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
  setTimeScale:(next)=>{ timeScale = next; },
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
  scene,
  showMsg,
  sfxOrb,
  partGeo:pGeo,
  orbGeo
}) : null;
battleViewTools = createBattleViewTools ? createBattleViewTools({
  camera:cam,
  getBaseCameraY:()=>sceneShellTools ? sceneShellTools.getBaseCameraY() : 17,
  getBaseCameraZ:()=>sceneShellTools ? sceneShellTools.getBaseCameraZ() : 12,
  updateHUD
}) : null;
battleSimTools = createBattleSimTools ? createBattleSimTools({
  friction:FRIC,
  spinDrain:SPIN_D,
  hazardDrain:SPIN_HAZ,
  arenaRadius:AR,
  topRadius:TOP_R,
  hexPoints:HEX_PTS,
  getTimeScale:()=>timeScale,
  setTimeScale:(next)=>{ timeScale = next; },
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
  spawnParts,
  showMsg,
  sfxWall,
  sfxRingOut,
  sfxCollide,
  endRound,
  fireSkill,
  scene
}) : null;
applyStaticText();
updateModeUI();

let tp,te,camShake=0,lastT=0,endLock=false;

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
function doPlayerSkill(){
  if(combatActionTools) combatActionTools.doPlayerSkill();
}
function flashScreen(type){
  if(combatActionTools) combatActionTools.flashScreen(type);
}
const SK_ICONS={'Fly Charge':'FC','Shield':'SH','Phantom':'PH'};
function fireSkill(user,target){
  if(combatActionTools) combatActionTools.fireSkill(user,target);
}

function initRound(){
  if(roundFlowTools) roundFlowTools.initRound();
}

function launch(){
  if(roundFlowTools) roundFlowTools.launch();
}

function physTick(dt){
  if(gameState!=='active')return;
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
  tickOrbs(dt,tp,te);tickParts(dt);
  if(scratchLayerTools) scratchLayerTools.tick(tp,te,dt);
  updateTrail(true,pTrailPos,tp.x,tp.z,tp.alive);
  updateTrail(false,eTrailPos,te.x,te.z,te.alive);
  if(timeScale<1) timeScale=Math.min(1,timeScale+dt*1.1);
  const allOrbDead=orbObjs.length===0||orbObjs.every(o=>!o.alive);
  if(allOrbDead&&roundTimer>5&&!physTick._orbTimer){
    physTick._orbTimer=setTimeout(()=>{spawnOrbs();physTick._orbTimer=null;},9500);
  }
  if(battleViewTools) camShake = battleViewTools.updateFrame(tp,te,dt,camShake);
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
  if(roundFlowTools) roundFlowTools.endRound(reason);
}

function showMatchResult(){
  gameState='matchResult';
  if(matchFlowTools) matchFlowTools.showMatchResult();
}

function resetMatch(){
  if(matchFlowTools) matchFlowTools.resetMatch();
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

function showMsg(txt,dur){
  if(messageUiTools) messageUiTools.showMsg(txt,dur);
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
  if(uiShellTools) uiShellTools.hideBattleHud();
  showLoadoutOverlay();
  updateModeUI();
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
  physTick(dt);
  renderer.render(scene,cam);
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
  tops:TOPS,
  arenas:ARENAS,
  getSave,
  saveProgress,
  addCurrency,
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





