const state = {
  dependencyInstalled: false,
  logsExpanded: false,
  testLogsExpanded: false,
  codeViewed: false,
  resolved: false,
  activeFilePath: null,
  isEditingCode: false,
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
  'npm run build',
  '',
  'node server.js',
  '',
  "Error: Cannot find module 'lodash'",
  'Require stack:',
  '- /app/controllers/cartController.js',
  '- /app/server.js',
  '',
  'Exit code: 1',
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
  console.log(\`Server running on port ${PORT}\`)
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

document.getElementById('inspectBtn').addEventListener('click', () => {
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
    appendLogs(['', ...EXTRA_LOGS]);
    state.logsExpanded = true;
  }

  detailTitle.textContent = 'Deep Build Trace';
  detailOutput.hidden = false;
  repoExplorer.hidden = true;
  detailOutput.textContent = EXTRA_LOGS.join('\n');
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
    configOutput.textContent = 'Type npm install command to fix dependencies.\n';
  }
});

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = configInput.value.trim();
  if (!command || state.resolved) {
    return;
  }

  const isValidCommand = /^npm\s+install\s+lodash(\s+--save)?$/i.test(command);

  configOutput.textContent += `config@dcib-build:~$ ${command}\n`;

  if (isValidCommand) {
    state.dependencyInstalled = true;
    configOutput.textContent += '> installing lodash...\n> dependency added to package.json\n';
  } else {
    configOutput.textContent += 'Command failed.\nDependency still missing.\n';
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
  state.resolved = true;
  statusValue.textContent = '● BUILD PASSED';
  statusValue.classList.remove('status-failed');
  statusValue.classList.add('status-success');
  resolveMessage.hidden = false;

  setTimeout(() => {
    window.location.href = 'terminal.html';
  }, 3000);
}

document.getElementById('rerunBtn').addEventListener('click', () => {
  if (state.resolved) {
    return;
  }

  const bugFixed = isCartTotalBugFixed();
  const failureTriggerLine = '✖ cartTotalCalculation.test.js FAILED';
  const successTriggerLine = '✔ All unit tests passed';
  const deployTriggerLine = '> Stage: Deploy';
  const deployFailureLine = 'Deployment failed.';
  const streamedLines = bugFixed
    ? [
        { text: '', delay: 120 },
        { text: '> Re-running pipeline...', delay: 350 },
        { text: '', delay: 200 },
        { text: '> Stage: Checkout', delay: 500 },
        { text: '✔ Repository cloned', delay: 600 },
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
        { text: '✔ Unit tests passed successfully.', delay: 250 },
        { text: '', delay: 200 },
        { text: deployTriggerLine, delay: 350 },
        { text: '', delay: 200 },
        { text: '[INFO] Starting application...', delay: 350 },
        { text: '[INFO] Binding to port 8080...', delay: 350 },
        { text: '', delay: 200 },
        { text: '[ERROR] listen EADDRINUSE: address already in use 0.0.0.0:8080', delay: 1000 },
        { text: '[FATAL] Existing process blocking deployment.', delay: 350 },
        { text: '', delay: 200 },
        { text: deployFailureLine, delay: 250 },
      ]
    : [
        { text: '', delay: 120 },
        { text: '> Re-running pipeline...', delay: 350 },
        { text: '', delay: 200 },
        { text: '> Stage: Checkout', delay: 500 },
        { text: '✔ Repository cloned', delay: 600 },
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
      }

      if (entry.text === deployTriggerLine) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'done',
          deploy: 'pending',
        });
      }

      if (entry.text === deployFailureLine) {
        setPipelineStatus({
          checkout: 'done',
          build: 'done',
          test: 'done',
          deploy: 'failed',
        });

        statusValue.textContent = '● DEPLOY FAILED';
        statusValue.classList.remove('status-success');
        statusValue.classList.add('status-failed');
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
