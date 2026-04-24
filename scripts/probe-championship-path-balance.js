const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '..');

const OPENERS = {
  center: {
    id: 'center',
    start: { x: 0.50, y: 0.82 },
    end: { x: 0.50, y: 0.64 }
  },
  left: {
    id: 'left',
    start: { x: 0.47, y: 0.82 },
    end: { x: 0.42, y: 0.65 }
  },
  right: {
    id: 'right',
    start: { x: 0.53, y: 0.82 },
    end: { x: 0.58, y: 0.65 }
  },
  hard_left: {
    id: 'hard_left',
    start: { x: 0.50, y: 0.84 },
    end: { x: 0.34, y: 0.62 }
  },
  hard_right: {
    id: 'hard_right',
    start: { x: 0.50, y: 0.84 },
    end: { x: 0.66, y: 0.62 }
  }
};

function parseArgs(argv) {
  const args = {
    url: 'https://play.hakurokudo.com/',
    locale: 'en',
    outDir: '',
    headless: true,
    width: 1440,
    height: 960,
    baselineSamples: 3,
    sweepSamples: 2,
    stepMs: 180,
    maxActiveMs: 60000,
    nodeIds: []
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--url' && next) {
      args.url = next;
      index += 1;
      continue;
    }
    if (token === '--locale' && next) {
      args.locale = next;
      index += 1;
      continue;
    }
    if (token === '--out-dir' && next) {
      args.outDir = next;
      index += 1;
      continue;
    }
    if (token === '--baseline-samples' && next) {
      args.baselineSamples = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--sweep-samples' && next) {
      args.sweepSamples = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--step-ms' && next) {
      args.stepMs = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--max-active-ms' && next) {
      args.maxActiveMs = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--node-ids' && next) {
      args.nodeIds = next
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (token === '--headed') {
      args.headless = false;
      continue;
    }
  }

  return args;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(getValue, predicate, { timeoutMs = 20000, intervalMs = 120 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await getValue();
    if (predicate(value)) return value;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms.`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampIndex(value, maxIndex) {
  return Math.max(0, Math.min(maxIndex, Math.floor(value)));
}

function buildSaveForNode(baseSave, nodeIndex, locale) {
  const save = clone(baseSave);
  const checkpointNodeIndex = nodeIndex >= 6 ? 5 : nodeIndex >= 3 ? 2 : 0;
  save.challenge = save.challenge || {};
  save.challenge.unlockedNodeIndex = nodeIndex;
  save.challenge.checkpointNodeIndex = checkpointNodeIndex;
  save.challenge.completedNodes = Array.from({ length: nodeIndex }, (_, index) => index);
  save.challenge.lastNodeIndex = nodeIndex;
  save.challenge.selectedRankIndex = 0;
  save.challenge.unlockedRankIndex = 0;
  save.settings = save.settings || {};
  save.settings.locale = locale;
  save.analytics = [];
  save.currency = 0;
  save.research = {
    levels: {
      spin_core: 0,
      guard_frame: 0,
      burst_relay: 0
    }
  };
  save.unlocks = {
    arenas: ['circle_bowl', 'heart_bowl'],
    tops: ['impact', 'armor']
  };
  return save;
}

function parseState(raw) {
  return JSON.parse(raw || '{}');
}

async function getState(page) {
  const raw = await page.evaluate(() => {
    return typeof window.render_game_to_text === 'function' ? window.render_game_to_text() : '{}';
  });
  return parseState(raw);
}

function pickActions(state) {
  const actions = [];
  const player = state.player;
  const enemy = state.enemy;
  if (!player || !enemy || !player.alive || !enemy.alive) {
    return actions;
  }

  const dx = enemy.x - player.x;
  const dz = enemy.z - player.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const enemySpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vz * enemy.vz);
  const playerSpeed = Math.sqrt(player.vx * player.vx + player.vz * player.vz);
  const playerRadius = Math.sqrt(player.x * player.x + player.z * player.z);
  const relativeVx = enemy.vx - player.vx;
  const relativeVz = enemy.vz - player.vz;
  const closingSpeed = dist > 0.001 ? ((relativeVx * dx) + (relativeVz * dz)) / dist : 0;

  if (!player.guarding && player.guardCD <= 0.01) {
    const edgeDanger = playerRadius > 5.9 && dist < 2.3;
    const pressureDanger = dist < 2.1 && closingSpeed < -8.5 && enemySpeed > 11.5;
    if (edgeDanger || pressureDanger) {
      actions.push('guard');
      return actions;
    }
  }

  if (player.dashCD <= 0.01) {
    const chaseWindow = dist > 2.1 && dist < 5.5;
    const enemyAhead = enemy.z > player.z - 0.2;
    const playerStable = playerSpeed < 15.5;
    if (chaseWindow && enemyAhead && playerStable) {
      actions.push('dash');
    }
  }

  if (player.skillCD <= 0.01 && player.burst >= 100 && dist < 3.2) {
    actions.push('skill');
  }

  return actions;
}

async function dispatchLaunch(page, opener) {
  return page.evaluate((launchOpener) => {
    const canvas = document.querySelector('#gc canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const start = {
      x: rect.left + rect.width * launchOpener.start.x,
      y: rect.top + rect.height * launchOpener.start.y
    };
    const end = {
      x: rect.left + rect.width * launchOpener.end.x,
      y: rect.top + rect.height * launchOpener.end.y
    };

    function fire(type, point) {
      canvas.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: type === 'mouseup' ? 0 : 1,
        clientX: point.x,
        clientY: point.y
      }));
    }

    fire('mousedown', start);
    fire('mousemove', end);
    fire('mouseup', end);

    return { start, end };
  }, opener);
}

async function applyActions(page, actions) {
  if (!actions.length) return;
  await page.evaluate((actionList) => {
    actionList.forEach((action) => {
      if (window.__spinClashUI && typeof window.__spinClashUI[action] === 'function') {
        window.__spinClashUI[action]();
      }
    });
  }, actions);
}

async function readRoundOverlay(page) {
  return page.evaluate(() => ({
    title: document.getElementById('rd-txt') ? document.getElementById('rd-txt').textContent.trim() : '',
    detail: document.getElementById('rd-detail') ? document.getElementById('rd-detail').textContent.trim() : '',
    cause: document.getElementById('rd-cause') ? document.getElementById('rd-cause').textContent.trim() : '',
    next: document.getElementById('rd-next') ? document.getElementById('rd-next').textContent.trim() : '',
    adjust: document.getElementById('rd-adjust') ? document.getElementById('rd-adjust').textContent.trim() : ''
  }));
}

async function readMatchOverlay(page) {
  return page.evaluate(() => ({
    title: document.getElementById('mt-txt') ? document.getElementById('mt-txt').textContent.trim() : '',
    sub: document.getElementById('mt-sub') ? document.getElementById('mt-sub').textContent.trim() : '',
    meta: document.getElementById('mt-meta') ? document.getElementById('mt-meta').textContent.trim() : '',
    breakdown: document.getElementById('mt-breakdown') ? document.getElementById('mt-breakdown').textContent.trim() : '',
    next: document.getElementById('mt-next') ? document.getElementById('mt-next').textContent.trim() : '',
    guidance: document.getElementById('mt-guidance') ? document.getElementById('mt-guidance').textContent.trim() : ''
  }));
}

function normalizeEndReason(detailText) {
  const raw = String(detailText || '').toLowerCase();
  if (raw.includes('ring out')) return 'ringout';
  if (raw.includes('spin out')) return 'spinout';
  if (raw.includes('hp break')) return 'hpbreak';
  if (raw.includes('time out')) return 'timeout';
  return raw ? raw.replace(/[^a-z0-9]+/g, '_') : 'unknown';
}

async function prepareNode(page, baseSave, node, locale) {
  const save = buildSaveForNode(baseSave, node.index, locale);
  await page.evaluate(({ saveJson }) => {
    window.SpinClash.services.storage.import(saveJson);
  }, {
    saveJson: JSON.stringify(save)
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });

  await waitFor(
    () => page.evaluate(() => ({
      hasUI: !!window.__spinClashUI,
      hasRender: typeof window.render_game_to_text === 'function',
      hasAdvance: typeof window.advanceTime === 'function'
    })),
    (value) => value.hasUI && value.hasRender && value.hasAdvance,
    { timeoutMs: 30000 }
  );

  await page.evaluate((localeCode) => {
    window.__spinClashUI.setLocale(localeCode);
    window.__spinClashUI.goPath();
    window.__spinClashUI.selectTop(0);
  }, locale);

  await waitFor(
    () => getState(page),
    (state) => state.selectedMode === 'challenge'
      && state.overlays
      && state.overlays.loadout === true
      && state.progression
      && state.progression.activeChallengeIndex === node.index,
    { timeoutMs: 15000 }
  );

  await page.evaluate(() => {
    window.__spinClashUI.startFight();
  });

  await waitFor(
    () => getState(page),
    (state) => state.mode === 'prepare'
      && state.selectedMode === 'challenge'
      && state.progression
      && state.progression.activeChallengeIndex != null,
    { timeoutMs: 12000 }
  );
}

async function runMatch(page, baseSave, node, opener, options) {
  await prepareNode(page, baseSave, node, options.locale);

  let lastLaunchedRound = -1;
  let activeMs = 0;
  const rounds = [];
  const seenRoundKeys = new Set();
  let guardLoops = 0;

  while (guardLoops < 1200) {
    guardLoops += 1;
    const state = await getState(page);

    if (state.overlays && state.overlays.matchResult) {
      const matchOverlay = await readMatchOverlay(page);
      return {
        nodeId: node.id,
        nodeIndex: node.index,
        openerId: opener.id,
        win: state.score.player > state.score.enemy,
        score: clone(state.score),
        rounds,
        activeMs,
        matchOverlay,
        state
      };
    }

    if (state.overlays && state.overlays.roundResult) {
      const roundKey = `${state.round}:${state.score.player}-${state.score.enemy}`;
      if (!seenRoundKeys.has(roundKey)) {
        seenRoundKeys.add(roundKey);
        const roundOverlay = await readRoundOverlay(page);
        rounds.push({
          round: state.round,
          score: clone(state.score),
          title: roundOverlay.title,
          detail: roundOverlay.detail,
          cause: roundOverlay.cause,
          adjust: roundOverlay.adjust,
          endReason: normalizeEndReason(roundOverlay.detail)
        });
      }
      await sleep(2850);
      continue;
    }

    if (state.mode === 'prepare') {
      if (state.round !== lastLaunchedRound) {
        await dispatchLaunch(page, opener);
        lastLaunchedRound = state.round;
        await sleep(120);
      } else {
        await sleep(80);
      }
      continue;
    }

    if (state.mode === 'active') {
      const actions = pickActions(state);
      await applyActions(page, actions);
      await page.evaluate((step) => {
        window.advanceTime(step);
      }, options.stepMs);
      activeMs += options.stepMs;
      if (activeMs > options.maxActiveMs) {
        throw new Error(`Match exceeded max active time on ${node.id} with opener ${opener.id}.`);
      }
      continue;
    }

    await sleep(80);
  }

  throw new Error(`Probe loop bailed out on ${node.id} with opener ${opener.id}.`);
}

function summarizeMatches(matches) {
  const total = matches.length;
  const wins = matches.filter((entry) => entry.win).length;
  const losses = matches.filter((entry) => !entry.win);
  const lossRoundReasons = {};
  const allRoundReasons = {};
  let shortestLossMs = Infinity;
  let averageActiveMs = 0;
  let averageLossMs = 0;

  matches.forEach((entry) => {
    averageActiveMs += entry.activeMs;
    entry.rounds.forEach((roundEntry) => {
      allRoundReasons[roundEntry.endReason] = (allRoundReasons[roundEntry.endReason] || 0) + 1;
    });
  });

  losses.forEach((entry) => {
    averageLossMs += entry.activeMs;
    shortestLossMs = Math.min(shortestLossMs, entry.activeMs);
    const finalRound = entry.rounds[entry.rounds.length - 1];
    const finalReason = finalRound ? finalRound.endReason : 'unknown';
    lossRoundReasons[finalReason] = (lossRoundReasons[finalReason] || 0) + 1;
  });

  return {
    sample: total,
    wins,
    losses: total - wins,
    winRate: total ? wins / total : 0,
    averageActiveSec: total ? averageActiveMs / total / 1000 : 0,
    averageLossSec: losses.length ? averageLossMs / losses.length / 1000 : 0,
    shortestLossSec: Number.isFinite(shortestLossMs) ? shortestLossMs / 1000 : null,
    lossRoundReasons,
    allRoundReasons
  };
}

function selectSweepNodes(baselineResults) {
  return baselineResults.filter((entry) => {
    const ringoutShare = entry.summary.losses > 0
      ? (entry.summary.lossRoundReasons.ringout || 0) / entry.summary.losses
      : 0;
    return entry.summary.winRate < 0.34
      || (
        entry.summary.winRate < 0.5
        && ringoutShare >= 0.66
        && entry.summary.averageLossSec > 0
        && entry.summary.averageLossSec <= 11
      );
  });
}

function classifyNode(node, baselineSummary, openerSummaries) {
  const bestOpener = openerSummaries
    .slice()
    .sort((left, right) => {
      if (right.summary.winRate !== left.summary.winRate) {
        return right.summary.winRate - left.summary.winRate;
      }
      return left.summary.averageActiveSec - right.summary.averageActiveSec;
    })[0];
  const viableOpeners = openerSummaries.filter((entry) => entry.summary.winRate >= 0.5).length;
  const solutionWidthScore = openerSummaries.length ? viableOpeners / openerSummaries.length : 0;
  const ringoutShare = baselineSummary.losses > 0
    ? (baselineSummary.lossRoundReasons.ringout || 0) / baselineSummary.losses
    : 0;

  let classification = 'stable';
  let recommendation = 'Keep current structure and monitor with larger sample sizes.';

  if (
    baselineSummary.winRate < 0.34
    && bestOpener
    && bestOpener.summary.winRate >= 0.67
    && solutionWidthScore <= 0.4
  ) {
    classification = 'narrow_solution_trap';
    recommendation = 'Redesign the node itself before touching shared archetype numbers.';
  } else if (baselineSummary.winRate < 0.34) {
    classification = node.tier === 'boss' || node.tier === 'final'
      ? 'overtuned_boss_spike'
      : 'broad_difficulty_spike';
    recommendation = node.tier === 'boss' || node.tier === 'final'
      ? 'Reduce checkpoint boss pressure or widen recovery windows.'
      : 'Reduce pressure or add recovery room without creating a single hidden correct opener.';
  } else if (baselineSummary.winRate < 0.5 && ringoutShare >= 0.66 && solutionWidthScore <= 0.4) {
    classification = 'borderline_narrow';
    recommendation = 'Widen the solution space before adding more raw pressure later in the road.';
  } else if ((node.tier === 'boss' || node.tier === 'final') && baselineSummary.winRate <= 0.55) {
    classification = 'acceptable_boss_pressure';
    recommendation = 'Keep as a boss spike for now, but only if the surrounding nodes are smoother.';
  }

  return {
    classification,
    recommendation,
    bestOpener: bestOpener ? bestOpener.openerId : null,
    bestOpenerWinRate: bestOpener ? bestOpener.summary.winRate : 0,
    solutionWidthScore
  };
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function buildMarkdownReport(report) {
  const lines = [
    '# Championship Path Macro Balance Probe',
    '',
    `- Generated: \`${report.generatedAt}\``,
    `- Target URL: \`${report.url}\``,
    `- Baseline opener: \`center\` x ${report.baselineSamples}`,
    `- Sweep openers: \`${report.sweepOpeners.join(', ')}\` x ${report.sweepSamples}`,
    `- Tested node count: \`${report.nodes.length}\``,
    '',
    '## Baseline',
    '',
    '| Node | Tier | Center win rate | Avg active sec | Main loss reasons |',
    '| --- | --- | ---: | ---: | --- |'
  ];

  report.baseline.forEach((entry) => {
    const reasonText = Object.entries(entry.summary.lossRoundReasons)
      .sort((left, right) => right[1] - left[1])
      .map(([reason, count]) => `${reason}:${count}`)
      .join(', ') || 'none';
    lines.push(`| \`${entry.node.id}\` | \`${entry.node.tier}\` | ${formatPercent(entry.summary.winRate)} | ${entry.summary.averageActiveSec.toFixed(1)} | ${reasonText} |`);
  });

  lines.push('', '## Classification', '', '| Node | Classification | Best opener | Best opener win rate | Solution width | Recommendation |', '| --- | --- | --- | ---: | ---: | --- |');

  report.classification.forEach((entry) => {
    lines.push(`| \`${entry.nodeId}\` | \`${entry.classification}\` | \`${entry.bestOpener || '-'}\` | ${formatPercent(entry.bestOpenerWinRate)} | ${formatPercent(entry.solutionWidthScore)} | ${entry.recommendation} |`);
  });

  if (report.sweeps.length) {
    lines.push('', '## Flagged Node Sweeps', '');
    report.sweeps.forEach((entry) => {
      lines.push(`### ${entry.node.id} / ${entry.node.name}`, '');
      lines.push('| Opener | Win rate | Avg active sec | Main loss reasons |');
      lines.push('| --- | ---: | ---: | --- |');
      entry.openers.forEach((openerSummary) => {
        const reasonText = Object.entries(openerSummary.summary.lossRoundReasons)
          .sort((left, right) => right[1] - left[1])
          .map(([reason, count]) => `${reason}:${count}`)
          .join(', ') || 'none';
        lines.push(`| \`${openerSummary.openerId}\` | ${formatPercent(openerSummary.summary.winRate)} | ${openerSummary.summary.averageActiveSec.toFixed(1)} | ${reasonText} |`);
      });
      lines.push('');
    });
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const outDir = path.resolve(args.outDir || path.join(REPO_ROOT, 'output', `championship-path-balance-probe-${timestampSlug()}`));
  ensureDir(outDir);

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    viewport: {
      width: args.width,
      height: args.height
    }
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon\.ico/i.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    const text = error && error.message ? error.message : String(error);
    if (!/favicon\.ico/i.test(text)) {
      pageErrors.push(text);
    }
  });

  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitFor(
      () => page.evaluate(() => ({
        hasUI: !!window.__spinClashUI,
        hasRender: typeof window.render_game_to_text === 'function',
        hasAdvance: typeof window.advanceTime === 'function'
      })),
      (value) => value.hasUI && value.hasRender && value.hasAdvance,
      { timeoutMs: 20000 }
    );

    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {}
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

    await waitFor(
      () => page.evaluate(() => ({
        hasUI: !!window.__spinClashUI,
        hasRender: typeof window.render_game_to_text === 'function',
        hasAdvance: typeof window.advanceTime === 'function'
      })),
      (value) => value.hasUI && value.hasRender && value.hasAdvance,
      { timeoutMs: 30000 }
    );

    const baseSave = await page.evaluate(() => JSON.parse(window.SpinClash.services.storage.export()));
    let nodes = await page.evaluate(() => {
      return (window.SpinClash.config.challengeRoad || []).map((node, index) => ({
        index,
        id: node.id,
        name: node.name,
        chapterId: node.chapterId,
        chapterLabel: node.chapterLabel,
        tier: node.tier,
        arenaId: (window.SpinClash.config.arenas[node.arenaIndex] || {}).id || null,
        enemyPresetId: node.enemyPresetId,
        modifierId: node.modifierId,
        reward: node.reward,
        firstClearBonus: node.firstClearBonus || 0,
        checkpointOnClear: !!node.checkpointOnClear
      }));
    });
    if (Array.isArray(args.nodeIds) && args.nodeIds.length) {
      const idSet = new Set(args.nodeIds);
      nodes = nodes.filter((node) => idSet.has(node.id));
    }

    const baseline = [];
    for (const node of nodes) {
      const matches = [];
      for (let sampleIndex = 0; sampleIndex < args.baselineSamples; sampleIndex += 1) {
        matches.push(await runMatch(page, baseSave, node, OPENERS.center, args));
      }
      baseline.push({
        node,
        openerId: 'center',
        matches,
        summary: summarizeMatches(matches)
      });
    }

    const sweepNodes = selectSweepNodes(baseline);
    const sweepOpeners = Object.keys(OPENERS);
    const sweeps = [];
    for (const baselineEntry of sweepNodes) {
      const openerSummaries = [];
      for (const openerId of sweepOpeners) {
        const matches = [];
        const sampleCount = openerId === 'center' ? 0 : args.sweepSamples;
        if (openerId === 'center') {
          openerSummaries.push({
            openerId,
            summary: baselineEntry.summary,
            sample: args.baselineSamples
          });
          continue;
        }
        for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
          matches.push(await runMatch(page, baseSave, baselineEntry.node, OPENERS[openerId], args));
        }
        openerSummaries.push({
          openerId,
          summary: summarizeMatches(matches),
          sample: sampleCount
        });
      }
      sweeps.push({
        node: baselineEntry.node,
        openers: openerSummaries
      });
    }

    const sweepMap = new Map(sweeps.map((entry) => [entry.node.id, entry]));
    const classification = baseline.map((entry) => {
      const openerSummaries = sweepMap.has(entry.node.id)
        ? sweepMap.get(entry.node.id).openers
        : [{ openerId: 'center', summary: entry.summary, sample: args.baselineSamples }];
      return {
        nodeId: entry.node.id,
        ...classifyNode(entry.node, entry.summary, openerSummaries)
      };
    });

    const report = {
      generatedAt: new Date().toISOString(),
      url: args.url,
      baselineSamples: args.baselineSamples,
      sweepSamples: args.sweepSamples,
      sweepOpeners,
      nodes,
      baseline: baseline.map((entry) => ({
        node: entry.node,
        summary: entry.summary
      })),
      sweeps,
      classification,
      consoleErrors,
      pageErrors
    };

    const reportJsonPath = path.join(outDir, 'report.json');
    const reportMdPath = path.join(outDir, 'report.md');
    fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(reportMdPath, buildMarkdownReport(report), 'utf8');

    console.log(JSON.stringify({
      ok: true,
      outDir,
      reportJsonPath,
      reportMdPath,
      sweepNodeIds: sweeps.map((entry) => entry.node.id)
    }, null, 2));
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exit(1);
  });
}
