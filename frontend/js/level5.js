// Initialize Reward System
if (window.RewardSystem) {
  window.RewardSystem.init();
}

// Cinematic Intro Handler
(function() {
  const cinematicIntro = document.getElementById('cinematicIntro');
  const skipBtn = document.getElementById('skipL2CrawlBtn');
  const crawlContent = document.getElementById('l2CrawlContent');

  const dismissCinematic = () => {
    if (cinematicIntro) {
      cinematicIntro.style.transition = 'opacity 0.8s ease';
      cinematicIntro.style.opacity = '0';
      setTimeout(() => { cinematicIntro.style.display = 'none'; }, 800);
    }
  };

  if (skipBtn) skipBtn.addEventListener('click', dismissCinematic);
  if (crawlContent) crawlContent.addEventListener('animationend', dismissCinematic);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cinematicIntro && cinematicIntro.style.display !== 'none') {
      dismissCinematic();
    }
  });
})();

const state = {
  activeFile: 'server.js',
  isEditingCode: false,
  files: {
    'server.js': `const express = require('express');
const app = express();

// TODO: Add dedicated /health route to report readiness
app.get('/', (req, res) => res.send('Welcome to the SRE API'));

app.listen(8080);`,
    'alert-config.js': `// Alert threshold monitoring
// TODO: Create a script that triggers if CPU or memory usage exceeds 85%
const CPU_ALERT_THRESHOLD = 0;
const MEM_ALERT_THRESHOLD = 0;

function checkThresholds(cpu, mem) {
  if (cpu > CPU_ALERT_THRESHOLD || mem > MEM_ALERT_THRESHOLD) {
    return 'CRITICAL_ALERT';
  }
  return 'HEALTHY';
}`
  }
};

const codeViewer = document.getElementById('codeViewer');
const codeEditor = document.getElementById('codeEditor');
const editCodeBtn = document.getElementById('editCodeBtn');
const saveCodeBtn = document.getElementById('saveCodeBtn');
const saveCodeMessage = document.getElementById('saveCodeMessage');
const statusValue = document.getElementById('statusValue');
const systemClock = document.getElementById('systemClock');
const briefingPanel = document.getElementById('briefingPanel');
const mainDashboard = document.getElementById('mainDashboard');
const startInvestigationBtn = document.getElementById('startInvestigationBtn');
const evaluateBtn = document.getElementById('evaluateBtn');
const resolveMessage = document.getElementById('resolveMessage');

const serverJsBtn = document.getElementById('serverJsBtn');
const alertConfigBtn = document.getElementById('alertConfigBtn');

let term = null;
let socket = null;
let terminalInitialized = false;

function setClock() {
  const now = new Date();
  systemClock.textContent = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function openFile(fileName) {
  state.activeFile = fileName;
  const content = state.files[fileName];
  codeViewer.textContent = content;
  codeEditor.value = content;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = true;

  serverJsBtn.classList.toggle('primary', fileName === 'server.js');
  alertConfigBtn.classList.toggle('primary', fileName === 'alert-config.js');
}

serverJsBtn.addEventListener('click', () => openFile('server.js'));
alertConfigBtn.addEventListener('click', () => openFile('alert-config.js'));

editCodeBtn.addEventListener('click', () => {
  state.isEditingCode = true;
  codeViewer.hidden = true;
  codeEditor.hidden = false;
  editCodeBtn.hidden = true;
  saveCodeBtn.hidden = false;
  saveCodeMessage.hidden = true;
  codeEditor.focus();
});

saveCodeBtn.addEventListener('click', () => {
  state.files[state.activeFile] = codeEditor.value;
  state.isEditingCode = false;
  codeViewer.textContent = state.files[state.activeFile];
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = false;

  // Validate Objectives
  if (state.activeFile === 'server.js' && state.files['server.js'].toLowerCase().includes('/health')) {
    const el = document.getElementById('obj-health');
    if (el && !el.classList.contains('completed')) {
      el.classList.add('completed');
      if (window.RewardSystem) window.RewardSystem.showFlag('Health Endpoint Implemented', 100);
    }
  }

  if (state.activeFile === 'alert-config.js' && (state.files['alert-config.js'].includes('85') || state.files['alert-config.js'].includes('> 85'))) {
    const el = document.getElementById('obj-alert');
    if (el && !el.classList.contains('completed')) {
      el.classList.add('completed');
      if (window.RewardSystem) window.RewardSystem.showFlag('Alert Thresholds Configured', 100);
    }
  }
});

startInvestigationBtn.addEventListener('click', () => {
  briefingPanel.hidden = true;
  mainDashboard.hidden = false;
  setClock();
  openFile('server.js');
  initializeTerminal();
});

setInterval(setClock, 1000);

function initializeTerminal() {
  if (terminalInitialized) return;
  terminalInitialized = true;

  term = new Terminal({
    theme: { background: '#000000', foreground: '#29ff6a' },
    cursorBlink: true,
    fontFamily: '"JetBrains Mono", Consolas, Monaco, monospace',
    fontSize: 14
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  const container = document.getElementById('xterm-container');
  term.open(container);
  fitAddon.fit();

  socket = io(window.location.origin);

  socket.on('connect', () => {
    socket.emit('start_lab', { levelId: 'level_5', cols: term.cols, rows: term.rows });
  });

  socket.on('terminal_output', (data) => {
    if (data.includes('__OBJ_L5_1__')) {
      const el = document.getElementById('obj-triage');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Active Leak Triaged', 100);
      }
      data = data.replace('__OBJ_L5_1__', '');
    }
    if (data.includes('__OBJ_L5_2__')) {
      const el = document.getElementById('obj-terminate');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Runaway Worker Terminated', 100);
      }
      data = data.replace('__OBJ_L5_2__', '');
    }
    if (data.includes('__OBJ_L5_5__')) {
      const el = document.getElementById('obj-load');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Load Resilience Verified', 100);
      }
      data = data.replace('__OBJ_L5_5__', '');
    }
    term.write(data);
  });

  term.onData((data) => {
    socket.emit('terminal_input', data);
  });

  window.addEventListener('resize', () => {
    fitAddon.fit();
    if (socket) {
      socket.emit('terminal_resize', { cols: term.cols, rows: term.rows });
    }
  });
}

evaluateBtn.addEventListener('click', () => {
  const triage = document.getElementById('obj-triage').classList.contains('completed');
  const terminate = document.getElementById('obj-terminate').classList.contains('completed');
  const health = document.getElementById('obj-health').classList.contains('completed');
  const alertStatus = document.getElementById('obj-alert').classList.contains('completed');
  const load = document.getElementById('obj-load').classList.contains('completed');

  if (triage && terminate && health && alertStatus && load) {
    statusValue.textContent = 'SYSTEMS SECURED';
    statusValue.classList.remove('status-failed');
    statusValue.classList.add('status-success');
    resolveMessage.hidden = false;

    if (window.RewardSystem) window.RewardSystem.showFlag('SRE Incident Resolved', 200, true);

    const totalScore = window.RewardSystem ? window.RewardSystem.getScore() : 100;
    const username = localStorage.getItem('devops_player_username') || 'shadow_dev';

    fetch(`${window.location.origin}/api/players/${username}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        levelId: 'level_5',
        status: 'completed',
        score: totalScore,
        badge: 'alert_sentinel',
        objectives: window.RewardSystem ? window.RewardSystem.getObjectives() : []
      })
    })
    .then(res => res.json())
    .then(data => console.log('Progress saved:', data))
    .catch(err => console.error('Failed to save progress:', err))
    .finally(() => {
      setTimeout(() => {
        if (window.RewardSystem) {
          window.RewardSystem.showLevelComplete('level_5', 'Monitoring & Alerting', totalScore, () => {
            window.location.href = 'level6.html';
          });
        } else {
          window.location.href = 'level6.html';
        }
      }, 1500);
    });
  } else {
    alert('Please complete all objectives first before finishing Level 5.');
  }
});

// Initialize Virtual Assistant
if (window.VirtualAssistant) {
  new window.VirtualAssistant(() => {
    const objTriage = document.getElementById('obj-triage');
    const objTerminate = document.getElementById('obj-terminate');
    const objHealth = document.getElementById('obj-health');
    const objAlert = document.getElementById('obj-alert');
    const objLoad = document.getElementById('obj-load');

    if (!objTriage || !objTriage.classList.contains('completed')) {
      return "Objective 1: Check running processes to triage resource siphoning. Run 'top' or 'ps aux' in the terminal.";
    }
    if (!objTerminate || !objTerminate.classList.contains('completed')) {
      return "Objective 2: Terminate the malicious runaway process using 'kill -9 <PID>'. Look for the PID in your ps aux output.";
    }
    if (!objHealth || !objHealth.classList.contains('completed')) {
      return "Objective 3: Add the '/health' route in server.js to report readiness. Don't forget to click 'Save' to confirm your edits.";
    }
    if (!objAlert || !objAlert.classList.contains('completed')) {
      return "Objective 4: Edit 'alert-config.js' to trigger if resource usage exceeds 85%. E.g., change the CPU/Memory threshold to 85. Click 'Save' when you're done.";
    }
    if (!objLoad || !objLoad.classList.contains('completed')) {
      return "Objective 5: Run a synthetic load test against the app to test health check and metric alerts using 'load-test' or 'npm run load-test' in the terminal.";
    }
    return "All objectives met perfectly! Ready to complete SRE Incident Response!";
  }, () => {
    return "Level 5: SRE: Monitoring & Alerting. Your mission is to secure the platform from resource leaks. Current goals: (1) Process Triage, (2) Process Termination, (3) Create /health route, (4) Set alert threshold to 85, (5) Synthetically load test.";
  });
}
