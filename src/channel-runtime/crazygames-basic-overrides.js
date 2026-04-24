(function(){
  window.__spinClashProviderOverrides = null;
  const root = window.SpinClash || (window.SpinClash = {});
  root.config = root.config || {};
  const textLocales = root.config.textLocales || {};

  function applyOverrides(text, locale){
    if(!text || typeof text !== 'object'){
      return;
    }
    if(locale === 'zh'){
      text.homePathNote = '主推进路线：节点奖励、检查点、永久解锁都集中在征途。';
      text.homeQuickNote = '这里只适合打一局短战。想更快拿 SCRAP 和新场地，优先走征途。';
      text.quickTopPathAction = '去征途解锁';
      text.quickTopEarnAction = '去征途赚取';
      text.quickStartArenaLockedButton = '前往征途';
      text.quickStartArenaLockedHint = '征途是更快拿到 SCRAP 的路线。继续推进征途，或先攒够 {cost} SCRAP 直接解锁这个场地。';
      text.rewardTrialUnavailable = '这个场地还未解锁。继续推进征途会更快拿到 SCRAP 和永久解锁。';
      text.resultGuidanceQuickWin = '这局奖励先收下。想更快解锁新场地和新陀螺，下一步优先推进征途。';
      text.resultGuidanceQuickLoss = '基础奖励照常到账。对 CrazyGames 版本来说，征途才是更快拿 SCRAP、检查点和永久解锁的主线。';
      text.resultGuidanceChallengeRetry = '这次征途在这里停下，但奖励仍然有效。把开局节奏调顺，再从同一节点继续推进。';
      text.challengeGoalAdvance = '拿下这一节点就能领到结算、推进下一战，并更快靠近下一个永久解锁。';
      text.challengeGoalRetry = '这个节点就是当前门槛。把开局和碰撞节奏调顺，就能重新回到主推进路线。';
      return;
    }
    if(locale === 'ja'){
      text.homePathNote = '主進行ルート。ノード報酬、チェックポイント、恒久解放はここに集約される。';
      text.homeQuickNote = 'こちらは短い一戦向け。SCRAP と新アリーナを早く取りたいなら、まずロードを進める。';
      text.quickTopPathAction = 'ロードで解放';
      text.quickTopEarnAction = 'ロードで稼ぐ';
      text.quickStartArenaLockedButton = 'ロードへ';
      text.quickStartArenaLockedHint = 'SCRAP を最も早く稼げるのは Championship Path。ロードを進めるか、{cost} SCRAP を貯めてこのアリーナを直接解放する。';
      text.rewardTrialUnavailable = 'このアリーナはまだ未解放。Championship Path を進める方が、SCRAP と恒久解放への近道になる。';
      text.resultGuidanceQuickWin = 'この報酬は受け取れる。新アリーナや新トップを早く開けたいなら、次は Championship Path を優先する。';
      text.resultGuidanceQuickLoss = '基本報酬はそのまま入る。CrazyGames 版では、SCRAP・チェックポイント・恒久解放は Championship Path が主ルート。';
      text.resultGuidanceChallengeRetry = '今回はここで止まるが、報酬は残る。初動と当て方を整え、同じノードからもう一度押し返す。';
      text.challengeGoalAdvance = 'このノードを抜けば報酬を受け取り、次の対戦へ進み、次の恒久解放へ近づける。';
      text.challengeGoalRetry = '今のノードが関門。初動と衝突リズムを整えれば、主進行ルートへ戻れる。';
      return;
    }
    text.homePathNote = 'Primary progression route: node rewards, checkpoints, and permanent unlocks all live here.';
    text.homeQuickNote = 'Short duel only. Championship Path is the faster route for SCRAP and new arenas.';
    text.quickTopPathAction = 'UNLOCK IN PATH';
    text.quickTopEarnAction = 'EARN IN PATH';
    text.quickStartArenaLockedButton = 'GO TO PATH';
    text.quickStartArenaLockedHint = 'Championship Path is the fastest route to more SCRAP. Push deeper there, or earn {cost} SCRAP to buy this arena outright.';
    text.rewardTrialUnavailable = 'This arena is still locked. Championship Path is the faster route to more SCRAP and permanent unlocks.';
    text.resultGuidanceQuickWin = 'Take the payout, but move back to Championship Path when you want faster SCRAP and permanent unlocks.';
    text.resultGuidanceQuickLoss = 'You still keep the payout. On CrazyGames, Championship Path is the main route for SCRAP, checkpoints, and permanent unlocks.';
    text.resultGuidanceChallengeRetry = 'This Path run stops here, but the payout still counts. Clean up the opener and push the same node again.';
    text.challengeGoalAdvance = 'Clear this node to claim the payout, unlock the next duel, and move faster toward the next permanent unlock.';
    text.challengeGoalRetry = 'This node is the gate. A cleaner opener and better collision timing put you back on the main progression route.';
  }

  Object.keys(textLocales).forEach(function(locale){
    applyOverrides(textLocales[locale], locale);
  });
  applyOverrides(root.config.text || {}, document && document.documentElement ? document.documentElement.lang : 'en');
})();
