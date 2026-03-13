const state = {
  dependencyInstalled: false,
  logsExpanded: false,
  codeViewed: false,
  resolved: false,
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

const REPO_FILES = {
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

app.listen(3000, () => {
  console.log("Server running")
})`,
  'controllers/cartController.js': `const express = require("express")
const router = express.Router()
const _ = require("lodash")

function calculateCartTotal(items){
  return _.sumBy(items,"price")
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
};

const logOutput = document.getElementById('logOutput');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailOutput = document.getElementById('detailOutput');
const repoExplorer = document.getElementById('repoExplorer');
const repoTree = document.getElementById('repoTree');
const codeViewer = document.getElementById('codeViewer');
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

function setActiveFile(path) {
  const fileButtons = repoTree.querySelectorAll('button[data-path]');
  fileButtons.forEach((button) => {
    const isActive = button.dataset.path === path;
    button.classList.toggle('primary', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function openFile(path) {
  const contents = REPO_FILES[path];
  if (!contents) {
    return;
  }

  state.codeViewed = true;
  detailTitle.textContent = `Source Review — ${path}`;
  codeViewer.textContent = contents;
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
  controllers.textContent = '└── controllers';

  const cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'action-button';
  cartBtn.dataset.path = 'controllers/cartController.js';
  cartBtn.textContent = '    └── cartController.js';

  [packageBtn, serverBtn, cartBtn].forEach((button) => {
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
}

document.getElementById('inspectBtn').addEventListener('click', () => {
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
  codeViewer.textContent = 'Select a file from the explorer to open it.';
  showPanel('detail');
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
      if (el) {
        el.textContent = `${el.textContent} ✔`;
        el.classList.add('done');
      }
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

  if (!state.dependencyInstalled) {
    appendLogs([
      '',
      '> Re-running pipeline...',
      '> Installing dependencies...',
      '> Running build script...',
      "> ERROR: Module 'lodash' not found in package.json",
      '> Build failed again.',
    ]);
    return;
  }

  appendLogs([
    '',
    '> Re-running pipeline...',
    '> Installing dependencies...',
    '> lodash installed successfully',
    '> Build completed',
    '> Running tests...',
    '> Tests passed',
    '> Deploying application...',
    '',
    'SUCCESS: Build pipeline completed.',
    '',
    'CASE 001 RESOLVED.',
  ]);

  runSuccessAnimation();
  setTimeout(completeCase, 2800);
});

startInvestigationBtn.addEventListener('click', () => {
  briefingPanel.hidden = true;
  levelDashboard.hidden = false;
  setClock();
  renderLogs();
  configInput.blur();
});

levelDashboard.hidden = true;
renderRepoExplorer();
setInterval(setClock, 1000);
