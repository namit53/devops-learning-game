const pipelineStages = [
  { name: "Checkout", status: "success", symbol: "✔" },
  { name: "Build", status: "failed", symbol: "❌" },
  { name: "Test", status: "pending", symbol: "⏸" },
  { name: "Deploy", status: "pending", symbol: "⏸" },
];

let expressAdded = false;
const addedDependencies = new Set();

const pipelineBoard = document.querySelector(".pipeline-board");
const pipelineLog = document.getElementById("pipelineLog");
const statusMessage = document.getElementById("statusMessage");
const overlay = document.getElementById("overlay");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");

const inspectLogsBtn = document.getElementById("inspectLogsBtn");
const reviewCodeBtn = document.getElementById("reviewCodeBtn");
const editConfigBtn = document.getElementById("editConfigBtn");
const rerunJobBtn = document.getElementById("rerunJobBtn");
const closePanelBtn = document.getElementById("closePanelBtn");

function renderPipeline() {
  pipelineBoard.innerHTML = "";

  pipelineStages.forEach((stage) => {
    const stageElement = document.createElement("div");
    stageElement.className = `pipeline-stage ${stage.status}`;
    stageElement.innerHTML = `<span class="dot"></span>${stage.name} ${stage.symbol}`;
    pipelineBoard.appendChild(stageElement);
  });
}

function openPanel(title, contentElement) {
  panelTitle.textContent = title;
  panelBody.innerHTML = "";
  panelBody.appendChild(contentElement);
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closePanel() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function buildLogsContent() {
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-block";

  const logLines = [
    "npm install",
    "",
    "added 120 packages",
    "",
    "> node server.js",
    "",
    "Error: Cannot find module 'express'",
    "Require stack:",
    "- /app/server.js",
    "",
    "Build step failed.",
  ];

  logLines.forEach((line) => {
    const lineElement = document.createElement("p");
    lineElement.className = "terminal-line";
    lineElement.textContent = line;

    if (line.includes("Cannot find module 'express'")) {
      lineElement.classList.add("highlight-error");
    }

    wrapper.appendChild(lineElement);
  });

  return wrapper;
}

function buildCodeContent() {
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-block";

  wrapper.innerHTML = `
<p class="terminal-line">const express = require('express')</p>
<p class="terminal-line">const app = express()</p>
<p class="terminal-line"></p>
<p class="terminal-line">app.get('/', (req,res)=&gt;{</p>
<p class="terminal-line">  res.send("Server running")</p>
<p class="terminal-line">})</p>
<p class="terminal-line"></p>
<p class="terminal-line">app.listen(3000)</p>
  `;

  return wrapper;
}

function getPackageJsonText() {
  const dependencies = {
    axios: "^1.0.0",
    lodash: "^4.17.21",
  };

  addedDependencies.forEach((dependency) => {
    dependencies[dependency] = "^latest";
  });

  return JSON.stringify(
    {
      name: "dcib-service",
      version: "1.0.0",
      dependencies,
    },
    null,
    2,
  );
}

function buildConfigContent() {
  const wrapper = document.createElement("div");
  const codeBlock = document.createElement("pre");
  codeBlock.className = "terminal-block config-view";
  codeBlock.textContent = getPackageJsonText();

  const controls = document.createElement("div");
  controls.className = "config-controls";

  const dependencySelect = document.createElement("select");
  dependencySelect.innerHTML = `
    <option value="express">express</option>
    <option value="mongoose">mongoose</option>
    <option value="cors">cors</option>
    <option value="nodemon">nodemon</option>
  `;

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "Add Dependency";

  const feedback = document.createElement("p");
  feedback.className = "config-feedback";

  addButton.addEventListener("click", () => {
    const selectedDependency = dependencySelect.value;
    addedDependencies.add(selectedDependency);

    if (selectedDependency === "express") {
      expressAdded = true;
      feedback.textContent = "express added. Re-run the job to validate the fix.";
      feedback.className = "config-feedback success";
    } else {
      feedback.textContent = "Build still failing. Required module is still missing.";
      feedback.className = "config-feedback error";
    }

    codeBlock.textContent = getPackageJsonText();
  });

  controls.appendChild(dependencySelect);
  controls.appendChild(addButton);

  wrapper.appendChild(codeBlock);
  wrapper.appendChild(controls);
  wrapper.appendChild(feedback);

  return wrapper;
}

function setInitialLog() {
  pipelineLog.textContent = `Running CI/CD pipeline...\n\nStage: Checkout\nRepository cloned successfully.\n\nStage: Build\nInstalling dependencies...\n\nBuild failed.\n\nSee logs for details.`;
}

function setFailedLog() {
  pipelineLog.textContent = `Running CI/CD pipeline...\n\nStage: Checkout\nRepository cloned successfully.\n\nStage: Build\nInstalling dependencies...\n\nError: Cannot find module 'express'\n\nBuild failed.`;
}

function setSuccessLog() {
  pipelineLog.textContent = `Running CI/CD pipeline...\n\nStage: Checkout\nRepository cloned successfully.\n\nStage: Build\nDependencies installed successfully.\n\nStage: Test\nAll tests passed.\n\nStage: Deploy\nDeployment completed.`;
}

inspectLogsBtn.addEventListener("click", () => {
  openPanel("Build Logs", buildLogsContent());
});

reviewCodeBtn.addEventListener("click", () => {
  openPanel("server.js", buildCodeContent());
});

editConfigBtn.addEventListener("click", () => {
  openPanel("package.json", buildConfigContent());
});

rerunJobBtn.addEventListener("click", () => {
  if (!expressAdded) {
    pipelineStages[1] = { name: "Build", status: "failed", symbol: "❌" };
    pipelineStages[2] = { name: "Test", status: "pending", symbol: "⏸" };
    pipelineStages[3] = { name: "Deploy", status: "pending", symbol: "⏸" };
    renderPipeline();
    setFailedLog();
    statusMessage.textContent = "Build failed again. Investigate logs to identify the missing dependency.";
    statusMessage.className = "status-message error";
    return;
  }

  pipelineStages[0] = { name: "Checkout", status: "success", symbol: "✔" };
  pipelineStages[1] = { name: "Build", status: "success", symbol: "✔" };
  pipelineStages[2] = { name: "Test", status: "success", symbol: "✔" };
  pipelineStages[3] = { name: "Deploy", status: "success", symbol: "✔" };

  renderPipeline();
  setSuccessLog();
  statusMessage.textContent = "Build successful. Missing dependency resolved. CASE 001 RESOLVED.";
  statusMessage.className = "status-message success";

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
setInitialLog();
