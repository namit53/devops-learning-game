/**
 * Reward System Module
 * Shared across all levels for points, flags, badges, and sound effects.
 */
window.RewardSystem = (() => {
  // --- Config ---
  const BADGE_MAP = {
    level_1: { name: 'Recruitment Cleared',    img: 'assets/badges/badge_level1.png' },
    level_2: { name: 'Pipeline Restorer',      img: 'assets/badges/badge_level2.png' },
    level_3: { name: 'History Guardian',        img: 'assets/badges/badge_level3.png' },
    level_4: { name: 'Container Breaker',       img: 'assets/badges/badge_level4.png' },
    level_5: { name: 'Alert Sentinel',          img: 'assets/badges/badge_level5.png' },
    level_6: { name: 'Infra Architect',         img: 'assets/badges/badge_level6.png' },
    level_7: { name: 'Orchestration Master',    img: 'assets/badges/badge_level7.png' },
  };

  const RANKS = [
    { min: 0,    title: 'Recruit' },
    { min: 500,  title: 'Field Agent' },
    { min: 1500, title: 'Senior Operative' },
    { min: 2500, title: 'Elite Commander' },
  ];

  let currentScore = 0;
  let scoreEl = null;
  let completedObjectives = [];

  // --- Sound Effects (Web Audio API — no external files) ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new AudioCtx(); } catch (e) { /* silent fail */ }
    }
    return audioCtx;
  }

  function playFlagSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playGoldenFlagSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [660, 880, 1100, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
  }

  function playLevelCompleteSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  }

  // --- Score Display ---
  function initScoreDisplay() {
    if (document.getElementById('rewardScoreDisplay')) {
      scoreEl = document.getElementById('rewardScoreDisplay');
      return;
    }
    const div = document.createElement('div');
    div.id = 'rewardScoreDisplay';
    div.className = 'reward-score-display';
    div.innerHTML = `
      <span class="score-icon">⚡</span>
      <span>SCORE:</span>
      <span class="score-value" id="rewardScoreValue">0</span>
    `;
    document.body.appendChild(div);
    scoreEl = div;
  }

  function updateScoreDisplay(points) {
    currentScore += points;
    const valEl = document.getElementById('rewardScoreValue');
    if (valEl) {
      valEl.textContent = currentScore;
    }
    if (scoreEl) {
      scoreEl.classList.add('score-bump');
      setTimeout(() => scoreEl.classList.remove('score-bump'), 400);
    }
  }

  // --- Flag Popup ---
  function showFlagPopup(objectiveName, points, isGolden = false) {
    // Track objective
    completedObjectives.push({ name: objectiveName, points, flag: isGolden ? 'golden' : 'standard' });

    // Play sound
    if (isGolden) {
      playGoldenFlagSound();
    } else {
      playFlagSound();
    }

    // Update score
    updateScoreDisplay(points);

    // Build popup
    const popup = document.createElement('div');
    popup.className = `reward-flag-popup${isGolden ? ' golden' : ''}`;
    popup.innerHTML = `
      <span class="flag-icon">${isGolden ? '🏆' : '🚩'}</span>
      <div class="flag-info">
        <span class="flag-label">${isGolden ? 'GOLDEN FLAG — FINAL OBJECTIVE' : 'FLAG CAPTURED'}</span>
        <span class="flag-objective">${objectiveName}</span>
      </div>
      <span class="flag-points">+${points}</span>
    `;
    document.body.appendChild(popup);

    // Auto-dismiss
    setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    }, 2800);
  }

  // --- Level Complete Banner ---
  function showLevelCompleteBanner(levelId, levelName, totalPoints, onContinue) {
    playLevelCompleteSound();

    const badge = BADGE_MAP[levelId] || {};
    const rank = getRank(totalPoints);

    const overlay = document.createElement('div');
    overlay.className = 'reward-complete-overlay';
    overlay.innerHTML = `
      <div class="reward-complete-card">
        <img src="${badge.img || ''}" alt="${badge.name || 'Badge'}" class="badge-reveal" />
        <h1 class="complete-title">LEVEL CLEARED</h1>
        <p class="complete-subtitle">${levelName}</p>
        <p class="complete-score">${totalPoints}</p>
        <p class="complete-score-label">Total Points Earned</p>
        <span class="complete-rank">${rank}</span>
        <button class="complete-continue-btn" id="completeContinueBtn">Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('completeContinueBtn').addEventListener('click', () => {
      overlay.remove();
      if (typeof onContinue === 'function') onContinue();
    });
  }

  // --- Utility ---
  function getRank(totalScore) {
    let rank = 'Recruit';
    for (const r of RANKS) {
      if (totalScore >= r.min) rank = r.title;
    }
    return rank;
  }

  function getCompletedObjectives() {
    return completedObjectives;
  }

  function getCurrentScore() {
    return currentScore;
  }

  function getBadgeMap() {
    return BADGE_MAP;
  }

  function getRanks() {
    return RANKS;
  }

  // --- Public API ---
  return {
    init: initScoreDisplay,
    showFlag: showFlagPopup,
    showLevelComplete: showLevelCompleteBanner,
    getObjectives: getCompletedObjectives,
    getScore: getCurrentScore,
    getRank,
    getBadgeMap,
    getRanks,
  };
})();
