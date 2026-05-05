// ── Cinematic Intro Handler ──
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

// Initialize Reward System
if (window.RewardSystem) {
  window.RewardSystem.init();
}

const state = {
  dependencyInstalled: false,
  logsExpanded: false,
  testLogsExpanded: false,
  codeViewed: false,
  resolved: false,
  activeFilePath: null,
  isEditingCode: false,
  deploySequenceStarted: false,
  deployFailed: false,
  deployLogsExpanded: false,
  portFreed: false,
  terminalReturnScheduled: false,
  reviewUnlocked: false,
};

const INITIAL_LOGS = [
  '> Jenkins Build #402 initiated...',
  '> Cloning repository...',
  '> Installing dependencies...',
  '> Running build script...',
  '',
  "> ERROR: Module 'lodash' not found in package.json",
  '> Build step failed.',
  '',
  '> (System awaiting user input)',
  '',
  '> Fetching console logs...',
  '',
  "> ERROR: Module 'lodash' not found in package.json",
  '> HINT: Check dependency configuration.',
];

const EXTRA_LOGS = [
  '[12:01:14] Started by user admin',
  '[12:01:15] Running in Workspace /var/jenkins_home/workspace/prod-deploy',
  '[12:01:16] [CHECKOUT] Fetching changes from origin/main...',
  '[12:01:18] [CHECKOUT] SUCCESS',
  "[12:01:19] [BUILD] Running 'npm ci'...",
  '[12:01:25] [BUILD] Compiling assets...',
  '[12:01:28] [BUILD] SUCCESS',
  '[12:01:29] [TEST] Executing Jest test suite...',
  '[12:01:34] [TEST] PASS: 42 suites run, 0 failures.',
  '[12:01:35] [TEST] SUCCESS',
  '[12:01:36] [DEPLOY] Connecting to production server...',
  '[12:01:37] [DEPLOY] Stopping old container instance...',
  '[12:01:38] [DEPLOY] Starting new container instance on port 8080...',
  '[12:01:39] [ERROR] node:events:491',
  "[12:01:39] [ERROR]       throw er; // Unhandled 'error' event",
  '[12:01:39] [ERROR]       ^',
  '[12:01:39] [ERROR] Error: listen EADDRINUSE: address already in use 0.0.0.0:8080',
  '[12:01:39] [ERROR]     at Server.setupListenHandle [as _listen2] (node:net:1446:16)',
  '[12:01:39] [ERROR]     at listenInCluster (node:net:1494:12)',
  '[12:01:39] [ERROR]     at Server.listen (node:net:1582:7)',
  '[12:01:40] [FATAL] Deployment script exited with code 1',
  "[12:01:40] Build step 'Execute shell' marked build as failure",
  '[12:01:40] Finished: FAILURE',
];

const TEST_FAILURE_LOGS = [
  '> Expanding console output...',
  '',
  '> npm test',
  '',
  'FAIL  tests/cartTotalCalculation.test.js',
  '  cart total calculation',
  '    ✕ calculates total price correctly (8 ms)',
  '',
  '  ● cart total calculation',
  '',
  '    expect(received).toBe(expected)',
  '',
  '    Expected: 820',
  '    Received: 0',
  '',
  '      9 | const total = calculateCartTotal(items)',
  '     10 |',
  '  > 11 | expect(total).toBe(820)',
  '        |               ^',
  '     12 | })',
  '',
  'Test data used:',
  '[',
  "  { name: 'Laptop', price: 800 },",
  "  { name: 'Mouse', price: 20 }",
  ']',
  '',
  'Stack trace:',
  '  at calculateCartTotal (controllers/cartController.js:6:12)',
  '  at Object.<anonymous> (tests/cartTotalCalculation.test.js:9:17)',
  '',
  'Note: Test input contains numeric "price" values.',
  '',
  'Test Suites: 1 failed, 1 total',
  'Tests:       1 failed, 1 total',
  'Time:        0.52 s',
  '',
  'ERROR: Unit tests failed.',
  'Pipeline halted at stage: TEST',
];

const files = {
  'package.json': `{
  "name": "ecom-checkout",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2"
  }
}`,
  'server.js': `const express = require("express")
const cartController = require("./controllers/cartController")

const app = express()

app.use("/cart", cartController)

const PORT = 8080

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`,
  'controllers/cartController.js': `const express = require("express")
const router = express.Router()
const _ = require("lodash")

function calculateCartTotal(items){
  return _.sumBy(items,"cost")
}

router.get("/",(req,res)=>{
  const items=[
    {name:"Laptop",price:800},
    {name:"Mouse",price:20}
  ]

  const total = calculateCartTotal(items)

  res.json({
    items,
    total
  })
})

module.exports = router`,
  'tests/cartTotalCalculation.test.js': `const { calculateCartTotal } = require("../controllers/cartController")

test("cart total calculation", () => {
  const items = [
    { name: "Laptop", price: 800 },
    { name: "Mouse", price: 20 }
  ]

  const total = calculateCartTotal(items)

  expect(total).toBe(820)
})`,
};

const logOutput = document.getElementById('logOutput');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailOutput = document.getElementById('detailOutput');
const repoExplorer = document.getElementById('repoExplorer');
const repoTree = document.getElementById('repoTree');
const codeViewer = document.getElementById('codeViewer');
const codeEditor = document.getElementById('codeEditor');
const codeActionRow = document.getElementById('codeActionRow');
const editCodeBtn = document.getElementById('editCodeBtn');
const saveCodeBtn = document.getElementById('saveCodeBtn');
const saveCodeMessage = document.getElementById('saveCodeMessage');
const configTerminal = document.getElementById('configTerminal');
let term = null;
let socket = null;
let terminalInitialized = false;
const statusValue = document.getElementById('statusValue');
const resolveMessage = document.getElementById('resolveMessage');
const systemClock = document.getElementById('systemClock');
const pipelineProgress = document.getElementById('pipelineProgress');
const briefingPanel = document.getElementById('briefingPanel');
const levelDashboard = document.querySelector('.level1-dashboard');
const startInvestigationBtn = document.getElementById('startInvestigationBtn');

const logs = [...INITIAL_LOGS];

function renderLogs() {
  logOutput.textContent = logs.join('\n');
  logOutput.scrollTop = logOutput.scrollHeight;
}

function appendLogs(lines) {
  logs.push(...lines);
  renderLogs();
}

function appendLog(line) {
  logs.push(line);
  renderLogs();
}

function setClock() {
  const now = new Date();
  const formatted = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  systemClock.textContent = formatted;
}

function showPanel(type) {
  detailPanel.hidden = type !== 'detail';
  configTerminal.hidden = type !== 'terminal';

  if (type !== 'detail') {
    repoExplorer.hidden = true;
    detailOutput.hidden = false;
  }

  if (type === 'terminal' && term) {
    term.focus();
  }
}

function setPipelineDefaults() {
  pipelineProgress.hidden = false;

  const defaults = {
    checkout: 'done',
    build: 'failed',
    test: 'pending',
    deploy: 'pending',
  };

  Object.entries(defaults).forEach(([stepName, status]) => {
    const stepEl = pipelineProgress.querySelector(`[data-step="${stepName}"]`);
    if (!stepEl) {
      return;
    }

    stepEl.classList.remove('done', 'failed');

    if (status === 'done') {
      stepEl.classList.add('done');
    }

    if (status === 'failed') {
      stepEl.classList.add('failed');
    }
  });
}

function setActiveFile(path) {
  const fileButtons = repoTree.querySelectorAll('button[data-path]');
  fileButtons.forEach((button) => {
    const isActive = button.dataset.path === path;
    button.classList.toggle('primary', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function openFile(path) {
  const contents = files[path];
  if (!contents) {
    return;
  }

  state.codeViewed = true;
  state.activeFilePath = path;
  state.isEditingCode = false;
  detailTitle.textContent = `Source Review — ${path}`;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  codeViewer.textContent = contents;
  codeEditor.value = contents;
  codeActionRow.hidden = false;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = true;
  setActiveFile(path);
}

function renderRepoExplorer() {
  repoTree.innerHTML = '';

  const root = document.createElement('div');
  root.textContent = 'repo/';
  repoTree.appendChild(root);

  const packageBtn = document.createElement('button');
  packageBtn.type = 'button';
  packageBtn.className = 'action-button';
  packageBtn.dataset.path = 'package.json';
  packageBtn.textContent = '├── package.json';

  const serverBtn = document.createElement('button');
  serverBtn.type = 'button';
  serverBtn.className = 'action-button';
  serverBtn.dataset.path = 'server.js';
  serverBtn.textContent = '├── server.js';

  const controllers = document.createElement('div');
  controllers.textContent = '├── controllers';

  const cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'action-button';
  cartBtn.dataset.path = 'controllers/cartController.js';
  cartBtn.textContent = '    └── cartController.js';

  const tests = document.createElement('div');
  tests.textContent = '└── tests';

  const testFileBtn = document.createElement('button');
  testFileBtn.type = 'button';
  testFileBtn.className = 'action-button';
  testFileBtn.dataset.path = 'tests/cartTotalCalculation.test.js';
  testFileBtn.textContent = '    └── cartTotalCalculation.test.js';

  [packageBtn, serverBtn, cartBtn, testFileBtn].forEach((button) => {
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.textAlign = 'left';
    button.style.margin = '0.2rem 0';
    button.addEventListener('click', () => openFile(button.dataset.path));
  });

  repoTree.appendChild(packageBtn);
  repoTree.appendChild(serverBtn);
  repoTree.appendChild(controllers);
  repoTree.appendChild(cartBtn);
  repoTree.appendChild(tests);
  repoTree.appendChild(testFileBtn);
}

function setPipelineStatus(steps) {
  Object.entries(steps).forEach(([stepName, status]) => {
    const stepEl = pipelineProgress.querySelector(`[data-step="${stepName}"]`);
    if (!stepEl) {
      return;
    }

    stepEl.classList.remove('done', 'failed');

    if (status === 'done') {
      stepEl.classList.add('done');
    }

    if (status === 'failed') {
      stepEl.classList.add('failed');
    }
  });
}

function isTestStageFailed() {
  const testStep = pipelineProgress.querySelector('[data-step="test"]');
  return Boolean(testStep && testStep.classList.contains('failed'));
}

function isCartTotalBugFixed() {
  const cartControllerContents = files['controllers/cartController.js'] || '';
  return /_\.sumBy\(\s*items\s*,\s*['"]price['"]\s*\)/.test(cartControllerContents);
}

function ensureLodashDependency() {
  if (state.dependencyInstalled) {
    return;
  }

  const packageContents = files['package.json'] || '';

  if (!/"dependencies"\s*:\s*\{/.test(packageContents) || /"lodash"\s*:/.test(packageContents)) {
    state.dependencyInstalled = true;
    return;
  }

  files['package.json'] = packageContents.replace(
    /"express"\s*:\s*"\^4\.18\.2"/,
    '"express": "^4.18.2",\n    "lodash": "^4.17.21"',
  );

  state.dependencyInstalled = true;
  
  if (state.activeFilePath === 'package.json') {
    const codeViewer = document.getElementById('codeViewer');
    const codeEditor = document.getElementById('codeEditor');
    if (codeViewer && codeEditor) {
      codeViewer.textContent = files['package.json'];
      codeEditor.value = files['package.json'];
    }
  }
}

function runDeployFailureSequence() {
  if (state.deploySequenceStarted) {
    return;
  }

  state.deploySequenceStarted = true;

  const deployLines = [
    { text: '> Stage: Deploy', delay: 450 },
    { text: '', delay: 150 },
    { text: '[INFO] Starting application...', delay: 300 },
    { text: '[INFO] Binding to port 8080...', delay: 350 },
    { text: '', delay: 1000 },
    { text: '[ERROR] listen EADDRINUSE: address already in use 0.0.0.0:8080', delay: 350 },
    { text: '[FATAL] Existing process blocking deployment.', delay: 350 },
    { text: '', delay: 180 },
    { text: 'Deployment failed.', delay: 250 },
  ];

  let elapsed = 0;

  deployLines.forEach((entry, index) => {
    elapsed += entry.delay;

    setTimeout(() => {
      appendLog(entry.text);

      if (index === deployLines.length - 1) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'done',
          deploy: 'failed',
        });

        statusValue.textContent = '● DEPLOY FAILED';
        statusValue.classList.remove('status-success');
        statusValue.classList.add('status-failed');
        state.deployFailed = true;
      }
    }, elapsed);
  });
}

document.getElementById('inspectBtn').addEventListener('click', () => {
  if (state.deployFailed) {
    if (!state.deployLogsExpanded) {
      appendLogs(['', ...EXTRA_LOGS]);
      state.deployLogsExpanded = true;
    }

    detailTitle.textContent = 'Deployment Failure Trace';
    detailOutput.hidden = false;
    repoExplorer.hidden = true;
    detailOutput.textContent = EXTRA_LOGS.join('\n');
    showPanel('detail');
    return;
  }

  if (isTestStageFailed()) {
    if (!state.testLogsExpanded) {
      appendLogs(['', ...TEST_FAILURE_LOGS]);
      state.testLogsExpanded = true;
    }

    detailTitle.textContent = 'Test Failure Trace';
    detailOutput.hidden = false;
    repoExplorer.hidden = true;
    detailOutput.textContent = TEST_FAILURE_LOGS.join('\n');
    showPanel('detail');
    return;
  }

  if (!state.logsExpanded) {
    appendLogs(['', '> Inspecting recent logs...', '[INFO] Awaiting deployment-stage diagnostics.']);
    state.logsExpanded = true;
  }

  detailTitle.textContent = 'Build Console Snapshot';
  detailOutput.hidden = false;
  repoExplorer.hidden = true;
  detailOutput.textContent = 'No expanded failure trace yet. Run the pipeline to collect deploy-stage logs.';
  showPanel('detail');
});

document.getElementById('reviewBtn').addEventListener('click', () => {
  if (!state.reviewUnlocked) {
    renderRepoExplorer();
    state.reviewUnlocked = true;
  }

  detailTitle.textContent = 'Source Review';
  detailOutput.hidden = true;
  repoExplorer.hidden = false;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  codeViewer.textContent = 'Select a file from the explorer to open it.';
  codeActionRow.hidden = true;
  saveCodeMessage.hidden = true;
  showPanel('detail');
});


editCodeBtn.addEventListener('click', () => {
  if (!state.activeFilePath) {
    return;
  }

  state.isEditingCode = true;
  codeEditor.value = files[state.activeFilePath] || '';
  codeViewer.hidden = true;
  codeEditor.hidden = false;
  editCodeBtn.hidden = true;
  saveCodeBtn.hidden = false;
  saveCodeMessage.hidden = true;
  codeEditor.focus();
});

saveCodeBtn.addEventListener('click', () => {
  if (!state.activeFilePath) {
    return;
  }

  files[state.activeFilePath] = codeEditor.value;
  state.isEditingCode = false;
  codeViewer.textContent = files[state.activeFilePath];
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = false;
  
  if (isCartTotalBugFixed()) {
    document.getElementById('obj-code').classList.add('completed');
    if (window.RewardSystem) window.RewardSystem.showFlag('Codebase Patched', 100);
  }
});

document.getElementById('configBtn').addEventListener('click', () => {
  showPanel('terminal');
  
  if (!terminalInitialized) {
    terminalInitialized = true;
    
    // Initialize xterm
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
    
    setTimeout(() => {
      fitAddon.fit();
      
      // Connect WebSocket
      socket = io('http://localhost:3000');
      
      socket.on('connect', () => {
        term.writeln('Connected to lab environment.');
        socket.emit('start_lab', { levelId: 'level_1', cols: term.cols, rows: term.rows });
      });
      
      socket.on('terminal_output', (data) => {
      let cleanData = data;
      if (data.includes('__DEPENDENCY_INSTALLED__')) {
        ensureLodashDependency();
        document.getElementById('obj-dependency').classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Dependency Resolved', 100);
        cleanData = cleanData.replace(/__DEPENDENCY_INSTALLED__\r?\n?/, '');
      }
      if (data.includes('__PORT_FREED__')) {
        state.portFreed = true;
        document.getElementById('obj-port').classList.add('completed');
        if (window.RewardSystem) window.RewardSystem.showFlag('Port Conflict Cleared', 100);
        cleanData = cleanData.replace(/__PORT_FREED__\r?\n?/, '');
      }
      term.write(cleanData);
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
    }, 50);
  }
});

function runSuccessAnimation() {
  pipelineProgress.hidden = false;
  const steps = ['checkout', 'build', 'test', 'deploy'];

  steps.forEach((name, index) => {
    setTimeout(() => {
      const el = pipelineProgress.querySelector(`[data-step="${name}"]`);
      if (!el) {
        return;
      }

      if (!el.textContent.includes('✔')) {
        el.textContent = `${el.textContent} ✔`;
      }
      el.classList.remove('failed');
      el.classList.add('done');
    }, 600 * (index + 1));
  });
}

function completeCase() {
  if (state.terminalReturnScheduled) {
    return;
  }

  state.resolved = true;
  state.terminalReturnScheduled = true;
  statusValue.textContent = 'APP DEPLOYED';
  statusValue.classList.remove('status-failed');
  statusValue.classList.add('status-success');
  document.getElementById('obj-pipeline').classList.add('completed');

  // Golden flag for final objective
  if (window.RewardSystem) window.RewardSystem.showFlag('Pipeline Restored', 200, true);

  const totalScore = window.RewardSystem ? window.RewardSystem.getScore() : 100;
  const username = localStorage.getItem('devops_player_username') || 'shadow_dev';
  
  fetch(`http://localhost:3000/api/players/${username}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      levelId: 'level_1',
      status: 'completed',
      score: totalScore,
      badge: 'pipeline_restorer',
      objectives: window.RewardSystem ? window.RewardSystem.getObjectives() : [],
      logs: logs
    })
  })
  .then(res => res.json())
  .then(data => console.log('Progress saved:', data))
  .catch(err => console.error('Failed to save progress:', err))
  .finally(() => {
    setTimeout(() => {
      if (window.RewardSystem) {
        window.RewardSystem.showLevelComplete('level_2', 'The Missing Dependency', totalScore, () => {
          window.location.href = 'crawl3.html';
        });
      } else {
        window.location.href = 'crawl3.html';
      }
    }, 3200);
  });
}

document.getElementById('rerunBtn').addEventListener('click', () => {
  const statusSection = document.getElementById('statusSection');
  if (statusSection) {
    statusSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (state.resolved) {
    return;
  }

  if (state.portFreed) {
    const successLines = [
      { text: '', delay: 120 },
      { text: '> Re-running pipeline...', delay: 300 },
      { text: '', delay: 180 },
      { text: '> Stage: Checkout', delay: 420 },
      { text: '✔ Repository cloned', delay: 380 },
      { text: '', delay: 180 },
      { text: '> Stage: Build', delay: 420 },
      { text: '✔ Build completed', delay: 380 },
      { text: '', delay: 180 },
      { text: '> Stage: Test', delay: 420 },
      { text: '✔ All tests passed', delay: 380 },
      { text: '', delay: 180 },
      { text: '> Stage: Deploy', delay: 420 },
      { text: '[INFO] Starting application...', delay: 380 },
      { text: '[INFO] Binding to port 8080...', delay: 380 },
      { text: '', delay: 180 },
      { text: '✔ Application deployed successfully', delay: 360 },
      { text: '✔ Server running on port 8080', delay: 360 },
      { text: '', delay: 180 },
      { text: 'CASE 001 SOLVED.', delay: 360 },
      { text: '', delay: 120 },
      { text: 'The system has been successfully restored.', delay: 360 },
    ];

    let elapsed = 0;

    successLines.forEach((entry, index) => {
      elapsed += entry.delay;

      setTimeout(() => {
        appendLog(entry.text);

        if (index === successLines.length - 1) {
          state.deployFailed = false;
          setPipelineStatus({
            checkout: 'done',
            build: 'done',
            test: 'done',
            deploy: 'done',
          });

          statusValue.textContent = 'APP DEPLOYED';
          statusValue.classList.remove('status-failed');
          statusValue.classList.add('status-success');
          runSuccessAnimation();
          completeCase();
        }
      }, elapsed);
    });

    return;
  }

  if (state.isRunning) return;
  state.isRunning = true;
  state.deploySequenceStarted = false;
  state.deployFailed = false;

  if (!state.dependencyInstalled) {
    const missingDependencyLines = [
      { text: '', delay: 120 },
      { text: '> Re-running pipeline...', delay: 350 },
      { text: '', delay: 220 },
      { text: '> Stage: Checkout', delay: 500 },
      { text: '✔ Repository cloned', delay: 520 },
      { text: '', delay: 220 },
      { text: '> Stage: Install Dependencies', delay: 500 },
      { text: "✖ ERROR: Module 'lodash' not found in package.json", delay: 700 },
      { text: 'Build aborted. Install lodash from Config Terminal and retry.', delay: 300 },
    ];

    let missingDependencyElapsed = 0;

    missingDependencyLines.forEach((entry, index) => {
      missingDependencyElapsed += entry.delay;

      setTimeout(() => {
        appendLog(entry.text);

        if (index === missingDependencyLines.length - 1) {
          setPipelineStatus({
            checkout: 'done',
            build: 'failed',
            test: 'pending',
            deploy: 'pending',
          });

          statusValue.textContent = '● BUILD FAILED';
          statusValue.classList.remove('status-success');
          statusValue.classList.add('status-failed');
          state.isRunning = false;
        }
      }, missingDependencyElapsed);
    });

    return;
  }

  const bugFixed = isCartTotalBugFixed();
  const failureTriggerLine = '✖ cartTotalCalculation.test.js FAILED';
  const successTriggerLine = '✔ All unit tests passed';
  const deployFailureTriggerLine = 'Deployment failed.';

  const streamedLines = bugFixed
    ? [
        { text: '', delay: 120 },
        { text: '> Re-running pipeline...', delay: 350 },
        { text: '', delay: 200 },
        { text: '> Stage: Checkout', delay: 500 },
        { text: '✔ Repository cloned', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Install Dependencies', delay: 500 },
        { text: '✔ lodash installed successfully', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Build', delay: 500 },
        { text: '✔ Build completed', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Test', delay: 500 },
        { text: 'Running unit tests...', delay: 1000 },
        { text: '', delay: 200 },
        { text: 'PASS  tests/cartTotalCalculation.test.js', delay: 400 },
        { text: '  cart total calculation', delay: 250 },
        { text: '    ✓ calculates total price correctly (5 ms)', delay: 250 },
        { text: '', delay: 200 },
        { text: 'Test Suites: 1 passed, 1 total', delay: 250 },
        { text: 'Tests:       1 passed, 1 total', delay: 250 },
        { text: 'Time:        0.45 s', delay: 250 },
        { text: '', delay: 200 },
        { text: successTriggerLine, delay: 300 },
        { text: '', delay: 200 },
        { text: '✔ Unit tests passed successfully.', delay: 300 },
        { text: '', delay: 200 },
        { text: 'Pipeline ready for deployment stage.', delay: 200 },
        { text: '> Stage: Deploy', delay: 450 },
        { text: '', delay: 150 },
        { text: '[INFO] Starting application...', delay: 300 },
        { text: '[INFO] Binding to port 8080...', delay: 350 },
        { text: '', delay: 1000 },
        { text: '[ERROR] listen EADDRINUSE: address already in use 0.0.0.0:8080', delay: 350 },
        { text: '[FATAL] Existing process blocking deployment.', delay: 350 },
        { text: '', delay: 180 },
        { text: deployFailureTriggerLine, delay: 250 },
      ]
    : [
        { text: '', delay: 120 },
        { text: '> Re-running pipeline...', delay: 350 },
        { text: '', delay: 200 },
        { text: '> Stage: Checkout', delay: 500 },
        { text: '✔ Repository cloned', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Install Dependencies', delay: 500 },
        { text: '✔ lodash installed successfully', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Build', delay: 500 },
        { text: '✔ Build completed', delay: 600 },
        { text: '', delay: 250 },
        { text: '> Stage: Test', delay: 400 },
        { text: 'Running unit tests...', delay: 1700 },
        { text: '', delay: 300 },
        { text: failureTriggerLine, delay: 350 },
        { text: '', delay: 200 },
        { text: 'Expected: 820', delay: 200 },
        { text: 'Received: 0', delay: 350 },
        { text: '', delay: 200 },
        { text: 'Test suite failed.', delay: 100 },
      ];

  let elapsed = 0;

  streamedLines.forEach((entry, index) => {
    elapsed += entry.delay;

    setTimeout(() => {
      appendLog(entry.text);

      if (entry.text === failureTriggerLine) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'failed',
          deploy: 'pending',
        });

        statusValue.textContent = '● TEST FAILED';
        statusValue.classList.remove('status-success');
        statusValue.classList.add('status-failed');
      }

      if (entry.text === successTriggerLine) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'done',
          deploy: 'pending',
        });

        statusValue.textContent = '● TESTS PASSED';
        statusValue.classList.remove('status-failed');
        statusValue.classList.add('status-success');
      }

      if (entry.text === deployFailureTriggerLine) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'done',
          deploy: 'failed',
        });

        statusValue.textContent = '● DEPLOY FAILED';
        statusValue.classList.remove('status-success');
        statusValue.classList.add('status-failed');
        state.deployFailed = true;
      }

      if (index === streamedLines.length - 1) {
        state.isRunning = false;
      }
    }, elapsed);
  });
});

startInvestigationBtn.addEventListener('click', () => {
  briefingPanel.hidden = true;
  levelDashboard.hidden = false;
  setClock();
  renderLogs();
  setPipelineDefaults();
  if (term) term.blur();
});

levelDashboard.hidden = true;
setInterval(setClock, 1000);

// Initialize Virtual Assistant
if (window.VirtualAssistant) {
  new window.VirtualAssistant(() => {
    const objDependency = document.getElementById('obj-dependency');
    const objCode = document.getElementById('obj-code');
    const objPort = document.getElementById('obj-port');
    const objPipeline = document.getElementById('obj-pipeline');

    if (!objDependency || !objDependency.classList.contains('completed')) {
      return "The pipeline failed due to a missing dependency. Open the terminal, check package.json, and run 'npm install lodash'.";
    }
    if (!objCode || !objCode.classList.contains('completed')) {
      return "The codebase has a bug. The cart total calculation in 'controllers/cartController.js' is incorrect. Remember that lodash's _.sumBy needs the property name 'price' as a string.";
    }
    if (!objPort || !objPort.classList.contains('completed')) {
      return "There's a port conflict. Something is blocking port 3000. Use the terminal to find the process with 'lsof -i :3000' and terminate it using 'kill -9 <PID>'.";
    }
    if (!objPipeline || !objPipeline.classList.contains('completed')) {
      return "All issues appear resolved. Click 'Evaluate' to re-run the pipeline and verify the fixes.";
    }
    return "The pipeline is fully restored. Great job.";
  });
}
