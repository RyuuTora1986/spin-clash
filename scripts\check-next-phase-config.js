const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function loadConfigScript(relPath, root) {
  const absPath = path.join(repoRoot, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  const context = {
    window: { SpinClash: root },
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: absPath });
}

function fail(message) {
  failures.push(message);
}

function main() {
  const root = { config: {}, services: {}, state: {}, debug: {} };

  [
    'src/bootstrap-app-globals.js',
    'src/config-challenge-road.js',
    'src/config-research.js',
    'src/config-road-ranks.js'
  ].forEach((relPath) => loadConfigScript(relPath, root));

  const challengeRoad = root.config.challengeRoad || [];
  const researchTracks = root.config.research || [];
  const roadRanks = root.config.roadRanks || [];

  if (!Array.isArray(challengeRoad)) {
    fail('config.challengeRoad must be an array');
  }

  if (challengeRoad.length !== 10) {
    fail(`config.challengeRoad must contain 10 nodes, found ${challengeRoad.length}`);
  }

  const chapterIds = new Set();
  const checkpointNodes = [];
  const tierCounts = { boss: 0, final: 0 };

  challengeRoad.forEach((node, index) => {
    if (!node || typeof node !== 'object') {
      fail(`challengeRoad node ${index} is not an object`);
      return;
    }
    if (typeof node.chapterId !== 'string' || !node.chapterId) {
      fail(`challengeRoad node ${index} is missing chapterId`);
    } else {
      chapterIds.add(node.chapterId);
    }
    if (typeof node.tier !== 'string' || !['normal', 'boss', 'final'].includes(node.tier)) {
      fail(`challengeRoad node ${index} has invalid tier: ${node.tier}`);
    } else if (node.tier === 'boss' || node.tier === 'final') {
      tierCounts[node.tier] += 1;
    }
    if (typeof node.previewLabel !== 'string' || !node.previewLabel) {
      fail(`challengeRoad node ${index} is missing previewLabel`);
    }
    if (typeof node.previewDesc !== 'string' || !node.previewDesc) {
      fail(`challengeRoad node ${index} is missing previewDesc`);
    }
    if (typeof node.checkpointOnClear !== 'boolean') {
      fail(`challengeRoad node ${index} has invalid checkpointOnClear: ${node.checkpointOnClear}`);
    } else if (node.checkpointOnClear) {
      checkpointNodes.push(index);
    }
    if (typeof node.firstClearBonus !== 'number' || !Number.isFinite(node.firstClearBonus) || node.firstClearBonus < 0) {
      fail(`challengeRoad node ${index} has invalid firstClearBonus: ${node.firstClearBonus}`);
    }
  });

  if (chapterIds.size !== 4) {
    fail(`config.challengeRoad must span 4 chapters, found ${chapterIds.size}`);
  }

  if (checkpointNodes.length !== 2 || checkpointNodes[0] !== 2 || checkpointNodes[1] !== 5) {
    fail(`config.challengeRoad must checkpoint after nodes 3 and 6, found checkpoints at indexes [${checkpointNodes.join(', ')}]`);
  }

  if (tierCounts.boss !== 2) {
    fail(`config.challengeRoad must define 2 boss nodes, found ${tierCounts.boss}`);
  }

  if (tierCounts.final !== 1) {
    fail(`config.challengeRoad must define 1 final node, found ${tierCounts.final}`);
  }

  if (!challengeRoad[3] || challengeRoad[3].unlockTopId !== 'trick') {
    fail('config.challengeRoad node 4 must unlock trick');
  }

  if (!Array.isArray(researchTracks)) {
    fail('config.research must be an array');
  }

  if (researchTracks.length !== 3) {
    fail(`config.research must contain 3 tracks, found ${researchTracks.length}`);
  }

  researchTracks.forEach((track, index) => {
    if (!track || typeof track !== 'object') {
      fail(`config.research track ${index} is not an object`);
      return;
    }
    if (typeof track.id !== 'string' || !track.id) {
      fail(`config.research track ${index} is missing id`);
    }
    if (typeof track.label !== 'string' || !track.label) {
      fail(`config.research track ${index} is missing label`);
    }
    if (typeof track.description !== 'string' || !track.description) {
      fail(`config.research track ${index} is missing description`);
    }
    if (!Array.isArray(track.levels) || track.levels.length !== 4) {
      fail(`config.research track ${index} must define 4 levels`);
      return;
    }
    track.levels.forEach((level, levelIndex) => {
      if (!level || typeof level !== 'object') {
        fail(`config.research track ${index} level ${levelIndex} is not an object`);
        return;
      }
      if (typeof level.cost !== 'number' || !Number.isFinite(level.cost) || level.cost <= 0) {
        fail(`config.research track ${index} level ${levelIndex} has invalid cost: ${level.cost}`);
      }
      if (typeof level.preview !== 'string' || !level.preview) {
        fail(`config.research track ${index} level ${levelIndex} is missing preview`);
      }
      if (!level.effect || typeof level.effect !== 'object') {
        fail(`config.research track ${index} level ${levelIndex} is missing effect`);
      }
    });
  });

  if (!Array.isArray(roadRanks)) {
    fail('config.roadRanks must be an array');
  }

  if (roadRanks.length !== 3) {
    fail(`config.roadRanks must contain 3 ranks, found ${roadRanks.length}`);
  }

  roadRanks.forEach((rank, index) => {
    if (!rank || typeof rank !== 'object') {
      fail(`config.roadRanks rank ${index} is not an object`);
      return;
    }
    if (typeof rank.id !== 'string' || !rank.id) {
      fail(`config.roadRanks rank ${index} is missing id`);
    }
    if (typeof rank.label !== 'string' || !rank.label) {
      fail(`config.roadRanks rank ${index} is missing label`);
    }
    if (typeof rank.rewardMul !== 'number' || !Number.isFinite(rank.rewardMul) || rank.rewardMul < 1) {
      fail(`config.roadRanks rank ${index} has invalid rewardMul: ${rank.rewardMul}`);
    }
    if (!rank.enemy || typeof rank.enemy !== 'object') {
      fail(`config.roadRanks rank ${index} is missing enemy scaling config`);
    }
  });

  if (failures.length) {
    console.error('Next-phase config check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Next-phase config check passed.');
}

main();
