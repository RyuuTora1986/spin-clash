const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startCrazyGamesPreviewServer } = require('./serve-crazygames-preview');
const { getChannelById } = require('./channel-registry');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    outDir: '',
    channel: 'crazygames_basic',
    headless: true,
    width: 1600,
    height: 1000
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--out-dir' && next) {
      args.outDir = next;
      index += 1;
      continue;
    }
    if (token === '--channel' && next) {
      args.channel = next;
      index += 1;
      continue;
    }
    if (token === '--headed') {
      args.headless = false;
      continue;
    }
    if (token === '--width' && next) {
      args.width = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
    if (token === '--height' && next) {
      args.height = Number.parseInt(next, 10);
      index += 1;
      continue;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, { timeoutMs = 20000, intervalMs = 200 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await predicate();
    if (result) return result;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms`);
}

function filterConsoleIssues(entries) {
  return entries.filter((entry) => !/favicon\.ico/i.test(entry));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAll(text, fragments) {
  return (fragments || []).every((fragment) => String(text || '').includes(fragment));
}

async function launchBattleFromPrepare(frame) {
  return frame.evaluate(() => {
    const canvas = document.querySelector('#gc canvas');
    if (!canvas || typeof canvas.dispatchEvent !== 'function') {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const points = [
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.80 },
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.73 },
      { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.64 }
    ];

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

    fire('mousedown', points[0]);
    fire('mousemove', points[1]);
    fire('mousemove', points[2]);
    fire('mouseup', points[2]);

    return {
      width: rect.width,
      height: rect.height,
      start: points[0],
      end: points[2]
    };
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const { channel } = getChannelById(args.channel || 'crazygames_basic');
  const smokeExpectations = channel.behaviorContracts && channel.behaviorContracts.smokeExpectations
    ? channel.behaviorContracts.smokeExpectations
    : {};
  const outDir = path.resolve(args.outDir || path.join(REPO_ROOT, 'output', `crazygames-preview-smoke-${timestampSlug()}`));
  ensureDir(outDir);

  const server = await startCrazyGamesPreviewServer({
    host: '127.0.0.1',
    port: 4383,
    maxPort: 4433,
    buildDir: path.join(REPO_ROOT, 'dist-crazygames'),
    silent: true
  });

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    viewport: {
      width: args.width,
      height: args.height
    }
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch (error) {}
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message || String(error));
  });

  let runError = null;

  try {
    await page.goto(server.previewUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('#cg-preview-frame', { timeout: 60000 });

    const frame = await waitFor(async () => {
      const target = page.frame({ name: 'cg-preview-frame' });
      if (!target) return null;
      return target.url().includes('/build/index.html') ? target : null;
    }, { timeoutMs: 60000 });

    await waitFor(() => frame.evaluate(() => {
      return !!(
        window.SpinClash
        && window.SpinClash.services
        && window.SpinClash.services.crazyGames
        && typeof window.__spinClashInvoke === 'function'
      );
    }), { timeoutMs: 60000 });

    await waitFor(() => frame.evaluate(() => {
      return window.SpinClash.services.crazyGames.getState().loadingStopped === true;
    }), { timeoutMs: 60000 });

    await page.screenshot({
      path: path.join(outDir, 'preview-shell.png'),
      scale: 'css'
    });

    const homeContractCheck = await frame.evaluate(() => {
      function textOf(id) {
        const node = document.getElementById(id);
        return node ? node.textContent.trim() : '';
      }
      return {
        primaryCta: textOf('btn-enter'),
        secondaryCta: textOf('btn-enter-quick'),
        pathNote: textOf('title-note-path'),
        quickNote: textOf('title-note-quick')
      };
    });

    if (smokeExpectations.homePrimaryCta) {
      assert(homeContractCheck.primaryCta === smokeExpectations.homePrimaryCta, `Expected home primary CTA "${smokeExpectations.homePrimaryCta}", got "${homeContractCheck.primaryCta}".`);
    }
    if (smokeExpectations.homeSecondaryCta) {
      assert(homeContractCheck.secondaryCta === smokeExpectations.homeSecondaryCta, `Expected home secondary CTA "${smokeExpectations.homeSecondaryCta}", got "${homeContractCheck.secondaryCta}".`);
    }
    if (Array.isArray(smokeExpectations.homePathNoteIncludes) && smokeExpectations.homePathNoteIncludes.length) {
      assert(includesAll(homeContractCheck.pathNote, smokeExpectations.homePathNoteIncludes), `Home Path note lost required fragments: ${smokeExpectations.homePathNoteIncludes.join(' | ')}`);
    }
    if (Array.isArray(smokeExpectations.homeQuickNoteIncludes) && smokeExpectations.homeQuickNoteIncludes.length) {
      assert(includesAll(homeContractCheck.quickNote, smokeExpectations.homeQuickNoteIncludes), `Home Quick note lost required fragments: ${smokeExpectations.homeQuickNoteIncludes.join(' | ')}`);
    }

    await frame.evaluate(() => {
      window.__spinClashInvoke('goQuick');
    });
    await page.waitForTimeout(900);

    const lockedArenaCheck = await frame.evaluate(() => {
      window.__spinClashInvoke('selectArena', 2);
      const button = document.getElementById('btn-fight');
      const hint = document.getElementById('quick-start-hint');
      return {
        buttonText: button ? button.textContent.trim() : '',
        hintText: hint ? hint.textContent.trim() : ''
      };
    });

    assert(!/trial|watch ad|reward/i.test(`${lockedArenaCheck.buttonText} ${lockedArenaCheck.hintText}`), 'CrazyGames Basic preview still exposes reward-trial language for locked arena flow.');
    if (smokeExpectations.lockedArenaCta) {
      assert(lockedArenaCheck.buttonText === smokeExpectations.lockedArenaCta, `Expected locked-arena CTA "${smokeExpectations.lockedArenaCta}", got "${lockedArenaCheck.buttonText}".`);
    }
    if (Array.isArray(smokeExpectations.lockedArenaHintIncludes) && smokeExpectations.lockedArenaHintIncludes.length) {
      assert(includesAll(lockedArenaCheck.hintText, smokeExpectations.lockedArenaHintIncludes), `Locked-arena hint lost required fragments: ${smokeExpectations.lockedArenaHintIncludes.join(' | ')}`);
    }

    let lockedArenaRouteCheck = null;
    if (smokeExpectations.lockedArenaAction === 'route_to_path') {
      await frame.evaluate(() => {
        const button = document.getElementById('btn-fight');
        if (button) {
          button.click();
        }
      });
      await waitFor(() => frame.evaluate(() => {
        const challengePanel = document.getElementById('challenge-panel');
        const quickPanel = document.getElementById('quick-battle-panel');
        const challengeVisible = !!(challengePanel && !challengePanel.classList.contains('hide'));
        const quickVisible = !!(quickPanel && !quickPanel.classList.contains('hide'));
        return challengeVisible === true && quickVisible === false;
      }), { timeoutMs: 10000 });
      lockedArenaRouteCheck = await frame.evaluate(() => {
        const challengePanel = document.getElementById('challenge-panel');
        const quickPanel = document.getElementById('quick-battle-panel');
        return {
          challengeVisible: !!(challengePanel && !challengePanel.classList.contains('hide')),
          quickVisible: !!(quickPanel && !quickPanel.classList.contains('hide'))
        };
      });
      await frame.evaluate(() => {
        window.__spinClashInvoke('goQuick');
        window.__spinClashInvoke('selectArena', 0);
      });
      await page.waitForTimeout(700);
    }

    await frame.evaluate(() => {
      window.__spinClashInvoke('startFight');
    });

    await waitFor(() => frame.evaluate(() => {
      return window.SpinClash.services.crazyGames.getState().gameplayActive === true;
    }), { timeoutMs: 20000 });

    await page.screenshot({
      path: path.join(outDir, 'prepare-state.png'),
      scale: 'css'
    });

    const launchVector = await launchBattleFromPrepare(frame);
    assert(!!launchVector, 'Could not dispatch launch drag on the battle canvas.');

    await waitFor(() => frame.evaluate(() => {
      const hint = document.getElementById('hint-bar');
      const text = hint ? hint.textContent.trim().toLowerCase() : '';
      return text && !/drag to aim/.test(text);
    }), { timeoutMs: 10000 });

    await page.screenshot({
      path: path.join(outDir, 'active-state.png'),
      scale: 'css'
    });

    await waitFor(() => frame.evaluate(() => {
      return window.SpinClash.services.crazyGames.getState().gameplayActive === false;
    }), { timeoutMs: 45000 });

    const finalServiceState = await frame.evaluate(() => {
      return window.SpinClash.services.crazyGames.getState();
    });
    const mockSnapshot = await frame.evaluate(() => {
      return window.__spinClashCrazyGamesMock && typeof window.__spinClashCrazyGamesMock.getSnapshot === 'function'
        ? window.__spinClashCrazyGamesMock.getSnapshot()
        : null;
    });

    const eventNames = (mockSnapshot && Array.isArray(mockSnapshot.events) ? mockSnapshot.events : []).map((entry) => entry.event);
    assert(eventNames.includes('loadingStart'), 'CrazyGames preview mock never received loadingStart.');
    assert(eventNames.includes('loadingStop'), 'CrazyGames preview mock never received loadingStop.');
    assert(eventNames.includes('gameplayStart'), 'CrazyGames preview mock never received gameplayStart.');
    assert(eventNames.includes('gameplayStop'), 'CrazyGames preview mock never received gameplayStop.');

    const filteredConsoleErrors = filterConsoleIssues(consoleErrors);
    const filteredPageErrors = filterConsoleIssues(pageErrors);
    assert(filteredConsoleErrors.length === 0, `Console errors detected: ${filteredConsoleErrors.join(' | ')}`);
    assert(filteredPageErrors.length === 0, `Page errors detected: ${filteredPageErrors.join(' | ')}`);

    const report = {
      generatedAt: new Date().toISOString(),
      channelId: channel.id,
      previewUrl: server.previewUrl,
      iframeUrl: server.iframeUrl,
      homeContractCheck,
      lockedArenaCheck,
      lockedArenaRouteCheck,
      launchVector,
      crazyGamesServiceState: finalServiceState,
      mockSnapshot,
      consoleErrors: filteredConsoleErrors,
      pageErrors: filteredPageErrors
    };

    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(
      path.join(outDir, 'report.md'),
      [
        '# CrazyGames Preview Smoke',
        '',
        `- Preview URL: \`${server.previewUrl}\``,
        `- Channel: \`${channel.id}\``,
        `- loadingStop reached: \`${finalServiceState.loadingStopped}\``,
        `- gameplay cycle reached: \`${finalServiceState.gameplayActive === false}\``,
        `- Home primary CTA: \`${homeContractCheck.primaryCta}\``,
        `- Home secondary CTA: \`${homeContractCheck.secondaryCta}\``,
        `- Home Path note: \`${homeContractCheck.pathNote}\``,
        `- Home Quick note: \`${homeContractCheck.quickNote}\``,
        `- Locked arena CTA: \`${lockedArenaCheck.buttonText}\``,
        `- Locked arena hint: \`${lockedArenaCheck.hintText}\``,
        `- Locked arena routed to Path: \`${lockedArenaRouteCheck ? lockedArenaRouteCheck.challengeVisible === true && lockedArenaRouteCheck.quickVisible === false : 'n/a'}\``,
        `- Launch drag: \`${launchVector ? `${Math.round(launchVector.start.x)},${Math.round(launchVector.start.y)} -> ${Math.round(launchVector.end.x)},${Math.round(launchVector.end.y)}` : 'n/a'}\``,
        '',
        '## Mock Events',
        '',
        ...((mockSnapshot && mockSnapshot.events) || []).map((entry) => `- \`${entry.event}\`${entry.payload != null ? ` ${JSON.stringify(entry.payload)}` : ''}`)
      ].join('\n'),
      'utf8'
    );

    console.log(JSON.stringify({
      ok: true,
      outDir,
      previewUrl: server.previewUrl,
      report: path.join(outDir, 'report.md')
    }, null, 2));
  } catch (error) {
    runError = error;
    throw error;
  } finally {
    if (runError && !fs.existsSync(path.join(outDir, 'report.md'))) {
      fs.writeFileSync(
        path.join(outDir, 'report.md'),
        `# CrazyGames Preview Smoke\n\n- Failed: ${runError.message || String(runError)}\n`,
        'utf8'
      );
    }
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || String(error));
    process.exit(1);
  });
}
