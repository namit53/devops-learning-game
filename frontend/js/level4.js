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
  dockerfile: `# Insecure Dockerfile used by the compromised service
FROM evil-node-base:latest
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]`,
  activeFilePath: 'Dockerfile',
  isEditingCode: false
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
  codeViewer.textContent = state.dockerfile;
  codeEditor.value = state.dockerfile;
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

function isBaseImageFixed() {
  const dockerfile = state.dockerfile.toLowerCase();
  return dockerfile.includes('from alpine') || dockerfile.includes('from node:slim');
}

saveCodeBtn.addEventListener('click', () => {
  state.dockerfile = codeEditor.value;
  state.isEditingCode = false;
  codeViewer.textContent = state.dockerfile;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = false;

  if (isBaseImageFixed()) {
    document.getElementById('obj-fix').classList.add('completed');
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

  socket = io('http://localhost:3000');

  socket.on('connect', () => {
    socket.emit('start_lab', { levelId: 'level_4', cols: term.cols, rows: term.rows });
  });

  socket.on('terminal_output', (data) => {
    if (data.includes('__OBJ_1_COMPLETED__')) {
      document.getElementById('obj-audit').classList.add('completed');
      data = data.replace('__OBJ_1_COMPLETED__', '');
    }
    if (data.includes('__OBJ_2_COMPLETED__')) {
      document.getElementById('obj-inspect').classList.add('completed');
      data = data.replace('__OBJ_2_COMPLETED__', '');
    }
    if (data.includes('__OBJ_4_COMPLETED__')) {
      document.getElementById('obj-build').classList.add('completed');
      data = data.replace('__OBJ_4_COMPLETED__', '');
    }
    if (data.includes('__OBJ_5_COMPLETED__')) {
      document.getElementById('obj-clear').classList.add('completed');
      data = data.replace('__OBJ_5_COMPLETED__', '');
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
  const audit = document.getElementById('obj-audit').classList.contains('completed');
  const inspect = document.getElementById('obj-inspect').classList.contains('completed');
  const fix = document.getElementById('obj-fix').classList.contains('completed');
  const build = document.getElementById('obj-build').classList.contains('completed');
  const clear = document.getElementById('obj-clear').classList.contains('completed');

  if (audit && inspect && fix && build && clear) {
    statusValue.textContent = 'APP SECURED';
    statusValue.classList.remove('status-failed');
    statusValue.classList.add('status-success');
    resolveMessage.hidden = false;

    const username = localStorage.getItem('devops_player_username') || 'shadow_dev';

    fetch(`http://localhost:3000/api/players/${username}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        levelId: 'level_4',
        status: 'completed',
        score: 100
      })
    })
    .then(res => res.json())
    .then(data => console.log('Progress saved:', data))
    .catch(err => console.error('Failed to save progress:', err))
    .finally(() => {
      setTimeout(() => {
        window.location.href = 'level5.html';
      }, 2500);
    });
  } else {
    alert('Please complete all objectives first before finishing Level 4.');
  }
});

// Initialize Virtual Assistant
if (window.VirtualAssistant) {
  new window.VirtualAssistant(() => {
    const objAudit = document.getElementById('obj-audit');
    const objInspect = document.getElementById('obj-inspect');
    const objFix = document.getElementById('obj-fix');
    const objBuild = document.getElementById('obj-build');
    const objClear = document.getElementById('obj-clear');

    if (!objAudit || !objAudit.classList.contains('completed')) {
      return "Objective 1: Check running containers to locate the malicious background task. Run 'docker ps' in the secure terminal.";
    }
    if (!objInspect || !objInspect.classList.contains('completed')) {
      return "Objective 2: Infiltrate the live malicious container with 'docker exec -it api-worker-compromised sh', explore files with 'ls', and 'cat rogue-worker.js'.";
    }
    if (!objFix || !objFix.classList.contains('completed')) {
      return "Objective 3: Fix the insecure base image in the Dockerfile from 'evil-node-base:latest' to 'node:slim' or 'alpine'. Remember to click 'Save' to confirm your edits.";
    }
    if (!objBuild || !objBuild.classList.contains('completed')) {
      return "Objective 4: Build a fresh container process using 'docker build -t trusted-api:latest .'";
    }
    if (!objClear || !objClear.classList.contains('completed')) {
      return "Objective 5: Prune old compromised images and running containers. Try running 'docker stop a1b2c3d4e5f6', 'docker rm api-worker-compromised' or 'docker system prune'.";
    }
    return "All objectives are met. Click the 'Complete Level 4' button to finish Chapter 4!";
  }, () => {
    return "Level 4: Container Infiltration. Complete (1) Container Audit, (2) Interactive Inspection, (3) Image Fix, (4) Fresh Build, (5) Old Resource Prune.";
  });
}
