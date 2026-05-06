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
  activeFile: 'config.yaml',
  isEditingCode: false,
  files: {
    'config.yaml': `apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  DB_HOST: NULL_INVALID # TODO: Fix DB host configuration
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-service
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: api
        image: backend-service:v1
        # TODO: Add livenessProbe and readinessProbe blocks here
`
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

function openFile() {
  const content = state.files['config.yaml'];
  codeViewer.textContent = content;
  codeEditor.value = content;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = true;
}

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
  state.files['config.yaml'] = codeEditor.value;
  state.isEditingCode = false;
  codeViewer.textContent = state.files['config.yaml'];
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = false;

  // Validate Objectives
  const yaml = state.files['config.yaml'].toLowerCase();
  if (!yaml.includes('null_invalid') && (yaml.includes('db_host: db') || yaml.includes('db-prod'))) {
    const el = document.getElementById('obj-config');
    if (el && !el.classList.contains('completed')) {
      el.classList.add('completed');
      if (window.RewardSystem) window.RewardSystem.showFlag('ConfigMap Values Corrected', 100);
    }
  }

  if (yaml.includes('livenessprobe') && yaml.includes('readinessprobe')) {
    const el = document.getElementById('obj-probes');
    if (el && !el.classList.contains('completed')) {
      el.classList.add('completed');
      if (window.RewardSystem) window.RewardSystem.showFlag('Health Probes Defined', 100);
    }
  }
});

startInvestigationBtn.addEventListener('click', () => {
  briefingPanel.hidden = true;
  mainDashboard.hidden = false;
  setClock();
  openFile();
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
    socket.emit('start_lab', { levelId: 'level_7', cols: term.cols, rows: term.rows });
  });

  socket.on('terminal_output', (data) => {
    if (data.includes('__OBJ_L7_1__')) {
      const el = document.getElementById('obj-locate');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Failing Pods Located', 100);
      }
      data = data.replace('__OBJ_L7_1__', '');
    }
    if (data.includes('__OBJ_L7_2__')) {
      const el = document.getElementById('obj-diagnostics');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Pod Diagnostics Extracted', 100);
      }
      data = data.replace('__OBJ_L7_2__', '');
    }
    if (data.includes('__OBJ_L7_4__')) {
      const el = document.getElementById('obj-deploy');
      if (el && !el.classList.contains('completed')) {
        el.classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Valid State Deployed', 100);
      }
      data = data.replace('__OBJ_L7_4__', '');
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
  const locate = document.getElementById('obj-locate').classList.contains('completed');
  const diagnostics = document.getElementById('obj-diagnostics').classList.contains('completed');
  const config = document.getElementById('obj-config').classList.contains('completed');
  const deploy = document.getElementById('obj-deploy').classList.contains('completed');
  const probes = document.getElementById('obj-probes').classList.contains('completed');

  if (locate && diagnostics && config && deploy && probes) {
    statusValue.textContent = 'SYSTEM SECURED';
    statusValue.classList.remove('status-failed');
    statusValue.classList.add('status-success');
    if (window.RewardSystem) window.RewardSystem.showFlag('Orchestration Integrity Restored', 200, true);

    const totalScore = window.RewardSystem ? window.RewardSystem.getScore() : 100;
    const username = localStorage.getItem('devops_player_username') || 'shadow_dev';

    fetch(`${window.location.origin}/api/players/${username}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        levelId: 'level_7',
        status: 'completed',
        score: totalScore,
        badge: 'orchestration_master',
        objectives: window.RewardSystem ? window.RewardSystem.getObjectives() : []
      })
    })
    .then(res => res.json())
    .then(data => console.log('Progress saved:', data))
    .catch(err => console.error('Failed to save progress:', err))
    .finally(() => {
      setTimeout(() => {
        if (window.RewardSystem) {
          window.RewardSystem.showLevelComplete('level_7', 'Orchestration Meltdown', totalScore, () => {
            window.location.href = 'dashboard.html';
          });
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1500);
    });
  } else {
    alert('Please complete all objectives first before finishing Level 7.');
  }
});

// Initialize Virtual Assistant
if (window.VirtualAssistant) {
  new window.VirtualAssistant(() => {
    const objLocate = document.getElementById('obj-locate');
    const objDiagnostics = document.getElementById('obj-diagnostics');
    const objConfig = document.getElementById('obj-config');
    const objDeploy = document.getElementById('obj-deploy');
    const objProbes = document.getElementById('obj-probes');

    if (!objLocate || !objLocate.classList.contains('completed')) {
      return "Objective 1: Check running pods using the 'kubectl get pods' or 'kubectl get po' command to identify the problematic one.";
    }
    if (!objDiagnostics || !objDiagnostics.classList.contains('completed')) {
      return "Objective 2: Run 'kubectl logs <pod-name>' or 'kubectl describe pod <pod-name>' to analyze tracebacks for CrashLoopBackOff.";
    }
    if (!objConfig || !objConfig.classList.contains('completed')) {
      return "Objective 3: Fix the NULL_INVALID variable setting in config.yaml. For example, replace it with 'db-prod' and click 'Save'.";
    }
    if (!objDeploy || !objDeploy.classList.contains('completed')) {
      return "Objective 4: Apply clean config updates with 'kubectl apply -f config.yaml' in the terminal.";
    }
    if (!objProbes || !objProbes.classList.contains('completed')) {
      return "Objective 5: Set up custom livenessProbe and readinessProbe blocks in the Deployment section of 'config.yaml'. Click 'Save' when you're done.";
    }
    return "All Kubernetes orchestration objectives completed perfectly! Ready to finalize Level 7!";
  }, () => {
    return "Level 7: Orchestration Meltdown. Fix Kubernetes deployment bugs: (1) Find pods via kubectl get pods, (2) Fetch traces via kubectl logs, (3) Update config.yaml variables, (4) Apply updates with kubectl apply, (5) Add health probes.";
  });
}
