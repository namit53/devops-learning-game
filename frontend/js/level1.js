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
const configOutput = document.getElementById('configOutput');
const configForm = document.getElementById('configForm');
const configInput = document.getElementById('configInput');
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

  if (type === 'terminal') {
    configInput.focus();
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
});

document.getElementById('configBtn').addEventListener('click', () => {
  showPanel('terminal');
  if (!configOutput.textContent.trim()) {
    configOutput.textContent = 'Run diagnostics for port 8080 before re-deploying.\n';
  }
});

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = configInput.value.trim();
  if (!command || state.resolved) {
    return;
  }

  configOutput.textContent += `config@dcib-build:~$ ${command}\n`;

  if (command === 'lsof -i :8080') {
    configOutput.textContent += 'COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n';
    configOutput.textContent += 'node      4052  admin  22u  IPv4 0x3a21      0t0  TCP *:8080 (LISTEN)\n';
  } else if (command === 'kill -9 4052') {
    state.portFreed = true;
    configOutput.textContent += 'Process 4052 terminated.\n';
    configOutput.textContent += 'Port 8080 is now free.\n';
  } else {
    configOutput.textContent += 'Command not recognized in this simulation.\n';
  }

  configInput.value = '';
  configOutput.scrollTop = configOutput.scrollHeight;
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
  resolveMessage.hidden = false;

  setTimeout(() => {
    window.location.href = 'terminal.html';
  }, 2200);
}

document.getElementById('rerunBtn').addEventListener('click', () => {
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

  state.deploySequenceStarted = false;
  state.deployFailed = false;

  const bugFixed = isCartTotalBugFixed();
  const failureTriggerLine = '✖ cartTotalCalculation.test.js FAILED';
  const successTriggerLine = '✔ All unit tests passed';
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

  streamedLines.forEach((entry) => {
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

        runDeployFailureSequence();
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
  configInput.blur();
});

levelDashboard.hidden = true;
renderRepoExplorer();
setInterval(setClock, 1000);
