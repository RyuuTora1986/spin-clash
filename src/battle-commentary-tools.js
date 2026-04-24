(function(){
  const root = window.SpinClash || (window.SpinClash = {});

  root.createBattleCommentaryTools = function createBattleCommentaryTools(deps){
    const uiText = deps.uiText || {};
    const host = document.getElementById('battle-commentary');
    const activeItems = [];
    const queue = [];
    const laneBusyUntil = [0, 0, 0];
    let drainTimer = 0;
    let lastShownAt = -Infinity;
    let lastPriority = 0;
    let lastText = '';
    let lastLaneIndex = -1;

    function formatLine(template, tokens){
      return String(template || '').replace(/\{(\w+)\}/g, function(_, key){
        return tokens && tokens[key] != null ? String(tokens[key]) : '';
      });
    }

    function resolveLine(key, tokens){
      const table = uiText.battleCommentary || {};
      const entry = table[key];
      if(!entry) return '';
      const variants = Array.isArray(entry) ? entry : [entry];
      if(!variants.length) return '';
      let picked = variants[Math.floor(Math.random() * variants.length)];
      if(variants.length > 1 && picked === lastText){
        const nextIndex = (variants.indexOf(picked) + 1) % variants.length;
        picked = variants[nextIndex];
      }
      return formatLine(picked, tokens || {});
    }

    function getLaneFractions(){
      if(window.innerWidth <= 540) return [0.32, 0.68];
      if(window.innerWidth <= 880) return [0.22, 0.5, 0.78];
      return [0.18, 0.5, 0.82];
    }

    function removeItem(node){
      if(!node) return;
      if(node.__removeTimer){
        clearTimeout(node.__removeTimer);
        node.__removeTimer = 0;
      }
      const index = activeItems.indexOf(node);
      if(index >= 0) activeItems.splice(index, 1);
      if(node.parentNode === host) host.removeChild(node);
      if(host && !activeItems.length && !queue.length){
        host.classList.add('hide');
      }
    }

    function clear(){
      clearTimeout(drainTimer);
      drainTimer = 0;
      queue.length = 0;
      while(activeItems.length) removeItem(activeItems[0]);
      for(let i = 0; i < laneBusyUntil.length; i++) laneBusyUntil[i] = 0;
      if(host){
        host.className = 'battle-commentary hide';
        host.textContent = '';
      }
      lastPriority = 0;
    }

    function pickLane(now){
      const fractions = getLaneFractions();
      let bestIndex = 0;
      let bestValue = Infinity;
      for(let i = 0; i < fractions.length; i++){
        let value = laneBusyUntil[i];
        if(i === lastLaneIndex) value += 60;
        if(value < bestValue){
          bestValue = value;
          bestIndex = i;
        }
      }
      laneBusyUntil[bestIndex] = Math.max(laneBusyUntil[bestIndex], now) + 420;
      lastLaneIndex = bestIndex;
      return {
        fraction:fractions[bestIndex],
        laneIndex:bestIndex
      };
    }

    function createBadge(text){
      const badge = document.createElement('span');
      badge.className = 'battle-commentary-badge';
      badge.textContent = text || 'LIVE';
      return badge;
    }

    function createLine(text){
      const line = document.createElement('span');
      line.className = 'battle-commentary-line';
      line.textContent = text;
      return line;
    }

    function spawnMessage(entry){
      if(!host) return false;
      if(activeItems.length >= 3){
        removeItem(activeItems[0]);
      }
      const now = (window.performance && typeof window.performance.now === 'function')
        ? window.performance.now()
        : Date.now();
      const lane = pickLane(now);
      const item = document.createElement('div');
      const durationMs = Math.max(1600, Math.round((entry.duration || 2.5) * 1000));
      const accentDrift = Math.round((Math.random() * 28) - 14);
      const finalRise = entry.tone === 'finish' ? -58 : entry.tone === 'alert' ? -52 : -48;
      item.className = 'battle-commentary-item tone-' + (entry.tone || 'normal');
      item.style.left = Math.round(lane.fraction * 1000) / 10 + '%';
      item.style.setProperty('--commentary-drift', accentDrift + 'px');
      item.style.setProperty('--commentary-rise', finalRise + 'px');
      item.style.setProperty('--commentary-duration', (durationMs / 1000).toFixed(2) + 's');
      item.appendChild(createBadge(uiText.battleCommentaryLabel || 'LIVE'));
      item.appendChild(createLine(entry.line));
      host.insertBefore(item, host.firstChild);
      host.classList.remove('hide');
      activeItems.push(item);
      item.__removeTimer = setTimeout(function(){
        removeItem(item);
      }, durationMs + 220);
      return true;
    }

    function drainQueue(){
      drainTimer = 0;
      if(!queue.length) return;
      const entry = queue.shift();
      spawnMessage(entry);
      if(queue.length){
        drainTimer = setTimeout(drainQueue, 320);
      }
    }

    function enqueue(entry){
      queue.push(entry);
      queue.sort(function(a, b){
        if(b.priority !== a.priority) return b.priority - a.priority;
        return a.queuedAt - b.queuedAt;
      });
      while(queue.length > 4) queue.pop();
      if(!drainTimer){
        drainQueue();
      }
    }

    function showCommentary(key, tokens, options){
      if(!host) return false;
      const settings = options || {};
      const priority = typeof settings.priority === 'number' ? settings.priority : 1;
      const minGapMs = typeof settings.minGapMs === 'number' ? settings.minGapMs : 860;
      const duration = typeof settings.duration === 'number' ? settings.duration : 2.45;
      const tone = settings.tone || 'normal';
      const now = (window.performance && typeof window.performance.now === 'function')
        ? window.performance.now()
        : Date.now();
      if(now - lastShownAt < minGapMs && priority < lastPriority){
        return false;
      }
      const line = resolveLine(key, tokens);
      if(!line) return false;
      if(line === lastText && now - lastShownAt < Math.max(minGapMs, 1700)){
        return false;
      }

      lastShownAt = now;
      lastPriority = priority;
      lastText = line;
      enqueue({
        line,
        priority,
        duration,
        tone,
        queuedAt:now
      });
      return true;
    }

    return {
      clear,
      showCommentary
    };
  };
})();
