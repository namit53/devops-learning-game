const pipelineStages = [
  { name: "Checkout", status: "success", icon: "✔" },
  { name: "Build", status: "failed", icon: "❌" },
  { name: "Test", status: "pending", icon: "⏸" },
  { name: "Deploy", status: "pending", icon: "⏸" },
];

let dependencyInstalled = false;
let logsExpanded = false;
let codeViewed = false;

const initialLogLines = [
  "> Jenkins Build #402 initiated...",
  "> Cloning repository...",
  "> Installing dependencies...",
  "> Running build script...",
  "",
  "> ERROR: Module 'lodash' not found in package.json",
  "> Build step failed.",
  "",
  "> (System awaiting user input)",
  "",
  "> Fetching console logs...",
  "",
  "> ERROR: Module 'lodash' not found in package.json",
  "> HINT: Check dependency configuration.",
];

const extendedLogLines = [
  "",
  "> npm run build",
  "",
  "> node server.js",
  "",
  "Error: Cannot find module 'lodash'",
  "Require stack:",
  "- /app/controllers/cartController.js",
  "- /app/server.js",
  "",
  "Exit code: 1",
];

const board = document.getElementById("pipelineBoard");
const logView = document.getElementById("pipelineLog");
const buildStatus = document.getElementById("buildStatus");
const statusText = document.getElementById("statusText");
const systemTime = document.getElementById("systemTime");
const resolutionBanner = document.getElementById("resolutionBanner");

const inspectLogsBtn = document.getElementById("inspectLogsBtn");
const reviewCodeBtn = document.getElementById("reviewCodeBtn");
const editConfigBtn = document.getElementById("editConfigBtn");
const rerunJobBtn = document.getElementById("rerunJobBtn");

const overlay = document.getElementById("overlay");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const closePanelBtn = document.getElementById("closePanelBtn");

function tickTime() {
  systemTime.textContent = new Date().toLocaleTimeString();
}

function renderPipeline() {
  board.innerHTML = "";

  pipelineStages.forEach((stage) => {
    const item = document.createElement("div");
    item.className = `pipeline-stage ${stage.status}`;
    item.innerHTML = `<span class="dot"></span>${stage.name} ${stage.icon}`;
    board.appendChild(item);
  });
}

function setBuildFailedStatus() {
  buildStatus.className = "build-status failed";
  statusText.textContent = "STATUS: BUILD FAILED";
}

function setBuildSuccessStatus() {
  buildStatus.className = "build-status success";
  statusText.textContent = "STATUS: BUILD SUCCESSFUL";
}

function setLogs(lines) {
  logView.textContent = lines.join("\n");
  logView.scrollTop = logView.scrollHeight;
}

function appendLogs(lines) {
  const existing = logView.textContent ? `${logView.textContent}\n` : "";
  logView.textContent = `${existing}${lines.join("\n")}`;
  logView.scrollTop = logView.scrollHeight;
}

function openPanel(title, body) {
  panelTitle.textContent = title;
  panelBody.innerHTML = "";
  panelBody.appendChild(body);
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closePanel() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function createLogsPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-block";

  const lines = [
    "npm run build",
    "",
    "node server.js",
    "",
    "Error: Cannot find module 'lodash'",
    "Require stack:",
    "- /app/controllers/cartController.js",
    "- /app/server.js",
    "",
    "Exit code: 1",
  ];

  lines.forEach((line) => {
    const p = document.createElement("p");
    p.className = "terminal-line";
    p.textContent = line;

    if (line.includes("Cannot find module 'lodash'")) {
      p.classList.add("highlight-error");
    }

    wrapper.appendChild(p);
  });

  return wrapper;
}

function createCodePanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-block";

  wrapper.innerHTML = `
<p class="terminal-line">cartController.js</p>
<p class="terminal-line"></p>
<p class="terminal-line">const express = require('express')</p>
<p class="terminal-line">const router = express.Router()</p>
<p class="terminal-line clue-line">const _ = require('lodash')</p>
<p class="terminal-line"></p>
<p class="terminal-line">function calculateCartTotal(items){</p>
<p class="terminal-line">  return _.sumBy(items,'price')</p>
<p class="terminal-line">}</p>
<p class="terminal-line"></p>
<p class="terminal-line">router.get('/cart',(req,res)=&gt;{</p>
<p class="terminal-line">  const items=[</p>
<p class="terminal-line">    {name:'Laptop',price:800},</p>
<p class="terminal-line">    {name:'Mouse',price:20}</p>
<p class="terminal-line">  ]</p>
<p class="terminal-line"></p>
<p class="terminal-line">  const total=calculateCartTotal(items)</p>
<p class="terminal-line"></p>
<p class="terminal-line">  res.json({</p>
<p class="terminal-line">    items,</p>
<p class="terminal-line">    total</p>
<p class="terminal-line">  })</p>
<p class="terminal-line">})</p>
<p class="terminal-line"></p>
<p class="terminal-line">module.exports=router</p>
  `;

  codeViewed = true;
  return wrapper;
}

function normalizeCommand(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function createConfigTerminalPanel() {
  const container = document.createElement("div");
  container.className = "config-terminal";

  const output = document.createElement("div");
  output.className = "config-output";

  const row = document.createElement("form");
  row.className = "config-input-row";

  const prompt = document.createElement("span");
  prompt.className = "config-prompt";
  prompt.textContent = "config@dcib-build:~$";

  const input = document.createElement("input");
  input.className = "config-input";
  input.type = "text";
  input.autocomplete = "off";
  input.placeholder = "Type command...";

  function printLine(text, className = "") {
    const line = document.createElement("p");
    line.className = `terminal-line ${className}`.trim();
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  printLine("Use npm install command to patch missing dependency.");
  printLine("Accepted: npm install lodash OR npm install lodash --save");

  row.addEventListener("submit", (event) => {
    event.preventDefault();

    const raw = input.value;
    if (!raw.trim()) {
      return;
    }

    printLine(`config@dcib-build:~$ ${raw}`);
    const normalized = normalizeCommand(raw);

    if (normalized === "npm install lodash" || normalized === "npm install lodash --save") {
      dependencyInstalled = true;
      printLine("> installing lodash...");
      printLine("> dependency added to package.json", "success-line");
    } else {
      printLine("Command failed.", "error-line");
      printLine("Dependency still missing.", "error-line");
    }

    input.value = "";
  });

  row.appendChild(prompt);
  row.appendChild(input);

  container.appendChild(output);
  container.appendChild(row);

  setTimeout(() => input.focus(), 0);

  return container;
}

inspectLogsBtn.addEventListener("click", () => {
  if (!logsExpanded) {
    appendLogs(extendedLogLines);
    logsExpanded = true;
  }

  openPanel("Console Logs", createLogsPanel());
});

reviewCodeBtn.addEventListener("click", () => {
  openPanel("Source Review", createCodePanel());
});

editConfigBtn.addEventListener("click", () => {
  openPanel("Config Terminal", createConfigTerminalPanel());
});

rerunJobBtn.addEventListener("click", () => {
  appendLogs(["", "> Re-running pipeline...", "> Installing dependencies...", "> Running build script..."]);

  if (!dependencyInstalled) {
    pipelineStages[1] = { name: "Build", status: "failed", icon: "❌" };
    pipelineStages[2] = { name: "Test", status: "pending", icon: "⏸" };
    pipelineStages[3] = { name: "Deploy", status: "pending", icon: "⏸" };

    renderPipeline();
    setBuildFailedStatus();
    appendLogs([
      "> ERROR: Module 'lodash' not found in package.json",
      "> Build failed again.",
    ]);
    return;
  }

  pipelineStages[0] = { name: "Checkout", status: "success", icon: "✔" };
  pipelineStages[1] = { name: "Build", status: "success", icon: "✔" };
  pipelineStages[2] = { name: "Test", status: "success", icon: "✔" };
  pipelineStages[3] = { name: "Deploy", status: "success", icon: "✔" };

  renderPipeline();
  setBuildSuccessStatus();

  appendLogs([
    "> lodash installed successfully",
    "> Build completed",
    "> Running tests...",
    "> Tests passed",
    "> Deploying application...",
    "",
    "SUCCESS: Build pipeline completed.",
    "CASE 001 RESOLVED.",
  ]);

  resolutionBanner.classList.remove("hidden");

  setTimeout(() => {
    window.location.href = "terminal.html";
  }, 3000);
});

closePanelBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closePanel();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanel();
  }
});

renderPipeline();
setBuildFailedStatus();
setLogs(initialLogLines);
tickTime();
setInterval(tickTime, 1000);
